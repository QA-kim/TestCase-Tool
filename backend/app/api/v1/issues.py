from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from typing import List
import time
from datetime import datetime, timezone

from app.db.supabase import issues_collection, issue_history_collection, projects_collection, testcases_collection, upload_file, get_file_url
from app.core.security import get_current_user_firestore
from app.core.permissions import check_write_permission
from app.schemas.issue import IssueCreate, IssueUpdate, Issue as IssueSchema, IssueHistory as IssueHistorySchema

router = APIRouter(redirect_slashes=False)


def record_issue_history(issue_id: str, field_name: str, old_value: str, new_value: str, changed_by: str, comment: str = None):
    """Record a change to issue history"""
    history_data = {
        'issue_id': issue_id,
        'field_name': field_name,
        'old_value': str(old_value) if old_value is not None else None,
        'new_value': str(new_value) if new_value is not None else None,
        'changed_by': changed_by,
        'comment': comment
    }
    issue_history_collection.create(history_data)


@router.post("", response_model=IssueSchema, status_code=status.HTTP_201_CREATED)
def create_issue(
    issue_in: IssueCreate,
    current_user: dict = Depends(get_current_user_firestore)
):
    """Create a new issue"""
    # Check if user has permission to create issues (viewer and developer cannot create)
    check_write_permission(current_user, "이슈")

    # Verify project exists
    project = projects_collection.get(issue_in.project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    # Verify testcase exists if provided
    if issue_in.testcase_id:
        testcase = testcases_collection.get(issue_in.testcase_id)
        if not testcase:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Test case not found"
            )

    issue_data = issue_in.dict()  # Pydantic v1 uses .dict()
    issue_data['created_by'] = current_user['id']

    # Convert empty strings to None for foreign key fields
    if issue_data.get('testcase_id') == '':
        issue_data['testcase_id'] = None
    if issue_data.get('testrun_id') == '':
        issue_data['testrun_id'] = None
    if issue_data.get('assigned_to') == '':
        issue_data['assigned_to'] = None

    issue = issues_collection.create(issue_data)
    return issue


@router.get("", response_model=List[IssueSchema])
def list_issues(
    project_id: str = None,
    testrun_id: str = None,
    status_filter: str = None,
    assigned_to: str = None,
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user_firestore)
):
    """List issues with optional filters"""
    # Build query
    if project_id:
        issues = issues_collection.query('project_id', '==', project_id)

        # Apply additional filters on the results (Firestore doesn't support multiple where clauses easily)
        if testrun_id:
            issues = [issue for issue in issues if issue.get('testrun_id') == testrun_id]
        if status_filter:
            issues = [issue for issue in issues if issue.get('status') == status_filter]
        if assigned_to:
            issues = [issue for issue in issues if issue.get('assigned_to') == assigned_to]
    elif testrun_id:
        # Filter by testrun_id only
        all_issues = issues_collection.list(limit=1000)
        issues = [issue for issue in all_issues if issue.get('testrun_id') == testrun_id]
    else:
        issues = issues_collection.list(limit=limit)

    return issues[skip:skip+limit]


@router.get("/{issue_id}", response_model=IssueSchema)
def get_issue(
    issue_id: str,
    current_user: dict = Depends(get_current_user_firestore)
):
    """Get a specific issue"""
    issue = issues_collection.get(issue_id)
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue not found"
        )
    return issue


@router.put("/{issue_id}", response_model=IssueSchema)
def update_issue(
    issue_id: str,
    issue_in: IssueUpdate,
    current_user: dict = Depends(get_current_user_firestore)
):
    """Update an issue"""
    # Check if user has permission to update issues (viewer and developer cannot update)
    check_write_permission(current_user, "이슈")

    issue = issues_collection.get(issue_id)
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue not found"
        )

    # Verify testcase exists if provided
    if issue_in.testcase_id:
        testcase = testcases_collection.get(issue_in.testcase_id)
        if not testcase:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Test case not found"
            )

    update_data = issue_in.dict(exclude_unset=True)  # Pydantic v1 uses .dict()

    # Convert empty strings to None for foreign key fields
    if update_data.get('testcase_id') == '':
        update_data['testcase_id'] = None
    if update_data.get('testrun_id') == '':
        update_data['testrun_id'] = None
    if update_data.get('assigned_to') == '':
        update_data['assigned_to'] = None

    # Record history for changed fields
    for field, new_value in update_data.items():
        old_value = issue.get(field)
        if old_value != new_value:
            record_issue_history(
                issue_id=issue_id,
                field_name=field,
                old_value=old_value,
                new_value=new_value,
                changed_by=current_user['id']
            )

    # Check if status changed to 'done' to set resolved_at
    if update_data.get('status') == 'done' and issue.get('status') != 'done':
        update_data['resolved_at'] = datetime.now(timezone.utc).isoformat()
    # Check if status changed from 'done' to something else to clear resolved_at
    elif update_data.get('status') and update_data.get('status') != 'done' and issue.get('status') == 'done':
        update_data['resolved_at'] = None

    issues_collection.update(issue_id, update_data)

    # Return updated issue
    updated_issue = issues_collection.get(issue_id)
    return updated_issue


@router.patch("/{issue_id}/status", response_model=IssueSchema)
def update_issue_status(
    issue_id: str,
    status: str,
    current_user: dict = Depends(get_current_user_firestore)
):
    """Update issue status (for kanban board drag and drop)"""
    # Check if user has permission to update issue status (viewer and developer cannot update)
    check_write_permission(current_user, "이슈 상태")

    issue = issues_collection.get(issue_id)
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue not found"
        )

    # Validate status
    valid_statuses = ['todo', 'in_progress', 'in_review', 'done']
    if status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )

    # Record status change in history
    old_status = issue.get('status')
    if old_status != status:
        record_issue_history(
            issue_id=issue_id,
            field_name='status',
            old_value=old_status,
            new_value=status,
            changed_by=current_user['id'],
            comment='Status changed via kanban board'
        )

    # Prepare update data
    update_data = {'status': status}

    # Set resolved_at when status changes to 'done'
    if status == 'done' and old_status != 'done':
        update_data['resolved_at'] = datetime.now(timezone.utc).isoformat()
    # Clear resolved_at when status changes from 'done' to something else
    elif status != 'done' and old_status == 'done':
        update_data['resolved_at'] = None

    issues_collection.update(issue_id, update_data)

    # Return updated issue
    updated_issue = issues_collection.get(issue_id)
    return updated_issue


@router.delete("/{issue_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_issue(
    issue_id: str,
    current_user: dict = Depends(get_current_user_firestore)
):
    """Delete an issue"""
    # Check if user has permission to delete issues (viewer and developer cannot delete)
    check_write_permission(current_user, "이슈")

    issue = issues_collection.get(issue_id)
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue not found"
        )

    issues_collection.delete(issue_id)
    return None


@router.post("/upload")
async def upload_attachment(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user_firestore)
):
    """Upload an attachment file to Supabase Storage"""
    # Validate file type (only images)
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files are allowed"
        )

    # Validate file size (max 5MB)
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()  # Get position (file size)
    file.file.seek(0)  # Reset to beginning

    if file_size > 5 * 1024 * 1024:  # 5MB
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size must be less than 5MB"
        )

    # Generate unique filename
    timestamp = int(time.time() * 1000)
    filename = f"{timestamp}_{file.filename}"

    # Read file data
    file_data = await file.read()

    # Upload to Supabase Storage
    try:
        public_url = upload_file("issue-attachments", filename, file_data)
        return {"url": public_url}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}"
        )


@router.get("/{issue_id}/history", response_model=List[IssueHistorySchema])
def get_issue_history(
    issue_id: str,
    current_user: dict = Depends(get_current_user_firestore)
):
    """Get history of changes for a specific issue"""
    # Verify issue exists
    issue = issues_collection.get(issue_id)
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue not found"
        )

    # Get all history records for this issue, ordered by changed_at descending
    all_history = issue_history_collection.list(limit=1000)
    issue_history = [h for h in all_history if h.get('issue_id') == issue_id]

    # Sort by changed_at descending (most recent first)
    issue_history.sort(key=lambda x: x.get('changed_at', ''), reverse=True)

    return issue_history


# Note: Attachments are served directly from Supabase Storage public URLs
# No need for a separate endpoint - files are accessed via public URL
