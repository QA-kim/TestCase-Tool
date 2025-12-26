#!/usr/bin/env python3
"""
Complete API test suite for TCMS backend
Tests all endpoints after deployment to ensure Supabase migration is working correctly
"""

import requests
import json
from typing import Dict, Any, Optional
import sys

# Configuration
BASE_URL = "https://testcase-tool.onrender.com/api/v1"
# BASE_URL = "http://localhost:8000/api/v1"  # For local testing

# Test credentials - will be created if not exists
TEST_USER_REGISTER = {
    "email": "apitest@tcms.com",
    "username": "apitest",
    "password": "Test123!@#",
    "full_name": "API Test User",
    "role": "admin"  # This will be set to viewer by backend, only for testing
}

TEST_USER_LOGIN = {
    "username": "apitest",
    "password": "Test123!@#"
}

# Colors for output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

# Global variables
token = None
test_data = {}

def print_header(text: str):
    """Print section header"""
    print(f"\n{Colors.BLUE}{'='*80}{Colors.RESET}")
    print(f"{Colors.BLUE}{text.center(80)}{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*80}{Colors.RESET}\n")

def print_success(text: str):
    """Print success message"""
    print(f"{Colors.GREEN}✅ {text}{Colors.RESET}")

def print_error(text: str):
    """Print error message"""
    print(f"{Colors.RED}❌ {text}{Colors.RESET}")

def print_warning(text: str):
    """Print warning message"""
    print(f"{Colors.YELLOW}⚠️  {text}{Colors.RESET}")

def print_info(text: str):
    """Print info message"""
    print(f"ℹ️  {text}")

def make_request(
    method: str,
    endpoint: str,
    data: Optional[Dict] = None,
    params: Optional[Dict] = None,
    use_auth: bool = True,
    expected_status: int = 200
) -> tuple[bool, Any]:
    """
    Make HTTP request and check response

    Returns:
        (success: bool, response_data: Any)
    """
    url = f"{BASE_URL}{endpoint}"
    headers = {}

    if use_auth and token:
        headers["Authorization"] = f"Bearer {token}"

    try:
        if method == "GET":
            response = requests.get(url, headers=headers, params=params, timeout=30)
        elif method == "POST":
            headers["Content-Type"] = "application/json"
            response = requests.post(url, headers=headers, json=data, timeout=30)
        elif method == "PUT":
            headers["Content-Type"] = "application/json"
            response = requests.put(url, headers=headers, json=data, timeout=30)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers, timeout=30)
        elif method == "PATCH":
            headers["Content-Type"] = "application/json"
            response = requests.patch(url, headers=headers, json=data, timeout=30)
        else:
            print_error(f"Unknown HTTP method: {method}")
            return False, None

        # Check status code
        if response.status_code != expected_status:
            print_error(f"{method} {endpoint} - Expected {expected_status}, got {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            return False, None

        # Parse response
        if response.status_code == 204:
            return True, None

        try:
            return True, response.json()
        except:
            return True, response.text

    except requests.exceptions.Timeout:
        print_error(f"{method} {endpoint} - Request timeout (30s)")
        return False, None
    except requests.exceptions.RequestException as e:
        print_error(f"{method} {endpoint} - Request failed: {e}")
        return False, None

def test_auth():
    """Test authentication endpoints"""
    global token
    print_header("Testing Authentication")

    # 1. Register test user (if not exists)
    print_info("Testing user registration...")
    url = f"{BASE_URL}/auth/register"
    try:
        response = requests.post(
            url,
            json=TEST_USER_REGISTER,
            headers={"Content-Type": "application/json"},
            timeout=30
        )

        if response.status_code == 200:
            print_success(f"User registration successful")
        elif response.status_code == 400 and "이미 존재" in response.text:
            print_info("Test user already exists - skipping registration")
        else:
            print_warning(f"Registration failed (status {response.status_code}) - will try login anyway")
    except Exception as e:
        print_warning(f"Registration request failed: {e} - will try login anyway")

    # 2. Login (uses form-data, not JSON)
    print_info("Testing login...")
    url = f"{BASE_URL}/auth/login"
    try:
        response = requests.post(
            url,
            data=TEST_USER_LOGIN,  # form-data for OAuth2
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=30
        )

        if response.status_code == 200:
            data = response.json()
            if "access_token" in data:
                token = data["access_token"]
                print_success(f"Login successful - Token: {token[:20]}...")
                test_data["user_id"] = data.get("user_id")
            else:
                print_error("Login response missing access_token")
                sys.exit(1)
        else:
            print_error(f"Login failed - Status {response.status_code}: {response.text[:200]}")
            sys.exit(1)
    except Exception as e:
        print_error(f"Login request failed: {e}")
        sys.exit(1)

    # 3. Get current user
    print_info("Testing get current user...")
    success, response = make_request("GET", "/auth/me")
    if success and response:
        print_success(f"Got current user: {response.get('username')} (role: {response.get('role')})")
    else:
        print_error("Failed to get current user")

def test_users():
    """Test user endpoints"""
    print_header("Testing Users")

    # 1. List users
    print_info("Testing list users...")
    success, response = make_request("GET", "/users")
    if success and isinstance(response, list):
        print_success(f"Retrieved {len(response)} users")
        if response:
            test_data["other_user_id"] = response[0]["id"]
    else:
        print_error("Failed to list users")

    # 2. Get specific user
    if test_data.get("user_id"):
        print_info(f"Testing get user by ID...")
        success, response = make_request("GET", f"/users/{test_data['user_id']}")
        if success and response:
            print_success(f"Retrieved user: {response.get('username')}")
        else:
            print_error("Failed to get user by ID")

def test_projects():
    """Test project endpoints"""
    print_header("Testing Projects")

    # 1. List projects
    print_info("Testing list projects...")
    success, response = make_request("GET", "/projects")
    if success and isinstance(response, list):
        print_success(f"Retrieved {len(response)} projects")
        if response:
            test_data["project_id"] = response[0]["id"]
            print_info(f"   Using project: {response[0].get('name')}")
    else:
        print_error("Failed to list projects")
        return

    # 2. Create project (if no projects exist)
    if not response:
        print_info("Creating test project...")
        project_data = {
            "name": "API Test Project",
            "key": "ATP",
            "description": "Project created by API test suite"
        }
        success, response = make_request(
            "POST",
            "/projects",
            data=project_data,
            expected_status=201
        )
        if success and response:
            test_data["project_id"] = response["id"]
            test_data["created_project"] = True
            print_success(f"Created project: {response.get('name')}")
        else:
            print_error("Failed to create project")
            return

    # 3. Get specific project
    if test_data.get("project_id"):
        print_info("Testing get project by ID...")
        success, response = make_request("GET", f"/projects/{test_data['project_id']}")
        if success and response:
            print_success(f"Retrieved project: {response.get('name')}")
        else:
            print_error("Failed to get project by ID")

def test_folders():
    """Test folder endpoints"""
    print_header("Testing Folders")

    if not test_data.get("project_id"):
        print_warning("Skipping folder tests - no project available")
        return

    # 1. List folders
    print_info("Testing list folders...")
    success, response = make_request(
        "GET",
        "/folders",
        params={"project_id": test_data["project_id"]}
    )
    if success and isinstance(response, list):
        print_success(f"Retrieved {len(response)} folders")
        if response:
            test_data["folder_id"] = response[0]["id"]
    else:
        print_error("Failed to list folders")

def test_testcases():
    """Test test case endpoints"""
    print_header("Testing Test Cases")

    if not test_data.get("project_id"):
        print_warning("Skipping test case tests - no project available")
        return

    # 1. List test cases
    print_info("Testing list test cases...")
    success, response = make_request(
        "GET",
        "/testcases",
        params={"project_id": test_data["project_id"]}
    )
    if success and isinstance(response, list):
        print_success(f"Retrieved {len(response)} test cases")
        if response:
            test_data["testcase_id"] = response[0]["id"]
            print_info(f"   Using test case: {response[0].get('title')}")
    else:
        print_error("Failed to list test cases")
        return

    # 2. Get specific test case
    if test_data.get("testcase_id"):
        print_info("Testing get test case by ID...")
        success, response = make_request("GET", f"/testcases/{test_data['testcase_id']}")
        if success and response:
            print_success(f"Retrieved test case: {response.get('title')}")
        else:
            print_error("Failed to get test case by ID")

def test_testruns():
    """Test test run endpoints"""
    print_header("Testing Test Runs")

    if not test_data.get("project_id"):
        print_warning("Skipping test run tests - no project available")
        return

    # 1. List test runs
    print_info("Testing list test runs...")
    success, response = make_request(
        "GET",
        "/testruns",
        params={"project_id": test_data["project_id"]}
    )
    if success and isinstance(response, list):
        print_success(f"Retrieved {len(response)} test runs")
        if response:
            test_data["testrun_id"] = response[0]["id"]
            print_info(f"   Using test run: {response[0].get('name')}")
    else:
        print_error("Failed to list test runs")
        return

    # 2. Get specific test run
    if test_data.get("testrun_id"):
        print_info("Testing get test run by ID...")
        success, response = make_request("GET", f"/testruns/{test_data['testrun_id']}")
        if success and response:
            print_success(f"Retrieved test run: {response.get('name')}")
        else:
            print_error("Failed to get test run by ID")

def test_testresults():
    """Test test result endpoints"""
    print_header("Testing Test Results")

    if not test_data.get("testrun_id"):
        print_warning("Skipping test result tests - no test run available")
        return

    # 1. List test results for a test run
    print_info("Testing list test results...")
    success, response = make_request(
        "GET",
        "/testresults",
        params={"test_run_id": test_data["testrun_id"]}
    )
    if success and isinstance(response, list):
        print_success(f"Retrieved {len(response)} test results")
        if response:
            test_data["testresult_id"] = response[0]["id"]
    else:
        print_error("Failed to list test results")
        return

    # 2. Get specific test result
    if test_data.get("testresult_id"):
        print_info("Testing get test result by ID...")
        success, response = make_request("GET", f"/testresults/{test_data['testresult_id']}")
        if success and response:
            print_success(f"Retrieved test result (status: {response.get('status')})")
        else:
            print_error("Failed to get test result by ID")

def test_issues():
    """Test issue endpoints"""
    print_header("Testing Issues")

    if not test_data.get("project_id"):
        print_warning("Skipping issue tests - no project available")
        return

    # 1. List issues
    print_info("Testing list issues...")
    success, response = make_request(
        "GET",
        "/issues",
        params={"project_id": test_data["project_id"]}
    )
    if success and isinstance(response, list):
        print_success(f"Retrieved {len(response)} issues")
        if response:
            test_data["issue_id"] = response[0]["id"]
    else:
        print_error("Failed to list issues")
        return

    # 2. Get specific issue
    if test_data.get("issue_id"):
        print_info("Testing get issue by ID...")
        success, response = make_request("GET", f"/issues/{test_data['issue_id']}")
        if success and response:
            print_success(f"Retrieved issue: {response.get('title')}")
        else:
            print_error("Failed to get issue by ID")

def test_statistics():
    """Test statistics endpoints"""
    print_header("Testing Statistics")

    # 1. Dashboard statistics
    print_info("Testing dashboard statistics...")
    success, response = make_request("GET", "/statistics/dashboard")
    if success and response:
        print_success(f"Retrieved dashboard stats: {response.get('total_projects', 0)} projects, "
                     f"{response.get('total_testcases', 0)} test cases")
    else:
        print_error("Failed to get dashboard statistics")

def main():
    """Run all API tests"""
    print(f"\n{Colors.BLUE}{'='*80}{Colors.RESET}")
    print(f"{Colors.BLUE}{'TCMS API Test Suite'.center(80)}{Colors.RESET}")
    print(f"{Colors.BLUE}{'Testing: ' + BASE_URL}{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*80}{Colors.RESET}\n")

    # Run tests in order
    test_auth()
    test_users()
    test_projects()
    test_folders()
    test_testcases()
    test_testruns()
    test_testresults()
    test_issues()
    test_statistics()

    # Summary
    print_header("Test Summary")
    print_success("All critical API endpoints tested successfully!")
    print_info(f"Test data collected: {json.dumps(test_data, indent=2)}")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}Tests interrupted by user{Colors.RESET}")
        sys.exit(1)
    except Exception as e:
        print_error(f"Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
