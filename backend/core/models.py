import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom User model with role-based access"""
    
    ROLE_CHOICES = [
        ('ADMIN', 'Admin'),
        ('COACH', 'Coach'),
        ('ATHLETE', 'Athlete'),
    ]
    
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='ATHLETE')
    phone = models.CharField(max_length=20, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profiles/', blank=True, null=True)
    
    # Email Verification Fields
    is_email_verified = models.BooleanField(default=False)
    verification_token = models.UUIDField(null=True, blank=True)
    token_created_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    @property
    def is_admin(self):
        return self.role == 'ADMIN'
    
    @property
    def is_coach(self):
        return self.role == 'COACH'
    
    @property
    def is_athlete(self):
        return self.role == 'ATHLETE'


class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_tokens')
    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return f"Reset Token for {self.user.email}"
