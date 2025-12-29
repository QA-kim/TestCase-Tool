from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from typing import List
import time

from app.db.supabase import issues_collection, projects_collection, testcases_collection, upload_file, get_file_url
from app.core.security import get_current_user_firestore
from app.schemas.issue import IssueCreate, IssueUpdate, Issue as IssueSchema

router = APIRouter(redirect_slashes=False)


@router.post("", response_model=IssueSchema, status_code=status.HTTP_201_CREATED)
def create_issue(
    issue_in: IssueCreate,
    current_user: dict = Depends(get_current_user_firestore)
):
    """Create a new issue"""
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

    issues_collection.update(issue_id, {'status': status})

    # Return updated issue
    updated_issue = issues_collection.get(issue_id)
    return updated_issue


@router.delete("/{issue_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_issue(
    issue_id: str,
    current_user: dict = Depends(get_current_user_firestore)
):
    """Delete an issue"""
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


# Note: Attachments are served directly from Supabase Storage public URLs
# No need for a separate endpoint - files are accessed via public URL
