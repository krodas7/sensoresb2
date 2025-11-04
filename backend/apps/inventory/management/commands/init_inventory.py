from django.core.management.base import BaseCommand
from apps.inventory.models import Category, Product


class Command(BaseCommand):
    help = 'Initialize inventory with sample data'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🔄 Inicializando inventario...'))

        # Crear categorías
        categories_data = [
            {'name': 'Café Verde', 'description': 'Café en grano sin procesar', 'color': 'bg-green-500'},
            {'name': 'Café Tostado', 'description': 'Café procesado y tostado', 'color': 'bg-amber-500'},
            {'name': 'Insumos', 'description': 'Materiales y suministros', 'color': 'bg-blue-500'},
            {'name': 'Equipos', 'description': 'Maquinaria y equipos', 'color': 'bg-purple-500'},
        ]

        for cat_data in categories_data:
            cat, created = Category.objects.get_or_create(name=cat_data['name'], defaults=cat_data)
            if created:
                self.stdout.write(self.style.SUCCESS(f'✅ Categoría creada: {cat.name}'))
            else:
                self.stdout.write(f'ℹ️  Categoría ya existe: {cat.name}')

        # Crear artículos de ejemplo
        products_data = [
            {
                'name': 'Café Arábica Premium',
                'description': 'Café arábica de alta calidad',
                'category_name': 'Café Verde',
                'unit': 'kg',
                'current_stock': 150,
                'min_stock': 50,
                'location': 'Almacén A',
                'status': 'active'
            },
            {
                'name': 'Café Robusta',
                'description': 'Café robusta para mezclas',
                'category_name': 'Café Verde',
                'unit': 'kg',
                'current_stock': 80,
                'min_stock': 30,
                'location': 'Almacén A',
                'status': 'active'
            },
            {
                'name': 'Café Tostado Medio',
                'description': 'Café tostado a punto medio',
                'category_name': 'Café Tostado',
                'unit': 'kg',
                'current_stock': 25,
                'min_stock': 10,
                'location': 'Almacén B',
                'status': 'active'
            },
            {
                'name': 'Sacos de Yute',
                'description': 'Sacos de yute para almacenamiento',
                'category_name': 'Insumos',
                'unit': 'unidad',
                'current_stock': 200,
                'min_stock': 50,
                'location': 'Bodega',
                'status': 'active'
            },
            {
                'name': 'Café Geisha',
                'description': 'Variedad especial de café Geisha',
                'category_name': 'Café Verde',
                'unit': 'kg',
                'current_stock': 20,
                'min_stock': 15,
                'location': 'Almacén A',
                'status': 'active'
            },
        ]

        for prod_data in products_data:
            category = Category.objects.get(name=prod_data.pop('category_name'))
            prod_data['category'] = category
            prod, created = Product.objects.get_or_create(name=prod_data['name'], defaults=prod_data)
            if created:
                self.stdout.write(self.style.SUCCESS(f'✅ Artículo creado: {prod.name}'))
            else:
                self.stdout.write(f'ℹ️  Artículo ya existe: {prod.name}')

        self.stdout.write(self.style.SUCCESS('✨ Datos de inventario inicializados correctamente'))

