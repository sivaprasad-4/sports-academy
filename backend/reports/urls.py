from django.urls import path
from . import views

urlpatterns = [
    path('attendance/', views.AttendanceReportView.as_view(), name='attendance-report'),
    path('performance/', views.PerformanceReportView.as_view(), name='performance-report'),
    path('receipt/<int:payment_id>/', views.ReceiptView.as_view(), name='receipt-report'),
    path('export/attendance/', views.AthleteAttendanceExportView.as_view(), name='export-my-attendance'),
    path('export/performance/', views.AthletePerformanceExportView.as_view(), name='export-my-performance'),
]
