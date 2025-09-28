from rest_framework import generics
from .models import Lot
from .serializers import LotSerializer


class LotListCreateView(generics.ListCreateAPIView):
    queryset = Lot.objects.all()
    serializer_class = LotSerializer


class LotDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Lot.objects.all()
    serializer_class = LotSerializer
