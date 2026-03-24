import requests
import json

BASE_URL = "http://localhost:8000/api"

def get_token(username, password):
    url = f"{BASE_URL}/auth/login/"
    data = {"username": username, "password": password}
    response = requests.post(url, json=data)
    if response.status_code == 200:
        return response.json().get("access")
    else:
        print(f"Login failed for {username}: {response.text}")
        return None

def verify_coach_access(username):
    print(f"\n--- Verifying Coach: {username} ---")
    token = get_token(username, "Admin@123")
    if not token:
        return

    headers = {"Authorization": f"Bearer {token}"}

    # 1. Verify Batches
    print("Checking Batches...")
    resp = requests.get(f"{BASE_URL}/academy/batches/", headers=headers)
    batches = []
    if resp.status_code == 200:
        data = resp.json()
        # Handle paginated response
        if isinstance(data, dict) and 'results' in data:
            batches = data['results']
        else:
            batches = data
            
        print(f"Success: Found {len(batches)} batches.")
        for b in batches:
            if isinstance(b, dict):
                print(f"  - {b.get('name')} ({b.get('sport_name')}) | Athletes: {b.get('athlete_count')}")
            else:
                print(f"  - Unexpected batch format: {b}")
    else:
        print(f"Failed to get batches: {resp.status_code} - {resp.text}")

    # 2. Verify Attendance Summary (New Feature)
    print("\nChecking Attendance Summary...")
    resp = requests.get(f"{BASE_URL}/academy/attendance/summary/", headers=headers)
    if resp.status_code == 200:
        summary = resp.json()
        print(f"Success: Attendance Summary retrieved.")
        print(f"  - Overall Rate: {summary.get('overall_attendance_rate')}%")
        print(f"  - Total Batches in Summary: {len(summary.get('batches', []))}")
    else:
        print(f"Failed to get attendance summary: {resp.status_code} - {resp.text[:200]}")

    # 3. Verify Batch Athletes (For "View Athletes" button)
    if batches:
        batch_id = batches[0].get('id')
        print(f"\nChecking Athletes for Batch {batch_id}...")
        resp = requests.get(f"{BASE_URL}/academy/batches/{batch_id}/athletes/", headers=headers)
        if resp.status_code == 200:
            athletes = resp.json()
            print(f"Success: Found {len(athletes)} athletes in batch.")
        else:
            print(f"Failed to get batch athletes: {resp.status_code} - {resp.text}")

if __name__ == "__main__":
    verify_coach_access("testcoach")
