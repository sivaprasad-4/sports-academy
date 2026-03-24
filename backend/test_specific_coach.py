import os
import sys
import django
import json

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sports_academy.settings')
django.setup()

from performance.views import TestResultViewSet
from rest_framework.test import APIRequestFactory, force_authenticate
from django.contrib.auth import get_user_model
from academy.models import Batch

User = get_user_model()

def check_specific_coach_summary():
    coach = User.objects.filter(username='siv_a__14').first()
    if not coach:
        print("Coach siv_a__14 not found")
        return

    batch_id = 2  # Based on previous output
    print(f"Checking API summary for Coach: {coach.username} (ID: {coach.id}), Batch ID: {batch_id}")
    
    factory = APIRequestFactory()
    request = factory.get(f'/api/performance/test-results/summary/?batch_id={batch_id}')
    force_authenticate(request, user=coach)
    
    view = TestResultViewSet.as_view({'get': 'summary'})
    response = view(request)
    
    print(f"Status Code: {response.status_code}")
    
    # Filter for Athlete 5 in the response
    athlete_5_results = [item for item in response.data if item['athlete_id'] == 5]
    print("\nResults for Athlete 5 (athu):")
    print(json.dumps(athlete_5_results, indent=2))

if __name__ == "__main__":
    check_specific_coach_summary()
