import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sports_academy_project.settings')
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model

User = get_user_model()
client = Client()

# Get an admin user
admin_user = User.objects.filter(role='ADMIN').first()
if not admin_user:
    print("No admin user found.")
else:
    client.force_login(admin_user)
    response = client.get('/api/payments/history/export_csv/?type=transactions')
    print(f"Status: {response.status_code}")
    print(f"Content-Type: {response['Content-Type']}")
    print(f"Content-Disposition: {response.get('Content-Disposition')}")
    print(f"Body snippet: {response.content[:100]}")
