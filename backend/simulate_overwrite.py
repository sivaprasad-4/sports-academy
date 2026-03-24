import os
import sys
import django

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sports_academy.settings')
django.setup()

from performance.models import TestResult, TestSession, PerformanceMetric
from django.contrib.auth import get_user_model

User = get_user_model()

def simulate_overwrite():
    athlete = User.objects.get(id=5)
    metric = PerformanceMetric.objects.get(id=19)
    session = TestSession.objects.get(id=1) 
    
    print(f"Initial count for Athlete 5, Metric 19, Session 1: {TestResult.objects.filter(athlete=athlete, metric=metric, session=session).count()}")
    
    # Record first value
    TestResult.objects.update_or_create(
        athlete=athlete, metric=metric, session=session,
        defaults={'value': 1500}
    )
    print("Recorded value 1500")
    
    # Record second value in SAME session
    TestResult.objects.update_or_create(
        athlete=athlete, metric=metric, session=session,
        defaults={'value': 1600}
    )
    print("Recorded value 1600")
    
    print(f"Final count for Athlete 5, Metric 19, Session 1: {TestResult.objects.filter(athlete=athlete, metric=metric, session=session).count()}")
    print(f"Final value: {TestResult.objects.get(athlete=athlete, metric=metric, session=session).value}")

if __name__ == "__main__":
    simulate_overwrite()
