from rest_framework import serializers
from .models import Transformation, TransformationImage
from apps.lots.serializers import LotSerializer


class TransformationImageSerializer(serializers.ModelSerializer):
    """Serializer para imágenes adicionales"""
    
    class Meta:
        model = TransformationImage
        fields = ['id', 'transformation', 'image', 'image_type', 'description', 'uploaded_at']
        read_only_fields = ['uploaded_at']


class TransformationSerializer(serializers.ModelSerializer):
    """Serializer para transformación"""
    
    lot_details = LotSerializer(source='lot', read_only=True)
    processed_by_name = serializers.CharField(source='processed_by.get_full_name', read_only=True)
    additional_images = TransformationImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Transformation
        fields = [
            'id', 'transformation_code', 'lot', 'lot_details',
            'processed_by', 'processed_by_name',
            'weight_qq', 'weight_lbs', 'yield_percentage',
            'voucher_image', 'ocr_raw_text',
            'ocr_weight_confidence', 'ocr_yield_confidence',
            'ocr_processed', 'manual_correction',
            'status', 'observations',
            'transformation_date', 'created_at', 'updated_at',
            'additional_images'
        ]
        read_only_fields = [
            'transformation_code', 'weight_lbs', 'ocr_raw_text',
            'ocr_weight_confidence', 'ocr_yield_confidence',
            'ocr_processed', 'transformation_date',
            'created_at', 'updated_at'
        ]


class TransformationCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear transformación con OCR automático"""
    
    class Meta:
        model = Transformation
        fields = ['lot', 'voucher_image', 'observations', 'processed_by']
    
    def create(self, validated_data):
        """Crear transformación y procesar OCR automáticamente"""
        from .ocr_service import VoucherOCRService
        
        voucher_image = validated_data.get('voucher_image')
        
        if voucher_image:
            # Guardar instancia
            instance = super().create(validated_data)
            
            # Extraer datos con OCR
            ocr_result = VoucherOCRService.extract_data_from_voucher(instance.voucher_image.path)
            
            # Actualizar con datos de OCR
            instance.ocr_raw_text = ocr_result.get('raw_text', '')
            instance.ocr_weight_confidence = ocr_result.get('weight_confidence', 0.0)
            instance.ocr_yield_confidence = ocr_result.get('yield_confidence', 0.0)
            instance.ocr_processed = True
            
            # Extraer peso
            extracted_weight = ocr_result.get('weight')
            if extracted_weight:
                instance.weight_qq = extracted_weight
            else:
                instance.weight_qq = 0.0
                instance.manual_correction = True
            
            # Extraer rendimiento
            extracted_yield = ocr_result.get('yield_percentage')
            if extracted_yield:
                instance.yield_percentage = extracted_yield
            else:
                instance.yield_percentage = 0.0
                instance.manual_correction = True
            
            # Determinar estado
            if extracted_weight and extracted_yield:
                instance.status = 'processing'
            else:
                instance.status = 'pending'
            
            instance.save()
            return instance
        else:
            return super().create(validated_data)


class TransformationStatsSerializer(serializers.Serializer):
    """Serializer para estadísticas de transformación"""
    
    total_transformations = serializers.IntegerField()
    total_weight_qq = serializers.DecimalField(max_digits=10, decimal_places=2)
    avg_yield_percentage = serializers.DecimalField(max_digits=5, decimal_places=2)
    by_status = serializers.DictField()
    ocr_success_rate = serializers.DecimalField(max_digits=5, decimal_places=2)
    recent_transformations = TransformationSerializer(many=True)

