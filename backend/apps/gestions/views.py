from rest_framework import generics
from .models import MaterialRequest, Material, FoodTicket, FoodTicketEmployee, PaymentTicket
from .serializers import (
    MaterialRequestSerializer, MaterialSerializer,
    FoodTicketSerializer, FoodTicketEmployeeSerializer,
    PaymentTicketSerializer
)


class MaterialRequestListCreateView(generics.ListCreateAPIView):
    queryset = MaterialRequest.objects.prefetch_related('materials').all()
    serializer_class = MaterialRequestSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtrar por tipo
        request_type = self.request.query_params.get('type')
        if request_type:
            queryset = queryset.filter(type=request_type)
        
        # Filtrar por estado
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        # Filtrar por prioridad
        priority = self.request.query_params.get('priority')
        if priority:
            queryset = queryset.filter(priority=priority)
        
        return queryset


class MaterialRequestDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MaterialRequest.objects.prefetch_related('materials').all()
    serializer_class = MaterialRequestSerializer


class MaterialListCreateView(generics.ListCreateAPIView):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtrar por solicitud
        request_id = self.request.query_params.get('request')
        if request_id:
            queryset = queryset.filter(request_id=request_id)
        
        return queryset


class MaterialDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer


class FoodTicketListCreateView(generics.ListCreateAPIView):
    queryset = FoodTicket.objects.prefetch_related('employees').all()
    serializer_class = FoodTicketSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtrar por turno
        shift = self.request.query_params.get('shift')
        if shift:
            queryset = queryset.filter(shift=shift)
        
        # Filtrar por estado
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        # Filtrar por tipo de comida
        meal_type = self.request.query_params.get('meal_type')
        if meal_type:
            queryset = queryset.filter(meal_type=meal_type)
        
        # Filtrar por fecha
        date = self.request.query_params.get('date')
        if date:
            queryset = queryset.filter(date=date)
        
        return queryset


class FoodTicketDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = FoodTicket.objects.prefetch_related('employees').all()
    serializer_class = FoodTicketSerializer


class PaymentTicketListCreateView(generics.ListCreateAPIView):
    queryset = PaymentTicket.objects.all()
    serializer_class = PaymentTicketSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtrar por tipo
        payment_type = self.request.query_params.get('type')
        if payment_type:
            queryset = queryset.filter(type=payment_type)
        
        # Filtrar por estado
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        # Filtrar por fecha
        work_date = self.request.query_params.get('work_date')
        if work_date:
            queryset = queryset.filter(work_date=work_date)
        
        return queryset


class PaymentTicketDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PaymentTicket.objects.all()
    serializer_class = PaymentTicketSerializer

