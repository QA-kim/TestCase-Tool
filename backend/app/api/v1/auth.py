from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta, datetime
from pydantic import BaseModel, EmailStr, Field, validator
from slowapi import Limiter
from slowapi.util import get_remote_address
import secrets
import logging

from app.db.firestore import users_collection
from app.core.security import verify_password, create_access_token, get_password_hash, get_current_user_firestore
from app.core.config import settings
from app.schemas.user import UserCreate, User as UserSchema, Token

router = APIRouter()
logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)


def send_email(to_email: str, subject: str, body: str):
    """이메일 발송 (Brevo API)"""
    import os
    import sib_api_v3_sdk
    from sib_api_v3_sdk.rest import ApiException

    # Brevo 설정
    brevo_api_key = os.getenv('BREVO_API_KEY')
    sender_email = os.getenv('BREVO_SENDER_EMAIL', 'noreply@tcms.com')
    sender_name = os.getenv('BREVO_SENDER_NAME', 'TMS')

    # 환경 변수가 설정되지 않은 경우 로그만 출력
    if not brevo_api_key:
        logger.warning("Brevo API key not configured. Email will not be sent.")
        logger.info(f"=== 이메일 발송 (로그만) ===")
        logger.info(f"받는 사람: {to_email}")
        logger.info(f"제목: {subject}")
        logger.info(f"내용:\n{body}")
        logger.info(f"==================")
        return

    try:
        # Brevo API 클라이언트 설정
        configuration = sib_api_v3_sdk.Configuration()
        configuration.api_key['api-key'] = brevo_api_key

        api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))

        # 이메일 메시지 생성
        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
            to=[{"email": to_email}],
            sender={"name": sender_name, "email": sender_email},
            subject=subject,
            text_content=body
        )

        # Brevo API로 이메일 발송
        api_response = api_instance.send_transac_email(send_smtp_email)

        logger.info(f"Email sent successfully to {to_email} (message_id: {api_response.message_id})")

    except ApiException as e:
        logger.error(f"Brevo API exception when sending email to {to_email}: {e}")
        # 이메일 발송 실패 시에도 로그는 출력
        logger.info(f"=== 이메일 발송 실패 (내용 로그) ===")
        logger.info(f"받는 사람: {to_email}")
        logger.info(f"제목: {subject}")
        logger.info(f"내용:\n{body}")
        logger.info(f"==================")
        # 이메일 발송 실패해도 에러는 던지지 않음 (사용자에게는 성공 메시지 표시)
        logger.warning("Email sending failed, but continuing...")
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        logger.info(f"=== 이메일 발송 실패 (내용 로그) ===")
        logger.info(f"받는 사람: {to_email}")
        logger.info(f"제목: {subject}")
        logger.info(f"내용:\n{body}")
        logger.info(f"==================")
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
    new_password: str = Field(..., min_length=8, max_length=128)

    @validator('new_password')
    def validate_new_password(cls, v):
        import re
        if len(v) < 8:
            raise ValueError('비밀번호는 최소 8자 이상이어야 합니다')
        if len(v) > 128:
            raise ValueError('비밀번호는 128자를 초과할 수 없습니다')
        if not re.search(r'[a-zA-Z]', v):
            raise ValueError('비밀번호는 최소 1개의 영문자를 포함해야 합니다')
        if not re.search(r'\d', v):
            raise ValueError('비밀번호는 최소 1개의 숫자를 포함해야 합니다')
        return v


@router.post("/register", response_model=UserSchema)
@limiter.limit("3/10minutes")
def register(request: Request, user_in: UserCreate):
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
        'is_active': True,
        'is_locked': False,
        'failed_login_attempts': 0
    }

    user = users_collection.create(user_data)
    return user


@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    # Authenticate user - try email first
    user = users_collection.get_by_field('email', form_data.username)
    if not user:
        user = users_collection.get_by_field('username', form_data.username)

    # If user not found, return generic error
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 올바르지 않습니다",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if account is locked
    if user.get('is_locked', False):
        locked_until = user.get('locked_until')
        if locked_until and datetime.utcnow() < locked_until:
            remaining_minutes = int((locked_until - datetime.utcnow()).total_seconds() / 60)
            locked_time_str = locked_until.strftime("%Y-%m-%d %H:%M:%S UTC")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"계정이 잠겼습니다. {remaining_minutes}분 후에 다시 시도해주세요.\n잠금 해제 시간: {locked_time_str}"
            )
        else:
            # Lock period expired, unlock account
            users_collection.update(user['id'], {
                'is_locked': False,
                'failed_login_attempts': 0,
                'locked_until': None
            })
            user['is_locked'] = False
            user['failed_login_attempts'] = 0

    # Check if account is active
    if not user.get('is_active', True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="비활성화된 계정입니다"
        )

    # Verify password
    if not verify_password(form_data.password, user['hashed_password']):
        # Increment failed login attempts
        failed_attempts = user.get('failed_login_attempts', 0) + 1
        update_data = {'failed_login_attempts': failed_attempts}

        # Lock account after 5 failed attempts
        if failed_attempts >= 5:
            lock_duration_minutes = 30  # Lock for 30 minutes
            locked_until = datetime.utcnow() + timedelta(minutes=lock_duration_minutes)
            update_data.update({
                'is_locked': True,
                'locked_until': locked_until
            })
            users_collection.update(user['id'], update_data)

            # Format the locked time for display
            locked_time_str = locked_until.strftime("%Y-%m-%d %H:%M:%S UTC")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"로그인 5회 실패로 계정이 {lock_duration_minutes}분간 잠겼습니다.\n잠금 해제 시간: {locked_time_str}"
            )

        users_collection.update(user['id'], update_data)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"이메일 또는 비밀번호가 올바르지 않습니다. (실패 {failed_attempts}/5)",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Successful login - reset failed attempts
    if user.get('failed_login_attempts', 0) > 0:
        users_collection.update(user['id'], {
            'failed_login_attempts': 0,
            'is_locked': False,
            'locked_until': None
        })

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
@limiter.limit("3/10minutes")
def find_email(request: Request, find_request: FindEmailRequest):
    """이름으로 등록된 이메일 찾기"""
    # Get all users and filter by full_name (using list method with high limit)
    all_users = users_collection.list(limit=1000)
    matching_users = [u for u in all_users if u.get('full_name', '').strip().lower() == find_request.full_name.strip().lower()]

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
@limiter.limit("3/10minutes")
def reset_password_request(http_request: Request, request: ResetPasswordRequest):
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
