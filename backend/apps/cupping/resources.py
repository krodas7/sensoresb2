"""
Import/Export resources para módulo de catación
"""
from import_export import resources, fields
from import_export.widgets import ForeignKeyWidget, DateWidget
from .models import Cupping, CuppingSample, CuppingScore, Cupper, CommercialCupping


class CommercialCuppingResource(resources.ModelResource):
    """Resource para importar/exportar cataciones comerciales"""
    
    class Meta:
        model = CommercialCupping
        fields = ('id', 'numero_ingreso', 'humedad', 'rendimiento', 
                 'apariencia_verde', 'tueste', 'quakers', 'tipo', 
                 'taza', 'estado', 'fecha_catacion', 'observaciones')
        export_order = ('id', 'numero_ingreso', 'tipo', 'fecha_catacion', 
                       'estado', 'humedad', 'rendimiento')
        
    def dehydrate_humedad(self, obj):
        """Format humidity for export"""
        return f"{obj.humedad}%"
    
    def dehydrate_rendimiento(self, obj):
        """Format yield for export"""
        return f"{obj.rendimiento}%"


class CupperResource(resources.ModelResource):
    """Resource para importar/exportar catadores"""
    user = fields.Field(
        column_name='user',
        attribute='user',
        widget=ForeignKeyWidget(model='auth.User', field='username')
    )
    
    class Meta:
        model = Cupper
        fields = ('id', 'name', 'role', 'is_active', 'user')
        export_order = ('id', 'name', 'role', 'is_active')


class CuppingResource(resources.ModelResource):
    """Resource para importar/exportar sesiones de catación"""
    creator = fields.Field(
        column_name='creator',
        attribute='creator',
        widget=ForeignKeyWidget(model='core.User', field='username')
    )
    date = fields.Field(
        column_name='date',
        attribute='date',
        widget=DateWidget(format='%Y-%m-%d')
    )
    
    class Meta:
        model = Cupping
        fields = ('id', 'name', 'protocol', 'date', 'status', 'creator', 
                 'blinding', 'label_type', 'language', 'is_calibration')
        export_order = ('id', 'name', 'date', 'protocol', 'status')


class CuppingSampleResource(resources.ModelResource):
    """Resource para importar/exportar muestras de catación"""
    cupping = fields.Field(
        column_name='cupping',
        attribute='cupping',
        widget=ForeignKeyWidget(model=Cupping, field='name')
    )
    
    class Meta:
        model = CuppingSample
        fields = ('id', 'cupping', 'blind_code', 'lot', 'origin', 
                 'variety', 'process', 'order')
        export_order = ('id', 'blind_code', 'cupping', 'lot', 'variety')


class CuppingScoreResource(resources.ModelResource):
    """Resource para importar/exportar scores de catación"""
    sample = fields.Field(
        column_name='sample',
        attribute='sample',
        widget=ForeignKeyWidget(model=CuppingSample, field='blind_code')
    )
    cupper = fields.Field(
        column_name='cupper',
        attribute='cupper',
        widget=ForeignKeyWidget(model=Cupper, field='name')
    )
    
    class Meta:
        model = CuppingScore
        fields = ('id', 'sample', 'cupper', 'fragrance', 'aroma', 'flavor',
                 'aftertaste', 'acidity', 'body', 'uniformity', 'clean_cup',
                 'sweetness', 'balance', 'overall', 'defects', 'notes')
        export_order = ('id', 'sample', 'cupper', 'fragrance', 'flavor', 
                       'acidity', 'body', 'overall')
    
    def dehydrate_defects(self, obj):
        """Convert defects to readable format"""
        try:
            return float(obj.defects)
        except:
            return obj.defects

