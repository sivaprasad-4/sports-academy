from django.db import models
from django.conf import settings
from academy.models import Sport


class PerformanceMetric(models.Model):
    """Definition of performance tests/metrics"""
    name = models.CharField(max_length=100)
    sport = models.ForeignKey(Sport, on_delete=models.CASCADE, related_name='metrics', null=True, blank=True)
    description = models.TextField(blank=True)
    unit = models.CharField(max_length=50, help_text="e.g., seconds, meters, points")
    metric_type = models.CharField(
        max_length=20,
        choices=[
            ('SPEED', 'Speed'),
            ('ENDURANCE', 'Endurance'),
            ('STRENGTH', 'Strength'),
            ('SKILL', 'Skill Rating'),
            ('OTHER', 'Other'),
        ],
        default='OTHER'
    )
    higher_is_better = models.BooleanField(default=True, help_text="True if higher values are better")
    weight_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=100.0,
        help_text="Weight of this metric in overall performance index (0-100)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['sport', 'name']
        unique_together = ['sport', 'name']
    
    def __str__(self):
        return f"{self.sport.name} - {self.name}"


class TestSession(models.Model):
    """Performance testing session"""
    name = models.CharField(max_length=200)
    sport = models.ForeignKey(Sport, on_delete=models.CASCADE, related_name='test_sessions')
    conducted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='conducted_sessions',
        limit_choices_to={'role': 'COACH'}
    )
    date = models.DateField(db_index=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.name} - {self.date}"


class TestResult(models.Model):
    """Individual athlete performance test result"""
    session = models.ForeignKey(TestSession, on_delete=models.CASCADE, related_name='results')
    athlete = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='test_results',
        limit_choices_to={'role': 'ATHLETE'}
    )
    metric = models.ForeignKey(PerformanceMetric, on_delete=models.CASCADE, related_name='results')
    value = models.DecimalField(max_digits=10, decimal_places=2)
    notes = models.TextField(blank=True)
    recorded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-session__date']
    
    def __str__(self):
        return f"{self.athlete.username} - {self.metric.name}: {self.value} {self.metric.unit}"


class PerformanceSummary(models.Model):
    """Calculated performance index per athlete per sport"""
    athlete = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='performance_summaries',
        limit_choices_to={'role': 'ATHLETE'}
    )
    sport = models.ForeignKey(Sport, on_delete=models.CASCADE, related_name='performance_summaries')
    performance_index = models.DecimalField(
        max_digits=6, decimal_places=2, default=0.0,
        help_text="Weighted overall performance score (0-100)"
    )
    rank_in_batch = models.IntegerField(
        null=True, blank=True,
        help_text="Athlete's rank within their batch for this sport"
    )
    calculated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-performance_index']
        unique_together = ['athlete', 'sport']

    def __str__(self):
        return f"{self.athlete.username} - {self.sport.name}: {self.performance_index}"
