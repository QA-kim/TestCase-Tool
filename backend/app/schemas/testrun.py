from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum


class TestRunStatus(str, Enum):
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    BLOCKED = "blocked"


class TestResultStatus(str, Enum):
    UNTESTED = "untested"
    PASSED = "passed"
    FAILED = "failed"
    BLOCKED = "blocked"  # 테스트불가
    SKIPPED = "skipped"


class TestRunBase(BaseModel):
    name: str
    description: Optional[str] = None
    assignee_id: Optional[str] = None  # Firestore uses string IDs
    environment: Optional[str] = None
    milestone: Optional[str] = None


class TestRunCreate(TestRunBase):
    project_id: str  # Firestore uses string IDs
    test_case_ids: list[str] = []  # Firestore uses string IDs


class TestRunUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    assignee_id: Optional[str] = None  # Firestore uses string IDs
    status: Optional[TestRunStatus] = None
    environment: Optional[str] = None
    milestone: Optional[str] = None
    test_case_ids: Optional[list[str]] = None  # Firestore uses string IDs


# Simple TestCase schema to avoid circular imports
class TestCaseSimple(BaseModel):
    id: str  # Firestore uses string IDs
    title: str
    priority: str
    test_type: str

    class Config:
        from_attributes = True


class TestRunInDB(TestRunBase):
    id: str  # Firestore uses string IDs
    project_id: str  # Firestore uses string IDs
    test_case_ids: List[str] = []  # Firestore uses string IDs
    status: TestRunStatus
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TestRun(TestRunInDB):
    pass


class TestResultBase(BaseModel):
    status: TestResultStatus = TestResultStatus.UNTESTED
    actual_result: Optional[str] = None
    comment: Optional[str] = None
    # defect_url and execution_time removed - not in Supabase schema


class TestResultCreate(TestResultBase):
    testrun_id: str  # Supabase uses testrun_id
    testcase_id: str  # Supabase uses testcase_id
    executed_by: Optional[str] = None  # Supabase uses executed_by instead of tester_id


class TestResultUpdate(BaseModel):
    status: Optional[TestResultStatus] = None
    actual_result: Optional[str] = None
    comment: Optional[str] = None
    # defect_url and execution_time removed - not in Supabase schema


class TestResultHistory(BaseModel):
    status: TestResultStatus
    comment: Optional[str] = None
    tester_id: Optional[str] = None
    tested_at: datetime

    class Config:
        from_attributes = True


class TestResultInDB(TestResultBase):
    id: str  # Firestore uses string IDs
    testrun_id: str  # Supabase uses testrun_id
    testcase_id: str  # Supabase uses testcase_id
    executed_by: Optional[str] = None  # Supabase uses executed_by instead of tester_id
    executed_at: Optional[datetime] = None  # Supabase uses executed_at instead of tested_at
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TestResult(TestResultInDB):
    pass
