import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

def debug_coach_edit():
    print("--- Debugging Coach Edit ---")
    session = requests.Session()
    
    # 1. Login as Admin
    res = session.post(f"{BASE_URL}/auth/login/", json={"username": "adminn", "password": "admin123"})
    if res.status_code != 200:
        print(f"Login failed: {res.text}")
        return
    tokens = res.json()
    session.headers.update({"Authorization": f"Bearer {tokens['access']}"})

    # 2. Get a coach
    res = session.get(f"{BASE_URL}/academy/coaches/")
    coaches = res.json()
    if isinstance(coaches, dict) and 'results' in coaches:
        coaches = coaches['results']
    
    if not coaches:
        print("No coaches found.")
        return
        
    coach = coaches[0]
    coach_id = coach['id']
    username = coach['user']['username']
    print(f"Testing with coach ID: {coach_id} (Username: {username})")

    # 3. Attempt to update
    payload = {
        "user_data": {
            "username": coach['user']['username'],
            "email": coach['user']['email'],
            "first_name": coach['user']['first_name'] + " Updated",
            "last_name": coach['user']['last_name'],
            "phone": coach['user']['phone'],
            "date_of_birth": coach['user']['date_of_birth'],
        },
        "bio": coach.get('bio', ''),
        "specialization": coach.get('specialization', ''),
        "is_active": coach.get('is_active', True)
    }
    
    print("Sending update request...")
    res = session.patch(f"{BASE_URL}/academy/coaches/{coach_id}/", json=payload)
    
    if res.status_code == 200:
        print("SUCCESS: Coach updated successfully!")
    else:
        print(f"FAILURE: Update failed with status {res.status_code}")
        print(f"Response Body: {res.text}")

if __name__ == "__main__":
    debug_coach_edit()
