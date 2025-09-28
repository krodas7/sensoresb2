from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Count, Q
from .models import AttendanceRecord
from .serializers import AttendanceRecordSerializer


class AttendanceRecordListCreateView(generics.ListCreateAPIView):
    queryset = AttendanceRecord.objects.all()
    serializer_class = AttendanceRecordSerializer


@api_view(['GET'])
def DepartmentAttendanceView(request):
    """Get attendance summary by department"""
    try:
        department = request.query_params.get('department')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        # Build query
        query = Q()
        if department:
            query &= Q(employee__department=department)
        if start_date:
            query &= Q(timestamp__date__gte=start_date)
        if end_date:
            query &= Q(timestamp__date__lte=end_date)
        
        # Get records
        records = AttendanceRecord.objects.filter(query)
        
        # Calculate summary
        total_records = records.count()
        check_ins = records.filter(record_type='IN').count()
        check_outs = records.filter(record_type='OUT').count()
        unique_employees = records.values('employee').distinct().count()
        
        return Response({
            'department': department or 'All',
            'total_records': total_records,
            'check_ins': check_ins,
            'check_outs': check_outs,
            'unique_employees': unique_employees,
            'attendance_rate': (check_ins / unique_employees * 100) if unique_employees > 0 else 0
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
