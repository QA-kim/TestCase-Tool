from typing import List
from fastapi import APIRouter, Depends, HTTPException, status

from app.db.firestore import users_collection
from app.core.security import get_current_user_firestore
from app.schemas.user import User as UserSchema

router = APIRouter()


@router.get("/", response_model=List[UserSchema])
def get_users(current_user: dict = Depends(get_current_user_firestore)):
    """Get all users (for displaying names in history)"""
    users = users_collection.list(limit=1000)
    return users
