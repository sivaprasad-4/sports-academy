import os
import django
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sports_academy.settings')
django.setup()

from academy.models import AthleteProfile
from academy.serializers import AthleteProfileSerializer
from django.contrib.auth import get_user_model

def test_serializer_validation():
    User = get_user_model()
    # Get an athlete and their profile
    u = User.objects.get(username='athu')
    profile = u.athlete_profile

    print(f"Testing validation for athlete: {u.username} (ID: {u.id})")
    print(f"Profile ID: {profile.id}")

    # Case 1: Update with existing data (should be valid)
    data = {
        "user_data": {
            "username": "athu",
            "email": "athu@gmail.com",
            "first_name": "athu Updated"
        },
        "height": 175.0
    }
    
    serializer = AthleteProfileSerializer(instance=profile, data=data, partial=True)
    is_valid = serializer.is_valid()
    print(f"Case 1 (No changes to unique fields): is_valid={is_valid}")
    if not is_valid:
        print(f"Errors: {serializer.errors}")

    # Case 2: Update with a duplicate username (should be invalid)
    data_dup = {
        "user_data": {
            "username": "adminn", # Existing admin username
            "email": "athu@gmail.com"
        }
    }
    serializer_dup = AthleteProfileSerializer(instance=profile, data=data_dup, partial=True)
    is_valid_dup = serializer_dup.is_valid()
    print(f"Case 2 (Duplicate username): is_valid={is_valid_dup}")
    if not is_valid_dup:
        print(f"Errors: {serializer_dup.errors}")

if __name__ == "__main__":
    test_serializer_validation()
