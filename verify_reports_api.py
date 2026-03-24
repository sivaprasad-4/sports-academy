import requests
import json

BASE_URL = "http://localhost:8000/api"
# Assuming we can use a known token or admin credentials if needed, 
# but for now let's just check if they are reachable and returning expected structures.
# In a real scenario, I'd login first.

def test_reports():
    print("--- Starting Report API Verification ---")
    
    # 1. Attendance Report
    print("Testing Attendance Report...")
    try:
        # Note: This will likely return 401 if unauthenticated, but we check the endpoint exists
        r = requests.get(f"{BASE_URL}/reports/attendance/")
        print(f"Attendance endpoint status: {r.status_code}")
    except Exception as e:
        print(f"Error testing attendance: {e}")

    # 2. Performance Report
    print("\nTesting Performance Report...")
    try:
        r = requests.get(f"{BASE_URL}/reports/performance/?athlete_id=1")
        print(f"Performance endpoint status: {r.status_code}")
    except Exception as e:
        print(f"Error testing performance: {e}")

    # 3. Receipt Report
    print("\nTesting Receipt Report...")
    try:
        r = requests.get(f"{BASE_URL}/reports/receipt/1/")
        print(f"Receipt endpoint status: {r.status_code}")
    except Exception as e:
        print(f"Error testing receipt: {e}")

if __name__ == "__main__":
    test_reports()
