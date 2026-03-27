import os
import django
import sys

# Set up Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sports_academy.settings')
django.setup()

from django.contrib.auth import get_user_model
from academy.models import Announcement, Batch
from rest_framework.exceptions import PermissionDenied
from academy.views import AnnouncementViewSet
from rest_framework.test import APIRequestFactory, force_authenticate

User = get_user_model()

def test_coach_announcement_restriction():
    factory = APIRequestFactory()
    view = AnnouncementViewSet.as_view({'post': 'create'})
    
    try:
        coach = User.objects.get(username='amar')
        other_coach = User.objects.get(username='pep')
    except User.DoesNotExist:
        print("Required users not found. Skipping test.")
        return
    
    # Get a batch belonging to amar
    amar_batch = Batch.objects.filter(coach=coach).first()
    if not amar_batch:
        print("Creating a batch for amar...")
        from academy.models import Sport
        sport = Sport.objects.first()
        amar_batch = Batch.objects.create(name="Amar's Batch", coach=coach, sport=sport, start_time="09:00:00", end_time="11:00:00", days_of_week="Mon,Wed,Fri")
    
    # Get a batch NOT belonging to amar
    other_batch = Batch.objects.filter(coach=other_coach).first()
    if not other_batch:
        print("Creating a batch for pep...")
        from academy.models import Sport
        sport = Sport.objects.first()
        other_batch = Batch.objects.create(name="Pep's Batch", coach=other_coach, sport=sport, start_time="09:00:00", end_time="11:00:00", days_of_week="Mon,Wed,Fri")

    print("\n--- Starting Verification ---")

    # 1. Test: Coach sends to their own batch (SUCCESS)
    print("Test 1: Coach sends to their own batch...")
    data = {'title': 'Valid', 'content': 'Valid', 'target_audience': 'ATHLETES', 'batch': amar_batch.id}
    request = factory.post('/academy/announcements/', data)
    force_authenticate(request, user=coach)
    response = view(request)
    if response.status_code == 201:
        print("PASS: Coach can send to their own batch.")
    else:
        print(f"FAIL: Coach could not send to their own batch: {response.data}")

    # 2. Test: Coach sends to OTHER coach's batch (FAILURE)
    print("\nTest 2: Coach sends to OTHER coach's batch...")
    data = {'title': 'Invalid', 'content': 'Invalid', 'target_audience': 'ATHLETES', 'batch': other_batch.id}
    request = factory.post('/academy/announcements/', data)
    force_authenticate(request, user=coach)
    try:
        response = view(request)
        if response.status_code == 403:
             print(f"PASS: Coach blocked with 403: {response.data}")
        else:
             print(f"FAIL: Coach sent to other batch! Status: {response.status_code}")
    except PermissionDenied as e:
        print(f"PASS: Coach blocked from other batch: {e}")

    # 3. Test: Coach sends GLOBAL (no batch) (FAILURE)
    print("\nTest 3: Coach sends GLOBAL announcement (no batch)...")
    data = {'title': 'Invalid Global', 'content': 'Invalid Global', 'target_audience': 'ATHLETES'}
    request = factory.post('/academy/announcements/', data)
    force_authenticate(request, user=coach)
    try:
        response = view(request)
        if response.status_code == 403:
             print(f"PASS: Coach blocked with 403: {response.data}")
        else:
             print(f"FAIL: Coach sent global announcement! Status: {response.status_code}")
    except PermissionDenied as e:
        print(f"PASS: Coach blocked from global: {e}")

    # 4. Test: Coach sends to COACHES (FAILURE)
    print("\nTest 4: Coach sends to COACHES audience...")
    data = {'title': 'Invalid Audience', 'content': 'Invalid Audience', 'target_audience': 'COACHES', 'batch': amar_batch.id}
    request = factory.post('/academy/announcements/', data)
    force_authenticate(request, user=coach)
    try:
        response = view(request)
        if response.status_code == 403:
             print(f"PASS: Coach blocked with 403: {response.data}")
        else:
             print(f"FAIL: Coach sent to coaches! Status: {response.status_code}")
    except PermissionDenied as e:
        print(f"PASS: Coach blocked from coach audience: {e}")

    # 5. Test: Admin can still do everything
    print("\nTest 5: Admin can still send global announcements...")
    admin = User.objects.filter(role='ADMIN').first()
    if admin:
        data = {'title': 'Admin Global', 'content': 'Admin Global', 'target_audience': 'ALL'}
        request = factory.post('/academy/announcements/', data)
        force_authenticate(request, user=admin)
        response = view(request)
        if response.status_code == 201:
            print("PASS: Admin can still send global announcements.")
        else:
            print(f"FAIL: Admin blocked: {response.data}")

if __name__ == "__main__":
    test_coach_announcement_restriction()
