import requests
import json
import random

BASE_URL = "http://127.0.0.1:8000/api"
ADMIN_USERNAME = "adminn"
ADMIN_PASSWORD = "admin123"

def run_test(name, data):
    try:
        # 1. Login as Admin
        auth_url = f"{BASE_URL}/auth/login/"
        response = requests.post(auth_url, json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD})
        response.raise_for_status()
        tokens = response.json()
        access_token = tokens["access"]
        
        # 2. Try to add a coach
        coach_url = f"{BASE_URL}/academy/coaches/"
        headers = {"Authorization": f"Bearer {access_token}"}
        
        print(f"--- Test: {name} ---")
        response = requests.post(coach_url, json=data, headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Request failed: {name} - {str(e)}")

if __name__ == "__main__":
    suffix = random.randint(100, 999)
    
    # Test case 1: Successful creation with empty specialization
    run_test("Empty Specialization (Should Succeed)", {
        "user_data": {
            "username": f"coach_empty_{suffix}",
            "password": "password123",
            "password_confirm": "password123",
            "email": f"empty_{suffix}@example.com",
            "first_name": "Empty",
            "last_name": "Spec",
        },
        "specialization": "",
        "experience_years": 0,
        "certifications": ""
    })

    # Test case 2: Duplicate username
    run_test("Duplicate Username (Should Fail)", {
        "user_data": {
            "username": f"coach_empty_{suffix}",
            "password": "password123",
            "password_confirm": "password123",
            "email": f"diff_{suffix}@example.com",
            "first_name": "Diff",
            "last_name": "Name",
        },
        "specialization": "Testing",
        "experience_years": 5,
        "certifications": ""
    })
