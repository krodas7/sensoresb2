"""
Sistema de Backup Automático para el Sistema de Beneficio
"""
import os
import shutil
import gzip
import json
from datetime import datetime, timedelta
from pathlib import Path
from django.conf import settings
from django.core.management import call_command
from django.utils import timezone
from celery import shared_task
from celery.utils.log import get_task_logger
import boto3
from botocore.exceptions import ClientError

logger = get_task_logger(__name__)


class BackupService:
    """Servicio de backup automático"""
    
    def __init__(self):
        self.backup_dir = Path(settings.BASE_DIR) / 'backups'
        self.backup_dir.mkdir(exist_ok=True)
        self.retention_days = getattr(settings, 'BACKUP_RETENTION_DAYS', 30)
        
    def create_database_backup(self):
        """Crear backup de la base de datos"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_filename = f'db_backup_{timestamp}.json'
        backup_path = self.backup_dir / backup_filename
        
        try:
            # Crear backup usando dumpdata
            with open(backup_path, 'w') as f:
                call_command('dumpdata', 
                           exclude=['contenttypes', 'sessions', 'admin.logentry'],
                           indent=2,
                           stdout=f)
            
            # Comprimir el backup
            compressed_path = f"{backup_path}.gz"
            with open(backup_path, 'rb') as f_in:
                with gzip.open(compressed_path, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)
            
            # Eliminar archivo sin comprimir
            os.remove(backup_path)
            
            # Obtener información del archivo
            file_size = os.path.getsize(compressed_path)
            
            logger.info(f"Backup de base de datos creado: {compressed_path} ({file_size} bytes)")
            
            return {
                'success': True,
                'file_path': compressed_path,
                'file_size': file_size,
                'timestamp': timestamp
            }
            
        except Exception as e:
            logger.error(f"Error creando backup de base de datos: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def create_media_backup(self):
        """Crear backup de archivos media"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_filename = f'media_backup_{timestamp}.tar.gz'
        backup_path = self.backup_dir / backup_filename
        
        try:
            media_dir = Path(settings.MEDIA_ROOT) if settings.MEDIA_ROOT else None
            
            if not media_dir or not media_dir.exists():
                return {
                    'success': True,
                    'message': 'No hay directorio media para respaldar'
                }
            
            # Crear archivo tar.gz del directorio media
            shutil.make_archive(
                str(backup_path.with_suffix('')),
                'gztar',
                media_dir.parent,
                media_dir.name
            )
            
            file_size = os.path.getsize(backup_path)
            
            logger.info(f"Backup de media creado: {backup_path} ({file_size} bytes)")
            
            return {
                'success': True,
                'file_path': backup_path,
                'file_size': file_size,
                'timestamp': timestamp
            }
            
        except Exception as e:
            logger.error(f"Error creando backup de media: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def upload_to_s3(self, file_path, s3_key):
        """Subir backup a S3"""
        try:
            s3_client = boto3.client('s3')
            
            # Configuración S3 desde settings
            s3_bucket = getattr(settings, 'BACKUP_S3_BUCKET', None)
            s3_region = getattr(settings, 'BACKUP_S3_REGION', 'us-east-1')
            
            if not s3_bucket:
                return {
                    'success': False,
                    'error': 'S3 bucket no configurado'
                }
            
            # Subir archivo
            s3_client.upload_file(
                str(file_path),
                s3_bucket,
                s3_key,
                ExtraArgs={
                    'ServerSideEncryption': 'AES256',
                    'StorageClass': 'STANDARD_IA'  # Infrequent Access para backups
                }
            )
            
            logger.info(f"Backup subido a S3: s3://{s3_bucket}/{s3_key}")
            
            return {
                'success': True,
                's3_url': f"s3://{s3_bucket}/{s3_key}"
            }
            
        except ClientError as e:
            logger.error(f"Error subiendo backup a S3: {str(e)}")
            return {
                'success': False,
                'error': f"S3 Error: {str(e)}"
            }
        except Exception as e:
            logger.error(f"Error inesperado subiendo a S3: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def cleanup_old_backups(self):
        """Limpiar backups antiguos"""
        try:
            cutoff_date = timezone.now() - timedelta(days=self.retention_days)
            deleted_count = 0
            
            for backup_file in self.backup_dir.glob('*'):
                if backup_file.is_file():
                    file_time = datetime.fromtimestamp(backup_file.stat().st_mtime)
                    if timezone.make_aware(file_time) < cutoff_date:
                        backup_file.unlink()
                        deleted_count += 1
                        logger.info(f"Backup antiguo eliminado: {backup_file}")
            
            return {
                'success': True,
                'deleted_count': deleted_count
            }
            
        except Exception as e:
            logger.error(f"Error limpiando backups antiguos: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_backup_stats(self):
        """Obtener estadísticas de backups"""
        try:
            backups = []
            total_size = 0
            
            for backup_file in self.backup_dir.glob('*'):
                if backup_file.is_file():
                    stat = backup_file.stat()
                    backups.append({
                        'name': backup_file.name,
                        'size': stat.st_size,
                        'created': datetime.fromtimestamp(stat.st_ctime),
                        'modified': datetime.fromtimestamp(stat.st_mtime)
                    })
                    total_size += stat.st_size
            
            return {
                'success': True,
                'backups': backups,
                'total_count': len(backups),
                'total_size': total_size,
                'retention_days': self.retention_days
            }
            
        except Exception as e:
            logger.error(f"Error obteniendo estadísticas de backup: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }


@shared_task(bind=True)
def backup_database_task(self):
    """Tarea Celery para backup de base de datos"""
    try:
        backup_service = BackupService()
        
        # Crear backup de base de datos
        db_result = backup_service.create_database_backup()
        
        if not db_result['success']:
            return {
                'success': False,
                'error': db_result['error'],
                'task_id': self.request.id
            }
        
        # Subir a S3 si está configurado
        s3_result = None
        if getattr(settings, 'BACKUP_S3_BUCKET', None):
            s3_key = f"database/{db_result['timestamp']}/{os.path.basename(db_result['file_path'])}"
            s3_result = backup_service.upload_to_s3(db_result['file_path'], s3_key)
        
        # Limpiar backups antiguos
        cleanup_result = backup_service.cleanup_old_backups()
        
        return {
            'success': True,
            'database_backup': db_result,
            's3_upload': s3_result,
            'cleanup': cleanup_result,
            'task_id': self.request.id
        }
        
    except Exception as e:
        logger.error(f"Error en tarea de backup de base de datos: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'task_id': self.request.id
        }


@shared_task(bind=True)
def backup_media_task(self):
    """Tarea Celery para backup de archivos media"""
    try:
        backup_service = BackupService()
        
        # Crear backup de media
        media_result = backup_service.create_media_backup()
        
        if not media_result['success']:
            return {
                'success': False,
                'error': media_result['error'],
                'task_id': self.request.id
            }
        
        # Subir a S3 si está configurado
        s3_result = None
        if getattr(settings, 'BACKUP_S3_BUCKET', None):
            s3_key = f"media/{media_result['timestamp']}/{os.path.basename(media_result['file_path'])}"
            s3_result = backup_service.upload_to_s3(media_result['file_path'], s3_key)
        
        return {
            'success': True,
            'media_backup': media_result,
            's3_upload': s3_result,
            'task_id': self.request.id
        }
        
    except Exception as e:
        logger.error(f"Error en tarea de backup de media: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'task_id': self.request.id
        }


@shared_task(bind=True)
def full_backup_task(self):
    """Tarea Celery para backup completo"""
    try:
        # Ejecutar backup de base de datos
        db_task = backup_database_task.delay()
        db_result = db_task.get()
        
        # Ejecutar backup de media
        media_task = backup_media_task.delay()
        media_result = media_task.get()
        
        return {
            'success': True,
            'database_backup': db_result,
            'media_backup': media_result,
            'task_id': self.request.id
        }
        
    except Exception as e:
        logger.error(f"Error en tarea de backup completo: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'task_id': self.request.id
        }

