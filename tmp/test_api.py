import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_fee_analysis():
    login_url = f"{BASE_URL}/auth/login/"
    login_data = {"username": "adminn", "password": "admin123"}
    
    try:
        response = requests.post(login_url, json=login_data)
        if response.status_code == 200:
            token = response.json()['access']
            headers = {"Authorization": f"Bearer {token}"}
            
            # Use Athlete ID 5
            athlete_id = 5
            print(f"Testing Analysis for Athlete ID: {athlete_id}")
            
            analysis_url = f"{BASE_URL}/payments/admin/fee-analysis/{athlete_id}/"
            analysis_resp = requests.get(analysis_url, headers=headers)
            print(f"Analysis Status: {analysis_resp.status_code}")
            if analysis_resp.status_code == 200:
                print(f"Analysis Data: {json.dumps(analysis_resp.json(), indent=2)}")
                
                history = analysis_resp.json().get('payment_history', [])
                success_payments = [p for p in history if p['status'] == 'SUCCESS']
                if success_payments:
                    payment_id = success_payments[0]['payment_id']
                    print(f"Testing Receipt for Payment ID: {payment_id}")
                    receipt_url = f"{BASE_URL}/payments/admin/fee-receipt/{payment_id}/"
                    receipt_resp = requests.get(receipt_url, headers=headers)
                    print(f"Receipt Status: {receipt_resp.status_code}")
                    print(f"Content Type: {receipt_resp.headers.get('Content-Type')}")
                    if receipt_resp.status_code == 200:
                        print("Receipt PDF successfully generated.")
                else:
                    print("No success payments found for this athlete.")
            else:
                print(f"Analysis failed: {analysis_resp.text}")
        else:
            print(f"Login failed: {response.status_code}")
    except Exception as e:
        print(f"Error during testing: {e}")

if __name__ == "__main__":
    test_fee_analysis()
