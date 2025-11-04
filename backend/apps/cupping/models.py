from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.core.models import User
from apps.lots.models import Lot


class Cupping(models.Model):
    PROTOCOL_CHOICES = [
        ('sca', 'SCA Clásico'),
        ('cva', 'CVA 2024'),
        ('coe', 'Cup of Excellence'),
        ('custom', 'Personalizado'),
    ]
    
    BLINDING_CHOICES = [
        ('none', 'No ciego'),
        ('blind', 'Ciego'),
        ('double', 'Doble ciego'),
    ]
    
    LABEL_TYPE_CHOICES = [
        ('alpha', 'Alfabético (A/B/C)'),
        ('numeric', 'Numérico (1/2/3)'),
        ('trilet', '3 Letras (ABC/DEF)'),
    ]
    
    LANGUAGE_CHOICES = [
        ('es', 'Español'),
        ('en', 'English'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Borrador'),
        ('open', 'Abierta'),
        ('closed', 'Cerrada'),
    ]
    
    # Basic info
    name = models.CharField(max_length=200, verbose_name='Nombre de la Sesión', default='Nueva Sesión')
    protocol = models.CharField(max_length=20, choices=PROTOCOL_CHOICES, default='sca', verbose_name='Protocolo')
    blinding = models.CharField(max_length=20, choices=BLINDING_CHOICES, default='blind', verbose_name='Tipo de Cegado')
    label_type = models.CharField(max_length=20, choices=LABEL_TYPE_CHOICES, default='alpha', verbose_name='Tipo de Etiqueta')
    language = models.CharField(max_length=5, choices=LANGUAGE_CHOICES, default='es', verbose_name='Idioma')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', verbose_name='Estado')
    
    # Session details
    description = models.TextField(blank=True, verbose_name='Descripción')
    is_calibration = models.BooleanField(default=False, verbose_name='Es Calibración')
    is_realtime = models.BooleanField(default=True, verbose_name='Tiempo Real')
    
    # Timing
    date = models.DateTimeField(verbose_name='Fecha de Catación')
    opened_at = models.DateTimeField(null=True, blank=True, verbose_name='Abierta en')
    closed_at = models.DateTimeField(null=True, blank=True, verbose_name='Cerrada en')
    
    # Relationships
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_cuppings')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Sesión de Catación'
        verbose_name_plural = 'Sesiones de Catación'
        ordering = ['-date']
    
    def __str__(self):
        return self.name


class CuppingSample(models.Model):
    cupping = models.ForeignKey(Cupping, on_delete=models.CASCADE, related_name='samples')
    lot = models.ForeignKey('lots.Lot', on_delete=models.CASCADE, related_name='cupping_samples', null=True, blank=True)
    blind_code = models.CharField(max_length=50, verbose_name='Código Ciego')
    order = models.PositiveIntegerField(default=1, verbose_name='Orden')
    
    # Coffee details
    origin = models.CharField(max_length=200, blank=True, verbose_name='Origen')
    variety = models.CharField(max_length=100, blank=True, verbose_name='Variedad')
    process = models.CharField(max_length=100, blank=True, verbose_name='Proceso')
    harvest = models.CharField(max_length=20, blank=True, verbose_name='Cosecha')
    
    # Roast details
    roast_date = models.DateField(null=True, blank=True, verbose_name='Fecha de Tueste')
    roast_profile = models.CharField(max_length=100, blank=True, verbose_name='Perfil de Tueste')
    
    # Brewing details
    water = models.CharField(max_length=100, blank=True, verbose_name='Agua')
    grind = models.CharField(max_length=50, blank=True, verbose_name='Molido')
    ratio = models.CharField(max_length=20, blank=True, verbose_name='Ratio')
    temperature = models.CharField(max_length=20, blank=True, verbose_name='Temperatura')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Muestra de Catación'
        verbose_name_plural = 'Muestras de Catación'
        ordering = ['order', 'blind_code']
    
    def __str__(self):
        return f"{self.blind_code} - {self.origin}"


class Cupper(models.Model):
    ROLE_CHOICES = [
        ('admin', 'Administrador'),
        ('qc_leader', 'Líder de Calidad'),
        ('taster', 'Catador'),
        ('guest', 'Invitado'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cupper_profile', null=True, blank=True)
    name = models.CharField(max_length=100, verbose_name='Nombre')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='taster', verbose_name='Rol')
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Catador'
        verbose_name_plural = 'Catadores'
    
    def __str__(self):
        return f"{self.name} ({self.get_role_display()})"


class CuppingScore(models.Model):
    sample = models.ForeignKey(CuppingSample, on_delete=models.CASCADE, related_name='scores')
    cupper = models.ForeignKey(Cupper, on_delete=models.CASCADE, related_name='scores')
    
    # SCA attributes (0-10 scale)
    fragrance = models.FloatField(null=True, blank=True, validators=[MinValueValidator(0), MaxValueValidator(10)])
    aroma = models.FloatField(null=True, blank=True, validators=[MinValueValidator(0), MaxValueValidator(10)])
    flavor = models.FloatField(null=True, blank=True, validators=[MinValueValidator(0), MaxValueValidator(10)])
    aftertaste = models.FloatField(null=True, blank=True, validators=[MinValueValidator(0), MaxValueValidator(10)])
    acidity = models.FloatField(null=True, blank=True, validators=[MinValueValidator(0), MaxValueValidator(10)])
    body = models.FloatField(null=True, blank=True, validators=[MinValueValidator(0), MaxValueValidator(10)])
    uniformity = models.FloatField(null=True, blank=True, validators=[MinValueValidator(0), MaxValueValidator(10)])
    clean_cup = models.FloatField(null=True, blank=True, validators=[MinValueValidator(0), MaxValueValidator(10)])
    sweetness = models.FloatField(null=True, blank=True, validators=[MinValueValidator(0), MaxValueValidator(10)])
    balance = models.FloatField(null=True, blank=True, validators=[MinValueValidator(0), MaxValueValidator(10)])
    overall = models.FloatField(null=True, blank=True, validators=[MinValueValidator(0), MaxValueValidator(10)])
    
    # CVA fields (for CVA protocol)
    descriptive_scores = models.JSONField(default=dict, blank=True, verbose_name='Puntajes Descriptivos')
    affective_scores = models.JSONField(default=dict, blank=True, verbose_name='Puntajes Afectivos')
    
    # Additional fields
    defects = models.CharField(max_length=500, blank=True, verbose_name='Defectos')
    notes = models.TextField(blank=True, verbose_name='Notas')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Puntaje de Catación'
        verbose_name_plural = 'Puntajes de Catación'
        unique_together = ['sample', 'cupper']
    
    @property
    def total_score(self):
        """Calculate total SCA score"""
        sca_attributes = [
            self.fragrance, self.aroma, self.flavor, self.aftertaste,
            self.acidity, self.body, self.uniformity, self.clean_cup,
            self.sweetness, self.balance, self.overall
        ]
        valid_scores = [score for score in sca_attributes if score is not None]
        return sum(valid_scores) if valid_scores else 0
    
    def __str__(self):
        return f"{self.sample.blind_code} - {self.cupper.name}: {self.total_score:.2f}"


class CuppingDescriptor(models.Model):
    """Model for flavor descriptors in the SCA Flavor Wheel"""
    POLARITY_CHOICES = [
        ('positive', 'Positivo'),
        ('negative', 'Negativo'),
    ]
    
    sample = models.ForeignKey(CuppingSample, on_delete=models.CASCADE, related_name='descriptors')
    cupper = models.ForeignKey(Cupper, on_delete=models.CASCADE, related_name='descriptors')
    descriptor = models.CharField(max_length=100, verbose_name='Descriptor')
    intensity = models.PositiveIntegerField(
        default=1, 
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        verbose_name='Intensidad'
    )
    polarity = models.CharField(
        max_length=10, 
        choices=POLARITY_CHOICES, 
        default='positive',
        verbose_name='Polaridad'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Descriptor de Sabor'
        verbose_name_plural = 'Descriptores de Sabor'
        unique_together = ['sample', 'cupper', 'descriptor']
    
    def __str__(self):
        return f"{self.descriptor} ({self.intensity}/10) - {self.sample.blind_code}"


class CuppingSessionParticipant(models.Model):
    """Model to track participants in cupping sessions"""
    cupping = models.ForeignKey(Cupping, on_delete=models.CASCADE, related_name='participants')
    cupper = models.ForeignKey(Cupper, on_delete=models.CASCADE, related_name='sessions')
    joined_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = 'Participante de Sesión'
        verbose_name_plural = 'Participantes de Sesión'
        unique_together = ['cupping', 'cupper']
    
    def __str__(self):
        return f"{self.cupper.name} en {self.cupping.name}"


class CommercialCupping(models.Model):
    """Catación Comercial - Evaluación rápida de producción"""
    
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('aprobado', 'Aprobado'),
        ('rechazado', 'Rechazado'),
    ]
    
    TIPO_CHOICES = [
        ('Estrictamente Duro (SHB)', 'Estrictamente Duro (SHB)'),
        ('Duro (HB)', 'Duro (HB)'),
        ('Semi Duro', 'Semi Duro'),
        ('Extra Prime', 'Extra Prime'),
        ('Prime', 'Prime'),
        ('Supremo', 'Supremo'),
        ('Excelso', 'Excelso'),
        ('Otro', 'Otro'),
    ]
    
    APARIENCIA_CHOICES = [
        ('Excelente', 'Excelente'),
        ('Muy Buena', 'Muy Buena'),
        ('Buena', 'Buena'),
        ('Regular', 'Regular'),
        ('Mala', 'Mala'),
    ]
    
    TUESTE_CHOICES = [
        ('Claro', 'Claro'),
        ('Medio', 'Medio'),
        ('Oscuro', 'Oscuro'),
        ('Muy Oscuro', 'Muy Oscuro'),
    ]
    
    # Campos básicos
    numero_ingreso = models.CharField(max_length=100, unique=True, verbose_name='Número de Ingreso')
    humedad = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0), MaxValueValidator(100)], verbose_name='Humedad (%)')
    rendimiento = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0), MaxValueValidator(100)], verbose_name='Rendimiento (%)')
    qq = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)], default=0, verbose_name='QQ (Peso en quintales)')
    apariencia_verde = models.CharField(max_length=20, choices=APARIENCIA_CHOICES, verbose_name='Apariencia Verde')
    tueste = models.CharField(max_length=20, choices=TUESTE_CHOICES, verbose_name='Tueste')
    QUAKERS_CHOICES = [
        ('No', 'No'),
        ('Pocos', 'Pocos'),
        ('Varios', 'Varios'),
        ('Bastantes', 'Bastantes'),
    ]
    
    quakers = models.CharField(max_length=20, choices=QUAKERS_CHOICES, default='No', verbose_name='Quakers')
    tipo = models.CharField(max_length=50, choices=TIPO_CHOICES, verbose_name='Tipo')
    taza = models.CharField(max_length=200, verbose_name='Taza')
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente', verbose_name='Estado')
    fecha_catacion = models.DateField(verbose_name='Fecha de Catación')
    observaciones = models.TextField(blank=True, verbose_name='Observaciones')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Catación Comercial'
        verbose_name_plural = 'Cataciones Comerciales'
        ordering = ['-fecha_catacion']
    
    def __str__(self):
        return f"{self.numero_ingreso} - {self.fecha_catacion}"
