from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import uuid

from app.db.supabase import testruns_collection, testresults_collection, testrun_testcases_collection
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

router = APIRouter(redirect_slashes=False)


def _get_testrun_testcase_ids(testrun_id: str) -> List[str]:
    """Get test case IDs for a test run from junction table"""
    junction_records = testrun_testcases_collection.query('testrun_id', '==', testrun_id)
    return [record['testcase_id'] for record in junction_records]


def _sync_testrun_testcases(testrun_id: str, testcase_ids: List[str]):
    """Sync test case IDs in junction table for a test run"""
    # Delete existing associations
    existing = testrun_testcases_collection.query('testrun_id', '==', testrun_id)
    for record in existing:
        testrun_testcases_collection.delete(record['id'])

    # Create new associations
    for testcase_id in testcase_ids:
        junction_data = {
            'id': str(uuid.uuid4()),
            'testrun_id': testrun_id,
            'testcase_id': testcase_id
        }
        testrun_testcases_collection.create(junction_data)


@router.post("", response_model=TestRunSchema, status_code=status.HTTP_201_CREATED)
def create_testrun(
    testrun_in: TestRunCreate,
    current_user: dict = Depends(get_current_user_firestore)
):
    # Check if user has permission to create test runs (viewer role cannot create)
    check_write_permission(current_user, "테스트 실행")

    testrun_data = testrun_in.dict()  # Pydantic v1 uses .dict()
    testrun_data['status'] = 'planned'  # Default status

    # Extract test_case_ids (not stored in testruns table)
    test_case_ids = testrun_data.pop('test_case_ids', [])

    # Remove fields that don't exist in Supabase schema
    testrun_data.pop('milestone', None)

    testrun = testruns_collection.create(testrun_data)

    # Sync test case associations in junction table
    if test_case_ids:
        _sync_testrun_testcases(testrun['id'], test_case_ids)

    # Add test_case_ids to response
    testrun['test_case_ids'] = test_case_ids
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

    # Add test_case_ids from junction table
    for testrun in testruns:
        testrun['test_case_ids'] = _get_testrun_testcase_ids(testrun['id'])

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

    # Add test_case_ids from junction table
    testrun['test_case_ids'] = _get_testrun_testcase_ids(testrun_id)

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

    # Extract test_case_ids (not stored in testruns table)
    test_case_ids = update_data.pop('test_case_ids', None)

    # Remove fields that don't exist in Supabase schema
    update_data.pop('milestone', None)

    # Update test run (only if there are fields to update)
    if update_data:
        testruns_collection.update(testrun_id, update_data)

    # Sync test case associations if provided
    if test_case_ids is not None:
        _sync_testrun_testcases(testrun_id, test_case_ids)

    # Return updated testrun
    updated_testrun = testruns_collection.get(testrun_id)

    # Add test_case_ids from junction table
    updated_testrun['test_case_ids'] = _get_testrun_testcase_ids(testrun_id)

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

    results = testresults_collection.query('testrun_id', '==', testrun_id)
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
