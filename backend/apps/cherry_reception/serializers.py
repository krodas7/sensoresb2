from rest_framework import serializers
from .models import CherryReception, CherryReceptionImage
from apps.suppliers.serializers import SupplierSerializer


class CherryReceptionImageSerializer(serializers.ModelSerializer):
    """Serializer para imágenes adicionales de recepción"""
    
    class Meta:
        model = CherryReceptionImage
        fields = [
            'id', 'reception', 'image', 'image_type', 
            'description', 'uploaded_at'
        ]
        read_only_fields = ['uploaded_at']


class CherryReceptionSerializer(serializers.ModelSerializer):
    """Serializer para recepción de cereza"""
    
    supplier_details = SupplierSerializer(source='supplier', read_only=True)
    received_by_name = serializers.CharField(source='received_by.get_full_name', read_only=True)
    additional_images = CherryReceptionImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = CherryReception
        fields = [
            'id', 'reception_code', 'supplier', 'supplier_details',
            'received_by', 'received_by_name', 'weight_qq', 'weight_lbs',
            'quality', 'scale_image',
            'ocr_raw_text', 'ocr_confidence', 'ocr_processed',
            'manual_correction', 'status', 'observations',
            'reception_date', 'created_at', 'updated_at',
            'additional_images'
        ]
        read_only_fields = [
            'reception_code', 'weight_lbs', 'ocr_raw_text', 
            'ocr_confidence', 'ocr_processed', 'reception_date',
            'created_at', 'updated_at'
        ]


class CherryReceptionCreateSerializer(serializers.ModelSerializer):
    """Serializer especial para crear recepción con OCR automático"""
    
    class Meta:
        model = CherryReception
        fields = [
            'supplier', 'scale_image', 'quality', 
            'observations', 'received_by'
        ]
    
    def create(self, validated_data):
        """Crear recepción y procesar OCR automáticamente"""
        from .ocr_service import ScaleOCRService
        
        scale_image = validated_data.get('scale_image')
        
        # Procesar OCR si hay imagen
        if scale_image:
            # Guardar temporalmente para procesar
            instance = super().create(validated_data)
            
            # Extraer peso con OCR
            ocr_result = ScaleOCRService.extract_weight_from_image(instance.scale_image.path)
            
            # Actualizar con datos de OCR
            instance.ocr_raw_text = ocr_result.get('raw_text', '')
            instance.ocr_confidence = ocr_result.get('confidence', 0.0)
            instance.ocr_processed = True
            
            extracted_weight = ocr_result.get('weight')
            if extracted_weight:
                instance.weight_qq = extracted_weight
                instance.status = 'processing'
            else:
                # Si no se pudo extraer, dejar en pending para ingreso manual
                instance.weight_qq = 0.0
                instance.status = 'pending'
                instance.manual_correction = True
            
            instance.save()
            return instance
        else:
            return super().create(validated_data)


class CherryReceptionStatsSerializer(serializers.Serializer):
    """Serializer para estadísticas de recepción"""
    
    total_receptions = serializers.IntegerField()
    total_weight_qq = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_weight_lbs = serializers.DecimalField(max_digits=10, decimal_places=2)
    avg_weight_qq = serializers.DecimalField(max_digits=10, decimal_places=2)
    by_supplier = serializers.ListField()
    by_status = serializers.DictField()
    by_quality = serializers.DictField()
    ocr_success_rate = serializers.DecimalField(max_digits=5, decimal_places=2)

