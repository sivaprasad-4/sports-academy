import os
import django
import sys

# Add the backend directory to sys.path
sys.path.append('c:/Users/Harishankar/.gemini/antigravity/scratch/sports_academy/backend')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sports_academy.settings')
django.setup()

from academy.models import AthleteProfile
from core.models import User
from django.db.models import Q

def test_search(query):
    print(f"Testing search for: '{query}'")
    
    # Simulate SearchFilter logic
    athletes = AthleteProfile.objects.filter(
        Q(user__first_name__icontains=query) |
        Q(user__last_name__icontains=query) |
        Q(user__username__icontains=query)
    )
    
    print(f"Found {athletes.count()} athletes.")
    for athlete in athletes:
        print(f" - {athlete.user.username}: {athlete.user.first_name} {athlete.user.last_name}")
        
    if athletes.count() == 0:
        print("All athletes in DB:")
        for athlete in AthleteProfile.objects.all()[:5]:
             print(f" - {athlete.user.username}: {athlete.user.first_name} {athlete.user.last_name}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        test_search(sys.argv[1])
    else:
        test_search("Ad") # Default test
