"""
Script to update all existing issues with testrun_id = 'ddddddd'
"""
from app.db.firestore import issues_collection

def main():
    print("Fetching all issues...")
    all_issues = issues_collection.list(limit=1000)
    
    print(f"Found {len(all_issues)} issues")
    
    updated_count = 0
    for issue in all_issues:
        issue_id = issue['id']
        # Only update if testrun_id is not set
        if not issue.get('testrun_id'):
            print(f"Updating issue {issue_id}: {issue.get('title', 'No title')}")
            issues_collection.update(issue_id, {'testrun_id': 'ddddddd'})
            updated_count += 1
        else:
            print(f"Skipping issue {issue_id} (already has testrun_id: {issue.get('testrun_id')})")
    
    print(f"\nUpdated {updated_count} issues with testrun_id = 'ddddddd'")

if __name__ == "__main__":
    main()
