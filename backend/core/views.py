from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.utils import timezone
import uuid
import datetime
from .models import PasswordResetToken
from .serializers import UserSerializer, RegisterSerializer, CustomTokenObtainPairSerializer

from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """User registration endpoint"""
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom login view with user data"""
    serializer_class = CustomTokenObtainPairSerializer


class UserProfileView(APIView):
    """Get and update user profile"""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get(self, request):
        serializer = UserSerializer(request.user, context={'request': request})
        return Response(serializer.data)
    
    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserListView(generics.ListAPIView):
    """List all users (Admin only)"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if not self.request.user.is_admin:
            return User.objects.filter(id=self.request.user.id)
        return User.objects.all()

class VerifyEmailView(APIView):
    """Verify user email using token"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        token = request.query_params.get('token')
        
        if not token:
            return Response({'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            # Look up user by token
            user = User.objects.get(verification_token=token)
            
            # Check expiration (24 hours)
            expiration_time = user.token_created_at + datetime.timedelta(hours=24)
            if timezone.now() > expiration_time:
                return Response({'error': 'Token has expired'}, status=status.HTTP_400_BAD_REQUEST)
                
            # Valid token - verify email
            user.is_email_verified = True
            user.verification_token = None
            user.token_created_at = None
            user.save()
            
            return Response({'message': 'Email verified successfully'}, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({'error': 'Invalid token format'}, status=status.HTTP_400_BAD_REQUEST)


class ResendVerificationView(APIView):
    """Resend email verification token"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            user = User.objects.get(email=email)
            
            # If already verified, do nothing but return success to avoid leaking intel
            if user.is_email_verified:
                return Response({'message': 'If the email exists, a verification link has been sent.'}, status=status.HTTP_200_OK)
                
            # Generate new token
            user.verification_token = uuid.uuid4()
            user.token_created_at = timezone.now()
            user.save()
            
            # Return new token for frontend to send via EmailJS
            return Response({
                'message': 'Verification token generated successfully',
                'token': str(user.verification_token)
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            # Return same message to prevent email enumeration
            return Response({'message': 'If the email exists, a verification link has been sent.'}, status=status.HTTP_200_OK)


class ForgotPasswordView(APIView):
    """Initiate password reset flow by identifying user by username"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        if not username:
            return Response({'error': 'Network ID (Username) is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(username=username)
            
            # Invalidate any existing unused tokens for this user
            PasswordResetToken.objects.filter(user=user, is_used=False).update(is_used=True)
            
            # Generate new token
            reset_token = PasswordResetToken.objects.create(user=user)
            
            return Response({
                'message': 'Password reset token generated successfully',
                'token': str(reset_token.token),
                'email': user.email  # Return email so frontend can send the link
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            # Fail silently or generic success to prevent enumeration if desired
            # But for "Forgot Password", usually we want to be helpful if it's a known username
            return Response({
                'message': 'If this Network ID exists, a reset link will be sent to the registered email.'
            }, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    """Complete password reset flow using token"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token_str = request.data.get('token')
        new_password = request.data.get('new_password')
        
        if not token_str or not new_password:
            return Response({'error': 'Token and new password are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Validate token UUID format implicitly during get
            reset_token = PasswordResetToken.objects.get(token=token_str, is_used=False)
            
            # Check 15-minute expiration bounds
            expiration_time = reset_token.created_at + datetime.timedelta(minutes=15)
            if timezone.now() > expiration_time:
                return Response({'error': 'Token has expired'}, status=status.HTTP_400_BAD_REQUEST)
                
            # Perform atomic password replacement
            user = reset_token.user
            user.set_password(new_password)
            user.save()
            
            # Seal the token securely
            reset_token.is_used = True
            reset_token.save()
            
            return Response({'message': 'Password has been reset successfully'}, status=status.HTTP_200_OK)
            
        except (PasswordResetToken.DoesNotExist, ValueError):
            return Response({'error': 'Invalid or expired token'}, status=status.HTTP_400_BAD_REQUEST)
