import os
import sys
import django

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sports_academy.settings')
django.setup()

from academy.models import AthleteProfile

def list_athletes_and_coaches():
    athletes = AthleteProfile.objects.select_related('user', 'batch', 'batch__coach').all()
    print("Listing athletes and their coaches:")
    for ap in athletes:
        coach_name = ap.batch.coach.username if ap.batch and ap.batch.coach else "None"
        batch_id = ap.batch.id if ap.batch else "None"
        print(f"Athlete: {ap.user.username} (ID: {ap.user.id}), Batch ID: {batch_id}, Coach: {coach_name}")

if __name__ == "__main__":
    list_athletes_and_coaches()
