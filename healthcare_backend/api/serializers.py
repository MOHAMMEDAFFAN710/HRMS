from rest_framework import serializers
from .models import  Appointment , Doctor , Patient
"""class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = '__all__'
        """

class DoctorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Doctor
        fields = '__all__'  # Or specify required fields
        extra_kwargs = {'user': {'read_only': True}}
class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = '__all__'
        extra_kwargs = {'user': {'read_only': True}}
        
class AppointmentSerializer(serializers.ModelSerializer):
    doctor = DoctorSerializer(read_only=True)
    patient = PatientSerializer(read_only=True)
    
    class Meta:
        model = Appointment
        fields = '__all__'