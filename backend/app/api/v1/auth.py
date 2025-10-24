from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta, datetime
from pydantic import BaseModel, EmailStr
import secrets

from app.db.firestore import users_collection
from app.core.security import verify_password, create_access_token, get_password_hash, get_current_user_firestore
from app.core.config import settings
from app.schemas.user import UserCreate, User as UserSchema, Token

router = APIRouter()


class FindUsernameRequest(BaseModel):
    email: EmailStr


class FindUsernameResponse(BaseModel):
    email: str
    username: str
    created_at: str


class ResetPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordConfirm(BaseModel):
    token: str
    new_password: str


@router.post("/register", response_model=UserSchema)
def register(user_in: UserCreate):
    # Check if user exists
    existing_user = users_collection.get_by_field('email', user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user (always as viewer)
    user_data = {
        'email': user_in.email,
        'username': user_in.email,  # Use email as username
        'full_name': user_in.full_name,
        'role': 'viewer',  # Always viewer for registration
        'hashed_password': get_password_hash(user_in.password),
        'is_active': True
    }

    user = users_collection.create(user_data)
    return user


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # Authenticate user - try email first
    user = users_collection.get_by_field('email', form_data.username)
    if not user:
        user = users_collection.get_by_field('username', form_data.username)

    if not user or not verify_password(form_data.password, user['hashed_password']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.get('is_active', True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )

    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user['id']}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserSchema)
def get_me(current_user: dict = Depends(get_current_user_firestore)):
    """Get current user profile"""
    return current_user


@router.post("/find-username", response_model=FindUsernameResponse)
def find_username(request: FindUsernameRequest):
    """이메일로 아이디(사용자명) 찾기"""
    user = users_collection.get_by_field('email', request.email)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 이메일로 등록된 계정을 찾을 수 없습니다"
        )

    return {
        "email": user['email'],
        "username": user.get('username', user['email']),
        "created_at": user['created_at'].strftime("%Y-%m-%d") if isinstance(user['created_at'], datetime) else str(user['created_at'])
    }


@router.post("/reset-password-request")
def reset_password_request(request: ResetPasswordRequest):
    """비밀번호 재설정 토큰 생성"""
    user = users_collection.get_by_field('email', request.email)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 이메일로 등록된 계정을 찾을 수 없습니다"
        )

    # Generate reset token (6-digit code)
    reset_token = ''.join([str(secrets.randbelow(10)) for _ in range(6)])

    # Store token in user document (expires in 30 minutes)
    users_collection.update(user['id'], {
        'reset_token': reset_token,
        'reset_token_expires': datetime.utcnow() + timedelta(minutes=30)
    })

    # In a real system, send this token via email
    # For now, return it in the response (for testing only)
    return {
        "message": "비밀번호 재설정 코드가 생성되었습니다",
        "token": reset_token,  # Remove this in production
        "email": request.email
    }


@router.post("/reset-password")
def reset_password(request: ResetPasswordConfirm):
    """비밀번호 재설정"""
    # Find user with matching token
    users = users_collection.get_all()
    user = None

    for u in users:
        if u.get('reset_token') == request.token:
            user = u
            break

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="유효하지 않은 재설정 코드입니다"
        )

    # Check if token is expired
    if 'reset_token_expires' in user:
        expires = user['reset_token_expires']
        if isinstance(expires, str):
            expires = datetime.fromisoformat(expires.replace('Z', '+00:00'))

        if datetime.utcnow() > expires:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="재설정 코드가 만료되었습니다"
            )

    # Update password and clear reset token
    users_collection.update(user['id'], {
        'hashed_password': get_password_hash(request.new_password),
        'reset_token': None,
        'reset_token_expires': None
    })

    return {"message": "비밀번호가 성공적으로 재설정되었습니다"}
