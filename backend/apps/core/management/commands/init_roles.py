"""
Management command to initialize default roles and permissions
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.core.models import UserRole, ModulePermission

User = get_user_model()

class Command(BaseCommand):
    help = 'Initialize default roles and permissions for the system'

    def handle(self, *args, **options):
        self.stdout.write('Inicializando roles y permisos por defecto...')

        # Crear roles por defecto
        default_roles = [
            {
                'name': 'superusuario',
                'display_name': 'Superusuario',
                'description': 'Acceso completo a todos los módulos y funciones del sistema'
            },
            {
                'name': 'administrador',
                'display_name': 'Administrador',
                'description': 'Gestión de usuarios, reportes y configuración del sistema'
            },
            {
                'name': 'catador',
                'display_name': 'Catador',
                'description': 'Acceso al módulo de catación y evaluación de calidad'
            },
            {
                'name': 'pesador',
                'display_name': 'Pesador',
                'description': 'Acceso a módulos de pesos, integraciones y envíos'
            },
            {
                'name': 'operador',
                'display_name': 'Operador',
                'description': 'Acceso a módulos básicos de producción y operación'
            },
            {
                'name': 'supervisor',
                'display_name': 'Supervisor',
                'description': 'Supervisión de procesos y acceso a reportes'
            },
            {
                'name': 'invitado',
                'display_name': 'Invitado',
                'description': 'Acceso de solo lectura a módulos básicos'
            }
        ]

        created_roles = []
        for role_data in default_roles:
            role, created = UserRole.objects.get_or_create(
                name=role_data['name'],
                defaults=role_data
            )
            if created:
                created_roles.append(role)
                self.stdout.write(f'✓ Rol creado: {role.display_name}')

        # Definir permisos por rol
        role_permissions = {
            'superusuario': {
                module: ['view', 'create', 'edit', 'delete', 'export', 'admin']
                for module, _ in ModulePermission.MODULE_CHOICES
            },
            'administrador': {
                'dashboard': ['view', 'admin'],
                'usuarios': ['view', 'create', 'edit', 'delete', 'admin'],
                'empleados': ['view', 'create', 'edit', 'delete'],
                'proveedores': ['view', 'create', 'edit', 'delete'],
                'reportes': ['view', 'create', 'edit', 'export', 'admin'],
                'logs': ['view', 'export'],
                'configuracion': ['view', 'edit', 'admin']
            },
            'catador': {
                'dashboard': ['view'],
                'catacion': ['view', 'create', 'edit'],
                'reportes': ['view', 'export']
            },
            'pesador': {
                'dashboard': ['view'],
                'integracion_lotes': ['view', 'create', 'edit'],
                'pesos_envio': ['view', 'create', 'edit'],
                'reportes': ['view', 'export']
            },
            'operador': {
                'dashboard': ['view'],
                'temperaturas': ['view'],
                'fermentacion': ['view', 'edit'],
                'ocupacion': ['view', 'edit']
            },
            'supervisor': {
                'dashboard': ['view', 'admin'],
                'usuarios': ['view'],
                'empleados': ['view'],
                'proveedores': ['view'],
                'catacion': ['view'],
                'integracion_lotes': ['view'],
                'pesos_envio': ['view'],
                'temperaturas': ['view'],
                'fermentacion': ['view'],
                'ocupacion': ['view'],
                'reportes': ['view', 'export']
            },
            'invitado': {
                'dashboard': ['view'],
                'temperaturas': ['view'],
                'fermentacion': ['view'],
                'ocupacion': ['view']
            }
        }

        created_permissions = 0
        for role_name, module_perms in role_permissions.items():
            try:
                role = UserRole.objects.get(name=role_name)
                for module, perms in module_perms.items():
                    for permission in perms:
                        perm, created = ModulePermission.objects.get_or_create(
                            role=role,
                            module=module,
                            permission=permission,
                            defaults={'is_granted': True}
                        )
                        if created:
                            created_permissions += 1
            except UserRole.DoesNotExist:
                continue

        self.stdout.write(
            self.style.SUCCESS(
                f'✓ Inicialización completada: {len(created_roles)} roles, {created_permissions} permisos creados'
            )
        )
