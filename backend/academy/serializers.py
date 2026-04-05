from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Sport, Batch, AthleteProfile, CoachProfile, Schedule, Attendance, Notification, Announcement, AthleteFeedback, Fee, FeeStructure
from core.serializers import UserSerializer, RegisterSerializer

User = get_user_model()


class SportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sport
        fields = '__all__'


class BatchSerializer(serializers.ModelSerializer):
    sport_name = serializers.CharField(source='sport.name', read_only=True)
    coach_name = serializers.CharField(source='coach.get_full_name', read_only=True)
    athlete_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Batch
        fields = '__all__'
    
    def get_athlete_count(self, obj):
        return obj.athletes.count()


class AthleteProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_data = serializers.DictField(write_only=True, required=False)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), 
        source='user', 
        write_only=True, 
        required=False
    )
    batch_name = serializers.CharField(source='batch.name', read_only=True)
    sport_name = serializers.CharField(source='batch.sport.name', read_only=True)
    
    class Meta:
        model = AthleteProfile
        fields = '__all__'

    def validate_user_data(self, value):
        if not value:
            return value
        
        username = value.get('username')
        email = value.get('email')
        
        # Check uniqueness manually, ignoring current user if updating
        user_instance = self.instance.user if self.instance else None
        
        if username:
            qs = User.objects.filter(username=username)
            if user_instance:
                qs = qs.exclude(pk=user_instance.pk)
            if qs.exists():
                raise serializers.ValidationError({"username": "A user with that username already exists."})
                
        if email:
            qs = User.objects.filter(email=email)
            if user_instance:
                qs = qs.exclude(pk=user_instance.pk)
            if qs.exists():
                raise serializers.ValidationError({"email": "A user with that email already exists."})
        
        return value

    def create(self, validated_data):
        user_data = validated_data.pop('user_data', None)
        
        if user_data:
            # Create user first and associate it
            user_data['role'] = 'ATHLETE'
            password = user_data.pop('password', None)
            user_data.pop('password_confirm', None)
            if not password:
                raise serializers.ValidationError({"password": "Password is required for new users."})
            
            # Clean up user_data
            for key, value in user_data.items():
                if value == "":
                    user_data[key] = None
            
            user_instance = User.objects.create_user(password=password, **user_data)
            validated_data['user'] = user_instance
            
        # Only clean up validated_data for fields that are actually nullable
        nullable_fields = ['batch', 'height', 'weight']
        for key in nullable_fields:
            if key in validated_data and validated_data[key] == "":
                validated_data[key] = None
                
        return super().create(validated_data)

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user_data', None)
        if user_data:
            user_instance = instance.user
            user_data.pop('password', None)
            user_data.pop('password_confirm', None)
            
            for attr, value in user_data.items():
                if value == "":
                    # Only convert to None for fields that are nullable in the database
                    if attr == 'date_of_birth':
                        value = None
                setattr(user_instance, attr, value)
            user_instance.save()
            
        # Only clean up validated_data for fields that are actually nullable
        nullable_fields = ['height', 'weight', 'batch']
        for key in nullable_fields:
            if key in validated_data and validated_data[key] == "":
                validated_data[key] = None
                 
        return super().update(instance, validated_data)


class CoachProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_data = serializers.DictField(write_only=True, required=False)
    user_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = CoachProfile
        fields = '__all__'
    
    def validate_user_data(self, value):
        if not value:
            return value
        
        username = value.get('username')
        email = value.get('email')
        
        user_instance = self.instance.user if self.instance else None
        
        if username:
            qs = User.objects.filter(username=username)
            if user_instance:
                qs = qs.exclude(pk=user_instance.pk)
            if qs.exists():
                raise serializers.ValidationError({"username": "A user with that username already exists."})
                
        if email:
            qs = User.objects.filter(email=email)
            if user_instance:
                qs = qs.exclude(pk=user_instance.pk)
            if qs.exists():
                raise serializers.ValidationError({"email": "A user with that email already exists."})
        
        return value

    def create(self, validated_data):
        user_data = validated_data.pop('user_data', None)
        user_id = validated_data.pop('user_id', None)
        
        if user_data:
            user_data['role'] = 'COACH'
            password = user_data.pop('password', None)
            user_data.pop('password_confirm', None)
            if not password:
                 raise serializers.ValidationError({"password": "Password is required for new users."})
                 
            for key, value in user_data.items():
                if value == "":
                    user_data[key] = None
                    
            user = User.objects.create_user(password=password, **user_data)
            validated_data['user'] = user
        elif user_id:
            validated_data['user_id'] = user_id
            
        # No specific nullable fields for CoachProfile beyond 'user' (handled by user_data).
                
        return super().create(validated_data)

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user_data', None)
        if user_data:
            user_instance = instance.user
            user_data.pop('password', None)
            user_data.pop('password_confirm', None)
            for attr, value in user_data.items():
                if value == "":
                    value = None
                setattr(user_instance, attr, value)
            user_instance.save()
            
        # No specific nullable fields for CoachProfile beyond 'user' (handled by user_data).
                
        return super().update(instance, validated_data)


class ScheduleSerializer(serializers.ModelSerializer):
    batch_name = serializers.CharField(source='batch.name', read_only=True)
    session_type = serializers.CharField(source='batch.session_type', read_only=True)
    coach_name = serializers.CharField(source='coach.get_full_name', read_only=True)
    attendance_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Schedule
        fields = '__all__'
    
    def get_attendance_count(self, obj):
        return obj.attendances.filter(status='PRESENT').count()


class AttendanceSerializer(serializers.ModelSerializer):
    athlete_name = serializers.CharField(source='athlete.get_full_name', read_only=True)
    schedule_date = serializers.DateField(source='schedule.date', read_only=True)
    schedule_topic = serializers.CharField(source='schedule.topic', read_only=True)
    schedule_start_time = serializers.TimeField(source='schedule.start_time', read_only=True)
    
    class Meta:
        model = Attendance
        fields = '__all__'


class AttendanceStatsSerializer(serializers.Serializer):
    """Serializer for attendance statistics"""
    total_sessions = serializers.IntegerField()
    present = serializers.IntegerField()
    absent = serializers.IntegerField()
    late = serializers.IntegerField()
    excused = serializers.IntegerField()
    attendance_percentage = serializers.FloatField()


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ['user', 'created_at']


class AnnouncementSerializer(serializers.ModelSerializer):
    batch_name = serializers.CharField(source='batch.name', read_only=True)
    coach_name = serializers.SerializerMethodField()
    target_coach_name = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Announcement
        fields = '__all__'
        read_only_fields = ['coach', 'created_by', 'created_at']

    def get_coach_name(self, obj):
        if obj.coach:
            return obj.coach.get_full_name() or obj.coach.username
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return 'Admin'

    def get_target_coach_name(self, obj):
        if obj.target_coach:
            return obj.target_coach.get_full_name() or obj.target_coach.username
        return None

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return 'Unknown'

class AthleteFeedbackSerializer(serializers.ModelSerializer):
    athlete_name = serializers.CharField(source='athlete.get_full_name', read_only=True)
    coach_name = serializers.CharField(source='coach.get_full_name', read_only=True)

    class Meta:
        model = AthleteFeedback
        fields = '__all__'
        read_only_fields = ['coach', 'created_at']


class FeeStructureSerializer(serializers.ModelSerializer):
    sport_name = serializers.CharField(source='sport.name', read_only=True)
    batch_name = serializers.CharField(source='batch.name', read_only=True)

    class Meta:
        model = FeeStructure
        fields = '__all__'


class FeeSerializer(serializers.ModelSerializer):
    athlete_name = serializers.CharField(source='athlete.get_full_name', read_only=True)
    fee_structure_data = FeeStructureSerializer(source='fee_structure', read_only=True)
    paid_amount = serializers.SerializerMethodField()
    balance = serializers.SerializerMethodField()

    class Meta:
        model = Fee
        fields = '__all__'
        read_only_fields = ['created_at']

    def get_paid_amount(self, obj):
        from payments.models import Payment
        successful_payments = obj.payments.filter(status='SUCCESS')
        total_paid = sum(p.amount for p in successful_payments)
        return total_paid

    def get_balance(self, obj):
        paid = self.get_paid_amount(obj)
        return obj.amount - paid
