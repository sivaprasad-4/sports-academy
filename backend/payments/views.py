import csv
import datetime
import time
import json

import razorpay
from django.conf import settings
from django.db import transaction
from django.db.models import Count, Q, Sum
from django.db.models.functions import TruncMonth
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from academy.models import AthleteProfile, Fee, Notification
from .models import Payment
from .serializers import PaymentSerializer, CreateOrderSerializer, VerifyPaymentSerializer


class MockRazorpayClient:
    class Order:
        def create(self, data):
            return {'id': f'order_mock_{int(time.time())}', 'amount': data['amount'], 'currency': data['currency']}

        def payments(self, order_id):
            # Mock client: return empty items so FetchAndSyncPaymentView falls back to DB status
            return {'items': [], 'count': 0}

    class Utility:
        def verify_payment_signature(self, data):
            # Only allow mock signature if explicitly enabled in settings
            if getattr(settings, 'RAZORPAY_ENABLE_MOCK', False) and settings.DEBUG:
                if data.get('razorpay_signature') == 'mock_signature':
                    return True
            raise razorpay.errors.SignatureVerificationError("Signature verification failed")

        def verify_webhook_signature(self, body, signature, secret):
            if getattr(settings, 'RAZORPAY_ENABLE_MOCK', False) and settings.DEBUG:
                if signature == 'mock_webhook_signature':
                    return True
            raise razorpay.errors.SignatureVerificationError("Webhook signature verification failed")

    def __init__(self):
        self.order = self.Order()
        self.utility = self.Utility()


class RazorpayClient:
    def __init__(self):
        self.is_mock = settings.RAZORPAY_KEY_ID == 'placeholder_key_id' or not settings.RAZORPAY_KEY_ID
        if self.is_mock:
            self.client = MockRazorpayClient()
        else:
            try:
                self.client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
            except:
                self.client = MockRazorpayClient()


client = RazorpayClient().client


class CreateOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CreateOrderSerializer(data=request.data)
        if serializer.is_valid():
            fee_id = serializer.validated_data['fee_id']
            try:
                fee = Fee.objects.get(id=fee_id, athlete=request.user)
                if fee.status == 'PAID':
                    return Response({"error": "Fee already paid"}, status=status.HTTP_400_BAD_REQUEST)

                # Create Razorpay Order
                amount_in_paise = int(fee.amount * 100)
                order_data = {
                    'amount': amount_in_paise,
                    'currency': 'INR',
                    'payment_capture': '1'
                }
                razorpay_order = client.order.create(data=order_data)

                # Create local Payment record
                payment = Payment.objects.create(
                    athlete=request.user,
                    fee=fee,
                    razorpay_order_id=razorpay_order['id'],
                    amount=fee.amount,
                    status='PENDING'
                )

                return Response({
                    "order_id": razorpay_order['id'],
                    "amount": amount_in_paise,
                    "currency": "INR",
                    "key_id": settings.RAZORPAY_KEY_ID,
                    "academy_upi_id": settings.ACADEMY_UPI_ID
                }, status=status.HTTP_201_CREATED)

            except Fee.DoesNotExist:
                return Response({"error": "Fee not found"}, status=status.HTTP_404_NOT_FOUND)
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CheckPaymentStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, order_id):
        try:
            payment = Payment.objects.get(razorpay_order_id=order_id, athlete=request.user)
            return Response({
                "status": payment.status,
                "order_id": order_id
            }, status=status.HTTP_200_OK)
        except Payment.DoesNotExist:
            return Response({"error": "Payment not found"}, status=status.HTTP_404_NOT_FOUND)


class FetchAndSyncPaymentView(APIView):
    """
    Fetches payment status directly from Razorpay's REST API and syncs to our DB.
    Used when the user clicks 'Verify Payment Completion' — handles cases where
    webhooks can't reach localhost or were missed.
    Bypasses MockRazorpayClient by using direct HTTP calls to Razorpay API.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        import requests as http_requests

        order_id = request.data.get('order_id')
        if not order_id:
            return Response({"error": "order_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        print(f"[FetchSync] Manual sync requested for Order: {order_id} by {request.user.username}")

        try:
            payment = Payment.objects.get(razorpay_order_id=order_id, athlete=request.user)
        except Payment.DoesNotExist:
            return Response({"error": "Payment record not found"}, status=status.HTTP_404_NOT_FOUND)

        # If already SUCCESS, return immediately
        if payment.status == 'SUCCESS':
            print(f"[FetchSync] Order {order_id} already SUCCESS.")
            return Response({"status": "SUCCESS", "message": "Payment already confirmed"}, status=status.HTTP_200_OK)

        key_id = settings.RAZORPAY_KEY_ID
        key_secret = settings.RAZORPAY_KEY_SECRET

        # Check if we have real Razorpay credentials (not placeholder)
        if not key_id or key_id == 'placeholder_key_id' or not key_secret:
            print(f"[FetchSync] No real Razorpay keys configured.")
            # In DEBUG mode with mock orders, auto-succeed to simulate real payment confirmation
            if order_id.startswith('order_mock_') and settings.DEBUG:
                print(f"[FetchSync] DEBUG mock order: auto-confirming payment for {order_id}")
                with transaction.atomic():
                    payment.razorpay_payment_id = f"pay_mock_{int(time.time())}"
                    payment.status = 'SUCCESS'
                    payment.payment_date = timezone.now()
                    payment.save()

                    fee = payment.fee
                    fee.status = 'PAID'
                    fee.save()

                    Notification.objects.create(
                        user=payment.athlete,
                        title="Payment Successful",
                        message=f"Your payment of ₹{payment.amount} for {fee.description} was received.",
                        link="/fees"
                    )
                return Response({"status": "SUCCESS", "message": "Payment confirmed"}, status=status.HTTP_200_OK)

            return Response({"status": payment.status, "message": "Razorpay keys not configured"}, status=status.HTTP_200_OK)


        # Directly call Razorpay REST API to fetch payments for this order
        try:
            razorpay_url = f"https://api.razorpay.com/v1/orders/{order_id}/payments"
            print(f"[FetchSync] Calling Razorpay API: {razorpay_url}")

            resp = http_requests.get(
                razorpay_url,
                auth=(key_id, key_secret),
                timeout=10
            )

            print(f"[FetchSync] Razorpay API response: {resp.status_code}")

            if resp.status_code == 200:
                data = resp.json()
                payments_list = data.get('items', [])
                print(f"[FetchSync] Found {len(payments_list)} payment(s) for Order: {order_id}")

                for rzp_payment in payments_list:
                    if rzp_payment.get('status') == 'captured':
                        rzp_payment_id = rzp_payment.get('id')
                        print(f"[FetchSync] Found captured payment: {rzp_payment_id}")

                        with transaction.atomic():
                            payment.razorpay_payment_id = rzp_payment_id
                            payment.status = 'SUCCESS'
                            payment.payment_date = timezone.now()
                            payment.save()

                            fee = payment.fee
                            fee.status = 'PAID'
                            fee.save()

                            Notification.objects.create(
                                user=payment.athlete,
                                title="Payment Successful",
                                message=f"Your payment of ₹{payment.amount} for {fee.description} was confirmed.",
                                link="/fees"
                            )

                        print(f"[FetchSync] SUCCESS: Order {order_id} synced from Razorpay API.")
                        return Response({"status": "SUCCESS", "message": "Payment confirmed and synced"}, status=status.HTTP_200_OK)

                # No captured payment found yet
                print(f"[FetchSync] No captured payment found for Order: {order_id}")
                return Response({"status": "PENDING", "message": "Payment not yet received by Razorpay"}, status=status.HTTP_200_OK)

            elif resp.status_code == 404:
                print(f"[FetchSync] Order {order_id} not found on Razorpay (may be a mock order)")
                return Response({"status": "PENDING", "message": "Order not found on Razorpay"}, status=status.HTTP_200_OK)
            else:
                print(f"[FetchSync] Razorpay API error: {resp.status_code} - {resp.text[:200]}")
                return Response({"status": payment.status, "message": "Could not verify with Razorpay"}, status=status.HTTP_200_OK)

        except http_requests.exceptions.Timeout:
            print(f"[FetchSync] Razorpay API timeout for Order: {order_id}")
            return Response({"status": payment.status, "message": "Razorpay API timeout. Try again."}, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"[FetchSync] ERROR: {str(e)}")
            return Response({"status": payment.status, "message": f"Error: {str(e)}"}, status=status.HTTP_200_OK)




class VerifyPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = VerifyPaymentSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            order_id = data['razorpay_order_id']
            print(f"[Payment] Verification attempt for Order: {order_id}")
            
            try:
                # Verify Signature
                client.utility.verify_payment_signature({
                    'razorpay_order_id': order_id,
                    'razorpay_payment_id': data['razorpay_payment_id'],
                    'razorpay_signature': data['razorpay_signature']
                })

                with transaction.atomic():
                    payment = Payment.objects.get(razorpay_order_id=order_id)
                    if payment.status == 'SUCCESS':
                        return Response({"status": "Already verified"}, status=status.HTTP_200_OK)

                    payment.razorpay_payment_id = data['razorpay_payment_id']
                    payment.razorpay_signature = data['razorpay_signature']
                    payment.status = 'SUCCESS'
                    payment.payment_date = timezone.now()
                    payment.save()

                    # Update Fee Status
                    fee = payment.fee
                    fee.status = 'PAID'
                    fee.save()

                    # Create Notification
                    Notification.objects.create(
                        user=payment.athlete,
                        title="Payment Successful",
                        message=f"Your payment of ₹{payment.amount} for {fee.description} was successful.",
                        link="/fees"
                    )

                print(f"[Payment] Verification SUCCESS for Order: {order_id}")
                return Response({"status": "Payment verified and updated"}, status=status.HTTP_200_OK)

            except razorpay.errors.SignatureVerificationError:
                print(f"[Payment] Verification FAILED (Invalid Signature) for Order: {order_id}")
                Payment.objects.filter(razorpay_order_id=order_id).update(status='FAILED')
                return Response({"error": "Invalid signature"}, status=status.HTTP_400_BAD_REQUEST)
            except Payment.DoesNotExist:
                print(f"[Payment] Verification ERROR (Record Not Found) for Order: {order_id}")
                return Response({"error": "Payment record not found"}, status=status.HTTP_404_NOT_FOUND)
            except Exception as e:
                print(f"[Payment] Verification ERROR ({str(e)}) for Order: {order_id}")
                Payment.objects.filter(razorpay_order_id=order_id).update(status='FAILED')
                return Response({"error": "Could not verify payment"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RazorpayWebhookView(APIView):
    permission_classes = [permissions.AllowAny]  # Razorpay calls this without auth

    def post(self, request):
        payload = request.body.decode('utf-8')
        signature = request.headers.get('X-Razorpay-Signature')
        secret = settings.RAZORPAY_WEBHOOK_SECRET
        
        print(f"[Webhook] Received Razorpay webhook event. Signature present: {bool(signature)}")

        try:
            # Verify Webhook Signature
            client.utility.verify_webhook_signature(payload, signature, secret)
            
            data = json.loads(payload)
            event = data.get('event')
            print(f"[Webhook] Processing event: {event} (Order ID: {data.get('payload', {}).get('payment', {}).get('entity', {}).get('order_id')})")
            
            if event == 'payment.captured':
                payment_id = data['payload']['payment']['entity']['id']
                order_id = data['payload']['payment']['entity']['order_id']
                
                with transaction.atomic():
                    try:
                        payment = Payment.objects.get(razorpay_order_id=order_id)
                        
                        # Idempotency check: If already success, just return
                        if payment.status == 'SUCCESS':
                            print(f"[Webhook] Order {order_id} already marked SUCCESS. Skipping.")
                            return Response({"status": "Already processed"}, status=status.HTTP_200_OK)
                            
                        payment.razorpay_payment_id = payment_id
                        payment.status = 'SUCCESS'
                        payment.payment_date = timezone.now()
                        payment.save()

                        # Update Fee Status
                        fee = payment.fee
                        fee.status = 'PAID'
                        fee.save()

                        # Create Notification
                        Notification.objects.create(
                            user=payment.athlete,
                            title="Payment Successful (Confirmed)",
                            message=f"Your payment of ₹{payment.amount} for {fee.description} was processed successfully.",
                            link="/fees"
                        )
                        print(f"[Webhook] SUCCESS: Payment {payment_id} for Order {order_id} captured. Fee {fee.id} marked as PAID.")
                        return Response({"status": "Webhook processed successfully"}, status=status.HTTP_200_OK)
                    except Payment.DoesNotExist:
                        print(f"[Webhook] ERROR: Payment record for Order {order_id} not found.")
                        return Response({"error": "Payment record not found"}, status=status.HTTP_404_NOT_FOUND)
            
            return Response({"status": "Event ignored"}, status=status.HTTP_200_OK)

        except razorpay.errors.SignatureVerificationError:
            print(f"[Webhook] ERROR: Invalid webhook signature detected.")
            return Response({"error": "Invalid webhook signature"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"[Webhook] CRITICAL ERROR: {str(e)}")
            return Response({"error": "Internal server error during webhook processing"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PaymentHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            queryset = Payment.objects.all()
        else:
            queryset = Payment.objects.filter(athlete=user)

        athlete_id = self.request.query_params.get('athlete')
        if athlete_id:
            queryset = queryset.filter(athlete_id=athlete_id)
            
        return queryset

    def paginate_queryset(self, queryset):
        if 'nopagination' in self.request.query_params:
            return None
        return super().paginate_queryset(queryset)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAdminUser])
    def stats(self, request):
        success_payments = Payment.objects.filter(status='SUCCESS')
        total_revenue = success_payments.aggregate(Sum('amount'))['amount__sum'] or 0

        # Total Pending Amount from Fee model
        pending_fees = Fee.objects.exclude(status='PAID')
        total_pending = pending_fees.aggregate(Sum('amount'))['amount__sum'] or 0

        # Athlete counts
        # 1. Total active athletes
        total_athletes = AthleteProfile.objects.filter(is_active=True).count()

        # 2. Athletes who have completed their payments (no pending/overdue fees)
        fully_paid_athletes = AthleteProfile.objects.filter(is_active=True).annotate(
            unpaid_count=Count('user__fees', filter=~Q(user__fees__status='PAID'))
        ).filter(unpaid_count=0).count()

        # Monthly Revenue trends (last 6 months)
        six_months_ago = timezone.now() - datetime.timedelta(days=180)
        monthly_revenue = success_payments.filter(payment_date__gte=six_months_ago)\
            .annotate(month=TruncMonth('payment_date'))\
            .values('month')\
            .annotate(total=Sum('amount'))\
            .order_by('month')

        # Formatting data for charts
        revenue_trends = []
        for item in monthly_revenue:
            if item['month']:
                revenue_trends.append({
                    'month': item['month'].strftime('%b %Y'),
                    'total': float(item['total'])
                })

        return Response({
            "total_revenue": total_revenue,
            "total_pending": total_pending,
            "total_athletes": total_athletes,
            "fully_paid_athletes": fully_paid_athletes,
            "revenue_trends": revenue_trends,
        })

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAdminUser])
    def export_csv(self, request):
        report_type = request.query_params.get('type', 'transactions')

        response = HttpResponse(content_type='text/csv')

        if report_type == 'athlete_summary':
            response['Content-Disposition'] = 'attachment; filename="athlete_financial_summary.csv"'
            writer = csv.writer(response)
            writer.writerow(['Athlete Name', 'Sport', 'Total Fees', 'Paid Amount', 'Balance', 'Status'])

            fees = Fee.objects.all().select_related('athlete', 'fee_structure__sport')
            for f in fees:
                # Calculate paid amount for this specific fee
                paid_amount = f.payments.filter(status='SUCCESS').aggregate(Sum('amount'))['amount__sum'] or 0
                balance = f.amount - paid_amount
                writer.writerow([
                    f.athlete.get_full_name(),
                    f.fee_structure.sport.name if f.fee_structure and f.fee_structure.sport else "N/A",
                    f.amount,
                    paid_amount,
                    balance,
                    f.status
                ])

        elif report_type == 'monthly_summary':
            response['Content-Disposition'] = 'attachment; filename="monthly_revenue_report.csv"'
            writer = csv.writer(response)
            writer.writerow(['Month', 'Total Revenue Collected', 'Transactions'])

            # Use Payment model directly
            monthly_data = Payment.objects.filter(status='SUCCESS')

            if monthly_data.exists():
                monthly_stats = monthly_data.annotate(month_trunc=TruncMonth('payment_date'))\
                    .values('month_trunc')\
                    .annotate(total=Sum('amount'), count=Count('payment_id'))\
                    .order_by('-month_trunc')

                for item in monthly_stats:
                    month_val = item.get('month_trunc')
                    if month_val:
                        writer.writerow([
                            month_val.strftime('%B %Y'),
                            item['total'],
                            item['count']
                        ])
            else:
                writer.writerow(['No data available', '0.00', '0'])
        else:
            # Default: Transaction History
            response['Content-Disposition'] = 'attachment; filename="payment_history.csv"'
            writer = csv.writer(response)
            writer.writerow(['Order ID', 'Athlete', 'Fee', 'Amount', 'Status', 'Date', 'Payment Method'])

            payments = Payment.objects.all().select_related('athlete', 'fee')
            for p in payments:
                writer.writerow([
                    p.razorpay_order_id,
                    p.athlete.get_full_name(),
                    p.fee.description or (f"{p.fee.fee_structure.sport.name} Fee" if p.fee.fee_structure else "Fee"),
                    p.amount,
                    p.status,
                    p.payment_date or p.created_at,
                    p.payment_method
                ])

        return response
