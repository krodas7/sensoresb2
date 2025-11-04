from django.urls import path
from . import views

urlpatterns = [
    # CRUD
    path('', views.TransformationListCreateView.as_view(), name='transformation-list'),
    path('<int:pk>/', views.TransformationDetailView.as_view(), name='transformation-detail'),
    
    # OCR y actualización
    path('<int:pk>/process-ocr/', views.process_ocr, name='transformation-process-ocr'),
    path('<int:pk>/update-data/', views.update_data_manually, name='transformation-update-data'),
    
    # Imágenes adicionales
    path('images/', views.TransformationImageUploadView.as_view(), name='transformation-image-upload'),
    
    # Estadísticas
    path('stats/', views.transformation_stats, name='transformation-stats'),
]

