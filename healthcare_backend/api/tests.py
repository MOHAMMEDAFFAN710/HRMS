import json
import base64
import hmac
from datetime import datetime, timedelta, time

from django.urls import reverse
from django.utils import timezone
from channels.db import database_sync_to_async
from asgiref.testing import ApplicationCommunicator
from rest_framework.test import APITestCase
from django.test import TransactionTestCase
from django.test import override_settings
import hashlib
import secrets

from rest_framework.authtoken.models import Token

from .consumers import ConsultationConsumer
from .models import Appointment, Availability, Consultation, ConsultationSocketTicket, Doctor, Message, Patient, User


class TelehealthWorkflowTests(APITestCase):
	def register(self, email, role="patient", first_name="Care"):
		response = self.client.post(reverse("register"), {"username": email, "email": email, "password": "A-secure-password-123", "role": role, "first_name": first_name})
		self.assertEqual(response.status_code, 201)
		self.client.credentials(HTTP_AUTHORIZATION=f"Token {response.data['token']}")
		return response.data

	def make_appointment(self, status=Appointment.CONFIRMED):
		patient_user = User.objects.create_user(username="room-patient", password="secret", role="patient")
		patient = Patient.objects.create(user=patient_user)
		doctor_user = User.objects.create_user(username="room-doctor", password="secret", role="doctor")
		doctor = Doctor.objects.create(user=doctor_user, specialization="General Medicine")
		start = timezone.now() + timedelta(hours=1)
		appointment = Appointment.objects.create(
			patient=patient,
			doctor=doctor,
			start_at=start,
			end_at=start + timedelta(minutes=30),
			status=status,
		)
		return appointment, patient_user, doctor_user

	def authenticate_as(self, user):
		token, _ = Token.objects.get_or_create(user=user)
		self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

	def test_registration_creates_role_profile_and_returns_user(self):
		response = self.register("patient@example.com")
		self.assertEqual(response["user"]["role"], "patient")
		self.assertTrue(User.objects.get(username="patient@example.com").patient_profile)

	def test_registration_persists_patient_and_doctor_details(self):
		patient_response = self.client.post(reverse("register"), {
			"email": "patient-profile@example.com",
			"password": "A-secure-password-123",
			"role": "patient",
			"first_name": "Pat",
			"last_name": "Example",
			"phone": "5550100",
			"date_of_birth": "1990-05-12",
			"medical_history": "Asthma",
			"allergies": "Peanuts",
			"emergency_contact": "Alex 5550199",
		}, format="json")
		self.assertEqual(patient_response.status_code, 201)
		patient = User.objects.get(email="patient-profile@example.com").patient_profile
		self.assertEqual(patient.medical_history, "Asthma")
		self.assertEqual(patient.allergies, "Peanuts")
		self.assertEqual(patient.emergency_contact, "Alex 5550199")
		self.assertEqual(patient.date_of_birth.isoformat(), "1990-05-12")

		doctor_response = self.client.post(reverse("register"), {
			"email": "doctor-profile@example.com",
			"password": "A-secure-password-123",
			"role": "doctor",
			"first_name": "Dee",
			"specialization": "Cardiology",
			"languages": ["English", "Hindi"],
			"experience_years": 12,
		}, format="json")
		self.assertEqual(doctor_response.status_code, 201)
		doctor = User.objects.get(email="doctor-profile@example.com").doctor_profile
		self.assertEqual(doctor.specialization, "Cardiology")
		self.assertEqual(doctor.languages, ["English", "Hindi"])
		self.assertEqual(doctor.experience_years, 12)

	def test_login_rejects_the_wrong_account_role(self):
		self.client.post(reverse("register"), {
			"email": "role-check@example.com",
			"password": "A-secure-password-123",
			"role": "doctor",
			"specialization": "Family Medicine",
		})
		wrong_role = self.client.post(reverse("login"), {
			"username": "role-check@example.com",
			"password": "A-secure-password-123",
			"role": "patient",
		})
		self.assertEqual(wrong_role.status_code, 403)
		correct_role = self.client.post(reverse("login"), {
			"username": "role-check@example.com",
			"password": "A-secure-password-123",
			"role": "doctor",
		})
		self.assertEqual(correct_role.status_code, 200)

	def test_patient_can_book_once_but_not_overlap_same_doctor(self):
		self.register("doctor@example.com", role="doctor", first_name="Doctor")
		doctor = User.objects.get(username="doctor@example.com").doctor_profile
		start = timezone.now() + timedelta(days=2)
		start = start.replace(hour=10, minute=0, second=0, microsecond=0)
		Availability.objects.create(doctor=doctor, weekday=start.weekday(), start_time=time(9), end_time=time(17), slot_minutes=30)

		self.register("patient@example.com")
		payload = {"doctor_id": doctor.id, "start_at": start.isoformat(), "end_at": (start + timedelta(minutes=30)).isoformat()}
		first = self.client.post(reverse("appointment-list"), payload)
		self.assertEqual(first.status_code, 201)
		second = self.client.post(reverse("appointment-list"), {**payload, "end_at": (start + timedelta(minutes=45)).isoformat()})
		self.assertEqual(second.status_code, 409)

	def test_patient_cannot_read_another_patient_data(self):
		self.register("one@example.com")
		self.register("two@example.com")
		response = self.client.get(reverse("patient-list"))
		self.assertEqual(response.status_code, 200)
		self.assertEqual(len(response.data), 1)

	def test_patient_profile_updates_are_persisted(self):
		self.register("save@example.com")
		user = User.objects.get(username="save@example.com")
		user_response = self.client.patch(reverse("current-user"), {"preferred_language": "Hindi", "phone": "555123"}, format="json")
		profile_response = self.client.patch(reverse("patient-current-patient"), {"medical_history": "Asthma", "allergies": "None"}, format="json")
		self.assertEqual(user_response.status_code, 200)
		self.assertEqual(profile_response.status_code, 200)
		user.refresh_from_db()
		user.patient_profile.refresh_from_db()
		self.assertEqual(user.preferred_language, "Hindi")
		self.assertEqual(user.phone, "555123")
		self.assertEqual(user.patient_profile.medical_history, "Asthma")

	def test_historical_appointments_reads_project_csv(self):
		self.register("dataset-doctor@example.com", role="doctor")
		response = self.client.get(reverse("historical-appointments"))
		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data["total"], 200)
		self.assertEqual(response.data["appointments"][0]["appointment_id"], "A001")
		self.assertIn({"status": "No-show", "count": 52}, response.data["statuses"])

		self.register("dataset-patient@example.com")
		forbidden = self.client.get(reverse("historical-appointments"))
		self.assertEqual(forbidden.status_code, 403)

	def test_consultation_requires_confirmed_appointment_and_issues_single_use_ticket(self):
		appointment, patient_user, doctor_user = self.make_appointment(Appointment.BOOKED)
		self.authenticate_as(patient_user)
		rejected = self.client.post(reverse("consultation-list"), {"appointment_id": appointment.id}, format="json")
		self.assertEqual(rejected.status_code, 409)

		appointment.status = Appointment.CONFIRMED
		appointment.save(update_fields=["status"])
		first = self.client.post(reverse("consultation-list"), {"appointment_id": appointment.id}, format="json")
		second = self.client.post(reverse("consultation-list"), {"appointment_id": appointment.id}, format="json")
		self.assertEqual(first.status_code, 201)
		self.assertEqual(first.data["room_id"], second.data["room_id"])
		consultation = Consultation.objects.get(appointment=appointment)

		ticket_response = self.client.post(reverse("consultation-socket-ticket", args=[consultation.id]))
		self.assertEqual(ticket_response.status_code, 200)
		self.assertNotEqual(consultation.socket_tickets.get().token_hash, ticket_response.data["ticket"])
		accepted_ticket = ConsultationConsumer.consume_ticket(ticket_response.data["ticket"], consultation.room_id)
		self.assertIsNotNone(accepted_ticket)
		self.assertEqual(accepted_ticket["user"].id, patient_user.id)
		self.assertIsNone(ConsultationConsumer.consume_ticket(ticket_response.data["ticket"], consultation.room_id))

		wrong_room_response = self.client.post(reverse("consultation-socket-ticket", args=[consultation.id]))
		self.assertEqual(wrong_room_response.status_code, 200)
		self.assertIsNone(ConsultationConsumer.consume_ticket(wrong_room_response.data["ticket"], "guessed-room-id"))
		self.authenticate_as(doctor_user)
		doctor_ticket = self.client.post(reverse("consultation-socket-ticket", args=[consultation.id]))
		self.assertEqual(doctor_ticket.status_code, 200)
		ice_configuration = self.client.get(reverse("consultation-ice-configuration", args=[consultation.id]))
		self.assertEqual(ice_configuration.status_code, 200)
		self.assertTrue(ice_configuration.data["iceServers"])
		self.authenticate_as(patient_user)
		ice_ticket = self.client.post(reverse("consultation-socket-ticket", args=[consultation.id]))
		self.assertEqual(ice_ticket.status_code, 200)

	def test_unrelated_user_cannot_create_or_access_consultation(self):
		appointment, patient_user, _ = self.make_appointment()
		self.authenticate_as(patient_user)
		created = self.client.post(reverse("consultation-list"), {"appointment_id": appointment.id}, format="json")
		self.assertEqual(created.status_code, 201)
		consultation = Consultation.objects.get(appointment=appointment)
		unrelated = User.objects.create_user(username="unrelated", password="secret", role="patient")
		Patient.objects.create(user=unrelated)
		self.authenticate_as(unrelated)
		unauthorized_room = self.client.post(reverse("consultation-socket-ticket", args=[consultation.id]))
		self.assertEqual(unauthorized_room.status_code, 404)
		unauthorized_create = self.client.post(reverse("consultation-list"), {"appointment_id": appointment.id}, format="json")
		self.assertEqual(unauthorized_create.status_code, 404)

	def test_call_end_preserves_appointment_status_and_chat_is_private(self):
		appointment, patient_user, doctor_user = self.make_appointment(Appointment.IN_PROGRESS)
		consultation = Consultation.objects.create(appointment=appointment, room_id="room-test")
		self.authenticate_as(patient_user)
		created = self.client.post(reverse("message-list"), {"consultation_id": consultation.id, "text": "Can you hear me?"}, format="json")
		self.assertEqual(created.status_code, 201)
		self.assertEqual(created.data["sender"]["id"], patient_user.id)
		own_messages = self.client.get(reverse("message-list"), {"consultation": consultation.id})
		self.assertEqual(len(own_messages.data), 1)
		ended = self.client.post(reverse("consultation-end", args=[consultation.id]), {}, format="json")
		self.assertEqual(ended.status_code, 200)
		appointment.refresh_from_db()
		self.assertEqual(appointment.status, Appointment.IN_PROGRESS)

		self.authenticate_as(doctor_user)
		ended_send = self.client.post(reverse("message-list"), {"consultation_id": consultation.id, "text": "After call"}, format="json")
		self.assertEqual(ended_send.status_code, 409)
		outsider = User.objects.create_user(username="outsider", password="secret", role="patient")
		Patient.objects.create(user=outsider)
		self.authenticate_as(outsider)
		denied = self.client.post(reverse("message-list"), {"consultation_id": consultation.id, "text": "Intrusion"}, format="json")
		self.assertEqual(denied.status_code, 403)

	@override_settings(
		WEBRTC_STUN_URL="stun:test.example:3478",
		WEBRTC_TURN_URLS="turns:turn.example:5349?transport=tcp",
		WEBRTC_TURN_SHARED_SECRET="test-shared-secret",
		WEBRTC_TURN_CREDENTIAL_TTL=600,
	)
	def test_ice_configuration_issues_short_lived_user_scoped_turn_credentials(self):
		appointment, patient_user, _ = self.make_appointment()
		consultation = Consultation.objects.create(appointment=appointment, room_id="ice-config")
		self.authenticate_as(patient_user)
		response = self.client.get(reverse("consultation-ice-configuration", args=[consultation.id]))
		self.assertEqual(response.status_code, 200)
		turn = response.data["iceServers"][1]
		self.assertEqual(turn["urls"], ["turns:turn.example:5349?transport=tcp"])
		self.assertTrue(turn["username"].endswith(f":{patient_user.id}"))
		expected = base64.b64encode(hmac.new(
			b"test-shared-secret", turn["username"].encode(), hashlib.sha1
		).digest()).decode()
		self.assertEqual(turn["credential"], expected)


class ConsultationSocketTests(TransactionTestCase):
	reset_sequences = True

	def setUp(self):
		self.patient_user = User.objects.create_user(username="socket-patient", password="secret", role="patient")
		patient = Patient.objects.create(user=self.patient_user)
		self.doctor_user = User.objects.create_user(username="socket-doctor", password="secret", role="doctor")
		doctor = Doctor.objects.create(user=self.doctor_user, specialization="General Medicine")
		start = timezone.now() + timedelta(hours=1)
		self.appointment = Appointment.objects.create(
			patient=patient,
			doctor=doctor,
			start_at=start,
			end_at=start + timedelta(minutes=30),
			status=Appointment.CONFIRMED,
		)
		self.consultation = Consultation.objects.create(appointment=self.appointment, room_id="socket-test-room")

	def issue_ticket(self, user):
		raw = secrets.token_urlsafe(32)
		ConsultationSocketTicket.objects.create(
			token_hash=hashlib.sha256(raw.encode()).hexdigest(),
			consultation=self.consultation,
			user=user,
			expires_at=timezone.now() + timedelta(seconds=60),
		)
		return raw

	def make_socket(self):
		return ApplicationCommunicator(
			ConsultationConsumer.as_asgi(),
			{
				"type": "websocket",
				"asgi": {"version": "3.0"},
				"path": f"/ws/consultations/{self.consultation.room_id}/",
				"query_string": b"",
				"headers": [],
				"url_route": {"kwargs": {"room_id": self.consultation.room_id}},
			},
		)

	async def websocket_connect(self, communicator):
		await communicator.send_input({"type": "websocket.connect"})
		return await communicator.receive_output()

	async def websocket_send_json(self, communicator, payload):
		await communicator.send_input({"type": "websocket.receive", "text": json.dumps(payload)})

	async def websocket_receive_json(self, communicator):
		response = await communicator.receive_output()
		return json.loads(response["text"])

	async def receive_until(self, communicator, expected_type):
		for _ in range(5):
			payload = await self.websocket_receive_json(communicator)
			if payload.get("type") == expected_type:
				return payload
		self.fail(f"Did not receive {expected_type} event")

	async def test_authorized_pair_can_signal_and_chat_but_guessed_ticket_is_denied(self):
		patient_socket = self.make_socket()
		doctor_socket = self.make_socket()
		self.assertEqual((await self.websocket_connect(patient_socket))["type"], "websocket.accept")
		await self.websocket_send_json(patient_socket, {"type": "authenticate", "ticket": await database_sync_to_async(self.issue_ticket)(self.patient_user)})
		self.assertEqual((await self.websocket_receive_json(patient_socket))["type"], "authenticated")

		self.assertEqual((await self.websocket_connect(doctor_socket))["type"], "websocket.accept")
		await self.websocket_send_json(doctor_socket, {"type": "authenticate", "ticket": await database_sync_to_async(self.issue_ticket)(self.doctor_user)})
		self.assertEqual((await self.websocket_receive_json(doctor_socket))["type"], "authenticated")
		await self.receive_until(patient_socket, "peer_joined")

		await self.websocket_send_json(patient_socket, {"type": "offer", "offer": {"type": "offer", "sdp": "v=0"}})
		await self.receive_until(doctor_socket, "offer")
		await self.websocket_send_json(patient_socket, {"type": "chat", "text": "Can you hear me?"})
		chat_event = await self.receive_until(doctor_socket, "chat")
		chat_ack = await self.receive_until(patient_socket, "chat_sent")
		self.assertEqual(chat_event['text'], "Can you hear me?")
		self.assertEqual(chat_ack['type'], "chat_sent")
		message_count = await database_sync_to_async(Message.objects.filter(consultation=self.consultation).count)()
		self.assertEqual(message_count, 1)

		invalid_socket = self.make_socket()
		await self.websocket_connect(invalid_socket)
		await self.websocket_send_json(invalid_socket, {"type": "authenticate", "ticket": secrets.token_urlsafe(32)})
		invalid_response = await invalid_socket.receive_output()
		self.assertEqual(invalid_response["type"], "websocket.close")
		self.assertEqual(invalid_response["code"], 4403)

		await patient_socket.send_input({"type": "websocket.disconnect", "code": 1000})
		await doctor_socket.send_input({"type": "websocket.disconnect", "code": 1000})
