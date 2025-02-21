from django.db import models

class UserProfile(models.Model):
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15, unique=True)
    email = models.EmailField(unique=True)

class Appointment(models.Model):
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE)
    date = models.DateTimeField()
    doctor_name = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=[('Pending', 'Pending'), ('Completed', 'Completed')])

class Doctor(models.Model):
        name = models.CharField(max_length=100)
        specialty - models.CharField(max_length=100) # type: ignore
    
class Patient(models.Model):
        name = models.CharField(max_length=100)
        age  = models.CharField(max_length=100)
        medical_history = models.TextField()
    
class Appointment(models.Model):
        doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE)
        patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
        date = models.DateTimeField()
        status = models.CharField(max_length=20, choices=[('Scheduled', 'Scheduled'), ('Completed', 'Completed')])