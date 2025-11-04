from rest_framework import generics
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Employee, Shift, ShiftAssignment, Supervisor
from .serializers import EmployeeSerializer, ShiftSerializer, ShiftAssignmentSerializer, SupervisorSerializer


class SupervisorListCreateView(generics.ListCreateAPIView):
    queryset = Supervisor.objects.all()
    serializer_class = SupervisorSerializer


class SupervisorDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Supervisor.objects.all()
    serializer_class = SupervisorSerializer


class EmployeeListCreateView(generics.ListCreateAPIView):
    queryset = Employee.objects.select_related('supervisor').all()
    serializer_class = EmployeeSerializer


class EmployeeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Employee.objects.select_related('supervisor').all()
    serializer_class = EmployeeSerializer


class ShiftListCreateView(generics.ListCreateAPIView):
    queryset = Shift.objects.all()
    serializer_class = ShiftSerializer


class ShiftDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Shift.objects.all()
    serializer_class = ShiftSerializer


class ShiftAssignmentListCreateView(generics.ListCreateAPIView):
    queryset = ShiftAssignment.objects.all()
    serializer_class = ShiftAssignmentSerializer


@api_view(['GET'])
def active_supervisor(request):
    """
    Retorna el encargado de turno activo según el día y hora actual.
    
    Los turnos son de 24 horas y rotan cada día:
    - Turno A: 24 horas
    - Turno B: 24 horas
    - Y así alternativamente...
    
    El cambio de turno ocurre a las 8:00 AM de cada día.
    """
    now = timezone.now()
    weekday = now.weekday()  # 0 = Monday, 1 = Tuesday, etc.
    hour = now.hour
    
    # Contar cuántas veces ha habido cambio de turno desde el lunes
    # Cada cambio de turno ocurre a las 8AM
    # Turno A: Lunes 8AM - Martes 8AM
    # Turno B: Martes 8AM - Miércoles 8AM
    # Turno A: Miércoles 8AM - Jueves 8AM
    # etc.
    
    # Número de cambios de turno desde el lunes
    shift_changes = weekday
    
    # Si ya pasaron las 8AM hoy, agregar 1 cambio más
    if hour >= 8:
        shift_changes += 1
    
    # Alternar entre turno_a y turno_b
    # turno_a = cambios pares (0, 2, 4, ...)
    # turno_b = cambios impares (1, 3, 5, ...)
    shift_type = 'turno_a' if shift_changes % 2 == 0 else 'turno_b'
    
    # Buscar el supervisor activo del turno
    try:
        supervisor = Supervisor.objects.filter(
            shift_type=shift_type,
            is_active=True
        ).first()
        
        if supervisor:
            serializer = SupervisorSerializer(supervisor)
            return Response({
                'supervisor': serializer.data,
                'shift_type': shift_type,
                'shift_name': supervisor.get_shift_type_display(),
                'current_time': now.isoformat()
            })
        else:
            return Response({
                'supervisor': None,
                'shift_type': shift_type,
                'shift_name': None,
                'current_time': now.isoformat(),
                'message': 'No hay encargado asignado para este turno'
            })
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=500)
