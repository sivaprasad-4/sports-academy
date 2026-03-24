from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PerformanceMetricViewSet, TestSessionViewSet, TestResultViewSet

router = DefaultRouter()
router.register(r'metrics', PerformanceMetricViewSet)
router.register(r'sessions', TestSessionViewSet)
router.register(r'results', TestResultViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
