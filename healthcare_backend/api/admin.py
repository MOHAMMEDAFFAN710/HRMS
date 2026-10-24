from django.contrib import admin
from .models import Appointment, Availability, Consultation, Doctor, Message, Notification, Patient, Prescription, User

admin.site.register(User)
admin.site.register(Patient)
admin.site.register(Doctor)
admin.site.register(Appointment)
admin.site.register(Availability)
admin.site.register(Consultation)
admin.site.register(Prescription)
admin.site.register(Message)
admin.site.register(Notification)
