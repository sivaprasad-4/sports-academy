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

def check_coach_api_summary():
    coach = User.objects.filter(role='COACH').first()
    if not coach:
        print("No coach found")
        return

    batch = Batch.objects.filter(coach=coach).first()
    if not batch:
        print(f"Coach {coach.username} has no batches")
        return

    print(f"Checking API summary for Coach: {coach.username} (ID: {coach.id}), Batch: {batch.name} (ID: {batch.id})")
    
    factory = APIRequestFactory()
    request = factory.get(f'/api/performance/test-results/summary/?batch_id={batch.id}')
    force_authenticate(request, user=coach)
    
    view = TestResultViewSet.as_view({'get': 'summary'})
    response = view(request)
    
    print(f"Status Code: {response.status_code}")
    print("Response Data (Top 5 entries):")
    print(json.dumps(response.data[:5], indent=2))
    
    counts = [item['test_count'] for item in response.data]
    print(f"\nTest counts found: {counts}")
    print(f"Max test count: {max(counts) if counts else 0}")

if __name__ == "__main__":
    check_coach_api_summary()
