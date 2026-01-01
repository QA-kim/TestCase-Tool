from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime
from enum import Enum
import re


class UserRole(str, Enum):
    ADMIN = "admin"
    QA_MANAGER = "qa_manager"
    QA_ENGINEER = "qa_engineer"
    DEVELOPER = "developer"
    VIEWER = "viewer"


class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=100)
    role: UserRole = UserRole.VIEWER

    @validator('full_name')
    def validate_full_name(cls, v):
        if not v or not v.strip():
            raise ValueError('이름은 비어있을 수 없습니다')
        # Remove potentially dangerous characters
        v = v.strip()
        if len(v) > 100:
            raise ValueError('이름은 100자를 초과할 수 없습니다')
        return v


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=8, max_length=128)

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('비밀번호는 최소 8자 이상이어야 합니다')
        if len(v) > 128:
            raise ValueError('비밀번호는 128자를 초과할 수 없습니다')

        # Check for at least one letter
        if not re.search(r'[a-zA-Z]', v):
            raise ValueError('비밀번호는 최소 1개의 영문자를 포함해야 합니다')

        # Check for at least one digit
        if not re.search(r'\d', v):
            raise ValueError('비밀번호는 최소 1개의 숫자를 포함해야 합니다')

        return v

    @validator('full_name')
    def validate_full_name(cls, v):
        if not v or not v.strip():
            raise ValueError('이름은 비어있을 수 없습니다')
        v = v.strip()
        if len(v) > 100:
            raise ValueError('이름은 100자를 초과할 수 없습니다')
        return v


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class UserInDB(UserBase):
    id: str  # Firestore uses string IDs
    is_active: bool
    is_temp_password: Optional[bool] = False
    is_locked: Optional[bool] = False
    failed_login_attempts: Optional[int] = 0
    locked_until: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class User(UserInDB):
    pass


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenPayload(BaseModel):
    sub: Optional[str] = None  # Firestore uses string IDs
