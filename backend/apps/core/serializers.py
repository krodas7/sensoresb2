"""
Serializers for core models
"""

from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, Parameter, Event, Alert, UserRole, ModulePermission, UserProfile


class UserSerializer(serializers.ModelSerializer):
    """User serializer"""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'status', 
                 'is_active', 'is_verified', 'last_login', 'date_joined']
        read_only_fields = ['id', 'last_login', 'date_joined']


class UserCreateSerializer(serializers.ModelSerializer):
    """User creation serializer"""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'password', 'password_confirm', 'role']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Las contraseñas no coinciden")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    """Login serializer"""
    username = serializers.CharField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Credenciales inválidas')
            if not user.is_active:
                raise serializers.ValidationError('Usuario inactivo')
            attrs['user'] = user
        else:
            raise serializers.ValidationError('Debe incluir usuario y contraseña')
        
        return attrs


class ParameterSerializer(serializers.ModelSerializer):
    """Parameter serializer"""
    
    class Meta:
        model = Parameter
        fields = ['id', 'key', 'value_json', 'description', 'category', 
                 'param_type', 'is_sensitive', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class EventSerializer(serializers.ModelSerializer):
    """Event serializer"""
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = Event
        fields = ['id', 'timestamp', 'event_type', 'payload_json', 'severity', 
                 'user_email', 'ip_address', 'user_agent']
        read_only_fields = ['id', 'timestamp']


class AlertSerializer(serializers.ModelSerializer):
    """Alert serializer"""
    
    class Meta:
        model = Alert
        fields = ['id', 'alert_type', 'rule', 'destination', 'is_active', 
                 'severity', 'status', 'description', 'conditions', 
                 'cooldown_minutes', 'last_triggered', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_triggered']


class UserRoleSerializer(serializers.ModelSerializer):
    """UserRole serializer"""
    
    class Meta:
        model = UserRole
        fields = ['id', 'name', 'display_name', 'description', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ModulePermissionSerializer(serializers.ModelSerializer):
    """ModulePermission serializer"""
    role_name = serializers.CharField(source='role.display_name', read_only=True)
    
    class Meta:
        model = ModulePermission
        fields = ['id', 'module', 'permission', 'role', 'role_name', 'is_granted', 'created_at']
        read_only_fields = ['id', 'created_at']


class UserProfileSerializer(serializers.ModelSerializer):
    """UserProfile serializer"""
    user_data = UserSerializer(source='user', read_only=True)
    role_data = UserRoleSerializer(source='role', read_only=True)
    accessible_modules = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'user_data', 'role', 'role_data', 'is_active', 
                 'last_login_ip', 'notes', 'accessible_modules', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'accessible_modules']
    
    def get_accessible_modules(self, obj):
        """Get accessible modules for the user"""
        return obj.get_accessible_modules()


class UserWithPermissionsSerializer(serializers.ModelSerializer):
    """Enhanced User serializer with permissions"""
    profile = UserProfileSerializer(read_only=True)
    permissions = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'status', 
                 'is_active', 'is_verified', 'last_login', 'date_joined', 'profile', 'permissions']
        read_only_fields = ['id', 'last_login', 'date_joined', 'profile', 'permissions']
    
    def get_permissions(self, obj):
        """Get user permissions"""
        if hasattr(obj, 'profile') and obj.profile:
            return {
                'accessible_modules': obj.profile.get_accessible_modules(),
                'role': obj.profile.role.display_name if obj.profile.role else None
            }
        return {'accessible_modules': [], 'role': None}


# Import backup serializers
from .backup_serializers import BackupRecordSerializer, BackupScheduleSerializer
