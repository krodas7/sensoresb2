from rest_framework import generics
from .models import Fermentation, FermentationMeasurement
from .serializers import FermentationSerializer, FermentationMeasurementSerializer


class FermentationListCreateView(generics.ListCreateAPIView):
    queryset = Fermentation.objects.all()
    serializer_class = FermentationSerializer


class FermentationDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Fermentation.objects.all()
    serializer_class = FermentationSerializer


class FermentationMeasurementListCreateView(generics.ListCreateAPIView):
    queryset = FermentationMeasurement.objects.all()
    serializer_class = FermentationMeasurementSerializer
