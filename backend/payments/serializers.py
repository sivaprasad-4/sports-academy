from rest_framework import serializers
from .models import Payment
from academy.serializers import FeeSerializer

class PaymentSerializer(serializers.ModelSerializer):
    athlete_name = serializers.ReadOnlyField(source='athlete.get_full_name')
    fee_details = FeeSerializer(source='fee', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'payment_id', 'athlete', 'athlete_name', 'fee', 'fee_details',
            'razorpay_order_id', 'razorpay_payment_id', 'amount',
            'status', 'payment_method', 'payment_date', 'created_at'
        ]
        read_only_fields = ['payment_id', 'created_at']

class CreateOrderSerializer(serializers.Serializer):
    fee_id = serializers.IntegerField()

class VerifyPaymentSerializer(serializers.Serializer):
    razorpay_order_id = serializers.CharField()
    razorpay_payment_id = serializers.CharField()
    razorpay_signature = serializers.CharField()
