from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SportViewSet, BatchViewSet, AthleteProfileViewSet,
    CoachProfileViewSet, ScheduleViewSet, AttendanceViewSet, NotificationViewSet,
    AnnouncementViewSet, AthleteFeedbackViewSet, FeeViewSet, FeeStructureViewSet
)

router = DefaultRouter()
router.register(r'sports', SportViewSet)
router.register(r'batches', BatchViewSet)
router.register(r'athletes', AthleteProfileViewSet)
router.register(r'coaches', CoachProfileViewSet)
router.register(r'schedules', ScheduleViewSet)
router.register(r'attendance', AttendanceViewSet)
router.register(r'notifications', NotificationViewSet, basename='notifications')
router.register(r'announcements', AnnouncementViewSet)
router.register(r'athlete-feedback', AthleteFeedbackViewSet)
router.register(r'fee-structures', FeeStructureViewSet)
router.register(r'fees', FeeViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
