from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg, Count, Q
from django.utils import timezone
from django.http import HttpResponse
from django.template.loader import render_to_string
from django.conf import settings
import json
import base64
from io import BytesIO
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from .models import (
    Cupping, CuppingSample, Cupper, CuppingScore, 
    CuppingDescriptor, CuppingSessionParticipant, CommercialCupping
)
from .serializers import (
    CuppingSerializer, CuppingCreateSerializer, CuppingSampleSerializer,
    CupperSerializer, CuppingScoreSerializer, CuppingScoreCreateSerializer,
    CuppingDescriptorSerializer, CuppingSessionParticipantSerializer,
    CommercialCuppingSerializer
)


class CuppingViewSet(viewsets.ModelViewSet):
    queryset = Cupping.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CuppingCreateSerializer
        return CuppingSerializer
    
    @action(detail=True, methods=['post'])
    def open_session(self, request, pk=None):
        """Open a cupping session"""
        cupping = self.get_object()
        if cupping.status != 'draft':
            return Response(
                {'error': 'Solo se pueden abrir sesiones en estado borrador'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cupping.status = 'open'
        cupping.opened_at = timezone.now()
        cupping.save()
        
        return Response({'status': 'Sesión abierta exitosamente'})
    
    @action(detail=True, methods=['post'])
    def close_session(self, request, pk=None):
        """Close a cupping session"""
        cupping = self.get_object()
        if cupping.status != 'open':
            return Response(
                {'error': 'Solo se pueden cerrar sesiones abiertas'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cupping.status = 'closed'
        cupping.closed_at = timezone.now()
        cupping.save()
        
        return Response({'status': 'Sesión cerrada exitosamente'})
    
    @action(detail=True, methods=['get'])
    def analysis(self, request, pk=None):
        """Get analysis data for a cupping session"""
        cupping = self.get_object()
        
        # Calculate sample statistics
        samples_data = []
        for sample in cupping.samples.all():
            scores = sample.scores.all()
            if scores.exists():
                avg_score = scores.aggregate(avg=Avg('total_score'))['avg']
                score_count = scores.count()
                scores_list = [s.total_score for s in scores]
                
                # Calculate standard deviation
                if len(scores_list) > 1:
                    mean = sum(scores_list) / len(scores_list)
                    variance = sum((x - mean) ** 2 for x in scores_list) / len(scores_list)
                    std_dev = variance ** 0.5
                else:
                    std_dev = 0
                
                samples_data.append({
                    'id': sample.id,
                    'blind_code': sample.blind_code,
                    'origin': sample.origin,
                    'average_score': round(avg_score, 2),
                    'score_count': score_count,
                    'standard_deviation': round(std_dev, 2),
                    'scores': scores_list
                })
        
        # Calculate cupper statistics
        cuppers_data = []
        for participant in cupping.participants.all():
            cupper = participant.cupper
            cupper_scores = CuppingScore.objects.filter(
                cupper=cupper, 
                sample__cupping=cupping
            )
            
            if cupper_scores.exists():
                avg_score = cupper_scores.aggregate(avg=Avg('total_score'))['avg']
                score_count = cupper_scores.count()
                
                cuppers_data.append({
                    'id': cupper.id,
                    'name': cupper.name,
                    'role': cupper.role,
                    'average_score': round(avg_score, 2),
                    'score_count': score_count
                })
        
        return Response({
            'session': CuppingSerializer(cupping).data,
            'samples': samples_data,
            'cuppers': cuppers_data
        })
    
    @action(detail=True, methods=['get'])
    def flavor_wheel(self, request, pk=None):
        """Get flavor wheel data for a cupping session"""
        cupping = self.get_object()
        
        # Get all descriptors for this session
        descriptors = CuppingDescriptor.objects.filter(
            sample__cupping=cupping
        ).values('descriptor', 'intensity', 'polarity').annotate(
            avg_intensity=Avg('intensity'),
            count=Count('id')
        )
        
        # Group by polarity
        positive_descriptors = [
            d for d in descriptors if d['polarity'] == 'positive'
        ]
        negative_descriptors = [
            d for d in descriptors if d['polarity'] == 'negative'
        ]
        
        return Response({
            'positive_descriptors': positive_descriptors,
            'negative_descriptors': negative_descriptors
        })


class CuppingSampleViewSet(viewsets.ModelViewSet):
    queryset = CuppingSample.objects.all()
    serializer_class = CuppingSampleSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        cupping_id = self.request.query_params.get('cupping_id')
        if cupping_id:
            queryset = queryset.filter(cupping_id=cupping_id)
        return queryset


class CupperViewSet(viewsets.ModelViewSet):
    queryset = Cupper.objects.all()
    serializer_class = CupperSerializer


class CuppingScoreViewSet(viewsets.ModelViewSet):
    queryset = CuppingScore.objects.all()
    
    def get_serializer_class(self):
        if self.action in ['create', 'update']:
            return CuppingScoreCreateSerializer
        return CuppingScoreSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        sample_id = self.request.query_params.get('sample_id')
        cupper_id = self.request.query_params.get('cupper_id')
        
        if sample_id:
            queryset = queryset.filter(sample_id=sample_id)
        if cupper_id:
            queryset = queryset.filter(cupper_id=cupper_id)
            
        return queryset


class CuppingDescriptorViewSet(viewsets.ModelViewSet):
    queryset = CuppingDescriptor.objects.all()
    serializer_class = CuppingDescriptorSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        sample_id = self.request.query_params.get('sample_id')
        cupper_id = self.request.query_params.get('cupper_id')
        
        if sample_id:
            queryset = queryset.filter(sample_id=sample_id)
        if cupper_id:
            queryset = queryset.filter(cupper_id=cupper_id)
            
        return queryset


class CuppingSessionParticipantViewSet(viewsets.ModelViewSet):
    queryset = CuppingSessionParticipant.objects.all()
    serializer_class = CuppingSessionParticipantSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        cupping_id = self.request.query_params.get('cupping_id')
        if cupping_id:
            queryset = queryset.filter(cupping_id=cupping_id)
        return queryset


class CommercialCuppingViewSet(viewsets.ModelViewSet):
    queryset = CommercialCupping.objects.all()
    serializer_class = CommercialCuppingSerializer
    
    @action(detail=False, methods=['post'], url_path='generate-pdf')
    def generate_pdf(self, request):
        """Generate stylish professional PDF report for commercial cupping"""
        try:
            # Obtener datos del formulario
            data = json.loads(request.data.get('data', '{}'))
            photos = []
            
            # Procesar fotos
            for key, value in request.FILES.items():
                if key.startswith('photo_'):
                    photos.append(value)
            
            # Crear PDF ultra compacto
            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=15, leftMargin=15, topMargin=15, bottomMargin=15)
            styles = getSampleStyleSheet()
            
            # Estilos con personalidad
            title_style = ParagraphStyle(
                'StylishTitle',
                parent=styles['Heading1'],
                fontSize=24,
                spaceAfter=15,
                alignment=1,  # Centrado
                textColor=colors.HexColor('#2c3e50'),
                fontName='Helvetica-Bold'
            )
            
            subtitle_style = ParagraphStyle(
                'StylishSubtitle',
                parent=styles['Heading2'],
                fontSize=16,
                spaceAfter=15,
                textColor=colors.HexColor('#2c3e50'),
                fontName='Helvetica-Bold'
            )
            
            label_style = ParagraphStyle(
                'StylishLabel',
                parent=styles['Normal'],
                fontSize=12,
                spaceAfter=8,
                textColor=colors.HexColor('#34495e'),
                fontName='Helvetica-Bold'
            )
            
            value_style = ParagraphStyle(
                'StylishValue',
                parent=styles['Normal'],
                fontSize=12,
                spaceAfter=8,
                textColor=colors.HexColor('#2c3e50'),
                fontName='Helvetica'
            )
            
            # Contenido del PDF
            story = []
            
            # Header con estilo
            header_table = Table([
                [Paragraph("BENEFICIO SANTO DOMINGO", title_style)]
            ], colWidths=[7.5*inch])
            header_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#ecf0f1')),
                ('BOX', (0, 0), (-1, -1), 2, colors.HexColor('#bdc3c7')),
                ('PADDING', (0, 0), (-1, -1), 20),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ]))
            
            story.append(header_table)
            story.append(Spacer(1, 5))
            
            # Información general
            story.append(Paragraph("INFORMACIÓN GENERAL", subtitle_style))
            
            info_data = [
                ['Número de Ingreso:', data.get('numero_ingreso', 'N/A')],
                ['Fecha de Catación:', data.get('fecha_catacion', 'N/A')],
                ['Estado:', data.get('estado', 'N/A')],
                ['Tipo de Café:', data.get('tipo', 'N/A')],
                ['QQ (Quintales):', f"{data.get('qq', 'N/A')} QQ"],
            ]
            
            info_table = Table(info_data, colWidths=[1.8*inch, 3.2*inch])
            info_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f8f9fa')),
                ('BACKGROUND', (1, 0), (1, -1), colors.HexColor('#ffffff')),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#2c3e50')),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('LEFTPADDING', (0, 0), (-1, -1), 8),
                ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e9ecef')),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ]))
            
            story.append(info_table)
            story.append(Spacer(1, 5))
            
            # Características del café
            story.append(Paragraph("CARACTERÍSTICAS DEL CAFÉ", subtitle_style))
            
            characteristics_data = [
                ['Humedad (%):', f"{data.get('humedad', 'N/A')}%"],
                ['Rendimiento (%):', f"{data.get('rendimiento', 'N/A')}%"],
                ['Apariencia Verde:', data.get('apariencia_verde', 'N/A')],
                ['Tueste:', data.get('tueste', 'N/A')],
                ['Quakers:', data.get('quakers', 'N/A')],
                ['Evaluación de Taza:', data.get('taza', 'N/A')],
            ]
            
            char_table = Table(characteristics_data, colWidths=[1.8*inch, 3.2*inch])
            char_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f8f9fa')),
                ('BACKGROUND', (1, 0), (1, -1), colors.HexColor('#ffffff')),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#2c3e50')),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('LEFTPADDING', (0, 0), (-1, -1), 8),
                ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e9ecef')),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ]))
            
            story.append(char_table)
            story.append(Spacer(1, 5))
            
            # Observaciones con estilo profesional
            if data.get('observaciones'):
                story.append(Paragraph("OBSERVACIONES", subtitle_style))
                obs_table = Table([
                    [Paragraph(data.get('observaciones', ''), value_style)]
                ], colWidths=[6*inch])
                obs_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8f9fa')),
                    ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#495057')),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                    ('FONTSIZE', (0, 0), (-1, -1), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
                    ('TOPPADDING', (0, 0), (-1, -1), 10),
                    ('LEFTPADDING', (0, 0), (-1, -1), 10),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 10),
                    ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#dee2e6')),
                ]))
                story.append(obs_table)
                story.append(Spacer(1, 5))
            
            # Fotos con estilo - lado a lado
            if photos:
                story.append(Paragraph("FOTOS DEL CAFÉ", subtitle_style))
                
                # Crear tabla para colocar fotos lado a lado
                photo_images = []
                for i, photo in enumerate(photos[:2]):  # Máximo 2 fotos
                    try:
                        photo_data = photo.read()
                        photo.seek(0)
                        
                        # Crear imagen grande y clara
                        img = Image(BytesIO(photo_data), width=2.8*inch, height=2.2*inch)
                        photo_images.append(img)
                    except Exception as e:
                        print(f"Error procesando foto {i}: {e}")
                        continue
                
                # Si hay fotos, crear tabla para colocarlas lado a lado
                if photo_images:
                    if len(photo_images) == 1:
                        # Una sola foto, centrada
                        photo_table = Table([[photo_images[0]]], colWidths=[2.8*inch])
                    else:
                        # Dos fotos lado a lado
                        photo_table = Table([photo_images], colWidths=[2.8*inch, 2.8*inch])
                    
                    photo_table.setStyle(TableStyle([
                        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                    ]))
                    
                    story.append(photo_table)
                    story.append(Spacer(1, 5))
            
            # Pie de página con estilo profesional
            story.append(Spacer(1, 5))
            footer_table = Table([
                [Paragraph(f"Reporte generado el: {timezone.localtime().strftime('%d/%m/%Y a las %H:%M')}", value_style)]
            ], colWidths=[6*inch])
            footer_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#6c757d')),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#495057')),
            ]))
            story.append(footer_table)
            
            # Construir PDF
            doc.build(story)
            
            # Preparar respuesta
            buffer.seek(0)
            response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="Beneficio_Santo_Domingo_{data.get("numero_ingreso", "reporte")}.pdf"'
            
            return response
            
        except Exception as e:
            return Response(
                {'error': f'Error generando PDF: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
