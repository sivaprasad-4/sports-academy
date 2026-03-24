from django.db import models
from django.conf import settings


class Sport(models.Model):
    """Sports categories"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Batch(models.Model):
    """Training batches"""
    SESSION_CHOICES = [
        ('MORNING', 'Morning'),
        ('EVENING', 'Evening'),
    ]
    name = models.CharField(max_length=100)
    sport = models.ForeignKey(Sport, on_delete=models.CASCADE, related_name='batches')
    coach = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='coached_batches',
        limit_choices_to={'role': 'COACH'}
    )
    session_type = models.CharField(
        max_length=10, 
        choices=SESSION_CHOICES, 
        default='MORNING'
    )
    start_time = models.TimeField()
    end_time = models.TimeField()
    days_of_week = models.CharField(max_length=50, help_text="e.g., Mon,Wed,Fri")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Batches'
    
    def __str__(self):
        return f"{self.name} - {self.sport.name} ({self.get_session_type_display()})"


class AthleteProfile(models.Model):
    """Extended profile for athletes"""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='athlete_profile',
        limit_choices_to={'role': 'ATHLETE'}
    )
    batch = models.ForeignKey(Batch, on_delete=models.SET_NULL, null=True, blank=True, related_name='athletes')
    height = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="in cm")
    weight = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="in kg")
    emergency_contact = models.CharField(max_length=100, blank=True)
    medical_notes = models.TextField(blank=True)
    enrollment_date = models.DateField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.batch.name if self.batch else 'No Batch'}"


class CoachProfile(models.Model):
    """Extended profile for coaches"""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='coach_profile',
        limit_choices_to={'role': 'COACH'}
    )
    specialization = models.CharField(max_length=100, blank=True)
    experience_years = models.PositiveIntegerField(default=0)
    certifications = models.TextField(blank=True)
    
    def __str__(self):
        return f"Coach {self.user.get_full_name()}"


class Schedule(models.Model):
    """Training schedule"""
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='schedules')
    coach = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='scheduled_sessions',
        limit_choices_to={'role': 'COACH'}
    )
    date = models.DateField(db_index=True)
    start_time = models.TimeField()
    end_time = models.TimeField()
    topic = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True)
    is_cancelled = models.BooleanField(default=False)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-date', '-start_time']
        unique_together = ['batch', 'date', 'start_time']
    
    def __str__(self):
        return f"{self.batch.name} - {self.date}"


class Attendance(models.Model):
    """Session attendance tracking"""
    schedule = models.ForeignKey(Schedule, on_delete=models.CASCADE, related_name='attendances')
    athlete = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='attendances',
        limit_choices_to={'role': 'ATHLETE'}
    )
    status = models.CharField(
        max_length=10,
        choices=[
            ('PRESENT', 'Present'),
            ('ABSENT', 'Absent'),
            ('LATE', 'Late'),
            ('EXCUSED', 'Excused'),
        ],
        default='ABSENT'
    )
    marked_at = models.DateTimeField(auto_now=True)
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-schedule__date']
        unique_together = ['schedule', 'athlete']
    
    def __str__(self):
        return f"{self.athlete.username} - {self.schedule.date} - {self.status}"


class Notification(models.Model):
    """User notifications"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    link = models.CharField(max_length=200, blank=True)
    
    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.title}"


class Announcement(models.Model):
    """Announcements for batches or global by coaches/admin"""
    AUDIENCE_CHOICES = [
        ('ATHLETES', 'Athletes'),
        ('COACHES', 'Coaches'),
        ('ALL', 'Everyone'),
    ]

    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, null=True, blank=True, related_name='announcements')
    coach = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='announcements',
        limit_choices_to={'role': 'COACH'}
    )
    # Who created this announcement (admin or coach)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_announcements',
        null=True,
        blank=True,
    )
    target_audience = models.CharField(
        max_length=10,
        choices=AUDIENCE_CHOICES,
        default='ATHLETES',
    )
    # If set, only this coach receives the announcement (when target_audience=COACHES)
    target_coach = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='received_announcements',
        limit_choices_to={'role': 'COACH'}
    )
    title = models.CharField(max_length=200)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.batch.name if self.batch else 'Global'}"


class AthleteFeedback(models.Model):
    """Direct feedback and training instructions for athletes from coaches"""
    athlete = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='feedback_received',
        limit_choices_to={'role': 'ATHLETE'}
    )
    coach = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='feedback_given',
        limit_choices_to={'role': 'COACH'}
    )
    content = models.TextField()
    is_training_instruction = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Athlete Feedback'

    def __str__(self):
        return f"To {self.athlete.username} by {self.coach.username} on {self.created_at.date()}"


class FeeStructure(models.Model):
    """Template for fee plans per sport/batch"""
    PAYMENT_TYPE_CHOICES = [
        ('MONTHLY', 'Monthly'),
        ('QUARTERLY', 'Quarterly'),
        ('YEARLY', 'Yearly'),
    ]
    sport = models.ForeignKey(Sport, on_delete=models.CASCADE, related_name='fee_structures')
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, null=True, blank=True, related_name='fee_structures')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_type = models.CharField(max_length=10, choices=PAYMENT_TYPE_CHOICES, default='MONTHLY')
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['sport', 'batch']

    def __str__(self):
        scope = self.batch.name if self.batch else "All Batches"
        return f"{self.sport.name} ({scope}) - {self.amount}"


class Fee(models.Model):
    """Fee management for athletes"""
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PAID', 'Paid'),
        ('OVERDUE', 'Overdue'),
    ]
    athlete = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='fees',
        limit_choices_to={'role': 'ATHLETE'}
    )
    fee_structure = models.ForeignKey(
        FeeStructure, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='assigned_fees'
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    due_date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-due_date']

    def __str__(self):
        return f"{self.athlete.username} - {self.amount} - {self.status}"
