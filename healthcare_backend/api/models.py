from django.contrib.auth.models import AbstractUser
from django.db import models

# Custom User Model with Roles
class User(AbstractUser):
        ROLE_CHOICES = [
                ('doctor', 'Doctor'),
                ('patient', 'Patient'),
]
        role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='patient')
        phone = models.CharField(max_length=15, blank=True, null=True)  # Removed unique constraint

        def __str__(self):
                return self.get_full_name()
        pass 
# Patient Model
class Patient(models.Model):
        user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="patient_profile")
        date_of_birth = models.DateField()
        medical_history = models.TextField(blank=True)

        def __str__(self):
                return f"Patient: {self.user.get_full_name()}"

# Doctor Model
class Doctor(models.Model):
        user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="doctor_profile")
        specialization = models.CharField(max_length=100)

        def __str__(self):
                return f"Dr. {self.user.get_full_name()} - {self.specialization}"

# Appointment Model
class Appointment(models.Model):
        patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="appointments")
        doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name="appointments" ,default=1)
        date = models.DateTimeField()
        status = models.CharField(
        max_length=20, 
        choices=[('Scheduled', 'Scheduled'), ('Completed', 'Completed')],
        default='Scheduled'
)
        def __str__(self):
                return f"Appointment with Dr. {self.doctor.user.get_full_name()} on {self.date}"
