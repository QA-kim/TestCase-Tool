from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.testrun import TestRunStatus, TestResultStatus


class TestRunBase(BaseModel):
    name: str
    description: Optional[str] = None
    assignee_id: Optional[int] = None
    environment: Optional[str] = None
    milestone: Optional[str] = None


class TestRunCreate(TestRunBase):
    project_id: int
    test_case_ids: list[int] = []


class TestRunUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    assignee_id: Optional[int] = None
    status: Optional[TestRunStatus] = None
    environment: Optional[str] = None
    milestone: Optional[str] = None
    test_case_ids: Optional[list[int]] = None


# Simple TestCase schema to avoid circular imports
class TestCaseSimple(BaseModel):
    id: int
    title: str
    priority: str
    test_type: str

    class Config:
        from_attributes = True


class TestRunInDB(TestRunBase):
    id: int
    project_id: int
    status: TestRunStatus
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TestRun(TestRunInDB):
    testcases: List[TestCaseSimple] = []

    class Config:
        from_attributes = True


class TestResultBase(BaseModel):
    status: TestResultStatus = TestResultStatus.UNTESTED
    actual_result: Optional[str] = None
    comment: Optional[str] = None
    defect_url: Optional[str] = None
    execution_time: Optional[int] = None


class TestResultCreate(TestResultBase):
    test_run_id: int
    test_case_id: int
    tester_id: Optional[int] = None


class TestResultUpdate(BaseModel):
    status: Optional[TestResultStatus] = None
    actual_result: Optional[str] = None
    comment: Optional[str] = None
    defect_url: Optional[str] = None
    execution_time: Optional[int] = None


class TestResultInDB(TestResultBase):
    id: int
    test_run_id: int
    test_case_id: int
    tester_id: Optional[int] = None
    tested_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TestResult(TestResultInDB):
    pass
