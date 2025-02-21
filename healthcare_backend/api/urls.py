from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import UserProfileViewSet, AppointmentViewSet

# Create a router and register viewsets
router = DefaultRouter()
router.register(r'users', UserProfileViewSet)
router.register(r'appointments', AppointmentViewSet)

# Define urlpatterns
urlpatterns = [
    path('', include(router.urls)),  # This will handle API routes
]
