from rest_framework import serializers
from .models import Lot


class LotSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lot
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
