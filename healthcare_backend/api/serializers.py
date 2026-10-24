from datetime import datetime, timedelta

from django.utils import timezone
from rest_framework import serializers
from .models import Appointment, Availability, Consultation, Doctor, Message, Notification, Patient, Prescription, User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name", "role", "phone", "preferred_language")


class PatientSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Patient
        fields = "__all__"


class DoctorSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    avatar_initials = serializers.SerializerMethodField()
    online_now = serializers.SerializerMethodField()
    next_available_at = serializers.SerializerMethodField()

    class Meta:
        model = Doctor
        fields = "__all__"

    def get_avatar_initials(self, doctor):
        name = doctor.user.get_full_name() or doctor.user.username
        return "".join(part[0] for part in name.split()[:2]).upper()

    def get_online_now(self, doctor):
        current = timezone.localtime()
        return doctor.availability.filter(
            weekday=current.weekday(), active=True,
            start_time__lte=current.time(), end_time__gte=current.time(),
        ).exists()

    def get_next_available_at(self, doctor):
        current = timezone.localtime()
        for day_offset in range(14):
            day = current.date() + timedelta(days=day_offset)
            availability = doctor.availability.filter(weekday=day.weekday(), active=True).first()
            if availability:
                candidate = timezone.make_aware(datetime.combine(day, availability.start_time))
                if candidate > current:
                    return candidate.isoformat()
        return None


class AvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Availability
        fields = "__all__"
        read_only_fields = ("doctor",)


class AppointmentSerializer(serializers.ModelSerializer):
    doctor = DoctorSerializer(read_only=True)
    patient = PatientSerializer(read_only=True)
    doctor_id = serializers.PrimaryKeyRelatedField(source="doctor", queryset=Doctor.objects.all(), write_only=True)

    class Meta:
        model = Appointment
        fields = "__all__"
        read_only_fields = ("patient", "status", "created_at")


class ConsultationSerializer(serializers.ModelSerializer):
    appointment = AppointmentSerializer(read_only=True)

    class Meta:
        model = Consultation
        fields = "__all__"
        read_only_fields = ("room_id", "started_at", "ended_at")


class PrescriptionSerializer(serializers.ModelSerializer):
    doctor = DoctorSerializer(read_only=True)
    patient = PatientSerializer(read_only=True)

    class Meta:
        model = Prescription
        fields = "__all__"
        read_only_fields = ("doctor", "patient")


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = "__all__"
        read_only_fields = ("sender", "consultation", "created_at")


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = "__all__"
        read_only_fields = ("recipient", "created_at")