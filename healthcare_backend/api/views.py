import csv
import base64
import hashlib
import hmac
import secrets
import uuid
from datetime import datetime, timedelta
from pathlib import Path

from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError, transaction
from django.db.models import Q
from django.http import JsonResponse
from django.conf import settings
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token

from .models import Appointment, Availability, Consultation, ConsultationSocketTicket, Doctor, Message, Notification, Patient, Prescription, User
from .serializers import AppointmentSerializer, AvailabilitySerializer, ConsultationSerializer, DoctorSerializer, MessageSerializer, NotificationSerializer, PatientSerializer, PrescriptionSerializer, UserSerializer


def health_check(request):
    return JsonResponse({"status": "backend connected"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def historical_appointments(request):
    if request.user.role != "doctor":
        return Response({"error": "Only doctors can access the historical appointment dataset"}, status=403)

    csv_path = Path(__file__).resolve().parent.parent / "data" / "appointments.csv"
    with csv_path.open(newline="", encoding="utf-8") as dataset_file:
        appointments = list(csv.DictReader(dataset_file))

    status_counts = {}
    month_counts = {}
    for appointment in appointments:
        status = appointment["status"]
        month = appointment["appointment_date"][:7]
        status_counts[status] = status_counts.get(status, 0) + 1
        month_counts[month] = month_counts.get(month, 0) + 1

    return Response({
        "total": len(appointments),
        "statuses": [{"status": key, "count": value} for key, value in sorted(status_counts.items())],
        "months": [{"month": key, "count": value} for key, value in sorted(month_counts.items())],
        "appointments": appointments,
    })


def serialize_user(user):
    return UserSerializer(user).data


def notify(user, title, message):
    Notification.objects.create(recipient=user, title=title, message=message)


def owns_consultation(user, consultation):
    return user.is_staff or user in (consultation.appointment.doctor.user, consultation.appointment.patient.user)


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    data = request.data
    email = (data.get("email") or data.get("username") or "").strip().lower()
    username = email
    password = data.get("password")
    role = data.get("role", "patient")
    if not email or not password or role not in ("patient", "doctor"):
        return Response({"error": "Email, password, and a valid role are required"}, status=400)
    if len(password) < 8:
        return Response({"error": "Password must be at least 8 characters"}, status=400)
    date_of_birth = None
    if role == "patient" and data.get("date_of_birth"):
        date_of_birth = parse_date(data["date_of_birth"])
        if not date_of_birth:
            return Response({"error": "Enter a valid date of birth"}, status=400)
    specialization = data.get("specialization", "General Medicine").strip() or "General Medicine"
    try:
        experience_years = int(data.get("experience_years") or 0) if role == "doctor" else 0
        if experience_years < 0:
            raise ValueError
    except (TypeError, ValueError):
        return Response({"error": "Years of experience must be a non-negative whole number"}, status=400)
    languages = data.get("languages", [])
    if isinstance(languages, str):
        languages = [language.strip() for language in languages.split(",") if language.strip()]
    if not isinstance(languages, list):
        return Response({"error": "Languages must be a list of names"}, status=400)
    if User.objects.filter(username__iexact=username).exists() or User.objects.filter(email__iexact=email).exists():
        return Response({"error": "An account with that email already exists"}, status=400)

    with transaction.atomic():
        user = User.objects.create_user(
            username=username,
            password=password,
            email=email,
            first_name=data.get("first_name", "").strip(),
            last_name=data.get("last_name", "").strip(),
            role=role,
            phone=data.get("phone", "").strip(),
            preferred_language=data.get("preferred_language", "").strip(),
        )
        if role == "doctor":
            Doctor.objects.create(
                user=user,
                specialization=specialization,
                languages=languages,
                experience_years=experience_years,
                bio=data.get("bio", "").strip(),
            )
        else:
            Patient.objects.create(
                user=user,
                date_of_birth=date_of_birth,
                medical_history=data.get("medical_history", "").strip(),
                allergies=data.get("allergies", "").strip(),
                emergency_contact=data.get("emergency_contact", "").strip(),
            )
    token, _ = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "user": serialize_user(user)}, status=201)


@api_view(["POST"])
@permission_classes([AllowAny])
def user_login(request):
    username = request.data.get("username") or request.data.get("email")
    user = authenticate(username=username, password=request.data.get("password"))
    if not user:
        return Response({"error": "Invalid credentials"}, status=400)
    expected_role = request.data.get("role")
    if expected_role in ("patient", "doctor") and user.role != expected_role:
        return Response({"error": f"This account is not registered as a {expected_role}"}, status=403)
    login(request, user)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "user": serialize_user(user)})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def user_logout(request):
    logout(request)
    if request.auth:
        request.auth.delete()
    return Response({"message": "Logged out"})


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def current_user(request):
    if request.method == "PATCH":
        for field in ("first_name", "last_name", "email", "phone", "preferred_language"):
            if field in request.data:
                setattr(request.user, field, request.data[field])
        request.user.save()
    return Response(serialize_user(request.user))


class DoctorViewSet(viewsets.ModelViewSet):
    serializer_class = DoctorSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "patch", "head", "options"]

    def update(self, request, *args, **kwargs):
        doctor = self.get_object()
        if not request.user.is_staff and doctor.user != request.user:
            return Response({"error": "You can only update your own doctor profile"}, status=403)
        return super().update(request, *args, **kwargs)

    def get_queryset(self):
        queryset = Doctor.objects.select_related("user").filter(is_accepting_patients=True)
        if self.request.query_params.get("specialization"):
            queryset = queryset.filter(specialization__icontains=self.request.query_params["specialization"])
        if self.request.query_params.get("language"):
            queryset = queryset.filter(languages__icontains=self.request.query_params["language"])
        if self.request.query_params.get("specialization"):
            queryset = queryset.filter(specialization__icontains=self.request.query_params["specialization"])
        if self.request.query_params.get("max_fee"):
            try:
                queryset = queryset.filter(consultation_fee__lte=float(self.request.query_params["max_fee"]))
            except ValueError:
                return queryset.none()
        if self.request.query_params.get("min_fee"):
            try:
                queryset = queryset.filter(consultation_fee__gte=float(self.request.query_params["min_fee"]))
            except ValueError:
                return queryset.none()
        if self.request.query_params.get("online_now") == "true":
            current = timezone.localtime()
            queryset = queryset.filter(
                availability__weekday=current.weekday(),
                availability__active=True,
                availability__start_time__lte=current.time(),
                availability__end_time__gte=current.time(),
            ).distinct()
        if self.request.query_params.get("available") == "true":
            queryset = queryset.filter(availability__active=True).distinct()
        return queryset

    @action(detail=False, methods=["get", "patch"])
    def current_doctor(self, request):
        try:
            doctor = Doctor.objects.get(user=request.user)
        except Doctor.DoesNotExist:
            return Response({"error": "Doctor profile not found"}, status=404)
        if request.method == "PATCH":
            serializer = self.get_serializer(doctor, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
        return Response(self.get_serializer(doctor).data)

    @action(detail=True, methods=["get"])
    def slots(self, request, pk=None):
        doctor = self.get_object()
        start_date = timezone.localdate()
        days = min(int(request.query_params.get("days", 14)), 60)
        booked = set(doctor.appointments.filter(start_at__gte=timezone.now(), status__in=[Appointment.BOOKED, Appointment.CONFIRMED, Appointment.IN_PROGRESS]).values_list("start_at", flat=True))
        slots = []
        for day_offset in range(days):
            day = start_date + timedelta(days=day_offset)
            for availability in doctor.availability.filter(weekday=day.weekday(), active=True):
                current = timezone.make_aware(datetime.combine(day, availability.start_time))
                end = timezone.make_aware(datetime.combine(day, availability.end_time))
                while current + timedelta(minutes=availability.slot_minutes) <= end:
                    if current > timezone.now() and current not in booked:
                        slots.append({"start_at": current.isoformat(), "end_at": (current + timedelta(minutes=availability.slot_minutes)).isoformat()})
                    current += timedelta(minutes=availability.slot_minutes)
        return Response(slots)


class PatientViewSet(viewsets.ModelViewSet):
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "patch", "head", "options"]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Patient.objects.select_related("user").all()
        return Patient.objects.filter(user=self.request.user)

    @action(detail=False, methods=["get", "patch"])
    def current_patient(self, request):
        patient, _ = Patient.objects.get_or_create(user=request.user)
        if request.method == "PATCH":
            serializer = self.get_serializer(patient, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
        return Response(self.get_serializer(patient).data)


class AvailabilityViewSet(viewsets.ModelViewSet):
    serializer_class = AvailabilitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Availability.objects.all()
        return Availability.objects.filter(doctor__user=self.request.user)

    def perform_create(self, serializer):
        if not hasattr(self.request.user, "doctor_profile"):
            raise PermissionError("Only doctors can manage availability")
        serializer.save(doctor=self.request.user.doctor_profile)


class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Appointment.objects.select_related("doctor__user", "patient__user")
        if hasattr(user, "doctor_profile"):
            return Appointment.objects.filter(doctor=user.doctor_profile).select_related("patient__user")
        if hasattr(user, "patient_profile"):
            return Appointment.objects.filter(patient=user.patient_profile).select_related("doctor__user")
        return Appointment.objects.none()

    def create(self, request, *args, **kwargs):
        if not hasattr(request.user, "patient_profile"):
            return Response({"error": "Only patients can book appointments"}, status=403)
        try:
            start_at = datetime.fromisoformat(request.data["start_at"].replace("Z", "+00:00"))
            end_at = datetime.fromisoformat(request.data["end_at"].replace("Z", "+00:00"))
        except (KeyError, ValueError):
            return Response({"error": "Valid start_at and end_at are required"}, status=400)
        if timezone.is_naive(start_at) or timezone.is_naive(end_at):
            return Response({"error": "Appointment times must include a timezone"}, status=400)
        if start_at <= timezone.now() or end_at <= start_at:
            return Response({"error": "Appointment must be in the future and have a valid duration"}, status=400)
        doctor = Doctor.objects.filter(pk=request.data.get("doctor_id"), is_accepting_patients=True).first()
        if not doctor:
            return Response({"error": "Doctor not found or not accepting patients"}, status=404)
        local_start = timezone.localtime(start_at)
        local_end = timezone.localtime(end_at)
        availability_rows = doctor.availability.filter(
            weekday=local_start.weekday(),
            active=True,
            start_time__lte=local_start.time(),
            end_time__gte=local_end.time(),
        )
        slot_is_valid = any(
            (end_at - start_at) == timedelta(minutes=row.slot_minutes)
            and (
                (local_start.replace(tzinfo=None) - datetime.combine(local_start.date(), row.start_time)).total_seconds()
                % (row.slot_minutes * 60) == 0
            )
            for row in availability_rows
        )
        try:
            with transaction.atomic():
                # Report an existing booking conflict before slot-duration errors.
                # This ensures overlapping requests consistently return HTTP 409.
                conflict = Appointment.objects.select_for_update().filter(
                    doctor=doctor,
                    status__in=[Appointment.BOOKED, Appointment.CONFIRMED, Appointment.IN_PROGRESS],
                    start_at__lt=end_at,
                    end_at__gt=start_at,
                ).exists()
                if conflict:
                    return Response(
                        {"error": "That appointment slot overlaps an existing booking"},
                        status=409,
                    )
                if not slot_is_valid:
                    return Response(
                        {"error": "Choose one of the available appointment slots shown for this clinician."},
                        status=400,
                    )
                appointment = Appointment.objects.create(patient=request.user.patient_profile, doctor=doctor, start_at=start_at, end_at=end_at, reason=request.data.get("reason", ""), status=Appointment.BOOKED)
        except IntegrityError:
            return Response({"error": "That appointment slot has already been booked"}, status=409)
        notify(doctor.user, "New appointment request", f"A patient requested an appointment for {start_at:%Y-%m-%d %H:%M}.")
        return Response(self.get_serializer(appointment).data, status=201)

    @action(detail=True, methods=["post"])
    def transition(self, request, pk=None):
        appointment = self.get_object()
        next_status = request.data.get("status")
        user = request.user

        # Patients may cancel only their own request/confirmed appointment.
        # Only the assigned clinician may confirm a booking. Call lifecycle
        # transitions are handled by the consultation endpoints, not this API.
        if next_status == Appointment.CANCELLED:
            if user != appointment.patient.user and user != appointment.doctor.user and not user.is_staff:
                return Response({"error": "You are not allowed to cancel this appointment"}, status=403)
            if appointment.status not in (Appointment.BOOKED, Appointment.CONFIRMED):
                return Response({"error": "Only booked or confirmed appointments can be cancelled"}, status=409)
        elif next_status == Appointment.CONFIRMED:
            if user != appointment.doctor.user and not user.is_staff:
                return Response({"error": "Only the assigned clinician can confirm this appointment"}, status=403)
            if appointment.status != Appointment.BOOKED:
                return Response({"error": "Only booked appointments can be confirmed"}, status=409)
        else:
            return Response({"error": "Unsupported appointment status transition"}, status=400)

        appointment.status = next_status
        appointment.save(update_fields=["status"])
        notify(
            appointment.patient.user,
            "Appointment updated",
            f"Your appointment is now {next_status.replace('_', ' ').lower()}.",
        )
        if next_status == Appointment.CONFIRMED:
            notify(
                appointment.doctor.user,
                "Appointment confirmed",
                f"The appointment for {appointment.start_at:%Y-%m-%d %H:%M} is confirmed.",
            )
        return Response(self.get_serializer(appointment).data)


class ConsultationViewSet(viewsets.ModelViewSet):
    serializer_class = ConsultationSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        queryset = Consultation.objects.select_related("appointment__doctor__user", "appointment__patient__user")
        user = self.request.user
        if user.is_staff:
            return queryset
        return queryset.filter(appointment__doctor__user=user) | queryset.filter(appointment__patient__user=user)

    def create(self, request, *args, **kwargs):
        appointment = Appointment.objects.filter(pk=request.data.get("appointment_id")).first()
        if not appointment or request.user not in (appointment.doctor.user, appointment.patient.user):
            return Response({"error": "Appointment not found"}, status=404)
        if appointment.status not in (Appointment.CONFIRMED, Appointment.IN_PROGRESS):
            return Response({"error": "The appointment must be confirmed before consultation can start"}, status=409)
        consultation, _ = Consultation.objects.get_or_create(appointment=appointment, defaults={"room_id": uuid.uuid4().hex})
        if consultation.ended_at:
            return Response({"error": "This consultation has ended"}, status=409)
        return Response(self.get_serializer(consultation).data, status=201)

    @action(detail=True, methods=["post"], url_path="socket-ticket")
    def socket_ticket(self, request, pk=None):
        consultation = self.get_object()
        if request.user not in (consultation.appointment.patient.user, consultation.appointment.doctor.user):
            return Response({"error": "Not authorized for this consultation"}, status=403)
        if consultation.appointment.status not in (Appointment.CONFIRMED, Appointment.IN_PROGRESS) or consultation.ended_at:
            return Response({"error": "This consultation is not available to join"}, status=409)

        raw_ticket = secrets.token_urlsafe(32)
        ConsultationSocketTicket.objects.create(
            token_hash=hashlib.sha256(raw_ticket.encode("utf-8")).hexdigest(),
            consultation=consultation,
            user=request.user,
            expires_at=timezone.now() + timedelta(seconds=60),
        )
        return Response({"ticket": raw_ticket, "expires_in": 60})

    @action(detail=True, methods=["get"], url_path="ice-configuration")
    def ice_configuration(self, request, pk=None):
        consultation = self.get_object()
        if request.user not in (consultation.appointment.patient.user, consultation.appointment.doctor.user):
            return Response({"error": "Not authorized for this consultation"}, status=403)
        if consultation.ended_at or consultation.appointment.status not in (Appointment.CONFIRMED, Appointment.IN_PROGRESS):
            return Response({"error": "This consultation is not available"}, status=409)

        stun_url = getattr(settings, "WEBRTC_STUN_URL", "stun:stun.l.google.com:19302")
        ice_servers = [{"urls": [stun_url]}] if stun_url else []
        turn_urls = [url.strip() for url in getattr(settings, "WEBRTC_TURN_URLS", "").split(",") if url.strip()]
        turn_secret = getattr(settings, "WEBRTC_TURN_SHARED_SECRET", "")
        ttl = max(300, int(getattr(settings, "WEBRTC_TURN_CREDENTIAL_TTL", 3600)))
        if turn_urls and turn_secret:
            expires_at = int(timezone.now().timestamp()) + ttl
            username = f"{expires_at}:{request.user.pk}"
            credential = base64.b64encode(
                hmac.new(turn_secret.encode("utf-8"), username.encode("utf-8"), hashlib.sha1).digest()
            ).decode("ascii")
            ice_servers.append({"urls": turn_urls, "username": username, "credential": credential})

        return Response({"iceServers": ice_servers, "expires_in": ttl if turn_urls and turn_secret else None})

    @action(detail=True, methods=["post"])
    def start(self, request, pk=None):
        consultation = self.get_object()
        if request.user != consultation.appointment.doctor.user:
            return Response({"error": "Only the doctor can start a consultation"}, status=403)
        if consultation.ended_at or consultation.appointment.status not in (Appointment.CONFIRMED, Appointment.IN_PROGRESS):
            return Response({"error": "This appointment is not eligible to start"}, status=409)
        if consultation.started_at is None:
            consultation.started_at = timezone.now()
            consultation.appointment.status = Appointment.IN_PROGRESS
            consultation.appointment.save(update_fields=["status"])
            consultation.save(update_fields=["started_at"])
        return Response(self.get_serializer(consultation).data)

    @action(detail=True, methods=["post"])
    def end(self, request, pk=None):
        consultation = self.get_object()
        if not owns_consultation(request.user, consultation):
            return Response({"error": "Not authorized"}, status=403)
        if consultation.ended_at is None:
            consultation.ended_at = timezone.now()
            if request.user == consultation.appointment.doctor.user and "notes" in request.data:
                consultation.notes = request.data["notes"]
            consultation.save(update_fields=["ended_at", "notes"] if request.user == consultation.appointment.doctor.user and "notes" in request.data else ["ended_at"])
        return Response(self.get_serializer(consultation).data)


class PrescriptionViewSet(viewsets.ModelViewSet):
    serializer_class = PrescriptionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Prescription.objects.all()
        if hasattr(user, "doctor_profile"):
            return Prescription.objects.filter(doctor=user.doctor_profile)
        return Prescription.objects.filter(patient__user=user)

    def create(self, request, *args, **kwargs):
        consultation = Consultation.objects.filter(pk=request.data.get("consultation_id")).first()
        if not consultation or consultation.appointment.doctor.user != request.user:
            return Response({"error": "Only the consultation doctor can prescribe"}, status=403)
        if consultation.ended_at:
            return Response({"error": "This consultation has ended"}, status=409)
        prescription = Prescription.objects.create(consultation=consultation, patient=consultation.appointment.patient, doctor=consultation.appointment.doctor, medicines=request.data.get("medicines", []), follow_up_date=request.data.get("follow_up_date") or None, instructions=request.data.get("instructions", ""))
        notify(prescription.patient.user, "New digital prescription", "Your doctor has added a prescription to your consultation history.")
        return Response(self.get_serializer(prescription).data, status=201)


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        consultation_id = self.request.query_params.get("consultation")
        if not consultation_id:
            return Message.objects.none()
        consultations = Consultation.objects.filter(pk=consultation_id)
        if not user.is_staff:
            consultations = consultations.filter(
                Q(appointment__doctor__user=user) | Q(appointment__patient__user=user)
            )
        return Message.objects.filter(consultation__in=consultations).select_related("sender")

    def create(self, request, *args, **kwargs):
        consultation = Consultation.objects.filter(pk=request.data.get("consultation_id")).first()
        if not consultation or not owns_consultation(request.user, consultation):
            return Response({"error": "Not authorized for this consultation"}, status=403)
        if consultation.ended_at:
            return Response({"error": "This consultation has ended"}, status=409)
        text = request.data.get("text")
        if not isinstance(text, str) or not text.strip() or len(text) > 4000:
            return Response({"error": "Message text must contain 1 to 4000 characters"}, status=400)
        message = Message.objects.create(consultation=consultation, sender=request.user, text=text.strip())
        return Response(self.get_serializer(message).data, status=201)


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "patch", "head", "options"]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)