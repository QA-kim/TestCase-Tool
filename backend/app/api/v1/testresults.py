from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.db.supabase import testresults_collection
from app.core.security import get_current_user_firestore
from app.schemas.testrun import (
    TestResultCreate,
    TestResultUpdate,
    TestResult as TestResultSchema
)

router = APIRouter()


@router.get("/", response_model=List[TestResultSchema])
def list_testresults(
    test_run_id: str = None,
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user_firestore)
):
    if test_run_id:
        results = testresults_collection.query('testrun_id', '==', test_run_id)
    else:
        results = testresults_collection.list(limit=limit)

    return results[skip:skip+limit]


@router.post("/", response_model=TestResultSchema, status_code=status.HTTP_201_CREATED)
def create_testresult(
    result_in: TestResultCreate,
    current_user: dict = Depends(get_current_user_firestore)
):
    from datetime import datetime
    result_data = result_in.dict()  # Pydantic v1 uses .dict()

    # Use Supabase field names
    result_data['executed_by'] = current_user['id']
    result_data['executed_at'] = datetime.utcnow().isoformat()

    result = testresults_collection.create(result_data)
    return result


@router.get("/{result_id}", response_model=TestResultSchema)
def get_testresult(
    result_id: str,
    current_user: dict = Depends(get_current_user_firestore)
):
    result = testresults_collection.get(result_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test result not found"
        )
    return result


@router.put("/{result_id}", response_model=TestResultSchema)
def update_testresult(
    result_id: str,
    result_in: TestResultUpdate,
    current_user: dict = Depends(get_current_user_firestore)
):
    from datetime import datetime
    result = testresults_collection.get(result_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test result not found"
        )

    update_data = result_in.dict(exclude_unset=True)  # Pydantic v1 uses .dict()

    # Use Supabase field names
    update_data['executed_by'] = current_user['id']
    update_data['executed_at'] = datetime.utcnow().isoformat()

    testresults_collection.update(result_id, update_data)

    # Return updated result
    updated_result = testresults_collection.get(result_id)
    return updated_result


@router.delete("/{result_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_testresult(
    result_id: str,
    current_user: dict = Depends(get_current_user_firestore)
):
    result = testresults_collection.get(result_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test result not found"
        )

    testresults_collection.delete(result_id)
    return None
