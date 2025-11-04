from django.urls import path
from . import views

urlpatterns = [
    # CRUD de recepciones
    path('', views.CherryReceptionListCreateView.as_view(), name='cherry-reception-list'),
    path('<int:pk>/', views.CherryReceptionDetailView.as_view(), name='cherry-reception-detail'),
    
    # Procesamiento OCR
    path('<int:pk>/process-ocr/', views.process_ocr, name='cherry-reception-process-ocr'),
    path('<int:pk>/update-weight/', views.update_weight_manually, name='cherry-reception-update-weight'),
    
    # Imágenes adicionales
    path('images/', views.CherryReceptionImageUploadView.as_view(), name='cherry-reception-image-upload'),
    
    # Estadísticas
    path('stats/', views.reception_stats, name='cherry-reception-stats'),
]

