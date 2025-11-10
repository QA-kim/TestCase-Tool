from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime


class ProjectStatistics(BaseModel):
    """프로젝트별 통계"""
    project_id: str
    project_name: str
    total_testcases: int
    total_testruns: int
    total_results: int
    passed_count: int
    failed_count: int
    blocked_count: int
    skipped_count: int
    pass_rate: float


class TestRunStatistics(BaseModel):
    """테스트 실행 통계"""
    testrun_id: str
    testrun_name: str
    status: str
    total_tests: int
    tested_count: int
    passed_count: int
    failed_count: int
    blocked_count: int
    skipped_count: int
    pass_rate: float
    progress: float
    created_at: datetime
    completed_at: Optional[datetime] = None


class OverallStatistics(BaseModel):
    """전체 시스템 통계"""
    total_projects: int
    total_testcases: int
    total_testruns: int
    total_results: int
    overall_pass_rate: float
    active_testruns: int
    completed_testruns: int

    # 최근 활동 (날짜별)
    recent_activity: Optional[Dict[str, int]] = {}

    # 우선순위별 테스트 케이스 분포
    priority_distribution: Optional[Dict[str, int]] = {}

    # 테스트 타입별 분포
    test_type_distribution: Optional[Dict[str, int]] = {}


class TrendData(BaseModel):
    """추세 데이터 (시간별)"""
    date: str
    pass_rate: float
    total_tests: int
    passed: int
    failed: int


class TrendStatistics(BaseModel):
    """추세 분석 통계"""
    period: str  # 'week', 'month', 'quarter', 'year'
    data: List[TrendData]


class DashboardStatistics(BaseModel):
    """대시보드용 통합 통계"""
    overall: OverallStatistics
    recent_projects: List[Dict]
    recent_testcases: List[Dict]
    recent_testruns: List[TestRunStatistics]
    top_failed_testcases: Optional[List[Dict]] = []
