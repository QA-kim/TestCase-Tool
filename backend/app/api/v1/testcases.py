from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.db.firestore import testcases_collection, testcase_history_collection
from app.core.security import get_current_user_firestore
from app.schemas.testcase import TestCaseCreate, TestCaseUpdate, TestCase as TestCaseSchema

router = APIRouter()


@router.post("/", response_model=TestCaseSchema, status_code=status.HTTP_201_CREATED)
def create_testcase(
    testcase_in: TestCaseCreate,
    current_user: dict = Depends(get_current_user_firestore)
):
    testcase_data = testcase_in.model_dump()
    testcase = testcases_collection.create(testcase_data)
    return testcase


@router.get("/", response_model=List[TestCaseSchema])
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
        'changed_by': current_user['id'],
        'change_note': testcase_in.model_dump().get('change_note', None)
    }
    testcase_history_collection.create(history_data)

    # Update testcase
    update_data = testcase_in.model_dump(exclude_unset=True)
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
