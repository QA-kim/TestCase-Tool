from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta, datetime
from pydantic import BaseModel, EmailStr
import secrets
import logging

from app.db.firestore import users_collection
from app.core.security import verify_password, create_access_token, get_password_hash, get_current_user_firestore
from app.core.config import settings
from app.schemas.user import UserCreate, User as UserSchema, Token

router = APIRouter()
logger = logging.getLogger(__name__)


def send_email(to_email: str, subject: str, body: str):
    """이메일 발송 (SendGrid API)"""
    import os
    from sendgrid import SendGridAPIClient
    from sendgrid.helpers.mail import Mail

    # SendGrid 설정
    sendgrid_api_key = os.getenv('SENDGRID_API_KEY')
    sender_email = os.getenv('SENDGRID_SENDER_EMAIL', 'noreply@tcms.com')

    # 환경 변수가 설정되지 않은 경우 로그만 출력
    if not sendgrid_api_key:
        logger.warning("SendGrid API key not configured. Email will not be sent.")
        logger.info(f"=== 이메일 발송 (로그만) ===")
        logger.info(f"받는 사람: {to_email}")
        logger.info(f"제목: {subject}")
        logger.info(f"내용:\n{body}")
        logger.info(f"==================")
        return

    try:
        # 이메일 메시지 생성
        message = Mail(
            from_email=sender_email,
            to_emails=to_email,
            subject=subject,
            plain_text_content=body
        )

        # SendGrid API로 이메일 발송
        sg = SendGridAPIClient(sendgrid_api_key)
        response = sg.send(message)

        logger.info(f"Email sent successfully to {to_email} (status: {response.status_code})")

    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        # 이메일 발송 실패 시에도 로그는 출력
        logger.info(f"=== 이메일 발송 실패 (내용 로그) ===")
        logger.info(f"받는 사람: {to_email}")
        logger.info(f"제목: {subject}")
        logger.info(f"내용:\n{body}")
        logger.info(f"==================")
        # 이메일 발송 실패해도 에러는 던지지 않음 (사용자에게는 성공 메시지 표시)
        logger.warning("Email sending failed, but continuing...")


class FindEmailRequest(BaseModel):
    full_name: str


class FindEmailResponse(BaseModel):
    emails: list[str]
    count: int


class ResetPasswordRequest(BaseModel):
    email: EmailStr


class ChangePasswordRequest(BaseModel):
    current_password: str
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


@router.post("/find-email", response_model=FindEmailResponse)
def find_email(request: FindEmailRequest):
    """이름으로 등록된 이메일 찾기"""
    # Get all users and filter by full_name (using list method with high limit)
    all_users = users_collection.list(limit=1000)
    matching_users = [u for u in all_users if u.get('full_name', '').strip().lower() == request.full_name.strip().lower()]

    if not matching_users:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 이름으로 등록된 계정을 찾을 수 없습니다"
        )

    emails = [u['email'] for u in matching_users]

    return {
        "emails": emails,
        "count": len(emails)
    }


@router.post("/reset-password-request")
def reset_password_request(request: ResetPasswordRequest):
    """임시 비밀번호 생성 및 이메일 발송"""
    user = users_collection.get_by_field('email', request.email)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 이메일로 등록된 계정을 찾을 수 없습니다"
        )

    # Generate temporary password (8 characters: letters + numbers)
    import random
    import string
    temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=8))

    # Update user with temporary password and flag
    users_collection.update(user['id'], {
        'hashed_password': get_password_hash(temp_password),
        'is_temp_password': True,
        'password_reset_at': datetime.utcnow()
    })

    # Send email with temporary password
    email_body = f"""
안녕하세요,

TMS 임시 비밀번호를 안내드립니다.

임시 비밀번호: {temp_password}

로그인 후 반드시 비밀번호를 변경해주세요.

감사합니다.
TMS 팀
    """

    send_email(
        to_email=request.email,
        subject="[TMS] 임시 비밀번호 안내",
        body=email_body
    )

    return {
        "message": f"임시 비밀번호가 '{request.email}' 이메일로 전송되었습니다",
        "email": request.email
    }


@router.post("/change-password")
def change_password(
    request: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user_firestore)
):
    """비밀번호 변경"""
    # Verify current password
    if not verify_password(request.current_password, current_user['hashed_password']):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="현재 비밀번호가 일치하지 않습니다"
        )

    # Update password and remove temp flag
    users_collection.update(current_user['id'], {
        'hashed_password': get_password_hash(request.new_password),
        'is_temp_password': False,
        'password_changed_at': datetime.utcnow()
    })

    return {"message": "비밀번호가 성공적으로 변경되었습니다"}
