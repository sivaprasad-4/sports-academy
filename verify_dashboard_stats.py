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
    print("--- Verifying Dashboard Stats ---")
    user = login('adminn', 'admin123')
    if not user:
        print("Login failed.")
        return

    res = SESSION.get(f'{BASE_URL}/payments/history/stats/')
    if res.status_code == 200:
        stats = res.json()
        print(f"Total Collected: INR {stats.get('total_revenue')}")
        print(f"Total Pending: INR {stats.get('total_pending')}")
        print(f"Total Athletes: {stats.get('total_athletes')}")
        print(f"Fully Paid Athletes: {stats.get('fully_paid_athletes')}")
        
        # Verify fields existence
        required = ['total_revenue', 'total_pending', 'total_athletes', 'fully_paid_athletes', 'revenue_trends']
        missing = [f for f in required if f not in stats]
        
        if not missing:
            print("\n✓ All requested metrics are present in API response.")
        else:
            print(f"\n✗ Missing fields: {missing}")
    else:
        print(f"Failed to fetch stats: {res.status_code} - {res.text}")

if __name__ == '__main__':
    main()
