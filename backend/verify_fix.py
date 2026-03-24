import os
import sys
import django
import json

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sports_academy.settings')
django.setup()

from performance.models import TestResult, TestSession, PerformanceMetric
from performance.views import TestResultViewSet
from rest_framework.test import APIRequestFactory, force_authenticate
from django.contrib.auth import get_user_model

User = get_user_model()

def verify_multiple_attempts():
    athlete = User.objects.get(id=5)
    metric = PerformanceMetric.objects.get(id=19)
    session = TestSession.objects.get(id=1)
    
    # Cleanup previous attempts if any
    TestResult.objects.filter(athlete=athlete, metric=metric, session=session).delete()
    
    print(f"Simulating bulk_create with 2 attempts for Athlete 5, Metric 19, Session 1...")
    
    factory = APIRequestFactory()
    data = {
        'session_id': session.id,
        'results': [
            {'athlete_id': athlete.id, 'metric_id': metric.id, 'value': 1000},
            {'athlete_id': athlete.id, 'metric_id': metric.id, 'value': 1100}
        ]
    }
    
    request = factory.post('/api/performance/test-results/bulk_create/', data, format='json')
    force_authenticate(request, user=User.objects.filter(role='ADMIN').first())
    
    view = TestResultViewSet.as_view({'post': 'bulk_create'})
    response = view(request)
    
    print(f"Bulk Create Status Code: {response.status_code}")
    print(f"Records created: {len(response.data)}")
    
    # Verify summary
    request_summary = factory.get(f'/api/performance/test-results/summary/?athlete_id={athlete.id}')
    force_authenticate(request_summary, user=athlete)
    view_summary = TestResultViewSet.as_view({'get': 'summary'})
    response_summary = view_summary(request_summary)
    
    metric_summary = next((item for item in response_summary.data if item['metric_id'] == metric.id), None)
    
    if metric_summary:
        print(f"\nSummary for Metric 19:")
        print(f" - Test Count: {metric_summary['test_count']}")
        print(f" - Latest Value: {metric_summary['latest_value']}")
        
        if metric_summary['test_count'] >= 2:
            print("\nSUCCESS: Multiple attempts correctly counted!")
        else:
            print("\nFAILURE: Test count is still 1.")
    else:
        print("\nFAILURE: No summary found for metric.")

if __name__ == "__main__":
    verify_multiple_attempts()
