import os
import django

# Set up Django environment BEFORE importing any django/rest_framework modules
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sports_academy.settings')
django.setup()

import json
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from performance.models import PerformanceMetric, TestSession
from academy.models import Sport

def verify_permissions_redistribution():
    User = get_user_model()
    admin = User.objects.filter(role='ADMIN').first()
    coach = User.objects.filter(role='COACH').first()
    sport = Sport.objects.first()

    if not admin or not coach or not sport:
        print("Missing required test data.")
        return

    client = APIClient()

    # 1. Test Admin (Should be restricted)
    client.force_authenticate(user=admin)
    
    # Try create metric
    res_metric = client.post('/api/performance/metrics/', {'name': 'Admin Metric', 'sport': sport.id, 'unit': 'test'})
    print(f"Admin creating metric: {res_metric.status_code}") # Expected 403
    
    # Try create session
    res_session = client.post('/api/performance/sessions/', {'name': 'Admin Session', 'sport': sport.id, 'date': '2023-01-01'})
    print(f"Admin creating session: {res_session.status_code}") # Expected 403

    # 2. Test Coach (Should be allowed)
    client.force_authenticate(user=coach)
    
    # Try create metric
    res_metric_c = client.post('/api/performance/metrics/', {'name': 'Coach Metric', 'sport': sport.id, 'unit': 'test'})
    print(f"Coach creating metric: {res_metric_c.status_code}") # Expected 201
    
    # Try create session
    res_session_c = client.post('/api/performance/sessions/', {'name': 'Coach Session', 'sport': sport.id, 'date': '2023-01-01'})
    print(f"Coach creating session: {res_session_c.status_code}") # Expected 201

    if res_metric.status_code == 403 and res_session.status_code == 403 and res_metric_c.status_code == 201 and res_session_c.status_code == 201:
        print("SUCCESS: Permissions successfully redistributed to Coaches.")
    else:
        print("FAILURE: Permissions setup incorrect.")

if __name__ == "__main__":
    verify_permissions_redistribution()
