#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'beneficio.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.core.models import UserRole, UserProfile

User = get_user_model()

try:
    admin_user = User.objects.get(username='admin')
    print(f"Usuario encontrado: {admin_user.username}")
    
    # Obtener rol de superusuario
    superusuario_role = UserRole.objects.get(name='superusuario')
    print(f"Rol encontrado: {superusuario_role.display_name}")
    
    # Crear o actualizar perfil
    profile, created = UserProfile.objects.get_or_create(
        user=admin_user,
        defaults={'role': superusuario_role, 'is_active': True}
    )
    
    if not created:
        profile.role = superusuario_role
        profile.is_active = True
        profile.save()
    
    print(f'Perfil {"creado" if created else "actualizado"} para {admin_user.username}')
    print(f'Rol asignado: {profile.role.display_name}')
    print(f'Módulos accesibles: {profile.get_accessible_modules()}')
    
except User.DoesNotExist:
    print("Usuario 'admin' no encontrado")
except UserRole.DoesNotExist:
    print("Rol 'superusuario' no encontrado")
except Exception as e:
    print(f"Error: {e}")
