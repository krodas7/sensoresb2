from rest_framework import generics
from .models import Supplier
from .serializers import SupplierSerializer


class SupplierListCreateView(generics.ListCreateAPIView):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtrar por tipo
        supplier_type = self.request.query_params.get('type')
        if supplier_type:
            queryset = queryset.filter(type=supplier_type)
        
        # Filtrar por estado
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        return queryset


class SupplierDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
