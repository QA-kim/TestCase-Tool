from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from typing import Optional
import csv
import io
from datetime import datetime

from app.db.firestore import (
    testcases_collection,
    testruns_collection,
    testresults_collection,
    projects_collection
)
from app.core.security import get_current_user_firestore

router = APIRouter()


@router.get("/testcases/csv")
def export_testcases_csv(
    project_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user_firestore)
):
    """테스트케이스를 CSV로 내보내기"""

    # 테스트케이스 조회
    if project_id:
        testcases = testcases_collection.query('project_id', '==', project_id)
        project = projects_collection.get(project_id)
        filename = f"testcases_{project.get('key', 'project')}_{datetime.now().strftime('%Y%m%d')}.csv"
    else:
        testcases = testcases_collection.list(limit=10000)
        filename = f"testcases_all_{datetime.now().strftime('%Y%m%d')}.csv"

    # CSV 생성
    output = io.StringIO()
    writer = csv.writer(output)

    # 헤더
    writer.writerow([
        'ID',
        'Title',
        'Description',
        'Priority',
        'Test Type',
        'Preconditions',
        'Steps',
        'Expected Result',
        'Version',
        'Created At',
        'Updated At'
    ])

    # 데이터
    for tc in testcases:
        writer.writerow([
            tc.get('id', ''),
            tc.get('title', ''),
            tc.get('description', ''),
            tc.get('priority', ''),
            tc.get('test_type', ''),
            tc.get('preconditions', ''),
            tc.get('steps', ''),
            tc.get('expected_result', ''),
            tc.get('version', '1.0'),
            tc.get('created_at', ''),
            tc.get('updated_at', '')
        ])

    # StreamingResponse 반환
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


@router.get("/testresults/csv")
def export_testresults_csv(
    testrun_id: Optional[str] = None,
    project_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user_firestore)
):
    """테스트 결과를 CSV로 내보내기"""

    # 테스트 결과 조회
    if testrun_id:
        testrun = testruns_collection.get(testrun_id)
        if not testrun:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Test run not found"
            )
        testresults = testresults_collection.query('test_run_id', '==', testrun_id)
        filename = f"testresults_{testrun.get('name', 'testrun')}_{datetime.now().strftime('%Y%m%d')}.csv"

    elif project_id:
        # 프로젝트의 모든 테스트런 조회
        testruns = testruns_collection.query('project_id', '==', project_id)
        testresults = []
        for tr in testruns:
            results = testresults_collection.query('test_run_id', '==', tr['id'])
            testresults.extend(results)

        project = projects_collection.get(project_id)
        filename = f"testresults_{project.get('key', 'project')}_{datetime.now().strftime('%Y%m%d')}.csv"

    else:
        testresults = testresults_collection.list(limit=50000)
        filename = f"testresults_all_{datetime.now().strftime('%Y%m%d')}.csv"

    # CSV 생성
    output = io.StringIO()
    writer = csv.writer(output)

    # 헤더
    writer.writerow([
        'Test Run ID',
        'Test Case ID',
        'Status',
        'Actual Result',
        'Comment',
        'Defect URL',
        'Execution Time (sec)',
        'Tester ID',
        'Tested At',
        'Created At'
    ])

    # 데이터
    for result in testresults:
        writer.writerow([
            result.get('test_run_id', ''),
            result.get('test_case_id', ''),
            result.get('status', ''),
            result.get('actual_result', ''),
            result.get('comment', ''),
            result.get('defect_url', ''),
            result.get('execution_time', ''),
            result.get('tester_id', ''),
            result.get('tested_at', ''),
            result.get('created_at', '')
        ])

    # StreamingResponse 반환
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


@router.get("/testruns/csv")
def export_testruns_csv(
    project_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user_firestore)
):
    """테스트 실행을 CSV로 내보내기"""

    # 테스트런 조회
    if project_id:
        testruns = testruns_collection.query('project_id', '==', project_id)
        project = projects_collection.get(project_id)
        filename = f"testruns_{project.get('key', 'project')}_{datetime.now().strftime('%Y%m%d')}.csv"
    else:
        testruns = testruns_collection.list(limit=10000)
        filename = f"testruns_all_{datetime.now().strftime('%Y%m%d')}.csv"

    # CSV 생성
    output = io.StringIO()
    writer = csv.writer(output)

    # 헤더
    writer.writerow([
        'ID',
        'Name',
        'Description',
        'Project ID',
        'Status',
        'Assignee ID',
        'Environment',
        'Milestone',
        'Test Case Count',
        'Started At',
        'Completed At',
        'Created At',
        'Updated At'
    ])

    # 데이터
    for tr in testruns:
        writer.writerow([
            tr.get('id', ''),
            tr.get('name', ''),
            tr.get('description', ''),
            tr.get('project_id', ''),
            tr.get('status', ''),
            tr.get('assignee_id', ''),
            tr.get('environment', ''),
            tr.get('milestone', ''),
            len(tr.get('test_case_ids', [])),
            tr.get('started_at', ''),
            tr.get('completed_at', ''),
            tr.get('created_at', ''),
            tr.get('updated_at', '')
        ])

    # StreamingResponse 반환
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


@router.get("/statistics/csv")
def export_statistics_csv(
    project_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user_firestore)
):
    """통계 데이터를 CSV로 내보내기"""

    # 프로젝트별 통계 생성
    if project_id:
        projects = [projects_collection.get(project_id)]
        filename = f"statistics_{projects[0].get('key', 'project')}_{datetime.now().strftime('%Y%m%d')}.csv"
    else:
        projects = projects_collection.list(limit=1000)
        filename = f"statistics_all_{datetime.now().strftime('%Y%m%d')}.csv"

    # CSV 생성
    output = io.StringIO()
    writer = csv.writer(output)

    # 헤더
    writer.writerow([
        'Project ID',
        'Project Name',
        'Total Test Cases',
        'Total Test Runs',
        'Total Results',
        'Passed',
        'Failed',
        'Blocked',
        'Skipped',
        'Pass Rate (%)'
    ])

    # 데이터
    for project in projects:
        if not project:
            continue

        proj_id = project.get('id')

        # 통계 계산
        testcases = testcases_collection.query('project_id', '==', proj_id)
        testruns = testruns_collection.query('project_id', '==', proj_id)

        all_results = []
        for tr in testruns:
            results = testresults_collection.query('test_run_id', '==', tr['id'])
            all_results.extend(results)

        passed = sum(1 for r in all_results if r.get('status') == 'passed')
        failed = sum(1 for r in all_results if r.get('status') == 'failed')
        blocked = sum(1 for r in all_results if r.get('status') == 'blocked')
        skipped = sum(1 for r in all_results if r.get('status') == 'skipped')

        total_results = len(all_results)
        pass_rate = round((passed / total_results) * 100, 2) if total_results > 0 else 0.0

        writer.writerow([
            proj_id,
            project.get('name', ''),
            len(testcases),
            len(testruns),
            total_results,
            passed,
            failed,
            blocked,
            skipped,
            pass_rate
        ])

    # StreamingResponse 반환
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )
