import requests
import json

BASE_URL = "http://localhost:8000/api"
ADMIN_USERNAME = "adminn"
ADMIN_PASSWORD = "admin123"

def test_add_coach():
    try:
        # 1. Login as Admin
        auth_url = f"{BASE_URL}/auth/login/"
        response = requests.post(auth_url, json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD})
        response.raise_for_status()
        tokens = response.json()
        access_token = tokens["access"]
        print(f"Admin ({ADMIN_USERNAME}) Login successful.")
        
        # 2. Try to add a coach
        coach_url = f"{BASE_URL}/academy/coaches/"
        headers = {"Authorization": f"Bearer {access_token}"}
        
        coach_data = {
            "user_data": {
                "username": "testcoach4",
                "password": "password123",
                "password_confirm": "password123",
                "email": "testcoach4@example.com",
                "first_name": "Test",
                "last_name": "Coach",
                "phone": "1234567890"
            },
            "specialization": "Testing",
            "experience_years": 5,
            "certifications": "Certified Tester"
        }
        
        print(f"Attempting to create coach: {coach_data['user_data']['username']}")
        response = requests.post(coach_url, json=coach_data, headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_add_coach()
