"""
Vistas para el sistema de backup
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.admin.views.decorators import staff_member_required
from django.utils.decorators import method_decorator
from django.http import JsonResponse, FileResponse
from django.conf import settings
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from .backup_service import BackupService, backup_database_task, backup_media_task, full_backup_task
from .backup_models import BackupRecord, BackupSchedule
from .serializers import BackupRecordSerializer, BackupScheduleSerializer


class BackupRecordViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar registros de backup"""
    queryset = BackupRecord.objects.all()
    serializer_class = BackupRecordSerializer
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        tags=['Backup'],
        summary='Iniciar backup de base de datos',
        description='Inicia un backup manual de la base de datos',
        responses={
            200: OpenApiTypes.OBJECT,
            500: OpenApiTypes.OBJECT
        }
    )
    @action(detail=False, methods=['post'])
    def backup_database(self, request):
        """Iniciar backup de base de datos"""
        try:
            # Crear registro de backup
            backup_record = BackupRecord.objects.create(
                backup_type='database',
                status='running',
                initiated_by=request.user
            )
            
            # Iniciar tarea asíncrona
            task = backup_database_task.delay()
            backup_record.task_id = task.id
            backup_record.save()
            
            return Response({
                'success': True,
                'message': 'Backup de base de datos iniciado',
                'task_id': task.id,
                'backup_record_id': backup_record.id
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @extend_schema(
        tags=['Backup'],
        summary='Iniciar backup de archivos media',
        description='Inicia un backup manual de archivos media',
        responses={
            200: OpenApiTypes.OBJECT,
            500: OpenApiTypes.OBJECT
        }
    )
    @action(detail=False, methods=['post'])
    def backup_media(self, request):
        """Iniciar backup de archivos media"""
        try:
            # Crear registro de backup
            backup_record = BackupRecord.objects.create(
                backup_type='media',
                status='running',
                initiated_by=request.user
            )
            
            # Iniciar tarea asíncrona
            task = backup_media_task.delay()
            backup_record.task_id = task.id
            backup_record.save()
            
            return Response({
                'success': True,
                'message': 'Backup de archivos media iniciado',
                'task_id': task.id,
                'backup_record_id': backup_record.id
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @extend_schema(
        tags=['Backup'],
        summary='Iniciar backup completo',
        description='Inicia un backup completo (base de datos + media)',
        responses={
            200: OpenApiTypes.OBJECT,
            500: OpenApiTypes.OBJECT
        }
    )
    @action(detail=False, methods=['post'])
    def backup_full(self, request):
        """Iniciar backup completo"""
        try:
            # Crear registro de backup
            backup_record = BackupRecord.objects.create(
                backup_type='full',
                status='running',
                initiated_by=request.user
            )
            
            # Iniciar tarea asíncrona
            task = full_backup_task.delay()
            backup_record.task_id = task.id
            backup_record.save()
            
            return Response({
                'success': True,
                'message': 'Backup completo iniciado',
                'task_id': task.id,
                'backup_record_id': backup_record.id
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @extend_schema(
        tags=['Backup'],
        summary='Obtener estadísticas de backup',
        description='Obtiene estadísticas de los backups realizados',
        responses={
            200: OpenApiTypes.OBJECT,
            500: OpenApiTypes.OBJECT
        }
    )
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Obtener estadísticas de backup"""
        try:
            backup_service = BackupService()
            stats = backup_service.get_backup_stats()
            
            # Agregar estadísticas de la base de datos
            db_stats = BackupRecord.objects.aggregate(
                total_backups=models.Count('id'),
                successful_backups=models.Count('id', filter=models.Q(status='completed')),
                failed_backups=models.Count('id', filter=models.Q(status='failed')),
                total_size=models.Sum('file_size')
            )
            
            return Response({
                'success': True,
                'local_backups': stats,
                'database_stats': db_stats
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @extend_schema(
        tags=['Backup'],
        summary='Descargar backup',
        description='Descarga un archivo de backup',
        parameters=[
            OpenApiParameter(name='backup_id', description='ID del registro de backup', required=True, type=int)
        ],
        responses={
            200: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    )
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Descargar archivo de backup"""
        try:
            backup_record = self.get_object()
            
            if not backup_record.file_path or backup_record.status != 'completed':
                return Response({
                    'success': False,
                    'error': 'Backup no disponible para descarga'
                }, status=status.HTTP_404_NOT_FOUND)
            
            file_path = Path(backup_record.file_path)
            if not file_path.exists():
                return Response({
                    'success': False,
                    'error': 'Archivo de backup no encontrado'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Incrementar contador de descargas
            # backup_record.download_count += 1
            # backup_record.save()
            
            return FileResponse(
                open(file_path, 'rb'),
                as_attachment=True,
                filename=file_path.name
            )
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BackupScheduleViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar programaciones de backup"""
    queryset = BackupSchedule.objects.all()
    serializer_class = BackupScheduleSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        """Crear nueva programación"""
        schedule = serializer.save(created_by=self.request.user)
        schedule.calculate_next_run()
        schedule.save()
    
    @extend_schema(
        tags=['Backup'],
        summary='Probar programación de backup',
        description='Ejecuta inmediatamente un backup programado para probarlo',
        responses={
            200: OpenApiTypes.OBJECT,
            500: OpenApiTypes.OBJECT
        }
    )
    @action(detail=True, methods=['post'])
    def test_run(self, request, pk=None):
        """Ejecutar backup programado como prueba"""
        try:
            schedule = self.get_object()
            
            # Crear registro de backup
            backup_record = BackupRecord.objects.create(
                backup_type=schedule.backup_type,
                status='running',
                initiated_by=request.user
            )
            
            # Ejecutar backup según el tipo
            if schedule.backup_type == 'database':
                task = backup_database_task.delay()
            elif schedule.backup_type == 'media':
                task = backup_media_task.delay()
            else:  # full
                task = full_backup_task.delay()
            
            backup_record.task_id = task.id
            backup_record.save()
            
            return Response({
                'success': True,
                'message': f'Backup de prueba iniciado para {schedule.name}',
                'task_id': task.id,
                'backup_record_id': backup_record.id
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    tags=['Backup'],
    summary='Estado de tarea de backup',
    description='Obtiene el estado de una tarea de backup',
    responses={
        200: OpenApiTypes.OBJECT,
        404: OpenApiTypes.OBJECT
    }
)
@staff_member_required
def backup_task_status(request, task_id):
    """Obtener estado de tarea de backup"""
    try:
        from celery.result import AsyncResult
        
        task_result = AsyncResult(task_id)
        
        return JsonResponse({
            'task_id': task_id,
            'status': task_result.status,
            'result': task_result.result,
            'ready': task_result.ready(),
            'successful': task_result.successful() if task_result.ready() else None,
            'failed': task_result.failed() if task_result.ready() else None
        })
        
    except Exception as e:
        return JsonResponse({
            'error': str(e)
        }, status=500)

