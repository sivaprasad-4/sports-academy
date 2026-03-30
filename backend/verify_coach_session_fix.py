import os
import django
import json
from django.contrib.auth import get_user_model

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sports_academy.settings')
django.setup()

from performance.models import TestSession
from academy.models import Batch, Sport
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory
from performance.views import TestSessionViewSet

def verify_coach_sessions():
    User = get_user_model()
    # Find a coach
    coach = User.objects.filter(role='COACH').first()
    if not coach:
        print("No coach found to test.")
        return

    # Find batches for this coach
    batches = Batch.objects.filter(coach=coach)
    sport_ids = list(batches.values_list('sport_id', flat=True))
    print(f"Coach: {coach.username}, Coached Sport IDs: {sport_ids}")

    # Check sessions in the database for these sports
    sessions = TestSession.objects.filter(sport_id__in=sport_ids)
    print(f"Total sessions in DB for these sports: {sessions.count()}")

    # Mock a request from this coach
    factory = APIRequestFactory()
    request = factory.get('/api/performance/sessions/')
    request.user = coach

    viewset = TestSessionViewSet()
    viewset.request = request
    viewset.format_kwarg = None
    
    queryset = viewset.get_queryset()
    print(f"Sessions visible to coach via ViewSet: {queryset.count()}")
    
    for s in queryset:
        print(f" - Session: {s.name}, Sport: {s.sport.name}, Conducted by: {s.conducted_by}")

    if queryset.count() == sessions.count():
        print("SUCCESS: Coach can see all sessions for their sport.")
    else:
        print("FAILURE: Session visibility is still restricted.")

if __name__ == "__main__":
    verify_coach_sessions()
