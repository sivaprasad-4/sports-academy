from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
import uuid
from django.utils import timezone

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 
                  'role', 'phone', 'date_of_birth', 'profile_picture', 
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'password_confirm', 
                  'first_name', 'last_name', 'role', 'phone', 'date_of_birth', 'verification_token']
        read_only_fields = ['verification_token']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Passwords don't match."})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        role = validated_data.get('role', 'ATHLETE')
        if role == 'ADMIN':
            validated_data['is_staff'] = True
            validated_data['is_superuser'] = True
            
        # Mark as verified by default (email is sent at enrollment via EmailJS, not enforced on login)
        validated_data['is_email_verified'] = True
        validated_data['verification_token'] = uuid.uuid4()
        validated_data['token_created_at'] = timezone.now()
        
        user = User.objects.create_user(**validated_data)
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT token serializer with user data"""
    
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add custom claims
        request = self.context.get('request')
        data['user'] = UserSerializer(self.user, context={'request': request}).data
        
        return data
