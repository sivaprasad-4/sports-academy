import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.join(os.getcwd(), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sports_academy.settings')
django.setup()

from payments.models import Payment
from academy.models import Fee, Notification
from django.utils import timezone

def simulate_latest_payment_success():
    # Find the most recent PENDING payment
    payment = Payment.objects.filter(status='PENDING').order_by('-created_at').first()
    
    if not payment:
        print("No pending payments found! Start a payment process on the website first.")
        return

    print(f"Found pending payment for Order: {payment.razorpay_order_id}")
    print(f"Athlete: {payment.athlete.get_full_name()}")
    print(f"Amount: ₹{payment.amount}")
    
    confirm = input("Confirm marking this payment as SUCCESSful? (y/n): ")
    if confirm.lower() != 'y':
        print("Aborted.")
        return

    # Update Payment and Fee
    payment.status = 'SUCCESS'
    payment.payment_date = timezone.now()
    payment.razorpay_payment_id = f'sim_pay_{int(timezone.now().timestamp())}'
    payment.save()

    fee = payment.fee
    fee.status = 'PAID'
    fee.save()

    # Create Notification
    Notification.objects.create(
        user=payment.athlete,
        title="Payment Successful (Simulated)",
        message=f"Your payment of ₹{payment.amount} was confirmed via simulation.",
        link="/fees"
    )

    print("\n✅ Success! The desktop screen should update instantly now.")

if __name__ == "__main__":
    simulate_latest_payment_success()
