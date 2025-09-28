from django.urls import path
from . import views

urlpatterns = [
    path('', views.EmployeeListCreateView.as_view(), name='employee-list'),
    path('<int:pk>/', views.EmployeeDetailView.as_view(), name='employee-detail'),
    path('shifts/', views.ShiftListCreateView.as_view(), name='shift-list'),
    path('shifts/<int:pk>/', views.ShiftDetailView.as_view(), name='shift-detail'),
    path('assignments/', views.ShiftAssignmentListCreateView.as_view(), name='shift-assignment-list'),
]
