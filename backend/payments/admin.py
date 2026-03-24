from django.contrib import admin
from .models import Payment

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('razorpay_order_id', 'athlete', 'fee', 'amount', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('razorpay_order_id', 'razorpay_payment_id', 'athlete__username', 'athlete__email')
    readonly_fields = ('created_at',)

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
