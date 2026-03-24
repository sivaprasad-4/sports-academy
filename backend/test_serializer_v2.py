import os
import django
import sys
import json

# Add the backend directory to sys.path
sys.path.append('c:/Users/Harishankar/.gemini/antigravity/scratch/sports_academy/backend')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sports_academy.settings')
django.setup()

from academy.models import AthleteProfile
from academy.serializers import AthleteProfileSerializer
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

def test_serializer_output(query):
    factory = APIRequestFactory()
    request = factory.get(f'/academy/athletes/?search={query}')
    
    # Filter queryset manually as we would in the view
    from django.db.models import Q
    queryset = AthleteProfile.objects.filter(
        Q(user__first_name__icontains=query) |
        Q(user__last_name__icontains=query) |
        Q(user__username__icontains=query)
    )
    
    serializer = AthleteProfileSerializer(queryset, many=True)
    print(json.dumps(serializer.data, indent=2))

if __name__ == "__main__":
    if len(sys.argv) > 1:
        test_serializer_output(sys.argv[1])
    else:
        test_serializer_output("fav")
