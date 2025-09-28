"""
URLs for core app - Sistema limpio sin sensores
"""

from django.urls import path
from . import views

urlpatterns = [
    # Authentication
    path('auth/login/', views.login, name='login'),
    path('auth/logout/', views.logout, name='logout'),
    path('auth/refresh/', views.refresh_token, name='refresh'),
    path('auth/me/', views.me, name='me'),
    
    # Health check
    path('health/', views.health_check, name='health'),
    
    # Users
    path('users/', views.UserListCreateView.as_view(), name='user-list'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),
    
    # Parameters
    path('parameters/', views.ParameterListCreateView.as_view(), name='parameter-list'),
    path('parameters/<int:pk>/', views.ParameterDetailView.as_view(), name='parameter-detail'),
    
    # Events
    path('events/', views.EventListView.as_view(), name='event-list'),
    
    # Alerts
    path('alerts/', views.AlertListCreateView.as_view(), name='alert-list'),
    path('alerts/<int:pk>/', views.AlertDetailView.as_view(), name='alert-detail'),
    
    # Role and Permission Management
    path('roles/', views.UserRoleListCreateView.as_view(), name='role-list'),
    path('roles/<int:pk>/', views.UserRoleDetailView.as_view(), name='role-detail'),
    
    path('permissions/', views.ModulePermissionListCreateView.as_view(), name='permission-list'),
    path('permissions/<int:pk>/', views.ModulePermissionDetailView.as_view(), name='permission-detail'),
    
    path('profiles/', views.UserProfileListCreateView.as_view(), name='profile-list'),
    path('profiles/<int:pk>/', views.UserProfileDetailView.as_view(), name='profile-detail'),
    
    # Permission utilities
    path('users/<int:user_id>/permissions/', views.get_user_permissions, name='user-permissions'),
    path('users/<int:user_id>/check-permission/', views.check_user_permission, name='check-permission'),
    path('initialize-roles/', views.initialize_default_roles, name='initialize-roles'),
]