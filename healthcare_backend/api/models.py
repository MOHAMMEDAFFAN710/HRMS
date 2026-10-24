from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
        ROLE_CHOICES = (("patient", "Patient"), ("doctor", "Doctor"), ("admin", "Admin"))
        role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="patient")
        phone = models.CharField(max_length=30, blank=True)
        preferred_language = models.CharField(max_length=80, blank=True)

        def __str__(self):
                return self.get_full_name() or self.username


class Patient(models.Model):
        user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="patient_profile")
        date_of_birth = models.DateField(null=True, blank=True)
        medical_history = models.TextField(blank=True)
        allergies = models.TextField(blank=True)
        emergency_contact = models.CharField(max_length=120, blank=True)

        def __str__(self):
                return f"Patient: {self.user}"


class Doctor(models.Model):
        user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="doctor_profile")
        specialization = models.CharField(max_length=100)
        languages = models.JSONField(default=list, blank=True)
        experience_years = models.PositiveIntegerField(default=0)
        bio = models.TextField(blank=True)
        consultation_fee = models.DecimalField(max_digits=8, decimal_places=2, default=0)
        is_accepting_patients = models.BooleanField(default=True)

        def __str__(self):
                return f"Dr. {self.user.get_full_name() or self.user.username} - {self.specialization}"


class Availability(models.Model):
        doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name="availability")
        weekday = models.PositiveSmallIntegerField()
        start_time = models.TimeField()
        end_time = models.TimeField()
        slot_minutes = models.PositiveIntegerField(default=30)
        active = models.BooleanField(default=True)

        class Meta:
                ordering = ("weekday", "start_time")


class Appointment(models.Model):
        AVAILABLE = "AVAILABLE"
        BOOKED = "BOOKED"
        CONFIRMED = "CONFIRMED"
        IN_PROGRESS = "IN_PROGRESS"
        COMPLETED = "COMPLETED"
        CANCELLED = "CANCELLED"
        STATUS_CHOICES = tuple((value, value.replace("_", " ").title()) for value in (
                AVAILABLE, BOOKED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED
        ))

        patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="appointments")
        doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name="appointments")
        start_at = models.DateTimeField()
        end_at = models.DateTimeField()
        status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=BOOKED)
        reason = models.CharField(max_length=255, blank=True)
        created_at = models.DateTimeField(auto_now_add=True)

        class Meta:
                ordering = ("start_at",)
                constraints = [models.UniqueConstraint(fields=("doctor", "start_at"), name="unique_doctor_appointment_start")]

        def __str__(self):
                return f"{self.doctor} with {self.patient} on {self.start_at}"


class Consultation(models.Model):
        appointment = models.OneToOneField(Appointment, on_delete=models.CASCADE, related_name="consultation")
        notes = models.TextField(blank=True)
        started_at = models.DateTimeField(null=True, blank=True)
        ended_at = models.DateTimeField(null=True, blank=True)
        room_id = models.CharField(max_length=80, unique=True)


class ConsultationSocketTicket(models.Model):
        token_hash = models.CharField(max_length=64, unique=True)
        consultation = models.ForeignKey(Consultation, on_delete=models.CASCADE, related_name="socket_tickets")
        user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="consultation_socket_tickets")
        expires_at = models.DateTimeField()
        used_at = models.DateTimeField(null=True, blank=True)
        created_at = models.DateTimeField(auto_now_add=True)

        class Meta:
                indexes = [models.Index(fields=("expires_at", "used_at"))]


class Prescription(models.Model):
        consultation = models.ForeignKey(Consultation, on_delete=models.CASCADE, related_name="prescriptions")
        patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="prescriptions")
        doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name="prescriptions")
        medicines = models.JSONField(default=list)
        follow_up_date = models.DateField(null=True, blank=True)
        instructions = models.TextField(blank=True)
        created_at = models.DateTimeField(auto_now_add=True)

        class Meta:
                ordering = ("-created_at",)


class Message(models.Model):
        consultation = models.ForeignKey(Consultation, on_delete=models.CASCADE, related_name="messages")
        sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_messages")
        text = models.TextField()
        created_at = models.DateTimeField(auto_now_add=True)

        class Meta:
                ordering = ("created_at",)


class Notification(models.Model):
        recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
        title = models.CharField(max_length=160)
        message = models.TextField()
        read = models.BooleanField(default=False)
        created_at = models.DateTimeField(auto_now_add=True)

        class Meta:
                ordering = ("-created_at",)
