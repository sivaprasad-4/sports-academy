import os
import sys
import django

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sports_academy.settings')
django.setup()

from performance.models import TestResult, TestSession
from django.db.models import Count

def check_counts():
    print("Checking TestResult counts...")
    
    # Check total results
    total = TestResult.objects.count()
    print(f"Total TestResults: {total}")
    
    # Check sessions
    sessions = TestSession.objects.all()
    print(f"Total TestSessions: {sessions.count()}")
    for s in sessions:
        print(f"  - Session: {s.name} on {s.date} (ID: {s.id})")

    # Check duplicates or counts per athlete/metric
    counts = TestResult.objects.values('athlete_id', 'metric_id').annotate(num_tests=Count('id')).filter(num_tests__gt=0)
    
    if not counts.exists():
        print("No test results found.")
        return

    print("\nTest counts per Athlete/Metric:")
    for c in counts:
        print(f"  - Athlete ID {c['athlete_id']}, Metric ID {c['metric_id']}: {c['num_tests']} tests")

if __name__ == "__main__":
    check_counts()
