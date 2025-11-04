from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'cuppings', views.CuppingViewSet, basename='cupping')
router.register(r'commercial', views.CommercialCuppingViewSet, basename='commercial-cupping')
router.register(r'samples', views.CuppingSampleViewSet, basename='cupping-sample')
router.register(r'cuppers', views.CupperViewSet, basename='cupper')
router.register(r'scores', views.CuppingScoreViewSet, basename='cupping-score')
router.register(r'descriptors', views.CuppingDescriptorViewSet, basename='cupping-descriptor')
router.register(r'participants', views.CuppingSessionParticipantViewSet, basename='cupping-participant')

urlpatterns = [
    path('', include(router.urls)),
]
