import requests
import json
import datetime

BASE_URL = 'http://127.0.0.1:8000/api'
SESSION = requests.Session()

def login(username, password):
    print(f"\n--- Logging in as {username} ---")
    response = SESSION.post(f'{BASE_URL}/auth/login/', json={'username': username, 'password': password})
    if response.status_code == 200:
        data = response.json()
        SESSION.headers.update({'Authorization': f"Bearer {data['access']}"})
        print("Login successful.")
        return data['user']
    else:
        print(f"Login failed: {response.status_code} - {response.text}")
        return None

def main():
    # Login as admin
    admin_user = login('adminn', 'admin123')
    if not admin_user:
        return

    # 1. Get Sports
    print("\n--- Fetching Sports ---")
    res = SESSION.get(f'{BASE_URL}/academy/sports/')
    sports = res.json().get('results', res.json())
    if not sports:
        print("No sports found.")
        return
    sport_id = sports[0]['id']
    print(f"Using Sport ID: {sport_id} ({sports[0]['name']})")

    # 2. Get Batches
    print("\n--- Fetching Batches ---")
    res = SESSION.get(f'{BASE_URL}/academy/batches/')
    batches = res.json().get('results', res.json())
    if not batches:
        print("No batches found.")
        return
    batch_id = batches[0]['id']
    print(f"Using Batch ID: {batch_id} ({batches[0]['name']})")

    # 3. Create Fee Structure
    print("\n--- Creating Fee Structure ---")
    fee_struct_data = {
        'sport': sport_id,
        'batch': batch_id,
        'amount': '1500.00',
        'payment_type': 'MONTHLY',
        'description': 'Monthly Training Fee'
    }
    res = SESSION.post(f'{BASE_URL}/academy/fee-structures/', json=fee_struct_data)
    if res.status_code == 201:
        fee_structure = res.json()
        print(f"Fee Structure created successfully. ID: {fee_structure['id']}")
    else:
        print(f"Failed to create Fee Structure: {res.status_code} - {res.text}")
        return

    # 3.5 Edit Fee Structure
    print("\n--- Editing Fee Structure ---")
    update_data = {
        'amount': '1750.00',
        'payment_type': 'QUARTERLY'
    }
    res = SESSION.patch(f'{BASE_URL}/academy/fee-structures/{fee_structure["id"]}/', json=update_data)
    if res.status_code == 200:
        updated_struct = res.json()
        print(f"Fee Structure updated successfully: Amount={updated_struct['amount']}, Type={updated_struct['payment_type']}")
    else:
        print(f"Failed to update Fee Structure: {res.status_code} - {res.text}")

    # 4. Assign Fees to Batch
    print("\n--- Assigning Fees to Batch ---")
    due_date = (datetime.date.today() + datetime.timedelta(days=7)).strftime('%Y-%m-%d')
    assign_data = {
        'batch_id': batch_id,
        'fee_structure_id': fee_structure['id'],
        'due_date': due_date
    }
    res = SESSION.post(f'{BASE_URL}/academy/fees/assign_to_batch/', json=assign_data)
    if res.status_code == 200:
        print(f"Fees assigned successfully: {res.json()}")
    else:
        print(f"Failed to assign fees: {res.status_code} - {res.text}")

    # 5. Check Stats
    print("\n--- Fetching Financial Stats ---")
    res = SESSION.get(f'{BASE_URL}/payments/history/stats/')
    if res.status_code == 200:
        stats = res.json()
        print("Stats fetched successfully:")
        print(json.dumps(stats, indent=2))
    else:
        print(f"Failed to fetch stats: {res.status_code} - {res.text}")


    # 6. Delete Fee Structure
    print("\n--- Deleting Fee Structure ---")
    res = SESSION.delete(f'{BASE_URL}/academy/fee-structures/{fee_structure["id"]}/')
    if res.status_code == 204:
        print(f"Fee Structure deleted successfully.")
    else:
        print(f"Failed to delete Fee Structure: {res.status_code} - {res.text}")


if __name__ == '__main__':
    main()
