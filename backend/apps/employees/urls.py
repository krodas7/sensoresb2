from django.urls import path
from . import views

urlpatterns = [
    # Supervisors
    path('supervisors/', views.SupervisorListCreateView.as_view(), name='supervisor-list'),
    path('supervisors/<int:pk>/', views.SupervisorDetailView.as_view(), name='supervisor-detail'),
    
    # Employees
    path('', views.EmployeeListCreateView.as_view(), name='employee-list'),
    path('<int:pk>/', views.EmployeeDetailView.as_view(), name='employee-detail'),
    
    # Shifts
    path('shifts/', views.ShiftListCreateView.as_view(), name='shift-list'),
    path('shifts/<int:pk>/', views.ShiftListCreateView.as_view(), name='shift-detail'),
    path('assignments/', views.ShiftAssignmentListCreateView.as_view(), name='shift-assignment-list'),
    
    # Active supervisor
    path('active-supervisor/', views.active_supervisor, name='active-supervisor'),
]
