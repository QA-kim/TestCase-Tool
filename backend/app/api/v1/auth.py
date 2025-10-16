from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta

from app.db.firestore import users_collection
from app.core.security import verify_password, create_access_token, get_password_hash, get_current_user_firestore
from app.core.config import settings
from app.schemas.user import UserCreate, User as UserSchema, Token

router = APIRouter()


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
