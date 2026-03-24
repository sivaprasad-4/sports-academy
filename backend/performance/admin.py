from django.contrib import admin
from .models import PerformanceMetric, TestSession, TestResult


@admin.register(PerformanceMetric)
class PerformanceMetricAdmin(admin.ModelAdmin):
    list_display = ['name', 'sport', 'metric_type', 'unit', 'higher_is_better']
    list_filter = ['sport', 'metric_type']
    search_fields = ['name']


@admin.register(TestSession)
class TestSessionAdmin(admin.ModelAdmin):
    list_display = ['name', 'sport', 'date', 'conducted_by']
    list_filter = ['sport', 'date']
    search_fields = ['name']


@admin.register(TestResult)
class TestResultAdmin(admin.ModelAdmin):
    list_display = ['athlete', 'metric', 'value', 'session', 'recorded_at']
    list_filter = ['metric', 'session__date']
    search_fields = ['athlete__username', 'metric__name']
