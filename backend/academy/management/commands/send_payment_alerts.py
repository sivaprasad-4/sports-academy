from django.core.management.base import BaseCommand
from django.utils import timezone
from academy.models import Fee, Notification

class Command(BaseCommand):
    help = 'Sends notifications for overdue payments'

    def handle(self, *args, **options):
        today = timezone.now().date()
        
        # 1. Update status for pending fees that are now past due
        overdue_count = Fee.objects.filter(
            status='PENDING',
            due_date__lt=today
        ).update(status='OVERDUE')
        
        self.stdout.write(self.style.SUCCESS(f'Updated {overdue_count} fees to OVERDUE'))
        
        # 2. Get all overdue fees to notify
        overdue_fees = Fee.objects.filter(status='OVERDUE')
        
        notifications_created = 0
        for fee in overdue_fees:
            # Check if we already sent a notification recently (optional improvement)
            # For now, we simple send one. 
            # In a real system, we might track 'last_notified' to avoid spam.
            
            Notification.objects.create(
                user=fee.athlete,
                title="URGENT: Overdue Payment",
                message=f"Your payment of {fee.amount} for {fee.description or 'training fees'} was due on {fee.due_date}. Please clear it immediately.",
                link="/fees"
            )
            notifications_created += 1
            
        self.stdout.write(self.style.SUCCESS(f'Sent {notifications_created} payment alert notifications'))
