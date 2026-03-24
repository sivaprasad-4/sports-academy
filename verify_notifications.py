import requests
import json
import random
import time

BASE_URL = "http://localhost:8000/api"
ADMIN_USERNAME = "adminn"
ADMIN_PASSWORD = "admin123"

def verify_notifications():
    print("--- Starting Enhanced Verification ---")
    
    # 1. Login as Admin
    print("Logging in as admin...")
    login_res = requests.post(f"{BASE_URL}/auth/login/", json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD})
    if login_res.status_code != 200:
        print(f"Login failed: {login_res.text}")
        return
    access_token = login_res.json()["access"]
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # 2. Get an Athlete and their Batch
    print("Fetching an athlete...")
    res = requests.get(f"{BASE_URL}/academy/athletes/", headers=headers).json()
    athletes = res.get("results", res)
    if not athletes:
        print("No athletes found for testing.")
        return
    
    athlete = athletes[0]
    athlete_user_id = athlete["user"]["id"]
    athlete_username = athlete["user"]["username"]
    batch_id = athlete["batch"]
    
    # Get batch details to find the sport
    sport_id = None
    if batch_id:
        batch_res = requests.get(f"{BASE_URL}/academy/batches/{batch_id}/", headers=headers).json()
        sport_id = batch_res.get("sport")
    
    if not sport_id:
        # Just use the first sport if no batch
        sports = requests.get(f"{BASE_URL}/academy/sports/", headers=headers).json()
        sports_list = sports.get("results", sports)
        if sports_list:
            sport_id = sports_list[0]["id"]

    print(f"Testing with Athlete: {athlete_username}, User ID: {athlete_user_id}, Batch ID: {batch_id}, Sport ID: {sport_id}")

    # 3. Create an Announcement
    if batch_id:
        print("\nCreating an Announcement...")
        ann_data = {
            "batch": batch_id,
            "title": "Training Rescheduled",
            "content": "Tomorrow's training will be at 6 AM instead of 7 AM."
        }
        ann_res = requests.post(f"{BASE_URL}/academy/announcements/", json=ann_data, headers=headers)
        if ann_res.status_code in [200, 201]:
            print("Announcement created successfully.")
        else:
            print(f"Failed to create announcement: {ann_res.text}")

    # 4. Create a Fee record
    print("\nCreating a Fee record...")
    fee_data = {
        "athlete": athlete_user_id,
        "amount": "1500.00",
        "due_date": "2026-04-15",
        "description": "April Training Fee",
        "status": "PENDING"
    }
    fee_res = requests.post(f"{BASE_URL}/academy/fees/", json=fee_data, headers=headers)
    if fee_res.status_code in [200, 201]:
        print("Fee record created successfully.")
    else:
        print(f"Failed to create fee: {fee_res.text}")

    # 5. Create a Performance Test Session
    if sport_id:
        print(f"\nCreating a Performance Test Session for Sport {sport_id}...")
        test_data = {
            "name": "Speed Test Session",
            "sport": sport_id,
            "date": "2026-04-20",
            "notes": "Monthly speed check for all athletes."
        }
        test_res = requests.post(f"{BASE_URL}/performance/sessions/", json=test_data, headers=headers)
        if test_res.status_code in [200, 201]:
            print("Performance test session created successfully.")
        else:
            print(f"Failed to create test session: {test_res.text}")

    # 6. Verify Notifications for Athlete
    print(f"\nVerifying notifications for athlete {athlete_username}...")
    athlete_login_res = requests.post(f"{BASE_URL}/auth/login/", json={"username": athlete_username, "password": "password123"})
    if athlete_login_res.status_code == 200:
        athlete_token = athlete_login_res.json()["access"]
        athlete_headers = {"Authorization": f"Bearer {athlete_token}"}
        
        # Give a small delay for background processing if any
        time.sleep(1)
        
        notifications = requests.get(f"{BASE_URL}/academy/notifications/", headers=athlete_headers).json()
        notif_list = notifications.get("results", notifications)
        
        titles = [n["title"] for n in notif_list]
        print(f"Recent notification titles: {titles[:8]}")
        
        ann_found = any("Announcement" in t for t in titles)
        fee_found = any("Fee" in t for t in titles)
        perf_found = any("Performance" in t for t in titles)
        
        if ann_found: print("SUCCESS: Announcement notification found.")
        else: print("FAILURE: Announcement notification NOT found.")
            
        if fee_found: print("SUCCESS: Fee notification found.")
        else: print("FAILURE: Fee notification NOT found.")
            
        if perf_found: print("SUCCESS: Performance test notification found.")
        else: print("FAILURE: Performance test notification NOT found.")
    else:
        print(f"Could not login as athlete {athlete_username} to verify notifications directly.")

if __name__ == "__main__":
    verify_notifications()
