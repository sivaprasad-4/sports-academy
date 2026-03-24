import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sports_academy.settings')
django.setup()

from performance.models import PerformanceMetric
from academy.models import Sport

def seed_metrics():
    print("Seeding expanded performance metrics...")
    
    # Get Sports
    cricket = Sport.objects.get(name='Cricket')
    football = Sport.objects.get(name='Football')
    tennis = Sport.objects.get(name='Tennis')

    metrics_to_add = [
        # Global Fitness Metrics
        {
            'name': 'Vertical Jump',
            'sport': None,
            'unit': 'inches',
            'higher_is_better': True,
            'weight_percentage': 20.0,
            'description': 'Measures explosive leg power.'
        },
        {
            'name': 'Plank Duration',
            'sport': None,
            'unit': 'seconds',
            'higher_is_better': True,
            'weight_percentage': 20.0,
            'description': 'Measures core stability and endurance.'
        },
        {
            'name': 'Illinois Agility Test',
            'sport': None,
            'unit': 'seconds',
            'higher_is_better': False,
            'weight_percentage': 20.0,
            'description': 'Standard test for agility and quickness.'
        },
        {
            'name': 'Sit and Reach',
            'sport': None,
            'unit': 'cm',
            'higher_is_better': True,
            'weight_percentage': 20.0,
            'description': 'Measures flexibility of the lower back and hamstrings.'
        },
        {
            'name': 'Cooper 12-Minute Run Test',
            'sport': None,
            'unit': 'meters',
            'higher_is_better': True,
            'weight_percentage': 20.0,
            'description': 'Measures aerobic endurance/stamina.'
        },

        # Cricket Metrics (Update existing and add new)
        {
            'name': '100m Sprint',
            'sport': cricket,
            'unit': 'seconds',
            'higher_is_better': False,
            'weight_percentage': 15.0,
        },
        {
            'name': 'Beep Test',
            'sport': cricket,
            'unit': 'level',
            'higher_is_better': True,
            'weight_percentage': 20.0,
        },
        {
            'name': 'Bowling Speed',
            'sport': cricket,
            'unit': 'km/h',
            'higher_is_better': True,
            'weight_percentage': 25.0,
            'description': 'Maximum velocity achieved during a bowl.'
        },
        {
            'name': 'Direct Hit Accuracy',
            'sport': cricket,
            'unit': '%',
            'higher_is_better': True,
            'weight_percentage': 20.0,
            'description': 'Percentage of successful direct hits at the stumps.'
        },
        {
            'name': 'Catching Efficiency',
            'sport': cricket,
            'unit': '%',
            'higher_is_better': True,
            'weight_percentage': 20.0,
            'description': 'Percentage of catches successfully completed.'
        },

        # Football Metrics
        {
            'name': '100m Sprint',
            'sport': football,
            'unit': 'seconds',
            'higher_is_better': False,
            'weight_percentage': 15.0,
        },
        {
            'name': 'Beep Test',
            'sport': football,
            'unit': 'level',
            'higher_is_better': True,
            'weight_percentage': 20.0,
        },
        {
            'name': 'Dribbling Time',
            'sport': football,
            'unit': 'seconds',
            'higher_is_better': False,
            'weight_percentage': 25.0,
            'description': 'Time to complete a 20m dribbling course through cones.'
        },
        {
            'name': 'Shooting Accuracy',
            'sport': football,
            'unit': '%',
            'higher_is_better': True,
            'weight_percentage': 20.0,
            'description': 'Percentage of shots hitting targets in corners of the goal.'
        },
        {
            'name': 'Passing Precision',
            'sport': football,
            'unit': '%',
            'higher_is_better': True,
            'weight_percentage': 20.0,
            'description': 'Percentage of successful mid-range passes to target.'
        },

        # Tennis Metrics
        {
            'name': 'First Serve Accuracy',
            'sport': tennis,
            'unit': '%',
            'higher_is_better': True,
            'weight_percentage': 25.0,
            'description': 'Percentage of first serves landing in the service box.'
        },
        {
            'name': 'Groundstroke Consistency',
            'sport': tennis,
            'unit': 'reps',
            'higher_is_better': True,
            'weight_percentage': 30.0,
            'description': 'Maximum number of consecutive groundstrokes in a rally.'
        },
        {
            'name': 'Serve Speed',
            'sport': tennis,
            'unit': 'km/h',
            'higher_is_better': True,
            'weight_percentage': 25.0,
            'description': 'Maximum serve velocity.'
        },
        {
            'name': 'Illinois Agility Test', # Tennis version
            'sport': tennis,
            'unit': 'seconds',
            'higher_is_better': False,
            'weight_percentage': 20.0,
        }
    ]

    for m_data in metrics_to_add:
        metric, created = PerformanceMetric.objects.update_or_create(
            name=m_data['name'],
            sport=m_data['sport'],
            defaults={
                'unit': m_data['unit'],
                'higher_is_better': m_data['higher_is_better'],
                'weight_percentage': m_data['weight_percentage'],
                'description': m_data.get('description', '')
            }
        )
        status = "Created" if created else "Updated"
        print(f"[{status}] {metric.name} ({metric.sport.name if metric.sport else 'Global'})")

    print("\nSeeding complete!")

if __name__ == '__main__':
    seed_metrics()
