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

User = get_user_model()

def check_api_summary():
    user = User.objects.filter(role='ATHLETE', id=5).first()
    if not user:
        print("Athlete 5 not found")
        return

    print(f"Checking API summary for Athlete: {user.username} (ID: {user.id})")
    
    factory = APIRequestFactory()
    request = factory.get(f'/api/performance/test-results/summary/?athlete_id={user.id}')
    force_authenticate(request, user=user)
    
    view = TestResultViewSet.as_view({'get': 'summary'})
    response = view(request)
    
    print(f"Status Code: {response.status_code}")
    print("Response Data:")
    print(json.dumps(response.data, indent=2))

if __name__ == "__main__":
    check_api_summary()
