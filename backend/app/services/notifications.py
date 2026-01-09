"""
Notification service for sending email notifications
"""
import os
import logging
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from typing import Optional

logger = logging.getLogger(__name__)


def send_email_notification(to_email: str, subject: str, body: str):
    """이메일 알림 발송 (Brevo API)"""
    # Brevo 설정
    brevo_api_key = os.getenv('BREVO_API_KEY')
    sender_email = os.getenv('BREVO_SENDER_EMAIL', 'noreply@tcms.com')
    sender_name = os.getenv('BREVO_SENDER_NAME', 'TMS')

    # 환경 변수가 설정되지 않은 경우 로그만 출력
    if not brevo_api_key:
        logger.warning("Brevo API key not configured. Email will not be sent.")
        logger.info(f"=== 이메일 알림 발송 (로그만) ===")
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

        logger.info(f"Notification email sent successfully to {to_email} (message_id: {api_response.message_id})")

    except ApiException as e:
        logger.error(f"Brevo API exception when sending notification to {to_email}: {e}")
        logger.info(f"=== 이메일 알림 발송 실패 (내용 로그) ===")
        logger.info(f"받는 사람: {to_email}")
        logger.info(f"제목: {subject}")
        logger.info(f"내용:\n{body}")
        logger.info(f"==================")
    except Exception as e:
        logger.error(f"Failed to send notification email to {to_email}: {str(e)}")
        logger.info(f"=== 이메일 알림 발송 실패 (내용 로그) ===")
        logger.info(f"받는 사람: {to_email}")
        logger.info(f"제목: {subject}")
        logger.info(f"내용:\n{body}")
        logger.info(f"==================")


def notify_issue_assigned(assignee_email: str, assignee_name: str, issue_title: str, issue_id: str, assigned_by: str):
    """이슈 할당 알림"""
    subject = f"[TMS] 새로운 이슈가 할당되었습니다: {issue_title}"
    body = f"""
안녕하세요, {assignee_name}님

새로운 이슈가 회원님께 할당되었습니다.

이슈 제목: {issue_title}
이슈 ID: {issue_id}
할당자: {assigned_by}

이슈 확인하기: https://tms.r-e.kr/issues

감사합니다.
Test Management System
"""
    send_email_notification(assignee_email, subject, body)


def notify_issue_updated(assignee_email: str, assignee_name: str, issue_title: str, issue_id: str, updated_by: str, update_type: str):
    """이슈 업데이트 알림"""
    subject = f"[TMS] 할당된 이슈가 업데이트되었습니다: {issue_title}"
    body = f"""
안녕하세요, {assignee_name}님

회원님께 할당된 이슈가 업데이트되었습니다.

이슈 제목: {issue_title}
이슈 ID: {issue_id}
업데이트 내용: {update_type}
업데이트한 사람: {updated_by}

이슈 확인하기: https://tms.r-e.kr/issues

감사합니다.
Test Management System
"""
    send_email_notification(assignee_email, subject, body)


def notify_testrun_completed(user_email: str, user_name: str, testrun_name: str, testrun_id: str, pass_rate: Optional[float] = None):
    """테스트 실행 완료 알림"""
    pass_rate_text = f"\n통과율: {pass_rate:.1f}%" if pass_rate is not None else ""

    subject = f"[TMS] 테스트 실행이 완료되었습니다: {testrun_name}"
    body = f"""
안녕하세요, {user_name}님

테스트 실행이 완료되었습니다.

테스트 실행 이름: {testrun_name}
테스트 실행 ID: {testrun_id}{pass_rate_text}

결과 확인하기: https://tms.r-e.kr/testruns

감사합니다.
Test Management System
"""
    send_email_notification(user_email, subject, body)


def notify_testrun_assigned(assignee_email: str, assignee_name: str, testrun_name: str, testrun_id: str, assigned_by: str):
    """테스트 실행 할당 알림"""
    subject = f"[TMS] 테스트 실행이 할당되었습니다: {testrun_name}"
    body = f"""
안녕하세요, {assignee_name}님

새로운 테스트 실행이 회원님께 할당되었습니다.

테스트 실행 이름: {testrun_name}
테스트 실행 ID: {testrun_id}
할당자: {assigned_by}

테스트 실행하기: https://tms.r-e.kr/testruns

감사합니다.
Test Management System
"""
    send_email_notification(assignee_email, subject, body)
