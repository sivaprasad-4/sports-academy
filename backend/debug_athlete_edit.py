import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

def debug_athlete_edit():
    print("--- Debugging Athlete Edit ---")
    session = requests.Session()
    
    # 1. Login as Admin
    res = session.post(f"{BASE_URL}/auth/login/", json={"username": "adminn", "password": "admin123"})
    if res.status_code != 200:
        print(f"Login failed: {res.text}")
        return
    tokens = res.json()
    session.headers.update({"Authorization": f"Bearer {tokens['access']}"})
    print("Logged in as Admin")

    # 2. Get an athlete (athu)
    res = session.get(f"{BASE_URL}/academy/athletes/")
    athletes = res.json()
    if isinstance(athletes, dict) and 'results' in athletes:
        athletes = athletes['results']
    
    if not athletes:
        print("No athletes found to test with.")
        return
        
    athlete = next((a for a in athletes if a['user']['username'] == 'athu'), athletes[0])
    athlete_id = athlete['id']
    username = athlete['user']['username']
    print(f"Testing with athlete ID: {athlete_id} (Username: {username})")

    # 3. Attempt to update (simple change: first_name)
    payload = {
        "user_data": {
            "username": athlete['user']['username'],
            "email": athlete['user']['email'],
            "first_name": athlete['user']['first_name'] + " Updated",
            "last_name": athlete['user']['last_name'],
            "phone": athlete['user']['phone'],
            "date_of_birth": athlete['user']['date_of_birth'],
        },
        "height": athlete['height'],
        "weight": athlete['weight'],
        "emergency_contact": athlete['emergency_contact'],
        "medical_notes": athlete['medical_notes'],
        "batch": athlete['batch']
    }
    
    print("Sending update request...")
    res = session.patch(f"{BASE_URL}/academy/athletes/{athlete_id}/", json=payload)
    
    if res.status_code == 200:
        print("SUCCESS: Athlete updated successfully (Response: 200)")
        print(f"New Name: {res.json()['user']['first_name']}")
    else:
        print(f"FAILURE: Update failed with status {res.status_code}")
        print(f"Response Body: {res.text}")

if __name__ == "__main__":
    debug_athlete_edit()
