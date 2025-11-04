"""
Admin Dashboard personalizado con estadísticas y gráficas
"""
from django.contrib import admin
from django.db.models import Count, Avg, Q
from django.utils import timezone
from datetime import timedelta


def get_dashboard_stats():
    """
    Obtiene estadísticas para el dashboard
    """
    today = timezone.now().date()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)
    
    stats = {
        'temp_count': 0,
        'temp_avg': 0,
        'active_alerts': 0,
        'attendance_today': 0,
        'occupied_areas': 0,
        'active_lots': 0,
        'recent_cuppings': 0,
        'avg_cupping_score': {},
        'recent_events': [],
        'temps_24h': [],
    }
    
    try:
        # Temperaturas
        from apps.temperatures.models import Reading
        temp_count = Reading.objects.filter(timestamp__date=today).count()
        temp_avg = Reading.objects.filter(
            timestamp__date=today
        ).aggregate(avg_temp=Avg('value'))['avg_temp'] or 0
        stats['temp_count'] = temp_count
        stats['temp_avg'] = round(temp_avg, 2)
        
        # Temperaturas por hora (últimas 24 horas)
        temps_24h = Reading.objects.filter(
            timestamp__gte=timezone.now() - timedelta(hours=24)
        ).values('sensor__code', 'value', 'timestamp').order_by('-timestamp')[:100]
        stats['temps_24h'] = list(temps_24h)
    except ImportError:
        pass
    
    try:
        # Alertas activas
        from apps.core.models import Alert
        active_alerts = Alert.objects.filter(is_active=True).count()
        stats['active_alerts'] = active_alerts
    except ImportError:
        pass
    
    try:
        # Asistencias del día
        from apps.attendance.models import AttendanceRecord
        attendance_today = AttendanceRecord.objects.filter(
            timestamp__date=today,
            record_type='IN'
        ).count()
        stats['attendance_today'] = attendance_today
    except ImportError:
        pass
    
    try:
        # Ocupación actual
        from apps.occupation.models import Occupation
        occupied_areas = Occupation.objects.filter(
            status='ocupado'
        ).count()
        stats['occupied_areas'] = occupied_areas
    except ImportError:
        pass
    
    try:
        # Lotes activos
        from apps.lots.models import Lot
        active_lots = Lot.objects.filter(
            Q(status='in_progress')
        ).count()
        stats['active_lots'] = active_lots
    except ImportError:
        pass
    
    try:
        # Cataciones recientes (última semana)
        from apps.cupping.models import Cupping, CuppingScore
        recent_cuppings = Cupping.objects.filter(
            date__gte=week_ago
        ).count()
        stats['recent_cuppings'] = recent_cuppings
        
        # Promedio de scores de catación (último mes)
        avg_cupping_score = CuppingScore.objects.filter(
            created_at__gte=month_ago
        ).aggregate(
            avg_fragrance=Avg('fragrance'),
            avg_flavor=Avg('flavor'),
            avg_acidity=Avg('acidity'),
            avg_body=Avg('body')
        )
        stats['avg_cupping_score'] = avg_cupping_score
    except ImportError:
        pass
    
    try:
        # Eventos recientes
        from apps.core.models import Event
        recent_events = Event.objects.filter(
            timestamp__gte=week_ago
        ).order_by('-timestamp')[:5]
        stats['recent_events'] = recent_events
    except ImportError:
        pass
    
    return stats


