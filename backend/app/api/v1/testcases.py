from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from fastapi.responses import StreamingResponse
from typing import List
from io import BytesIO
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font, PatternFill, Alignment
from pydantic import BaseModel

from app.db.supabase import testcases_collection, testcase_history_collection, projects_collection
from app.core.security import get_current_user_firestore
from app.core.permissions import check_write_permission
from app.schemas.testcase import TestCaseCreate, TestCaseUpdate, TestCase as TestCaseSchema
from app.services.ai_testcase_generator import generate_testcases_from_prd

router = APIRouter(redirect_slashes=False)


# Request/Response models for AI generation
class AIGenerateRequest(BaseModel):
    prd_content: str
    project_id: str


class AIGenerateResponse(BaseModel):
    testcases: List[dict]
    count: int


@router.post("", response_model=TestCaseSchema, status_code=status.HTTP_201_CREATED)
def create_testcase(
    testcase_in: TestCaseCreate,
    current_user: dict = Depends(get_current_user_firestore)
):
    # Check if user has permission to create test cases (viewer and developer cannot create)
    check_write_permission(current_user, "테스트케이스")

    # Convert Pydantic model to dict using json-compatible way to handle Enums
    import json
    testcase_data = json.loads(testcase_in.json())
    
    # Debug logging
    print(f"📝 Creating testcase - Input tags: {testcase_data.get('tags')} (type: {type(testcase_data.get('tags'))})")
    
    # Add created_by
    testcase_data['created_by'] = current_user.get('id')
    
    # Ensure tags is a list (handle legacy string format)
    if testcase_data.get('tags') is None:
        testcase_data['tags'] = []
    elif isinstance(testcase_data.get('tags'), str):
        # Convert comma-separated string to list
        print(f"⚠️ Converting string tags to list: {testcase_data['tags']}")
        testcase_data['tags'] = [t.strip() for t in testcase_data['tags'].split(',') if t.strip()]

    print(f"📝 Final testcase data tags: {testcase_data['tags']}")
    
    try:
        testcase = testcases_collection.create(testcase_data)
    except Exception as e:
        # Handle missing created_by column (Schema mismatch)
        error_str = str(e)
        if "Could not find the 'created_by' column" in error_str:
            print("⚠️ 'created_by' column missing in database schema. Retrying without it.")
            if 'created_by' in testcase_data:
                del testcase_data['created_by']
            testcase = testcases_collection.create(testcase_data)
        else:
            raise e
            
    return testcase


@router.get("", response_model=List[TestCaseSchema])
def list_testcases(
    project_id: str = None,
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user_firestore)
):
    if project_id:
        testcases = testcases_collection.query('project_id', '==', project_id)
    else:
        testcases = testcases_collection.list(limit=limit)

    return testcases[skip:skip+limit]


@router.get("/{testcase_id}", response_model=TestCaseSchema)
def get_testcase(
    testcase_id: str,
    current_user: dict = Depends(get_current_user_firestore)
):
    testcase = testcases_collection.get(testcase_id)
    if not testcase:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test case not found"
        )
    return testcase


@router.put("/{testcase_id}", response_model=TestCaseSchema)
def update_testcase(
    testcase_id: str,
    testcase_in: TestCaseUpdate,
    current_user: dict = Depends(get_current_user_firestore)
):
    # Check if user has permission to update test cases (viewer and developer cannot update)
    check_write_permission(current_user, "테스트케이스")

    testcase = testcases_collection.get(testcase_id)
    if not testcase:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test case not found"
        )

    # Get current version number
    history_records = testcase_history_collection.query('testcase_id', '==', testcase_id)
    new_version = len(history_records) + 1

    # Save current state to history before updating
    history_data = {
        'testcase_id': testcase_id,
        'version': new_version,
        'title': testcase.get('title'),
        'description': testcase.get('description'),
        'preconditions': testcase.get('preconditions'),
        'steps': testcase.get('steps'),
        'expected_result': testcase.get('expected_result'),
        'priority': testcase.get('priority'),
        'test_type': testcase.get('test_type'),
        'modified_by': current_user['id'],  # Supabase uses modified_by instead of changed_by
        'change_note': testcase_in.dict().get('change_note', None)  # Pydantic v1 uses .dict()
    }
    testcase_history_collection.create(history_data)

    # Update testcase
    update_data = testcase_in.dict(exclude_unset=True)  # Pydantic v1 uses .dict()
    if 'change_note' in update_data:
        del update_data['change_note']

    testcases_collection.update(testcase_id, update_data)

    # Return updated testcase
    updated_testcase = testcases_collection.get(testcase_id)
    return updated_testcase


@router.delete("/{testcase_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_testcase(
    testcase_id: str,
    current_user: dict = Depends(get_current_user_firestore)
):
    # Check if user has permission to delete test cases (viewer and developer cannot delete)
    check_write_permission(current_user, "테스트케이스")

    testcase = testcases_collection.get(testcase_id)
    if not testcase:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test case not found"
        )

    testcases_collection.delete(testcase_id)
    return None


@router.get("/{testcase_id}/history")
def get_testcase_history(
    testcase_id: str,
    current_user: dict = Depends(get_current_user_firestore)
):
    testcase = testcases_collection.get(testcase_id)
    if not testcase:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test case not found"
        )

    history_records = testcase_history_collection.query('testcase_id', '==', testcase_id)
    # Sort by version descending
    history_records.sort(key=lambda x: x.get('version', 0), reverse=True)

    return history_records


@router.get("/template/download")
def download_template(
    current_user: dict = Depends(get_current_user_firestore)
):
    """Download Excel template for test case import"""
    wb = Workbook()
    ws = wb.active
    ws.title = "테스트 케이스"

    # Header styling
    header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
    header_font = Font(bold=True, color="FFFFFF", size=11)
    header_alignment = Alignment(horizontal="center", vertical="center")

    # Define headers
    headers = [
        "프로젝트 이름*",
        "제목*",
        "설명",
        "사전조건",
        "수행방법*",
        "예상결과*",
        "우선순위*",
        "테스트 유형*"
    ]

    # Write headers
    for col_num, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col_num, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = header_alignment

    # Add example row
    example_row = [
        "샘플 프로젝트",
        "로그인 기능 테스트",
        "사용자가 이메일과 비밀번호로 로그인할 수 있는지 확인",
        "1. 사용자 계정이 생성되어 있어야 함\n2. 로그인 페이지에 접근 가능해야 함",
        "1. 로그인 페이지로 이동\n2. 이메일 입력\n3. 비밀번호 입력\n4. 로그인 버튼 클릭",
        "사용자가 성공적으로 로그인되고 대시보드 페이지로 이동됨",
        "high",
        "functional"
    ]

    for col_num, value in enumerate(example_row, 1):
        cell = ws.cell(row=2, column=col_num, value=value)
        cell.alignment = Alignment(wrap_text=True, vertical="top")

    # Add instruction sheet
    ws_info = wb.create_sheet("작성 가이드")
    ws_info.column_dimensions['A'].width = 20
    ws_info.column_dimensions['B'].width = 50

    instructions = [
        ("필수 필드", "* 표시가 있는 필드는 반드시 입력해야 합니다"),
        ("프로젝트 이름", "테스트 케이스가 속할 프로젝트의 이름을 입력합니다 (정확히 일치해야 함)"),
        ("제목", "테스트 케이스의 제목을 입력합니다"),
        ("설명", "테스트 케이스에 대한 상세 설명을 입력합니다 (선택)"),
        ("사전조건", "테스트 수행 전 준비해야 할 조건을 입력합니다 (선택)"),
        ("수행방법", "테스트를 수행하는 단계별 절차를 입력합니다"),
        ("예상결과", "테스트 수행 후 예상되는 결과를 입력합니다"),
        ("우선순위", "high, medium, low 중 하나를 입력합니다"),
        ("테스트 유형", "functional, performance, security, usability 중 하나를 입력합니다"),
    ]

    for row_num, (field, desc) in enumerate(instructions, 1):
        ws_info.cell(row=row_num, column=1, value=field).font = Font(bold=True)
        ws_info.cell(row=row_num, column=2, value=desc)

    # Adjust column widths
    ws.column_dimensions['A'].width = 20
    ws.column_dimensions['B'].width = 30
    ws.column_dimensions['C'].width = 40
    ws.column_dimensions['D'].width = 40
    ws.column_dimensions['E'].width = 40
    ws.column_dimensions['F'].width = 40
    ws.column_dimensions['G'].width = 12
    ws.column_dimensions['H'].width = 15

    # Save to BytesIO
    excel_file = BytesIO()
    wb.save(excel_file)
    excel_file.seek(0)

    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=testcase_template.xlsx"}
    )


@router.post("/import/excel")
async def import_excel(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user_firestore)
):
    """Import test cases from Excel file"""
    # Check if user has permission to import test cases (viewer and developer cannot import)
    check_write_permission(current_user, "테스트케이스")

    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only Excel files (.xlsx, .xls) are allowed"
        )

    try:
        # Read Excel file
        contents = await file.read()
        wb = load_workbook(BytesIO(contents))
        ws = wb.active

        # Skip header row
        imported_count = 0
        errors = []

        for row_num, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
            if not row or not any(row):  # Skip empty rows
                continue

            try:
                project_name, title, description, preconditions, steps, expected_result, priority, test_type = row[:8]

                # Validate required fields
                if not all([project_name, title, steps, expected_result, priority, test_type]):
                    errors.append(f"행 {row_num}: 필수 필드가 누락되었습니다")
                    continue

                # Find project by name
                projects = projects_collection.query('name', '==', str(project_name))
                if not projects:
                    errors.append(f"행 {row_num}: 프로젝트 '{project_name}'을(를) 찾을 수 없습니다")
                    continue

                project = projects[0]
                project_id = project['id']

                # Validate priority
                if priority not in ['high', 'medium', 'low']:
                    errors.append(f"행 {row_num}: 우선순위는 high, medium, low 중 하나여야 합니다")
                    continue

                # Validate test_type
                if test_type not in ['functional', 'regression', 'smoke', 'integration', 'performance', 'security']:
                    errors.append(f"행 {row_num}: 테스트 유형은 functional, regression, smoke, integration, performance, security 중 하나여야 합니다")
                    continue

                # Create test case
                testcase_data = {
                    'project_id': str(project_id),
                    'title': str(title),
                    'description': str(description) if description else None,
                    'preconditions': str(preconditions) if preconditions else None,
                    'steps': str(steps),
                    'expected_result': str(expected_result),
                    'priority': str(priority),
                    'test_type': str(test_type)
                }

                testcases_collection.create(testcase_data)
                imported_count += 1

            except Exception as e:
                errors.append(f"행 {row_num}: {str(e)}")

        return {
            "imported_count": imported_count,
            "errors": errors,
            "success": imported_count > 0
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Excel 파일 처리 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/ai/generate", response_model=AIGenerateResponse)
def generate_testcases_with_ai(
    request: AIGenerateRequest,
    current_user: dict = Depends(get_current_user_firestore)
):
    """Generate test cases from PRD content using AI"""
    # Check if user has permission to create test cases
    check_write_permission(current_user, "테스트케이스")

    # Validate project exists
    project = projects_collection.get(request.project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    try:
        # Generate test cases using AI
        generated_testcases = generate_testcases_from_prd(
            prd_content=request.prd_content,
            project_name=project.get('name', '')
        )

        # Return generated test cases (not saved to database yet - user can review and edit)
        return AIGenerateResponse(
            testcases=generated_testcases,
            count=len(generated_testcases)
        )

    except ValueError as e:
        # Specific error from AI service (API key missing, parsing error, etc.)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI 테스트 케이스 생성 중 오류가 발생했습니다: {str(e)}"
        )
