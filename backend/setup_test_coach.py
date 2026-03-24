import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sports_academy.settings')
django.setup()

from django.contrib.auth import get_user_model
from academy.models import CoachProfile, Batch

User = get_user_model()

def setup_test_coach():
    username = 'testcoach'
    password = 'Admin@123'
    
    u, created = User.objects.get_or_create(
        username=username, 
        defaults={'role': 'COACH', 'first_name': 'Test', 'last_name': 'Coach'}
    )
    u.set_password(password)
    u.role = 'COACH' # Ensure role is set
    u.save()
    
    CoachProfile.objects.get_or_create(user=u)
    
    # Assign to first batch without a coach if possible
    b = Batch.objects.filter(coach__isnull=True).first()
    if not b:
        b = Batch.objects.first()
        
    if b:
        b.coach = u
        b.save()
        print(f"Success: Test coach '{username}' created and assigned to batch '{b.name}'")
    else:
        print(f"Success: Test coach '{username}' created, but no batches found to assign.")

if __name__ == "__main__":
    setup_test_coach()
