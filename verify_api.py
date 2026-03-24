import requests
import json

BASE_URL = "http://localhost:8000/api"
USERNAME = "admin"
PASSWORD = "admin123"

def verify_api():
    # 1. Login
    auth_url = f"{BASE_URL}/auth/login/"
    try:
        response = requests.post(auth_url, json={"username": USERNAME, "password": PASSWORD})
        response.raise_for_status()
        tokens = response.json()
        access_token = tokens["access"]
        print("Login successful. Token obtained.")
    except Exception as e:
        print(f"Login failed: {e}")
        try:
            print(response.text)
        except:
            pass
        return

    # 2. Fetch Sports
    sports_url = f"{BASE_URL}/academy/sports/"
    headers = {"Authorization": f"Bearer {access_token}"}
    try:
        response = requests.get(sports_url, headers=headers)
        response.raise_for_status()
        sports = response.json()
        print(f"Sports API Response Status: {response.status_code}")
        print(f"Number of sports found: {len(sports)}")
        print("Sports Data:")
        print(json.dumps(sports, indent=2))
    except Exception as e:
        print(f"Fetch failed: {e}")
        try:
            print(response.text)
        except:
            pass

if __name__ == "__main__":
    verify_api()
