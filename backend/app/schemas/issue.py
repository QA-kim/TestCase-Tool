from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


class IssueStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    IN_REVIEW = "in_review"
    DONE = "done"


class IssuePriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class IssueType(str, Enum):
    BUG = "bug"
    IMPROVEMENT = "improvement"
    TASK = "task"


class IssueBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = Field(None, max_length=5000)
    status: IssueStatus = IssueStatus.TODO
    priority: IssuePriority = IssuePriority.MEDIUM
    issue_type: IssueType = IssueType.BUG
    testcase_id: Optional[str] = None  # 연관된 테스트 케이스
    testrun_id: Optional[str] = None  # 연관된 테스트 실행
    assigned_to: Optional[str] = None  # 담당자 user_id
    resolution: Optional[str] = Field(None, max_length=5000)  # 해결 방법 (Done 상태일 때)
    attachments: Optional[List[str]] = Field(default_factory=list)  # 첨부파일 URL 목록

    @validator('title')
    def validate_title(cls, v):
        if not v or not v.strip():
            raise ValueError('이슈 제목은 비어있을 수 없습니다')
        v = v.strip()
        if len(v) > 500:
            raise ValueError('이슈 제목은 500자를 초과할 수 없습니다')
        return v

    @validator('description')
    def validate_description(cls, v):
        if v and len(v) > 5000:
            raise ValueError('이슈 설명은 5000자를 초과할 수 없습니다')
        return v.strip() if v else v


class IssueCreate(IssueBase):
    project_id: str  # Firestore uses string IDs


class IssueUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = Field(None, max_length=5000)
    status: Optional[IssueStatus] = None
    priority: Optional[IssuePriority] = None
    issue_type: Optional[IssueType] = None
    testcase_id: Optional[str] = None
    testrun_id: Optional[str] = None
    assigned_to: Optional[str] = None
    resolution: Optional[str] = Field(None, max_length=5000)
    attachments: Optional[List[str]] = None

    @validator('title')
    def validate_title(cls, v):
        if v is not None:
            if not v.strip():
                raise ValueError('이슈 제목은 비어있을 수 없습니다')
            v = v.strip()
            if len(v) > 500:
                raise ValueError('이슈 제목은 500자를 초과할 수 없습니다')
        return v

    @validator('description')
    def validate_description(cls, v):
        if v and len(v) > 5000:
            raise ValueError('이슈 설명은 5000자를 초과할 수 없습니다')
        return v.strip() if v else v


class IssueInDB(IssueBase):
    id: str  # Firestore uses string IDs
    project_id: str  # Firestore uses string IDs
    created_by: str  # user_id
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None  # When issue was marked as Done

    class Config:
        from_attributes = True


class Issue(IssueInDB):
    pass


class IssueHistoryBase(BaseModel):
    issue_id: str
    field_name: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    comment: Optional[str] = None


class IssueHistoryCreate(IssueHistoryBase):
    changed_by: str


class IssueHistoryInDB(IssueHistoryBase):
    id: str
    changed_by: str
    changed_at: datetime

    class Config:
        from_attributes = True


class IssueHistory(IssueHistoryInDB):
    pass
