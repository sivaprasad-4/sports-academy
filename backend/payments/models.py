from django.db import models
from django.conf import settings
from academy.models import Fee

class Payment(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
    ]

    payment_id = models.AutoField(primary_key=True)
    athlete = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payments'
    )
    fee = models.ForeignKey(
        Fee,
        on_delete=models.CASCADE,
        related_name='payments'
    )
    razorpay_order_id = models.CharField(max_length=100, unique=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True, null=True)
    razorpay_signature = models.CharField(max_length=200, blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    payment_method = models.CharField(max_length=50, blank=True, null=True)
    payment_date = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Payment {self.razorpay_order_id} - {self.athlete.username} - {self.status}"
