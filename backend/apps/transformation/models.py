from django.db import models
from apps.lots.models import Lot
from apps.core.models import User


class Transformation(models.Model):
    """Registro de transformación de café cereza a pergamino"""
    
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('processing', 'En Proceso'),
        ('completed', 'Completado'),
        ('verified', 'Verificado'),
    ]
    
    # Relaciones
    lot = models.ForeignKey(
        Lot,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transformations',
        verbose_name='Lote',
        help_text='Lote asociado (opcional)'
    )
    processed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='transformations',
        verbose_name='Procesado por'
    )
    
    # Datos de transformación
    transformation_code = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Código de Transformación',
        help_text='Código único auto-generado'
    )
    
    # Peso
    weight_qq = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Peso Pergamino (qq)',
        help_text='Peso en quintales del café pergamino obtenido'
    )
    weight_lbs = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Peso (lbs)',
        help_text='Peso en libras (calculado automáticamente)'
    )
    
    # Rendimiento
    yield_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        verbose_name='Rendimiento (%)',
        help_text='Porcentaje de rendimiento cereza → pergamino (15-25% típico)'
    )
    
    # Foto del vale
    voucher_image = models.ImageField(
        upload_to='transformations/vouchers/%Y/%m/%d/',
        verbose_name='Foto del Vale',
        help_text='Foto del vale de transformación'
    )
    
    # Datos OCR
    ocr_raw_text = models.TextField(
        blank=True,
        verbose_name='Texto OCR sin procesar'
    )
    ocr_weight_confidence = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Confianza OCR Peso (%)'
    )
    ocr_yield_confidence = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Confianza OCR Rendimiento (%)'
    )
    ocr_processed = models.BooleanField(
        default=False,
        verbose_name='OCR Procesado'
    )
    manual_correction = models.BooleanField(
        default=False,
        verbose_name='Corrección Manual'
    )
    
    # Estado y observaciones
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='Estado'
    )
    observations = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )
    
    # Timestamps
    transformation_date = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Transformación'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Transformación'
        verbose_name_plural = 'Transformaciones'
        ordering = ['-transformation_date']
        indexes = [
            models.Index(fields=['-transformation_date']),
            models.Index(fields=['lot', '-transformation_date']),
            models.Index(fields=['status']),
        ]
    
    def save(self, *args, **kwargs):
        # Convertir qq a lbs (1 qq = 100 lbs)
        if self.weight_qq:
            self.weight_lbs = self.weight_qq * 100
        
        # Generar código si no existe
        if not self.transformation_code:
            from django.utils import timezone
            now = timezone.now()
            self.transformation_code = f"TR-{now.strftime('%Y%m%d')}-{now.strftime('%H%M%S')}"
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.transformation_code} - {self.weight_qq}qq - {self.yield_percentage}%"


class TransformationImage(models.Model):
    """Imágenes adicionales del proceso de transformación"""
    
    IMAGE_TYPE_CHOICES = [
        ('voucher', 'Vale'),
        ('before', 'Antes (Cereza)'),
        ('after', 'Después (Pergamino)'),
        ('process', 'Proceso'),
        ('quality', 'Control de Calidad'),
        ('other', 'Otra'),
    ]
    
    transformation = models.ForeignKey(
        Transformation,
        on_delete=models.CASCADE,
        related_name='additional_images',
        verbose_name='Transformación'
    )
    image = models.ImageField(
        upload_to='transformations/additional/%Y/%m/%d/',
        verbose_name='Imagen'
    )
    image_type = models.CharField(
        max_length=20,
        choices=IMAGE_TYPE_CHOICES,
        default='other',
        verbose_name='Tipo de Imagen'
    )
    description = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Descripción'
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Imagen de Transformación'
        verbose_name_plural = 'Imágenes de Transformación'
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f"{self.transformation.transformation_code} - {self.get_image_type_display()}"

