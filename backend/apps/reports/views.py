"""
Report views for the Sistema de Beneficio
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from django.utils import timezone
from django.db.models import Count, Sum, Avg, Max, Min
from drf_spectacular.utils import extend_schema
from drf_spectacular.types import OpenApiTypes

from .models import Report, ReportLog, ReportData
from .serializers import ReportSerializer, ReportGenerationSerializer, ReportStatsSerializer
from apps.core.exceptions import ErrorResponse, ReportGenerationException
from apps.lots.models import Lot
from apps.temperatures.models import Reading
from apps.occupation.models import Occupation
from apps.attendance.models import AttendanceRecord

import logging
import json
from datetime import timedelta
from django.http import HttpResponse
from django.template.loader import render_to_string
from django.conf import settings
import os

logger = logging.getLogger(__name__)


class ReportListView(ListCreateAPIView):
    """List and create reports"""
    
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter reports by user permissions"""
        queryset = Report.objects.all()
        
        # If user is not admin, only show their reports
        if not self.request.user.role == 'admin':
            queryset = queryset.filter(created_by=self.request.user)
        
        return queryset.order_by('-created_at')


class ReportDetailView(RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a report"""
    
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter reports by user permissions"""
        queryset = Report.objects.all()
        
        # If user is not admin, only show their reports
        if not self.request.user.role == 'admin':
            queryset = queryset.filter(created_by=self.request.user)
        
        return queryset


@extend_schema(
    tags=['Reports'],
    summary='Generar reporte',
    description='Genera un nuevo reporte con los parámetros especificados',
    request=ReportGenerationSerializer,
    responses={
        202: OpenApiTypes.OBJECT,
        400: OpenApiTypes.OBJECT,
        500: OpenApiTypes.OBJECT
    }
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_report(request):
    """Generate a new report"""
    try:
        serializer = ReportGenerationSerializer(data=request.data)
        if not serializer.is_valid():
            return ErrorResponse.validation_error(
                'Datos de generación de reporte inválidos',
                serializer.errors
            )
        
        data = serializer.validated_data
        
        # Create report record
        report = Report.objects.create(
            name=f"Reporte {data['report_type']} - {timezone.now().strftime('%Y-%m-%d %H:%M')}",
            report_type=data['report_type'],
            format=data['format'],
            parameters=data['parameters'],
            filters=data['filters'],
            start_date=data.get('start_date'),
            end_date=data.get('end_date'),
            created_by=request.user,
            status='generating'
        )
        
        # Log report creation
        ReportLog.objects.create(
            report=report,
            level='info',
            message='Reporte creado y en proceso de generación',
            details={'parameters': data}
        )
        
        # Generate report data
        try:
            report_data = generate_report_data(report)
            
            # Generate PDF if format is PDF
            if report.format == 'pdf':
                pdf_path = generate_pdf_report(report, report_data)
                report.file_url = pdf_path
                report.status = 'completed'
            else:
                report.status = 'completed'
            
            report.generated_at = timezone.now()
            report.save()
            
            ReportLog.objects.create(
                report=report,
                level='info',
                message='Reporte generado exitosamente',
                details={'generated_at': report.generated_at.isoformat()}
            )
            
        except Exception as e:
            report.status = 'failed'
            report.save()
            
            ReportLog.objects.create(
                report=report,
                level='error',
                message=f'Error generando reporte: {str(e)}',
                details={'error': str(e)}
            )
            
            raise ReportGenerationException(f"Error generando reporte: {str(e)}")
        
        return Response({
            'success': True,
            'message': 'Reporte generado exitosamente',
            'report_id': report.id,
            'status': report.status,
            'download_url': report.file_url if report.is_ready else None
        }, status=status.HTTP_202_ACCEPTED)
        
    except ReportGenerationException as e:
        return ErrorResponse.bad_request(str(e))
    except Exception as e:
        logger.error(f"Error generating report: {str(e)}", exc_info=True)
        return ErrorResponse.server_error(
            'Error interno generando reporte',
            {'error_type': 'report_generation_error'}
        )


def generate_report_data(report):
    """Generate report data based on type"""
    try:
        if report.report_type == 'daily_production':
            data = generate_daily_production_report(report)
        elif report.report_type == 'temperature_summary':
            data = generate_temperature_summary_report(report)
        elif report.report_type == 'attendance_summary':
            data = generate_attendance_summary_report(report)
        elif report.report_type == 'occupation_summary':
            data = generate_occupation_summary_report(report)
        elif report.report_type == 'lot_progress':
            data = generate_lot_progress_report(report)
        else:
            raise ValueError(f"Tipo de reporte no soportado: {report.report_type}")
        
        # Store generated data
        cache_key = f"report_{report.id}_{report.created_at.timestamp()}"
        ReportData.objects.create(
            report=report,
            data=data,
            cache_key=cache_key,
            expires_at=timezone.now() + timedelta(days=7)
        )
        
        return data
        
    except Exception as e:
        logger.error(f"Error generating report data: {str(e)}", exc_info=True)
        raise


def generate_daily_production_report(report):
    """Generate daily production report data"""
    start_date = report.start_date or timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
    end_date = report.end_date or start_date + timedelta(days=1)
    
    # Get lots processed in date range
    lots = Lot.objects.filter(
        created_at__gte=start_date,
        created_at__lt=end_date
    )
    
    # Get temperature readings
    readings = Reading.objects.filter(
        timestamp__gte=start_date,
        timestamp__lt=end_date
    )
    
    # Get occupation data
    occupations = Occupation.objects.filter(
        timestamp__gte=start_date,
        timestamp__lt=end_date
    )
    
    return {
        'report_type': 'daily_production',
        'date_range': {
            'start': start_date.isoformat(),
            'end': end_date.isoformat()
        },
        'lots': {
            'total': lots.count(),
            'completed': lots.filter(status='completed').count(),
            'in_progress': lots.filter(status='in_progress').count(),
            'data': [{
                'code': lot.code,
                'finca': lot.finca,
                'variety': lot.variety,
                'initial_weight': lot.initial_weight,
                'status': lot.status,
                'created_at': lot.created_at.isoformat()
            } for lot in lots]
        },
        'temperatures': {
            'total_readings': readings.count(),
            'avg_temperature': readings.aggregate(avg=Avg('value'))['avg'] or 0,
            'max_temperature': readings.aggregate(max=Max('value'))['max'] or 0,
            'min_temperature': readings.aggregate(min=Min('value'))['min'] or 0
        },
        'occupation': {
            'total_changes': occupations.count(),
            'occupied_areas': occupations.filter(status='ocupado').count(),
            'free_areas': occupations.filter(status='libre').count()
        }
    }


def generate_temperature_summary_report(report):
    """Generate temperature summary report data"""
    start_date = report.start_date or timezone.now() - timedelta(days=7)
    end_date = report.end_date or timezone.now()
    
    readings = Reading.objects.filter(
        timestamp__gte=start_date,
        timestamp__lt=end_date
    )
    
    return {
        'report_type': 'temperature_summary',
        'date_range': {
            'start': start_date.isoformat(),
            'end': end_date.isoformat()
        },
        'summary': {
            'total_readings': readings.count(),
            'overall_avg_temp': readings.aggregate(avg=Avg('value'))['avg'] or 0,
            'max_temperature': readings.aggregate(max=Max('value'))['max'] or 0,
            'min_temperature': readings.aggregate(min=Min('value'))['min'] or 0
        }
    }


def generate_attendance_summary_report(report):
    """Generate attendance summary report data"""
    start_date = report.start_date or timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
    end_date = report.end_date or start_date + timedelta(days=1)
    
    records = AttendanceRecord.objects.filter(
        timestamp__gte=start_date,
        timestamp__lt=end_date
    )
    
    return {
        'report_type': 'attendance_summary',
        'date_range': {
            'start': start_date.isoformat(),
            'end': end_date.isoformat()
        },
        'summary': {
            'total_records': records.count(),
            'total_check_ins': records.filter(record_type='IN').count(),
            'total_check_outs': records.filter(record_type='OUT').count(),
            'unique_employees': records.values('employee').distinct().count()
        }
    }


def generate_occupation_summary_report(report):
    """Generate occupation summary report data"""
    start_date = report.start_date or timezone.now() - timedelta(days=1)
    end_date = report.end_date or timezone.now()
    
    occupations = Occupation.objects.filter(
        timestamp__gte=start_date,
        timestamp__lt=end_date
    )
    
    return {
        'report_type': 'occupation_summary',
        'date_range': {
            'start': start_date.isoformat(),
            'end': end_date.isoformat()
        },
        'summary': {
            'total_occupation_changes': occupations.count(),
            'occupied_areas': occupations.filter(status='ocupado').values('area').distinct().count(),
            'free_areas': occupations.filter(status='libre').values('area').distinct().count(),
            'maintenance_areas': occupations.filter(status='mantenimiento').values('area').distinct().count()
        }
    }


def generate_lot_progress_report(report):
    """Generate lot progress report data"""
    lots = Lot.objects.all()
    
    return {
        'report_type': 'lot_progress',
        'summary': {
            'total_lots': lots.count(),
            'completed_lots': lots.filter(status='completed').count(),
            'in_progress_lots': lots.filter(status='in_progress').count(),
            'pending_lots': lots.filter(status='pending').count(),
            'cancelled_lots': lots.filter(status='cancelled').count()
        },
        'lots': [{
            'code': lot.code,
            'finca': lot.finca,
            'variety': lot.variety,
            'initial_weight': lot.initial_weight,
            'status': lot.status,
            'current_area': lot.current_area.name if lot.current_area else None,
            'created_at': lot.created_at.isoformat()
        } for lot in lots[:50]]  # Limit to 50 lots for performance
    }


@extend_schema(
    tags=['Reports'],
    summary='Estadísticas de reportes',
    description='Obtiene estadísticas generales de los reportes del sistema',
    responses={
        200: ReportStatsSerializer,
        500: OpenApiTypes.OBJECT
    }
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def report_stats(request):
    """Get report statistics"""
    try:
        # Calculate statistics
        total_reports = Report.objects.count()
        completed_reports = Report.objects.filter(status='completed').count()
        failed_reports = Report.objects.filter(status='failed').count()
        total_downloads = Report.objects.aggregate(total=Sum('download_count'))['total'] or 0
        
        # Most popular report type
        popular_type = Report.objects.values('report_type').annotate(
            count=Count('report_type')
        ).order_by('-count').first()
        
        most_popular_type = popular_type['report_type'] if popular_type else 'N/A'
        
        # Average generation time (simulated)
        avg_generation_time = 2.5  # minutes
        
        stats = {
            'total_reports': total_reports,
            'completed_reports': completed_reports,
            'failed_reports': failed_reports,
            'total_downloads': total_downloads,
            'most_popular_type': most_popular_type,
            'avg_generation_time': avg_generation_time,
            'success_rate': round((completed_reports / total_reports * 100), 2) if total_reports > 0 else 0
        }
        
        return Response(stats)
        
    except Exception as e:
        logger.error(f"Error getting report stats: {str(e)}", exc_info=True)
        return ErrorResponse.server_error(
            'Error obteniendo estadísticas de reportes',
            {'error_type': 'stats_error'}
        )


def generate_pdf_report(report, report_data):
    """Generate PDF report file"""
    try:
        # Create reports directory if it doesn't exist
        reports_dir = os.path.join(settings.MEDIA_ROOT, 'reports')
        if not os.path.exists(reports_dir):
            os.makedirs(reports_dir)
        
        # Generate filename
        filename = f"{report.report_type}_{report.id}_{timezone.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        file_path = os.path.join(reports_dir, filename)
        
        # For now, create a simple text file as placeholder
        # In production, you would use libraries like ReportLab or WeasyPrint
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(f"REPORTE: {report.name}\n")
            f.write(f"TIPO: {report.report_type}\n")
            f.write(f"FECHA: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"DATOS: {json.dumps(report_data, indent=2, ensure_ascii=False)}\n")
        
        return f"/media/reports/{filename}"
        
    except Exception as e:
        logger.error(f"Error generating PDF: {str(e)}", exc_info=True)
        raise ReportGenerationException(f"Error generando PDF: {str(e)}")


@extend_schema(
    tags=['Reports'],
    summary='Descargar reporte',
    description='Descarga un reporte generado',
    responses={
        200: OpenApiTypes.OBJECT,
        404: OpenApiTypes.OBJECT,
        500: OpenApiTypes.OBJECT
    }
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_report(request, report_id):
    """Download a generated report"""
    try:
        report = Report.objects.get(id=report_id)
        
        # Check permissions
        if not request.user.role == 'admin' and report.created_by != request.user:
            return ErrorResponse.forbidden('No tienes permisos para descargar este reporte')
        
        if report.status != 'completed' or not report.file_url:
            return ErrorResponse.bad_request('El reporte no está listo para descarga')
        
        # Increment download count
        report.download_count += 1
        report.save()
        
        # For now, return a simple response
        # In production, you would serve the actual file
        response = HttpResponse(
            f"Reporte: {report.name}\nTipo: {report.report_type}\nGenerado: {report.generated_at}",
            content_type='text/plain'
        )
        response['Content-Disposition'] = f'attachment; filename="{report.name}.txt"'
        
        return response
        
    except Report.DoesNotExist:
        return ErrorResponse.not_found('Reporte no encontrado')
    except Exception as e:
        logger.error(f"Error downloading report: {str(e)}", exc_info=True)
        return ErrorResponse.server_error(
            'Error descargando reporte',
            {'error_type': 'download_error'}
        )


@extend_schema(
    tags=['Reports'],
    summary='Obtener datos de reporte',
    description='Obtiene los datos de un reporte generado',
    responses={
        200: OpenApiTypes.OBJECT,
        404: OpenApiTypes.OBJECT,
        500: OpenApiTypes.OBJECT
    }
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_report_data(request, report_id):
    """Get report data"""
    try:
        report = Report.objects.get(id=report_id)
        
        # Check permissions
        if not request.user.role == 'admin' and report.created_by != request.user:
            return ErrorResponse.forbidden('No tienes permisos para ver este reporte')
        
        # Get report data from cache
        report_data = ReportData.objects.filter(report=report).first()
        
        if not report_data:
            return ErrorResponse.not_found('Datos del reporte no encontrados')
        
        return Response({
            'report': ReportSerializer(report).data,
            'data': report_data.data
        })
        
    except Report.DoesNotExist:
        return ErrorResponse.not_found('Reporte no encontrado')
    except Exception as e:
        logger.error(f"Error getting report data: {str(e)}", exc_info=True)
        return ErrorResponse.server_error(
            'Error obteniendo datos del reporte',
            {'error_type': 'data_error'}
        )
