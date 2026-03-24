import requests
import json
import datetime

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

    # Get a batch with athletes! Let's just create an athlete if none exist.
    # Actually, we can just GET /academy/fees/ to see if there are ANY fees
    res = SESSION.get(f'{BASE_URL}/academy/fees/')
    fees = res.json().get('results', res.json())
    
    struct_id = None
    if fees:
        for fee in fees:
            if fee.get('fee_structure_data'):
                struct_id = fee['fee_structure_data']['id']
                print(f"Found existing Fee {fee['id']} linked to structure {struct_id}")
                break
    
    if struct_id:
        print(f"Trying to delete structure {struct_id}...")
        res = SESSION.delete(f'{BASE_URL}/academy/fee-structures/{struct_id}/')
        print(f"Delete response: {res.status_code} - {res.text}")
    else:
        print("No fees with a linked structure found to test deletion.")
        # fallback: fetch all structures
        print("Fetching all structures and grabbing the first one...")
        res = SESSION.get(f'{BASE_URL}/academy/fee-structures/')
        structs = res.json().get('results', res.json())
        if structs:
            print(f"Trying to delete structure {structs[0]['id']}...")
            res = SESSION.delete(f'{BASE_URL}/academy/fee-structures/{structs[0]["id"]}/')
            print(f"Delete response: {res.status_code} - {res.text}")
        else:
            print("No structures to test.")


if __name__ == '__main__':
    main()
