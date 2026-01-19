from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import BlueprintViewSet, ContractViewSet

router = DefaultRouter()
router.register(r"blueprints", BlueprintViewSet, basename="blueprint")
router.register(r"contracts", ContractViewSet, basename="contract")

urlpatterns = [
    path("", include(router.urls)),
]


