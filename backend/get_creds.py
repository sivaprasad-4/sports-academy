import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "sports_academy_project.settings")
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

print("--- USERS ---")
for user in User.objects.all():
    print(f"Username: {user.username}, Role: {user.role}, Is Active: {user.is_active}")
