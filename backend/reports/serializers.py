from rest_framework import serializers

class AttendanceReportSerializer(serializers.Serializer):
    total_sessions = serializers.IntegerField()
    attended = serializers.IntegerField()
    missed = serializers.IntegerField()
    attendance_percentage = serializers.FloatField()
    records = serializers.ListField(child=serializers.DictField())

class PerformanceReportSerializer(serializers.Serializer):
    athlete_id = serializers.IntegerField()
    athlete_name = serializers.CharField()
    batch_name = serializers.CharField()
    metrics = serializers.ListField(child=serializers.DictField())
    timeline = serializers.ListField(child=serializers.DictField())
    index_history = serializers.ListField(child=serializers.DictField(), required=False)

class ReceiptSerializer(serializers.Serializer):
    receipt_no = serializers.CharField()
    academy_name = serializers.CharField()
    athlete_name = serializers.CharField()
    athlete_id = serializers.IntegerField()
    batch_name = serializers.CharField()
    sport_name = serializers.CharField()
    fee_description = serializers.CharField()
    amount_paid = serializers.DecimalField(max_digits=10, decimal_places=2)
    payment_method = serializers.CharField()
    razorpay_payment_id = serializers.CharField(allow_null=True)
    razorpay_order_id = serializers.CharField()
    transaction_date = serializers.DateTimeField()
    payment_status = serializers.CharField()
