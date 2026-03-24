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
from payments.views import RazorpayWebhookView
from rest_framework.test import APIRequestFactory
from django.utils import timezone
from django.contrib.auth import get_user_model

User = get_user_model()

def verify_webhook_logic():
    # 1. Setup Data
    athlete = User.objects.filter(role='ATHLETE').first()
    if not athlete:
        print("No athlete found for testing.")
        return

    # Create a pending fee and payment record
    fee = Fee.objects.create(
        athlete=athlete,
        amount=1200,
        due_date=timezone.now().date(),
        status='PENDING',
        description='Webhook Test Fee'
    )
    
    order_id = f'order_webhook_test_{int(timezone.now().timestamp())}'
    payment = Payment.objects.create(
        athlete=athlete,
        fee=fee,
        razorpay_order_id=order_id,
        amount=fee.amount,
        status='PENDING'
    )
    
    print(f"Testing Webhook for Athlete: {athlete.username}, Order ID: {order_id}")

    # 2. Prepare Webhook Payload
    webhook_payload = {
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_webhook_mock_123",
                    "order_id": order_id,
                    "amount": 120000,
                    "status": "captured"
                }
            }
        }
    }
    
    body = json.dumps(webhook_payload)
    
    factory = APIRequestFactory()
    request = factory.post(
        '/api/payments/webhook/',
        body,
        content_type='application/json',
        HTTP_X_RAZORPAY_SIGNATURE='mock_webhook_signature'
    )

    # 3. Call View
    print("\n--- Simulating Razorpay Webhook Call ---")
    view = RazorpayWebhookView.as_view()
    response = view(request)

    print(f"Response Status: {response.status_code}")
    print(f"Response Data: {response.data}")

    if response.status_code == 200:
        # 4. Verify DB Updates
        fee.refresh_from_db()
        payment.refresh_from_db()
        
        print(f"Fee Status: {fee.status}")
        print(f"Payment Status: {payment.status}")
        print(f"Payment Razorpay ID: {payment.razorpay_payment_id}")
        
        if fee.status == 'PAID' and payment.status == 'SUCCESS':
            print("\nSUCCESS: Webhook background processing verified!")
        else:
            print("\nFAILURE: Database records were not updated correctly.")
    else:
        print(f"\nFAILURE: Webhook API returned status {response.status_code}")

if __name__ == "__main__":
    verify_webhook_logic()
