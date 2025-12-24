from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.db.supabase import testruns_collection, testresults_collection
from app.core.security import get_current_user_firestore
from app.core.permissions import check_write_permission
from app.schemas.testrun import (
    TestRunCreate,
    TestRunUpdate,
    TestRun as TestRunSchema,
    TestResultCreate,
    TestResultUpdate,
    TestResult as TestResultSchema
)

router = APIRouter()


@router.post("", response_model=TestRunSchema, status_code=status.HTTP_201_CREATED)
def create_testrun(
    testrun_in: TestRunCreate,
    current_user: dict = Depends(get_current_user_firestore)
):
    # Check if user has permission to create test runs (viewer role cannot create)
    check_write_permission(current_user, "테스트 실행")

    testrun_data = testrun_in.dict()  # Pydantic v1 uses .dict()
    testrun_data['status'] = 'planned'  # Default status
    testrun = testruns_collection.create(testrun_data)
    return testrun


@router.get("", response_model=List[TestRunSchema])
def list_testruns(
    project_id: str = None,
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user_firestore)
):
    if project_id:
        testruns = testruns_collection.query('project_id', '==', project_id)
    else:
        testruns = testruns_collection.list(limit=limit)

    return testruns[skip:skip+limit]


@router.get("/{testrun_id}", response_model=TestRunSchema)
def get_testrun(
    testrun_id: str,
    current_user: dict = Depends(get_current_user_firestore)
):
    testrun = testruns_collection.get(testrun_id)
    if not testrun:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test run not found"
        )
    return testrun


@router.put("/{testrun_id}", response_model=TestRunSchema)
def update_testrun(
    testrun_id: str,
    testrun_in: TestRunUpdate,
    current_user: dict = Depends(get_current_user_firestore)
):
    testrun = testruns_collection.get(testrun_id)
    if not testrun:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test run not found"
        )

    # Check if user has permission to modify test runs
    check_write_permission(current_user, "테스트 실행")

    update_data = testrun_in.dict(exclude_unset=True)  # Pydantic v1 uses .dict()
    testruns_collection.update(testrun_id, update_data)

    # Return updated testrun
    updated_testrun = testruns_collection.get(testrun_id)
    return updated_testrun


@router.delete("/{testrun_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_testrun(
    testrun_id: str,
    current_user: dict = Depends(get_current_user_firestore)
):
    testrun = testruns_collection.get(testrun_id)
    if not testrun:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test run not found"
        )

    # Check if user has permission to delete test runs
    check_write_permission(current_user, "테스트 실행")

    testruns_collection.delete(testrun_id)
    return None


@router.get("/{testrun_id}/results", response_model=List[TestResultSchema])
def get_testrun_results(
    testrun_id: str,
    current_user: dict = Depends(get_current_user_firestore)
):
    testrun = testruns_collection.get(testrun_id)
    if not testrun:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test run not found"
        )

    results = testresults_collection.query('test_run_id', '==', testrun_id)
    return results


@router.post("/results", response_model=TestResultSchema, status_code=status.HTTP_201_CREATED)
def create_testresult(
    result_in: TestResultCreate,
    current_user: dict = Depends(get_current_user_firestore)
):
    result_data = result_in.dict()  # Pydantic v1 uses .dict()
    result_data['tester_id'] = current_user['id']
    result = testresults_collection.create(result_data)
    return result


@router.put("/results/{result_id}", response_model=TestResultSchema)
def update_testresult(
    result_id: str,
    result_in: TestResultUpdate,
    current_user: dict = Depends(get_current_user_firestore)
):
    result = testresults_collection.get(result_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test result not found"
        )

    update_data = result_in.dict(exclude_unset=True)  # Pydantic v1 uses .dict()
    testresults_collection.update(result_id, update_data)

    # Return updated result
    updated_result = testresults_collection.get(result_id)
    return updated_result
