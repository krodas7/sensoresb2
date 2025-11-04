from django.urls import path
from . import views

urlpatterns = [
    path('', views.AttendanceRecordListCreateView.as_view(), name='attendance-list'),
    path('records/', views.AttendanceRecordListCreateView.as_view(), name='attendance-records'),
    path('department/', views.DepartmentAttendanceView, name='department-attendance'),
    
    # Nuevos endpoints para cálculo de horas
    path('employee/<int:employee_id>/hours/', views.employee_worked_hours, name='employee-worked-hours'),
    path('employee/<int:employee_id>/summary/', views.employee_attendance_summary, name='employee-attendance-summary'),
    path('daily-summary/', views.daily_attendance_summary, name='daily-attendance-summary'),
]
