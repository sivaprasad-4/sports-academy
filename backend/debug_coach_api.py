import os
import django

# Set up Django environment BEFORE importing any django/rest_framework modules
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sports_academy.settings')
django.setup()

import json
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

def debug_coach_data():
    User = get_user_model()
    coach = User.objects.filter(role='COACH').first()
    if not coach:
        print("No coach found.")
        return

    client = APIClient()
    client.force_authenticate(user=coach)

    print(f"--- Debugging for Coach: {coach.username} ---")
    
    # Check Batches
    res_batches = client.get('/api/academy/batches/')
    batches = res_batches.data.get('results', res_batches.data)
    print(f"Batches ({len(batches)}):")
    for b in batches:
        print(f"  - ID: {b['id']}, Name: {b['name']}, Sport: {b['sport']} ({type(b['sport'])})")
        sport_id = b['sport']
        
        # Check Metrics for this sport
        res_metrics = client.get(f'/api/performance/metrics/?sport={sport_id}')
        metrics = res_metrics.data.get('results', res_metrics.data)
        print(f"    Metrics found: {len(metrics)}")
        
        # Check Sessions for this sport
        res_sessions = client.get('/api/performance/sessions/')
        sessions = res_sessions.data.get('results', res_sessions.data)
        print(f"    Total Sessions found for Coach: {len(sessions)}")
        for s in sessions:
             print(f"      - Session ID: {s['id']}, Sport: {s['sport']} ({type(s['sport'])})")

if __name__ == "__main__":
    debug_coach_data()
