from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CreateOrderView, VerifyPaymentView, PaymentHistoryViewSet, 
    RazorpayWebhookView, CheckPaymentStatusView, FetchAndSyncPaymentView,
    AdminFeeAnalysisView, AdminFeeReceiptView
)

router = DefaultRouter()
router.register(r'history', PaymentHistoryViewSet, basename='payment-history')

urlpatterns = [
    path('create-order/', CreateOrderView.as_view(), name='create-order'),
    path('verify-payment/', VerifyPaymentView.as_view(), name='verify-payment'),
    path('webhook/', RazorpayWebhookView.as_view(), name='razorpay-webhook'),
    path('check-status/<str:order_id>/', CheckPaymentStatusView.as_view(), name='check-status'),
    path('fetch-and-sync/', FetchAndSyncPaymentView.as_view(), name='fetch-and-sync'),
    path('admin/fee-analysis/<int:athlete_id>/', AdminFeeAnalysisView.as_view(), name='admin-fee-analysis'),
    path('admin/fee-receipt/<int:payment_id>/', AdminFeeReceiptView.as_view(), name='admin-fee-receipt'),
    path('', include(router.urls)),
]

