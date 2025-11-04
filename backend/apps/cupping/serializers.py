from rest_framework import serializers
from .models import (
    Cupping, CuppingSample, Cupper, CuppingScore, 
    CuppingDescriptor, CuppingSessionParticipant, CommercialCupping
)


class CupperSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cupper
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


class CuppingDescriptorSerializer(serializers.ModelSerializer):
    class Meta:
        model = CuppingDescriptor
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


class CuppingScoreSerializer(serializers.ModelSerializer):
    total_score = serializers.ReadOnlyField()
    descriptors = CuppingDescriptorSerializer(many=True, read_only=True)
    
    class Meta:
        model = CuppingScore
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class CuppingSampleSerializer(serializers.ModelSerializer):
    scores = CuppingScoreSerializer(many=True, read_only=True)
    descriptors = CuppingDescriptorSerializer(many=True, read_only=True)
    
    class Meta:
        model = CuppingSample
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


class CuppingSessionParticipantSerializer(serializers.ModelSerializer):
    cupper = CupperSerializer(read_only=True)
    
    class Meta:
        model = CuppingSessionParticipant
        fields = '__all__'
        read_only_fields = ['id', 'joined_at']


class CuppingSerializer(serializers.ModelSerializer):
    samples = CuppingSampleSerializer(many=True, read_only=True)
    participants = CuppingSessionParticipantSerializer(many=True, read_only=True)
    creator_name = serializers.CharField(source='creator.get_full_name', read_only=True)
    
    class Meta:
        model = Cupping
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class CuppingCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating cupping sessions"""
    class Meta:
        model = Cupping
        fields = [
            'name', 'protocol', 'blinding', 'label_type', 'language',
            'description', 'is_calibration', 'is_realtime', 'date', 'creator', 'status'
        ]


class CuppingScoreCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating cupping scores"""
    descriptors = CuppingDescriptorSerializer(many=True, required=False)
    
    class Meta:
        model = CuppingScore
        fields = [
            'sample', 'cupper', 'fragrance', 'aroma', 'flavor', 'aftertaste',
            'acidity', 'body', 'uniformity', 'clean_cup', 'sweetness',
            'balance', 'overall', 'descriptive_scores', 'affective_scores',
            'defects', 'notes', 'descriptors'
        ]
    
    def create(self, validated_data):
        descriptors_data = validated_data.pop('descriptors', [])
        score = CuppingScore.objects.create(**validated_data)
        
        for descriptor_data in descriptors_data:
            CuppingDescriptor.objects.create(score=score, **descriptor_data)
        
        return score


class CommercialCuppingSerializer(serializers.ModelSerializer):
    """Serializer for commercial cupping"""
    class Meta:
        model = CommercialCupping
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
