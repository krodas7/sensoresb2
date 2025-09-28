from django.urls import path
from . import views

urlpatterns = [
    path('', views.AttendanceRecordListCreateView.as_view(), name='attendance-list'),
    path('records/', views.AttendanceRecordListCreateView.as_view(), name='attendance-records'),
    path('department/', views.DepartmentAttendanceView, name='department-attendance'),
]
