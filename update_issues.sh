#!/bin/bash

# Update all issues to link them to testrun_id 'ddddddd'
# This script uses the production API

API_URL="https://testcase-tool.onrender.com/api/v1"

# First, login to get a token
echo "Please login first:"
echo "Username: "
read username
echo "Password: "
read -s password

# Login
TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$username&password=$password" | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

if [ -z "$TOKEN" ]; then
  echo "Login failed!"
  exit 1
fi

echo "Login successful!"

# Get all issues
echo "Fetching all issues..."
ISSUES=$(curl -s -X GET "$API_URL/issues" \
  -H "Authorization: Bearer $TOKEN")

echo "$ISSUES" | python3 << 'PYTHON'
import json
import sys
import requests

issues = json.load(sys.stdin)
api_url = "https://testcase-tool.onrender.com/api/v1"
token = sys.argv[1]

print(f"Found {len(issues)} issues")

updated_count = 0
for issue in issues:
    issue_id = issue['id']
    if not issue.get('testrun_id'):
        print(f"Updating issue {issue_id}: {issue.get('title', 'No title')}")
        response = requests.put(
            f"{api_url}/issues/{issue_id}",
            headers={"Authorization": f"Bearer {token}"},
            json={"testrun_id": "ddddddd"}
        )
        if response.status_code == 200:
            updated_count += 1
        else:
            print(f"  Failed: {response.status_code}")
    else:
        print(f"Skipping issue {issue_id} (already has testrun_id: {issue.get('testrun_id')})")

print(f"\nUpdated {updated_count} issues with testrun_id = 'ddddddd'")
PYTHON $TOKEN
