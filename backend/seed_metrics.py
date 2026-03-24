import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sports_academy.settings')
django.setup()

from academy.models import Sport
from performance.models import PerformanceMetric

def seed_metrics():
    sports = Sport.objects.all()
    if not sports.exists():
        print("No sports found. Please add sports first before seeding metrics.")
        return

    metrics_to_add = [
        {
            'name': '100m Sprint',
            'description': 'Time taken to run 100 meters',
            'unit': 'seconds',
            'metric_type': 'SPEED',
            'higher_is_better': False
        },
        {
            'name': 'Beep Test',
            'description': 'Multi-stage fitness test score (level.shuttle)',
            'unit': 'level',
            'metric_type': 'ENDURANCE',
            'higher_is_better': True
        }
    ]

    for sport in sports:
        print(f"\nAdding metrics for Sport: {sport.name}")
        for metric_data in metrics_to_add:
            metric, created = PerformanceMetric.objects.get_or_create(
                sport=sport,
                name=metric_data['name'],
                defaults={
                    'description': metric_data['description'],
                    'unit': metric_data['unit'],
                    'metric_type': metric_data['metric_type'],
                    'higher_is_better': metric_data['higher_is_better']
                }
            )
            if created:
                print(f"  + Created metric: {metric.name}")
            else:
                print(f"  - Metric already exists: {metric.name}")
                
if __name__ == '__main__':
    seed_metrics()
