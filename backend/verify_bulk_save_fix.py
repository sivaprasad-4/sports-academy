import os
import django

# Set up Django environment BEFORE importing any django/rest_framework modules
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sports_academy.settings')
django.setup()

import json
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from performance.models import TestSession, PerformanceMetric
from academy.models import Batch, AthleteProfile

def verify_bulk_create_fix():
    User = get_user_model()
    # Find a coach (amar)
    coach = User.objects.filter(username='amar').first()
    if not coach:
        print("Coach 'amar' not found.")
        return

    # Find a session created by someone else (e.g., adminn) in the same sport (Football, ID 2)
    session = TestSession.objects.filter(sport_id=2).exclude(conducted_by=coach).first()
    if not session:
        print("No sessions found in Football not conducted by amar.")
        return
    
    print(f"Testing with Session: {session.name}, Conducted by: {session.conducted_by}")

    # Find an athlete and metric for this sport
    athlete = User.objects.filter(athlete_profile__batch__sport_id=2).first()
    metric = PerformanceMetric.objects.filter(sport_id=2).first()
    
    if not athlete or not metric:
        print("Missing athlete or metric for testing.")
        return

    client = APIClient()
    client.force_authenticate(user=coach)

    payload = {
        'session_id': session.id,
        'results': [
            {
                'athlete_id': athlete.id,
                'metric_id': metric.id,
                'value': 100.5,
                'notes': 'Verified test result'
            }
        ]
    }

    res = client.post('/api/performance/results/bulk_create/', payload, format='json')
    if res.status_code == 201:
        print("SUCCESS: Coach successfully recorded data for a session they didn't create.")
        print(f"Response: {res.data[0]['id']}")
    else:
        print(f"FAILURE: Status code {res.status_code}")
        print(f"Response: {res.data}")

if __name__ == "__main__":
    verify_bulk_create_fix()
