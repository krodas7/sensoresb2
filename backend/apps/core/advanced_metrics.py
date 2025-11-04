"""
Servicio avanzado de métricas para el dashboard
"""
from django.db.models import Avg, Count, Sum, Q, F, Max, Min
from django.db.models.functions import TruncDay, TruncHour, TruncWeek
from django.utils import timezone
from datetime import timedelta, datetime
import json


class AdvancedMetricsService:
    """Servicio avanzado de métricas para el dashboard"""
    
    def __init__(self):
        self.now = timezone.now()
    
    def get_production_metrics(self):
        """Métricas de producción"""
        try:
            from apps.lots.models import Lot
            from apps.fermentation.models import FermentationBatch
            
            # Métricas de lotes
            lots_stats = Lot.objects.aggregate(
                total_lots=Count('id'),
                active_lots=Count('id', filter=Q(status__in=['processing', 'drying', 'fermenting'])),
                completed_lots=Count('id', filter=Q(status='completed')),
                total_weight=Sum('weight'),
                avg_weight=Avg('weight')
            )
            
            # Métricas de fermentación
            fermentation_stats = FermentationBatch.objects.aggregate(
                total_batches=Count('id'),
                active_batches=Count('id', filter=Q(status='active')),
                completed_batches=Count('id', filter=Q(status='completed'))
            )
            
            # Producción por día (últimos 7 días)
            last_7_days = self.now - timedelta(days=7)
            daily_production = Lot.objects.filter(
                created_at__gte=last_7_days,
                status='completed'
            ).extra(
                select={'day': 'date(created_at)'}
            ).values('day').annotate(
                count=Count('id'),
                total_weight=Sum('weight')
            ).order_by('day')
            
            return {
                'lots': lots_stats,
                'fermentation': fermentation_stats,
                'daily_production': list(daily_production),
                'success': True
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_quality_metrics(self):
        """Métricas de calidad"""
        try:
            from apps.cupping.models import CuppingScore, Cupping, CuppingSample
            
            # Métricas de catación
            cupping_stats = Cupping.objects.aggregate(
                total_sessions=Count('id'),
                active_sessions=Count('id', filter=Q(status='open')),
                completed_sessions=Count('id', filter=Q(status='closed'))
            )
            
            # Scores promedio por categoría
            score_metrics = CuppingScore.objects.aggregate(
                avg_fragrance=Avg('fragrance'),
                avg_flavor=Avg('flavor'),
                avg_aftertaste=Avg('aftertaste'),
                avg_acidity=Avg('acidity'),
                avg_body=Avg('body'),
                avg_balance=Avg('balance'),
                avg_sweetness=Avg('sweetness'),
                avg_clean_cup=Avg('clean_cup'),
                avg_uniformity=Avg('uniformity'),
                avg_overall=Avg('overall'),
                avg_defects=Avg('defects'),
                total_scores=Count('id')
            )
            
            # Mejores y peores scores
            best_scores = CuppingScore.objects.filter(
                overall__isnull=False
            ).order_by('-overall')[:5].values(
                'overall', 'cupper__name', 'sample__blind_code'
            )
            
            worst_scores = CuppingScore.objects.filter(
                overall__isnull=False
            ).order_by('overall')[:5].values(
                'overall', 'cupper__name', 'sample__blind_code'
            )
            
            # Evolución de scores (últimos 30 días)
            last_30_days = self.now - timedelta(days=30)
            score_evolution = CuppingScore.objects.filter(
                created_at__gte=last_30_days,
                overall__isnull=False
            ).extra(
                select={'day': 'date(created_at)'}
            ).values('day').annotate(
                avg_overall=Avg('overall'),
                count=Count('id')
            ).order_by('day')
            
            return {
                'cupping_sessions': cupping_stats,
                'score_metrics': score_metrics,
                'best_scores': list(best_scores),
                'worst_scores': list(worst_scores),
                'score_evolution': list(score_evolution),
                'success': True
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_operational_metrics(self):
        """Métricas operacionales"""
        try:
            from apps.employees.models import Employee
            from apps.attendance.models import Attendance
            from apps.temperatures.models import Reading
            from apps.areas.models import Area
            
            # Métricas de empleados
            employee_stats = Employee.objects.aggregate(
                total_employees=Count('id'),
                active_employees=Count('id', filter=Q(is_active=True)),
                present_today=Count('id', filter=Q(
                    attendance__check_in_time__date=self.now.date()
                ))
            )
            
            # Métricas de asistencia
            attendance_stats = Attendance.objects.filter(
                check_in_time__date=self.now.date()
            ).aggregate(
                total_check_ins=Count('id'),
                on_time=Count('id', filter=Q(
                    check_in_time__time__lte=timezone.datetime.strptime('08:00', '%H:%M').time()
                ))
            )
            
            # Métricas de temperaturas
            temp_stats = Reading.objects.filter(
                timestamp__gte=self.now - timedelta(hours=24)
            ).aggregate(
                avg_temp=Avg('value'),
                max_temp=Max('value'),
                min_temp=Min('value'),
                total_readings=Count('id')
            )
            
            # Métricas de áreas
            area_stats = Area.objects.aggregate(
                total_areas=Count('id'),
                occupied_areas=Count('id', filter=Q(is_occupied=True)),
                available_areas=Count('id', filter=Q(is_occupied=False))
            )
            
            return {
                'employees': employee_stats,
                'attendance': attendance_stats,
                'temperatures': temp_stats,
                'areas': area_stats,
                'success': True
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_financial_metrics(self):
        """Métricas financieras (si están disponibles)"""
        try:
            from apps.lots.models import Lot
            from apps.suppliers.models import Supplier
            
            # Métricas de costos (si hay campos de precio)
            cost_metrics = {
                'total_lots_cost': 0,  # Placeholder
                'avg_cost_per_kg': 0,  # Placeholder
                'total_suppliers': Supplier.objects.count()
            }
            
            return {
                'costs': cost_metrics,
                'success': True
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_equipment_metrics(self):
        """Métricas de equipos"""
        try:
            from apps.sensors.models import Sensor
            from apps.areas.models import Area
            
            # Métricas de sensores
            sensor_stats = Sensor.objects.aggregate(
                total_sensors=Count('id'),
                active_sensors=Count('id', filter=Q(is_active=True)),
                offline_sensors=Count('id', filter=Q(is_active=False))
            )
            
            # Métricas de equipos por área
            equipment_by_area = Area.objects.annotate(
                sensor_count=Count('sensors')
            ).values('name', 'sensor_count', 'is_occupied')
            
            return {
                'sensors': sensor_stats,
                'equipment_by_area': list(equipment_by_area),
                'success': True
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_alerts_metrics(self):
        """Métricas de alertas"""
        try:
            from apps.core.models import Alert
            
            # Alertas activas
            active_alerts = Alert.objects.filter(is_active=True).count()
            
            # Alertas por tipo (últimas 24 horas)
            last_24h = self.now - timedelta(hours=24)
            alerts_by_type = Alert.objects.filter(
                created_at__gte=last_24h
            ).values('alert_type').annotate(
                count=Count('id')
            )
            
            # Alertas críticas
            critical_alerts = Alert.objects.filter(
                severity='critical',
                is_active=True
            ).count()
            
            return {
                'active_alerts': active_alerts,
                'critical_alerts': critical_alerts,
                'alerts_by_type': list(alerts_by_type),
                'success': True
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_comprehensive_dashboard_data(self):
        """Obtener todos los datos del dashboard"""
        try:
            return {
                'production': self.get_production_metrics(),
                'quality': self.get_quality_metrics(),
                'operational': self.get_operational_metrics(),
                'financial': self.get_financial_metrics(),
                'equipment': self.get_equipment_metrics(),
                'alerts': self.get_alerts_metrics(),
                'timestamp': self.now.isoformat(),
                'success': True
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'timestamp': self.now.isoformat()
            }
    
    def get_kpi_summary(self):
        """Resumen de KPIs principales"""
        try:
            comprehensive_data = self.get_comprehensive_dashboard_data()
            
            if not comprehensive_data['success']:
                return comprehensive_data
            
            # Extraer KPIs principales
            kpis = {
                'total_lots': comprehensive_data['production']['lots']['total_lots'],
                'active_lots': comprehensive_data['production']['lots']['active_lots'],
                'total_weight': comprehensive_data['production']['lots']['total_weight'],
                'avg_quality_score': comprehensive_data['quality']['score_metrics']['avg_overall'],
                'active_employees': comprehensive_data['operational']['employees']['active_employees'],
                'present_today': comprehensive_data['operational']['employees']['present_today'],
                'avg_temperature': comprehensive_data['operational']['temperatures']['avg_temp'],
                'active_alerts': comprehensive_data['alerts']['active_alerts'],
                'critical_alerts': comprehensive_data['alerts']['critical_alerts'],
                'total_sensors': comprehensive_data['equipment']['sensors']['total_sensors'],
                'active_sensors': comprehensive_data['equipment']['sensors']['active_sensors']
            }
            
            return {
                'kpis': kpis,
                'timestamp': self.now.isoformat(),
                'success': True
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'timestamp': self.now.isoformat()
            }

