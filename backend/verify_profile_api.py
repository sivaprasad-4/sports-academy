import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"
USERNAME = "athu"
PASSWORD = "password123"

def verify_profile_api():
    print(f"--- Starting API Verification for {USERNAME} ---")
    
    # 1. Login to get JWT
    print("Logging in...")
    res = requests.post(f"{BASE_URL}/auth/login/", json={"username": USERNAME, "password": PASSWORD})
    if res.status_code != 200:
        print(f"Login failed: {res.text}")
        return
    token = res.json().get('access')
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Get Profile
    print("\nFetching profile data...")
    res = requests.get(f"{BASE_URL}/academy/athletes/me/", headers=headers)
    if res.status_code != 200:
        print(f"Failed to fetch profile: {res.text}")
        return
    profile = res.json()
    print("Profile retrieved successfully.")
    print(f"  Name: {profile['user']['first_name']} {profile['user']['last_name']}")
    print(f"  Sport: {profile.get('sport_name', 'MISSING')}")
    print(f"  Batch: {profile.get('batch_name', 'MISSING')}")
    
    original_batch_id = profile['batch']
    original_active_status = profile['is_active']

    # 3. Update Allowed Fields
    print("\nAttempting to update allowed fields (emergency_contact, medical_notes)...")
    update_data = {
        "emergency_contact": "999-888-7777 (Test)",
        "medical_notes": "No known allergies (Test)"
    }
    res = requests.patch(f"{BASE_URL}/academy/athletes/me/", json=update_data, headers=headers)
    if res.status_code != 200:
        print(f"Failed to update allowed fields: {res.text}")
        return
    updated_profile = res.json()
    if updated_profile['emergency_contact'] == update_data['emergency_contact'] and updated_profile['medical_notes'] == update_data['medical_notes']:
        print("SUCCESS: Allowed fields updated correctly.")
    else:
        print("ERROR: Allowed fields did not update as expected.")
        print(f"Response: {json.dumps(updated_profile, indent=2)}")
        return

    # 4. Attempt to Update Restricted Fields
    print("\nAttempting to update RESTRICTED fields (batch, is_active)...")
    malicious_data = {
        "batch": 9999,  # Invalid or unauthorized batch ID
        "is_active": not original_active_status
    }
    res = requests.patch(f"{BASE_URL}/academy/athletes/me/", json=malicious_data, headers=headers)
    if res.status_code != 200:
         print(f"Patch request failed (this might be fine if validation blocked it, but let's check): {res.text}")
    
    # Fetch fresh to be absolutely sure
    res = requests.get(f"{BASE_URL}/academy/athletes/me/", headers=headers)
    final_profile = res.json()
    
    if final_profile['batch'] == original_batch_id and final_profile['is_active'] == original_active_status:
         print("SUCCESS: Restricted fields were protected and NOT updated.")
    else:
         print("CRITICAL ERROR: Restricted fields WERE modified!")
         print(f"Original Batch: {original_batch_id}, New Batch: {final_profile['batch']}")
         print(f"Original Active: {original_active_status}, New Active: {final_profile['is_active']}")
         return

    print("\n--- Verification Completed Successfully ---")

if __name__ == "__main__":
    verify_profile_api()
