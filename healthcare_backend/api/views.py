from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate, login, logout
from rest_framework.authtoken.models import Token
from .models import Doctor, Patient, Appointment, User
from .serializers import (
    DoctorSerializer,
    PatientSerializer,
    AppointmentSerializer,
    #UserProfileSerializer
)
from django.http import JsonResponse

# Health Check Endpoint (your existing code)
def health_check(request):
    return JsonResponse({"status": "backend connected"})

# Authentication Views (new code)
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    data = request.data
    user = User.objects.create_user(
        username=data['username'],
        password=data['password'],
        email=data.get('email', ''),
        first_name=data.get('first_name', ''),
        last_name=data.get('last_name', '')
    )
    token, _ = Token.objects.get_or_create(user=user)
    return Response({'token': token.key}, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([AllowAny])
def user_login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)
    if user:
        login(request, user)
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name
            }
        })
    return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def user_logout(request):
    logout(request)
    request.auth.delete()  # Delete the token
    return Response({'message': 'Logged out'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    user = request.user
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name
    })

# Your existing ViewSets with added authentication (modified)
class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def current_doctor(self, request):
        try:
            doctor = Doctor.objects.get(user=request.user)
            serializer = self.get_serializer(doctor)
            return Response(serializer.data)
        except Doctor.DoesNotExist:
            return Response({'error': 'Doctor profile not found'}, status=status.HTTP_404_NOT_FOUND)

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def current_patient(self, request):
        try:
            patient = Patient.objects.get(user=request.user)
            serializer = self.get_serializer(patient)
            return Response(serializer.data)
        except Patient.DoesNotExist:
            return Response({'error': 'Patient profile not found'}, status=status.HTTP_404_NOT_FOUND)

class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Filter appointments to only show those related to the current user
        user = self.request.user
        if hasattr(user, 'doctor'):
            return Appointment.objects.filter(doctor=user.doctor)
        elif hasattr(user, 'patient'):
            return Appointment.objects.filter(patient=user.patient)
        return Appointment.objects.none()

    def perform_create(self, serializer):
        # Automatically assign the patient when creating an appointment
        if hasattr(self.request.user, 'patient'):
            serializer.save(patient=self.request.user.patient)
        else:
            serializer.save()

# Uncomment if you want to use UserProfile
"""class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]"""