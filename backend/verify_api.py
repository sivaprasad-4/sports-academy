import requests
import os
import django
import sys

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sports_academy.settings')
django.setup()

from payments.models import Payment
from django.contrib.auth import get_user_model

def verify_api_logic():
    BASE = 'http://localhost:8000/api'
    auth = {'username': 'ab123', 'password': 'password123'}
    
    print("Logging in...")
    login = requests.post(f'{BASE}/auth/login/', json=auth).json()
    print(f"Login response: {login}")
    if 'access' not in login:
        print("Login failed!")
        return
    token = login['access']
    headers = {'Authorization': f'Bearer {token}'}
    
    print("Fetching fees...")
    fees = requests.get(f'{BASE}/academy/fees/', headers=headers).json()
    fee_id = fees['results'][0]['id']
    
    print(f"Creating order for Fee ID: {fee_id}...")
    order = requests.post(f'{BASE}/payments/create-order/', json={'fee_id': fee_id}, headers=headers).json()
    order_id = order['order_id']
    print(f"Order ID: {order_id}")
    
    print("Checking initial status (should be PENDING)...")
    status_initial = requests.get(f'{BASE}/payments/check-status/{order_id}/', headers=headers).json()
    print(f"Initial Status: {status_initial['status']}")
    
    if status_initial['status'] != 'PENDING':
        print("FAILURE: Initial status was not PENDING!")
        return

    print("Manually updating status to SUCCESS in DB...")
    p = Payment.objects.get(razorpay_order_id=order_id)
    p.status = 'SUCCESS'
    p.save()
    
    print("Checking status again (should be SUCCESS)...")
    status_after = requests.get(f'{BASE}/payments/check-status/{order_id}/', headers=headers).json()
    print(f"Status after update: {status_after['status']}")
    
    if status_after['status'] == 'SUCCESS':
        print("\n✅ API VERIFICATION SUCCESSFUL")
    else:
        print("\n❌ API VERIFICATION FAILED")

if __name__ == "__main__":
    verify_api_logic()
