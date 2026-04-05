import requests
import json

BASE_URL = "http://localhost:8000/api"
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
    # Test case 1: Duplicate username
    run_test("Duplicate Username", {
        "user_data": {
            "username": "testcoach4",
            "password": "password123",
            "password_confirm": "password123",
            "email": "testcoach5@example.com",
            "first_name": "Test",
            "last_name": "Coach",
        },
        "specialization": "Testing",
        "experience_years": 5,
        "certifications": ""
    })

    # Test case 2: Empty specialization (if required)
    run_test("Empty Specialization", {
        "user_data": {
            "username": "testcoach6",
            "password": "password123",
            "password_confirm": "password123",
            "email": "testcoach6@example.com",
            "first_name": "Test",
            "last_name": "Coach",
        },
        "specialization": "",
        "experience_years": 5,
        "certifications": ""
    })
