"""
URLs for sensors app
"""

from django.urls import path
from . import views

urlpatterns = [
    # === Sensores originales ===
    path('', views.SensorListCreateView.as_view(), name='sensor-list'),
    path('<int:pk>/', views.SensorDetailView.as_view(), name='sensor-detail'),
    path('status/', views.sensor_status, name='sensor-status'),
    path('data/', views.receive_sensor_data, name='sensor-data'),
    path('latest/', views.get_sensor_data, name='sensor-latest'),
    
    # === Raspberry Pi endpoints ===
    path('raspberry/', views.RaspberryPiListCreateView.as_view(), name='raspberry-list'),
    path('raspberry/<int:pk>/', views.RaspberryPiDetailView.as_view(), name='raspberry-detail'),
    
    # === Recipiente endpoints ===
    path('recipiente/', views.RecipienteListCreateView.as_view(), name='recipiente-list'),
    path('recipiente/<int:pk>/', views.RecipienteDetailView.as_view(), name='recipiente-detail'),
    
    # === Medición endpoints (Distancia/Llenado) ===
    path('medicion/', views.MedicionListView.as_view(), name='medicion-list'),
    path('medicion/<int:pk>/', views.MedicionDetailView.as_view(), name='medicion-detail'),
    path('medicion/recibir/', views.recibir_mediciones_raspberry, name='recibir-mediciones'),
    path('medicion/resumen/', views.resumen_mediciones, name='resumen-mediciones'),
    path('medicion/estadisticas/', views.estadisticas_mediciones, name='estadisticas-mediciones'),
    
    # === Endpoints separados por tipo (Fermentación/Secado) ===
    path('fermentacion/resumen/', views.resumen_fermentacion, name='resumen-fermentacion'),
    path('secado/resumen/', views.resumen_secado, name='resumen-secado'),
    
    # === Sensores de temperatura endpoints (Guardiolas) ===
    path('temperatura/sensor/', views.SensorTemperaturaListCreateView.as_view(), name='sensor-temperatura-list'),
    path('temperatura/sensor/<int:pk>/', views.SensorTemperaturaDetailView.as_view(), name='sensor-temperatura-detail'),
    
    # === Mediciones de temperatura endpoints ===
    path('temperatura/medicion/', views.MedicionTemperaturaListView.as_view(), name='medicion-temperatura-list'),
    path('temperatura/recibir/', views.recibir_mediciones_temperatura, name='recibir-temperatura'),
    path('temperatura/resumen/', views.resumen_temperaturas, name='resumen-temperaturas'),
    path('temperatura/estadisticas/', views.estadisticas_temperaturas, name='estadisticas-temperaturas'),
]
