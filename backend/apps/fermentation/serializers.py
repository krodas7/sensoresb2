from rest_framework import serializers
from .models import Fermentation, FermentationMeasurement


class FermentationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fermentation
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class FermentationMeasurementSerializer(serializers.ModelSerializer):
    class Meta:
        model = FermentationMeasurement
        fields = '__all__'
        read_only_fields = ['id', 'created_at']
