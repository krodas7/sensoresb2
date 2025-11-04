"""
URLs for core app - Sistema limpio sin sensores
"""

from django.urls import path
from . import views
from . import backup_views
from . import advanced_dashboard_views
from . import health_checks

urlpatterns = [
    # Authentication
    path('auth/login/', views.login, name='login'),
    path('auth/logout/', views.logout, name='logout'),
    path('auth/refresh/', views.refresh_token, name='refresh'),
    path('auth/me/', views.me, name='me'),
    
    # Health checks (múltiples niveles)
    path('health/', health_checks.health_check, name='health'),
    path('health/detailed/', health_checks.detailed_health, name='health-detailed'),
    path('readiness/', health_checks.readiness_check, name='readiness'),
    path('liveness/', health_checks.liveness_check, name='liveness'),
    path('metrics/', health_checks.metrics, name='metrics'),
    
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
    
    # Dashboard
    path('dashboard-stats/', views.dashboard_stats, name='dashboard-stats'),
    path('advanced-dashboard/', views.advanced_dashboard_view, name='advanced-dashboard'),
    
    
    # Dashboard Avanzado
    path('dashboard/production/', advanced_dashboard_views.production_metrics, name='production-metrics'),
    path('dashboard/quality/', advanced_dashboard_views.quality_metrics, name='quality-metrics'),
    path('dashboard/operational/', advanced_dashboard_views.operational_metrics, name='operational-metrics'),
    path('dashboard/equipment/', advanced_dashboard_views.equipment_metrics, name='equipment-metrics'),
    path('dashboard/alerts/', advanced_dashboard_views.alerts_metrics, name='alerts-metrics'),
    path('dashboard/comprehensive/', advanced_dashboard_views.comprehensive_dashboard, name='comprehensive-dashboard'),
    path('dashboard/kpi-summary/', advanced_dashboard_views.kpi_summary, name='kpi-summary'),
    
    # Backup system
    path('backup/records/', backup_views.BackupRecordViewSet.as_view({'get': 'list', 'post': 'create'}), name='backup-record-list'),
    path('backup/records/<int:pk>/', backup_views.BackupRecordViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='backup-record-detail'),
    path('backup/records/backup_database/', backup_views.BackupRecordViewSet.as_view({'post': 'backup_database'}), name='backup-database'),
    path('backup/records/backup_media/', backup_views.BackupRecordViewSet.as_view({'post': 'backup_media'}), name='backup-media'),
    path('backup/records/backup_full/', backup_views.BackupRecordViewSet.as_view({'post': 'backup_full'}), name='backup-full'),
    path('backup/records/stats/', backup_views.BackupRecordViewSet.as_view({'get': 'stats'}), name='backup-stats'),
    path('backup/records/<int:pk>/download/', backup_views.BackupRecordViewSet.as_view({'get': 'download'}), name='backup-download'),
    
    path('backup/schedules/', backup_views.BackupScheduleViewSet.as_view({'get': 'list', 'post': 'create'}), name='backup-schedule-list'),
    path('backup/schedules/<int:pk>/', backup_views.BackupScheduleViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='backup-schedule-detail'),
    path('backup/schedules/<int:pk>/test_run/', backup_views.BackupScheduleViewSet.as_view({'post': 'test_run'}), name='backup-schedule-test'),
    
    path('backup/task-status/<str:task_id>/', backup_views.backup_task_status, name='backup-task-status'),
]