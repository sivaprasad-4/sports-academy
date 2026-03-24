import os
import sys
import django
from django.db.models import Avg, Max, Min, Count

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sports_academy.settings')
django.setup()

from performance.models import TestResult
from django.contrib.auth import get_user_model

User = get_user_model()

def check_summary_query():
    print("Simulating summary query...")
    
    # Simulate a generic queryset as an admin would see (unfiltered)
    queryset = TestResult.objects.all()
    
    results = queryset.select_related('metric', 'athlete').values(
        'metric__id', 'metric__name', 'metric__description', 'metric__unit', 'metric__higher_is_better',
        'athlete__id', 'athlete__first_name', 'athlete__last_name'
    ).annotate(
        avg_value=Avg('value'),
        max_value=Max('value'),
        min_value=Min('value'),
        count=Count('id')
    ).order_by()

    print(f"Number of groups in results: {len(results)}")
    for r in results:
        print(f"Athlete: {r['athlete__first_name']} {r['athlete__last_name']}, Metric: {r['metric__name']}, Count: {r['count']}")
        
        # Now simulate the inner loop calculation
        metric_results = TestResult.objects.filter(
            athlete_id=r['athlete__id'],
            metric_id=r['metric__id']
        ).order_by('session__date')
        
        all_values = [float(res.value) for res in metric_results]
        print(f"  - Inner loop test_count (len(all_values)): {len(all_values)}")

if __name__ == "__main__":
    check_summary_query()
