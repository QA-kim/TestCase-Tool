from fastapi import APIRouter, Depends, Query
from typing import Optional
from datetime import datetime, timedelta
from collections import defaultdict

from app.db.firestore import (
    projects_collection,
    testcases_collection,
    testruns_collection,
    testresults_collection
)
from app.core.security import get_current_user_firestore
from app.schemas.statistics import (
    OverallStatistics,
    ProjectStatistics,
    TestRunStatistics,
    TrendStatistics,
    TrendData,
    DashboardStatistics
)

router = APIRouter()


def calculate_pass_rate(passed: int, total: int) -> float:
    """합격률 계산"""
    if total == 0:
        return 0.0
    return round((passed / total) * 100, 2)


@router.get("/overall", response_model=OverallStatistics)
def get_overall_statistics(
    current_user: dict = Depends(get_current_user_firestore)
):
    """전체 시스템 통계 조회"""

    # 프로젝트, 테스트케이스, 테스트런 수집
    projects = projects_collection.list(limit=1000)
    testcases = testcases_collection.list(limit=10000)
    testruns = testruns_collection.list(limit=10000)
    testresults = testresults_collection.list(limit=50000)

    # 기본 카운트
    total_projects = len(projects)
    total_testcases = len(testcases)
    total_testruns = len(testruns)
    total_results = len(testresults)

    # 테스트 실행 상태 카운트
    active_testruns = sum(1 for tr in testruns if tr.get('status') in ['planned', 'in_progress'])
    completed_testruns = sum(1 for tr in testruns if tr.get('status') == 'completed')

    # 전체 합격률 계산
    passed_results = sum(1 for r in testresults if r.get('status') == 'passed')
    overall_pass_rate = calculate_pass_rate(passed_results, total_results)

    # 우선순위별 분포
    priority_dist = defaultdict(int)
    for tc in testcases:
        priority = tc.get('priority', 'medium')
        priority_dist[priority] += 1

    # 테스트 타입별 분포
    type_dist = defaultdict(int)
    for tc in testcases:
        test_type = tc.get('test_type', 'functional')
        type_dist[test_type] += 1

    # 최근 7일간 활동
    recent_activity = defaultdict(int)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    for tr in testruns:
        created_at = tr.get('created_at')
        if created_at and isinstance(created_at, datetime) and created_at >= seven_days_ago:
            date_key = created_at.strftime('%Y-%m-%d')
            recent_activity[date_key] += 1

    return OverallStatistics(
        total_projects=total_projects,
        total_testcases=total_testcases,
        total_testruns=total_testruns,
        total_results=total_results,
        overall_pass_rate=overall_pass_rate,
        active_testruns=active_testruns,
        completed_testruns=completed_testruns,
        recent_activity=dict(recent_activity),
        priority_distribution=dict(priority_dist),
        test_type_distribution=dict(type_dist)
    )


@router.get("/projects/{project_id}", response_model=ProjectStatistics)
def get_project_statistics(
    project_id: str,
    current_user: dict = Depends(get_current_user_firestore)
):
    """프로젝트별 통계 조회"""

    # 프로젝트 정보
    project = projects_collection.get(project_id)
    if not project:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    # 프로젝트의 테스트케이스, 테스트런, 결과 조회
    testcases = testcases_collection.query('project_id', '==', project_id)
    testruns = testruns_collection.query('project_id', '==', project_id)

    # 테스트 결과 수집 (모든 테스트런의 결과)
    all_results = []
    for tr in testruns:
        results = testresults_collection.query('test_run_id', '==', tr['id'])
        all_results.extend(results)

    # 상태별 카운트
    passed_count = sum(1 for r in all_results if r.get('status') == 'passed')
    failed_count = sum(1 for r in all_results if r.get('status') == 'failed')
    blocked_count = sum(1 for r in all_results if r.get('status') == 'blocked')
    skipped_count = sum(1 for r in all_results if r.get('status') == 'skipped')

    # 합격률 계산
    pass_rate = calculate_pass_rate(passed_count, len(all_results))

    return ProjectStatistics(
        project_id=project_id,
        project_name=project.get('name', 'Unknown'),
        total_testcases=len(testcases),
        total_testruns=len(testruns),
        total_results=len(all_results),
        passed_count=passed_count,
        failed_count=failed_count,
        blocked_count=blocked_count,
        skipped_count=skipped_count,
        pass_rate=pass_rate
    )


@router.get("/testruns/{testrun_id}", response_model=TestRunStatistics)
def get_testrun_statistics(
    testrun_id: str,
    current_user: dict = Depends(get_current_user_firestore)
):
    """테스트 실행별 통계 조회"""

    # 테스트런 정보
    testrun = testruns_collection.get(testrun_id)
    if not testrun:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test run not found"
        )

    # 테스트 결과 조회
    results = testresults_collection.query('test_run_id', '==', testrun_id)

    # 테스트 케이스 수
    test_case_ids = testrun.get('test_case_ids', [])
    total_tests = len(test_case_ids)

    # 상태별 카운트
    tested_count = sum(1 for r in results if r.get('status') != 'untested')
    passed_count = sum(1 for r in results if r.get('status') == 'passed')
    failed_count = sum(1 for r in results if r.get('status') == 'failed')
    blocked_count = sum(1 for r in results if r.get('status') == 'blocked')
    skipped_count = sum(1 for r in results if r.get('status') == 'skipped')

    # 진행률 및 합격률
    progress = calculate_pass_rate(tested_count, total_tests) if total_tests > 0 else 0.0
    pass_rate = calculate_pass_rate(passed_count, tested_count) if tested_count > 0 else 0.0

    return TestRunStatistics(
        testrun_id=testrun_id,
        testrun_name=testrun.get('name', 'Unknown'),
        status=testrun.get('status', 'planned'),
        total_tests=total_tests,
        tested_count=tested_count,
        passed_count=passed_count,
        failed_count=failed_count,
        blocked_count=blocked_count,
        skipped_count=skipped_count,
        pass_rate=pass_rate,
        progress=progress,
        created_at=testrun.get('created_at'),
        completed_at=testrun.get('completed_at')
    )


@router.get("/trends", response_model=TrendStatistics)
def get_trend_statistics(
    period: str = Query('week', regex='^(week|month|quarter|year)$'),
    project_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user_firestore)
):
    """추세 통계 조회 (시간별 합격률 추이)"""
    from datetime import timezone

    # 기간 계산 (timezone-aware)
    now = datetime.now(timezone.utc)
    if period == 'week':
        start_date = now - timedelta(days=7)
        date_format = '%Y-%m-%d'
    elif period == 'month':
        start_date = now - timedelta(days=30)
        date_format = '%Y-%m-%d'
    elif period == 'quarter':
        start_date = now - timedelta(days=90)
        date_format = '%Y-%m-%d'
    else:  # year
        start_date = now - timedelta(days=365)
        date_format = '%Y-%m'

    # 테스트런 조회
    if project_id:
        testruns = testruns_collection.query('project_id', '==', project_id)
    else:
        testruns = testruns_collection.list(limit=10000)

    # 날짜별 데이터 수집
    date_data = defaultdict(lambda: {'total': 0, 'passed': 0, 'failed': 0})

    for tr in testruns:
        created_at = tr.get('created_at')
        if not created_at or not isinstance(created_at, datetime):
            continue

        # Ensure created_at is timezone-aware for comparison
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)

        if created_at < start_date:
            continue

        date_key = created_at.strftime(date_format)

        # 해당 테스트런의 결과 조회
        results = testresults_collection.query('test_run_id', '==', tr['id'])

        for r in results:
            status = r.get('status')
            if status in ['passed', 'failed', 'blocked', 'skipped']:
                date_data[date_key]['total'] += 1
                if status == 'passed':
                    date_data[date_key]['passed'] += 1
                elif status == 'failed':
                    date_data[date_key]['failed'] += 1

    # TrendData 리스트 생성
    trend_list = []
    for date_key in sorted(date_data.keys()):
        data = date_data[date_key]
        pass_rate = calculate_pass_rate(data['passed'], data['total'])

        trend_list.append(TrendData(
            date=date_key,
            pass_rate=pass_rate,
            total_tests=data['total'],
            passed=data['passed'],
            failed=data['failed']
        ))

    return TrendStatistics(
        period=period,
        data=trend_list
    )


@router.get("/dashboard", response_model=DashboardStatistics)
def get_dashboard_statistics(
    days: int = Query(7, ge=1, le=365),
    current_user: dict = Depends(get_current_user_firestore)
):
    """대시보드용 통합 통계"""

    # 전체 통계
    overall = get_overall_statistics(current_user)

    # 최근 프로젝트 (5개)
    projects = projects_collection.list(limit=1000)
    recent_projects = sorted(
        projects,
        key=lambda x: x.get('updated_at', datetime.min),
        reverse=True
    )[:5]

    # 최근 테스트케이스 (5개)
    testcases = testcases_collection.list(limit=1000)
    recent_testcases = sorted(
        testcases,
        key=lambda x: x.get('updated_at', datetime.min),
        reverse=True
    )[:5]

    # 최근 테스트런 (5개, 통계 포함)
    testruns = testruns_collection.list(limit=1000)
    recent_testruns_data = sorted(
        testruns,
        key=lambda x: x.get('created_at', datetime.min),
        reverse=True
    )[:5]

    recent_testruns = []
    for tr in recent_testruns_data:
        tr_stats = get_testrun_statistics(tr['id'], current_user)
        recent_testruns.append(tr_stats)

    # 자주 실패하는 테스트케이스 TOP 5
    testcase_failures = defaultdict(int)
    all_results = testresults_collection.list(limit=50000)

    for r in all_results:
        if r.get('status') == 'failed':
            testcase_id = r.get('test_case_id')
            if testcase_id:
                testcase_failures[testcase_id] += 1

    # 실패 횟수로 정렬
    top_failed = sorted(testcase_failures.items(), key=lambda x: x[1], reverse=True)[:5]

    top_failed_testcases = []
    for tc_id, fail_count in top_failed:
        tc = testcases_collection.get(tc_id)
        if tc:
            top_failed_testcases.append({
                'id': tc_id,
                'title': tc.get('title', 'Unknown'),
                'failure_count': fail_count,
                'priority': tc.get('priority', 'medium')
            })

    return DashboardStatistics(
        overall=overall,
        recent_projects=[{
            'id': p.get('id'),
            'name': p.get('name'),
            'key': p.get('key'),
            'updated_at': p.get('updated_at')
        } for p in recent_projects],
        recent_testcases=[{
            'id': tc.get('id'),
            'title': tc.get('title'),
            'priority': tc.get('priority'),
            'test_type': tc.get('test_type'),
            'updated_at': tc.get('updated_at')
        } for tc in recent_testcases],
        recent_testruns=recent_testruns,
        top_failed_testcases=top_failed_testcases
    )
