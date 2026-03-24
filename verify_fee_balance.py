import requests
import json

BASE_URL = 'http://127.0.0.1:8000/api'
SESSION = requests.Session()

def login(username, password):
    response = SESSION.post(f'{BASE_URL}/auth/login/', json={'username': username, 'password': password})
    if response.status_code == 200:
        data = response.json()
        SESSION.headers.update({'Authorization': f"Bearer {data['access']}"})
        return data['user']
    return None

def main():
    login('adminn', 'admin123')
    
    print("\n--- Fetching Athlete Fees (with Balance Tracking) ---")
    res = SESSION.get(f'{BASE_URL}/academy/fees/')
    if res.status_code == 200:
        fees = res.json().get('results', res.json())
        if fees:
            print(f"Found {len(fees)} fee records.")
            for f in fees[:3]: # Look at first 3
                print(f"\nAthlete: {f['athlete_name']}")
                print(f"Total Amount: {f['amount']}")
                print(f"Paid Amount: {f.get('paid_amount', 'MISSING')}")
                print(f"Balance: {f.get('balance', 'MISSING')}")
                print(f"Status: {f['status']}")
                
                # Verify logic
                if 'paid_amount' in f and 'balance' in f:
                    expected_balance = float(f['amount']) - float(f['paid_amount'])
                    if abs(float(f['balance']) - expected_balance) < 0.01:
                        print("✓ Balance calculation correct.")
                    else:
                        print(f"✗ Balance calculation mismatch! Expected {expected_balance}")
        else:
            print("No fee records found in database.")
    else:
        print(f"Failed to fetch fees: {res.status_code} - {res.text}")

if __name__ == '__main__':
    main()
