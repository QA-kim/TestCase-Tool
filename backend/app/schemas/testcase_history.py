from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class TestCaseHistoryBase(BaseModel):
    version: int
    title: str
    description: Optional[str] = None
    preconditions: Optional[str] = None
    steps: Optional[str] = None
    expected_result: Optional[str] = None
    priority: str
    test_type: str
    change_note: Optional[str] = None


class TestCaseHistoryCreate(BaseModel):
    testcase_id: int
    version: int
    title: str
    description: Optional[str] = None
    preconditions: Optional[str] = None
    steps: Optional[str] = None
    expected_result: Optional[str] = None
    priority: str
    test_type: str
    changed_by: int
    change_note: Optional[str] = None


class TestCaseHistory(TestCaseHistoryBase):
    id: int
    testcase_id: int
    changed_by: int
    changed_at: datetime

    class Config:
        from_attributes = True


class TestCaseHistoryWithUser(TestCaseHistory):
    user_name: Optional[str] = None
    user_email: Optional[str] = None

    class Config:
        from_attributes = True
