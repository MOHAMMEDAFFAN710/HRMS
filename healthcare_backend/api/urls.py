from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r"appointments", views.AppointmentViewSet, basename="appointment")
router.register(r"doctors", views.DoctorViewSet, basename="doctor")
router.register(r"patients", views.PatientViewSet, basename="patient")
router.register(r"availability", views.AvailabilityViewSet, basename="availability")
router.register(r"consultations", views.ConsultationViewSet, basename="consultation")
router.register(r"prescriptions", views.PrescriptionViewSet, basename="prescription")
router.register(r"messages", views.MessageViewSet, basename="message")
router.register(r"notifications", views.NotificationViewSet, basename="notification")

urlpatterns = [
    path("", include(router.urls)),
    path("health-check/", views.health_check),
    path("historical-appointments/", views.historical_appointments, name="historical-appointments"),
    path("register/", views.register, name="register"),
    path("login/", views.user_login, name="login"),
    path("logout/", views.user_logout, name="logout"),
    path("current-user/", views.current_user, name="current-user"),
    path("test/", views.health_check, name="health_check"),
]