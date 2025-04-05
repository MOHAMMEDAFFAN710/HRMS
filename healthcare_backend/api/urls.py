from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import DoctorViewSet, PatientViewSet, AppointmentViewSet 
from api import views 

# Explicit import using app name
# Create a router and register viewsets
router = DefaultRouter()
#router.register(r'users', UserProfileViewSet)
router.register(r'appointments', AppointmentViewSet)
router.register(r'doctors', DoctorViewSet)  # /api/doctors/
router.register(r'patients', PatientViewSet)  # /api/patients/
# Define urlpatterns
urlpatterns = [

    path('api/', include(router.urls)),
    path('health-check/', views.health_check),
    
    
    path('register/', views.register, name='register'),
    path('login/', views.user_login, name='login'),
    path('logout/', views.user_logout, name='logout'),
    path('current-user/', views.current_user, name='current-user'),
    
    path('test/', views.health_check, name='health_check'),
    # This will handle API routes
]
