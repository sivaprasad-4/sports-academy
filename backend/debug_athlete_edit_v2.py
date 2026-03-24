import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

def debug_athlete_edit_advanced():
    print("--- Advanced Debugging Athlete Edit ---")
    session = requests.Session()
    
    # 1. Login as Admin
    res = session.post(f"{BASE_URL}/auth/login/", json={"username": "adminn", "password": "admin123"})
    if res.status_code != 200:
        print(f"Login failed: {res.text}")
        return
    tokens = res.json()
    session.headers.update({"Authorization": f"Bearer {tokens['access']}"})

    # 2. Get the athlete
    res = session.get(f"{BASE_URL}/academy/athletes/")
    athletes = res.json()
    if isinstance(athletes, dict) and 'results' in athletes:
        athletes = athletes['results']
    
    athlete = next((a for a in athletes if a['user']['username'] == 'athu'), athletes[0])
    athlete_id = athlete['id']

    # 3. Payload matching EXACTLY what frontend does
    # Frontend sends:
    # username: formData.username,
    # email: formData.email,
    # height: formData.height || null, (Wait, if formData.height is "168.00", it sends "168.00")
    
    payload = {
        "user_data": {
            "username": athlete['user']['username'],
            "email": athlete['user']['email'],
            "first_name": athlete['user']['first_name'], # No change
            "last_name": athlete['user']['last_name'],
            "phone": athlete['user']['phone'] if athlete['user']['phone'] else "",
            "date_of_birth": athlete['user']['date_of_birth'] if athlete['user']['date_of_birth'] else "",
        },
        "height": athlete['height'], # This is "168.00" (string)
        "weight": athlete['weight'], # This is "45.00" (string)
        "emergency_contact": athlete['emergency_contact'],
        "medical_notes": athlete['medical_notes'],
        "batch": athlete['batch']
    }
    
    print(f"Payload: {json.dumps(payload, indent=2)}")
    print("Sending patch request...")
    res = session.patch(f"{BASE_URL}/academy/athletes/{athlete_id}/", json=payload)
    
    if res.status_code == 200:
        print("SUCCESS: Update worked!")
    else:
        print(f"FAILURE: Status {res.status_code}")
        print(f"Body: {res.text}")

if __name__ == "__main__":
    debug_athlete_edit_advanced()
