import os
import sys
import django
import json

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sports_academy.settings')
django.setup()

from academy.models import Fee
from payments.models import Payment
from payments.views import CreateOrderView, VerifyPaymentView
from rest_framework.test import APIRequestFactory, force_authenticate
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

def verify_payment_flow():
    # 1. Setup Data
    athlete = User.objects.filter(role='ATHLETE').first()
    if not athlete:
        print("No athlete found for testing.")
        return

    # Create a pending fee if none exists
    fee = Fee.objects.filter(athlete=athlete, status='PENDING').first()
    if not fee:
        fee = Fee.objects.create(
            athlete=athlete,
            amount=5000,
            due_date=timezone.now().date(),
            status='PENDING',
            description='Test Fee'
        )
    
    print(f"Testing with Athlete: {athlete.username}, Fee ID: {fee.id}, Amount: {fee.amount}")

    factory = APIRequestFactory()

    # 2. Test Create Order
    print("\n--- Testing Create Order ---")
    create_request = factory.post('/api/payments/create-order/', {'fee_id': fee.id}, format='json')
    force_authenticate(create_request, user=athlete)
    create_view = CreateOrderView.as_view()
    create_response = create_view(create_request)

    print(f"Response Status: {create_response.status_code}")
    print(f"Response Data: {create_response.data}")

    if create_response.status_code != 201:
        print("Order creation failed.")
        return

    order_id = create_response.data['order_id']

    # Verify local payment record
    payment = Payment.objects.filter(razorpay_order_id=order_id).first()
    if payment:
        print(f"Local Payment record created: {payment.razorpay_order_id}, Status: {payment.status}")
    else:
        print("Local Payment record NOT found.")
        return

    # 3. Test Verify Payment
    print("\n--- Testing Verify Payment ---")
    verify_data = {
        'razorpay_order_id': order_id,
        'razorpay_payment_id': 'pay_mock_123',
        'razorpay_signature': 'mock_signature'
    }
    verify_request = factory.post('/api/payments/verify-payment/', verify_data, format='json')
    force_authenticate(verify_request, user=athlete)
    verify_view = VerifyPaymentView.as_view()
    verify_response = verify_view(verify_request)

    print(f"Response Status: {verify_response.status_code}")
    print(f"Response Data: {verify_response.data}")

    if verify_response.status_code == 200:
        # Check if fee status updated
        fee.refresh_from_db()
        payment.refresh_from_db()
        print(f"Fee Status: {fee.status}")
        print(f"Payment Status: {payment.status}")
        print(f"Payment ID: {payment.razorpay_payment_id}")
        
        if fee.status == 'PAID' and payment.status == 'SUCCESS':
            print("\nSUCCESS: Payment flow verified successfully!")
        else:
            print("\nFAILURE: Status not updated correctly.")
    else:
        print("\nFAILURE: Verification API failed.")

if __name__ == "__main__":
    verify_payment_flow()
