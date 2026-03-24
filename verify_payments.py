import requests
import json
import time

BASE_URL = "http://localhost:8000/api"
ADMIN_USERNAME = "adminn"
ADMIN_PASSWORD = "admin123"

def verify_payments():
    print("--- Starting Payment Integration Verification ---")
    
    # 1. Login as Admin
    print("Logging in as admin...")
    login_res = requests.post(f"{BASE_URL}/auth/login/", json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD})
    if login_res.status_code != 200:
        print(f"Login failed: {login_res.text}")
        return
    access_token = login_res.json()["access"]
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # 2. Get an Athlete
    print("Fetching an athlete...")
    athletes = requests.get(f"{BASE_URL}/academy/athletes/", headers=headers).json()
    athlete = athletes.get("results", athletes)[0]
    athlete_username = athlete["user"]["username"]
    
    # 3. Get a pending fee for that athlete
    print(f"Fetching pending fees for {athlete_username}...")
    # Login as athlete to get fees
    athlete_login = requests.post(f"{BASE_URL}/auth/login/", json={"username": athlete_username, "password": "password123"})
    athlete_token = athlete_login.json()["access"]
    athlete_headers = {"Authorization": f"Bearer {athlete_token}"}
    
    fees = requests.get(f"{BASE_URL}/academy/fees/", headers=athlete_headers).json()
    pending_fees = [f for f in fees.get("results", fees) if f["status"] != "PAID"]
    
    if not pending_fees:
        print("No pending fees found. Creating one...")
        # Create a fee as admin
        fee_data = {
            "athlete": athlete["user"]["id"],
            "amount": "500.00",
            "due_date": "2026-05-01",
            "description": "Payment Verification Fee",
            "status": "PENDING"
        }
        requests.post(f"{BASE_URL}/academy/fees/", json=fee_data, headers=headers)
        fees = requests.get(f"{BASE_URL}/academy/fees/", headers=athlete_headers).json()
        pending_fees = [f for f in fees.get("results", fees) if f["status"] != "PAID"]

    fee = pending_fees[0]
    fee_id = fee["id"]
    print(f"Testing with Fee ID: {fee_id}, Amount: {fee['amount']}")

    # 4. Create Razorpay Order
    print("Creating Razorpay Order...")
    order_res = requests.post(f"{BASE_URL}/payments/create-order/", json={"fee_id": fee_id}, headers=athlete_headers)
    if order_res.status_code == 201:
        order_data = order_res.json()
        print(f"Order created successfully: {order_data['order_id']}")
    else:
        print(f"Order creation failed: {order_res.text}")
        return

    # 5. Check Payment History
    print("Checking Payment History...")
    history = requests.get(f"{BASE_URL}/payments/history/", headers=athlete_headers).json()
    history_list = history.get("results", history)
    if any(p["razorpay_order_id"] == order_data["order_id"] for p in history_list):
        print("SUCCESS: Local payment record found with PENDING status.")
    else:
        print("FAILURE: Local payment record NOT found.")

    # 6. Admin Stats
    print("Checking Admin Revenue Stats...")
    stats = requests.get(f"{BASE_URL}/payments/history/stats/", headers=headers).json()
    print(f"Stats: {stats}")

    print("\nVerification complete. Manual signature verification (VerifyPaymentView) requires real Razorpay token.")

if __name__ == "__main__":
    verify_payments()
