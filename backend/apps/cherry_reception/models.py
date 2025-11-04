from django.db import models
from apps.suppliers.models import Supplier
from apps.core.models import User


class CherryReception(models.Model):
    """Registro de recepción de café cereza"""
    
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('processing', 'En Proceso'),
        ('completed', 'Completado'),
        ('rejected', 'Rechazado'),
    ]
    
    QUALITY_CHOICES = [
        ('excellent', 'Excelente'),
        ('good', 'Bueno'),
        ('regular', 'Regular'),
        ('poor', 'Deficiente'),
    ]
    
    # Relaciones
    supplier = models.ForeignKey(
        Supplier, 
        on_delete=models.PROTECT, 
        related_name='cherry_receptions',
        verbose_name='Proveedor'
    )
    received_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='cherry_receptions',
        verbose_name='Recibido por'
    )
    
    # Datos de recepción
    reception_code = models.CharField(
        max_length=50, 
        unique=True, 
        verbose_name='Código de Recepción',
        help_text='Código único de identificación'
    )
    weight_qq = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        verbose_name='Peso (qq)',
        help_text='Peso en quintales extraído de la foto'
    )
    weight_lbs = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Peso (lbs)',
        help_text='Peso en libras (calculado automáticamente)'
    )
    
    # Calidad
    quality = models.CharField(
        max_length=20,
        choices=QUALITY_CHOICES,
        default='good',
        verbose_name='Calidad'
    )
    
    # OCR y datos de imagen
    scale_image = models.ImageField(
        upload_to='cherry_receptions/scales/%Y/%m/%d/',
        verbose_name='Foto del Reloj/Báscula'
    )
    ocr_raw_text = models.TextField(
        blank=True,
        verbose_name='Texto OCR sin procesar',
        help_text='Texto completo extraído de la imagen'
    )
    ocr_confidence = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Confianza OCR (%)'
    )
    ocr_processed = models.BooleanField(
        default=False,
        verbose_name='OCR Procesado'
    )
    manual_correction = models.BooleanField(
        default=False,
        verbose_name='Corrección Manual',
        help_text='Si el peso fue corregido manualmente'
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
    reception_date = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Recepción'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Recepción de Cereza'
        verbose_name_plural = 'Recepciones de Cereza'
        ordering = ['-reception_date']
        indexes = [
            models.Index(fields=['-reception_date']),
            models.Index(fields=['supplier', '-reception_date']),
            models.Index(fields=['status']),
        ]
    
    def save(self, *args, **kwargs):
        # Convertir qq a lbs (1 qq = 100 lbs)
        if self.weight_qq:
            self.weight_lbs = self.weight_qq * 100
        
        # Generar código de recepción si no existe
        if not self.reception_code:
            from django.utils import timezone
            now = timezone.now()
            self.reception_code = f"CR-{now.strftime('%Y%m%d')}-{now.strftime('%H%M%S')}"
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.reception_code} - {self.supplier.name} - {self.weight_qq}qq"


class CherryReceptionImage(models.Model):
    """Imágenes adicionales de la recepción (fotos de muestra, calidad, etc.)"""
    
    IMAGE_TYPE_CHOICES = [
        ('scale', 'Báscula/Reloj'),
        ('sample', 'Muestra de Cereza'),
        ('truck', 'Camión/Vehículo'),
        ('quality', 'Control de Calidad'),
        ('other', 'Otra'),
    ]
    
    reception = models.ForeignKey(
        CherryReception,
        on_delete=models.CASCADE,
        related_name='additional_images',
        verbose_name='Recepción'
    )
    image = models.ImageField(
        upload_to='cherry_receptions/additional/%Y/%m/%d/',
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
        verbose_name = 'Imagen de Recepción'
        verbose_name_plural = 'Imágenes de Recepción'
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f"{self.reception.reception_code} - {self.get_image_type_display()}"

