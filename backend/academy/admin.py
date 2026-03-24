from django.contrib import admin
from .models import (
    Sport, Batch, AthleteProfile, CoachProfile, Schedule, Attendance,
    Announcement, Fee
)


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ['title', 'batch', 'coach', 'created_at']
    list_filter = ['batch', 'coach', 'created_at']
    search_fields = ['title', 'content']


@admin.register(Fee)
class FeeAdmin(admin.ModelAdmin):
    list_display = ['athlete', 'amount', 'due_date', 'status']
    list_filter = ['status', 'due_date']
    search_fields = ['athlete__username', 'description']


@admin.register(Sport)
class SportAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name']


@admin.register(Batch)
class BatchAdmin(admin.ModelAdmin):
    list_display = ['name', 'sport', 'coach', 'start_time', 'end_time', 'is_active']
    list_filter = ['sport', 'is_active']
    search_fields = ['name']


@admin.register(AthleteProfile)
class AthleteProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'batch', 'enrollment_date', 'is_active']
    list_filter = ['batch', 'is_active']
    search_fields = ['user__username', 'user__first_name', 'user__last_name']


@admin.register(CoachProfile)
class CoachProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'specialization', 'experience_years']
    search_fields = ['user__username', 'user__first_name', 'user__last_name']


@admin.register(Schedule)
class ScheduleAdmin(admin.ModelAdmin):
    list_display = ['batch', 'date', 'start_time', 'end_time', 'is_cancelled']
    list_filter = ['batch', 'is_cancelled', 'date']
    search_fields = ['batch__name', 'topic']


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ['athlete', 'schedule', 'status', 'marked_at']
    list_filter = ['status', 'schedule__date']
    search_fields = ['athlete__username']
