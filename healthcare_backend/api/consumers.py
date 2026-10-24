import json
import hashlib
import hmac
import asyncio

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.core.cache import cache
from django.db import transaction
from django.utils import timezone

from .models import Appointment, Consultation, ConsultationSocketTicket, Message


class ConsultationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope["url_route"]["kwargs"]["room_id"]
        self.group_name = None
        self.presence_key = None
        self.authorized = False
        await self.accept()
        self.auth_timeout = asyncio.create_task(self.close_if_unauthenticated())

    async def close_if_unauthenticated(self):
        await asyncio.sleep(8)
        if not self.authorized:
            await self.close(code=4401)

    async def disconnect(self, close_code):
        if hasattr(self, "auth_timeout"):
            self.auth_timeout.cancel()
        if self.authorized:
            await self.channel_layer.group_send(self.group_name, {
                "type": "peer.event",
                "payload": {"type": "peer_left", "participant_id": self.scope["user"].pk},
            })
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
            await database_sync_to_async(cache.delete)(self.presence_key)

    async def receive(self, text_data):
        if not text_data or len(text_data) > 100_000:
            await self.close(code=4400)
            return
        try:
            payload = json.loads(text_data)
        except (TypeError, json.JSONDecodeError):
            await self.close(code=4400)
            return
        if not isinstance(payload, dict):
            await self.close(code=4400)
            return

        if not self.authorized:
            await self.authenticate(payload)
            return

        if not self.valid_signal(payload):
            await self.send(text_data=json.dumps({"type": "error", "message": "Invalid signaling message"}))
            return

        if payload.get("type") == "heartbeat":
            await database_sync_to_async(cache.expire)(self.presence_key, 90)
            await self.send(text_data=json.dumps({"type": "heartbeat_ack"}))
            return

        if payload.get("type") == "chat":
            try:
                message = await database_sync_to_async(self.persist_chat)(payload["text"])
            except (Consultation.DoesNotExist, ValueError):
                await self.send(text_data=json.dumps({"type": "error", "message": "This consultation chat is no longer available."}))
                return
            payload = {
                "type": "chat",
                "text": message.text,
                "timestamp": message.created_at.isoformat(),
                "message_id": message.pk,
                "participant_id": self.scope["user"].pk,
                "role": self.scope["user"].role,
            }
            await self.channel_layer.group_send(self.group_name, {"type": "peer.event", "payload": payload})
            await self.send(text_data=json.dumps({**payload, "type": "chat_sent"}))
            return

        payload["participant_id"] = self.scope["user"].pk
        payload["role"] = self.scope["user"].role
        await self.channel_layer.group_send(self.group_name, {"type": "peer.event", "payload": payload})

    async def authenticate(self, payload):
        if payload.get("type") != "authenticate" or not isinstance(payload.get("ticket"), str):
            await self.close(code=4401)
            return

        ticket_data = await database_sync_to_async(self.consume_ticket)(payload["ticket"], self.room_id)
        if not ticket_data:
            await self.close(code=4403)
            return

        self.scope["user"] = ticket_data["user"]
        self.consultation_id = ticket_data["consultation_id"]
        self.presence_key = ticket_data["presence_key"]
        reserved = await database_sync_to_async(cache.add)(self.presence_key, self.channel_name, timeout=90)
        if not reserved:
            await self.close(code=4409)
            return

        self.group_name = f"consultation_{self.room_id}"
        self.authorized = True
        self.auth_timeout.cancel()
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await database_sync_to_async(cache.set)(self.presence_key, self.channel_name, timeout=90)
        await self.send(text_data=json.dumps({"type": "authenticated", "role": self.scope["user"].role}))
        peer_connected = await database_sync_to_async(cache.get)(ticket_data["peer_presence_key"])
        if peer_connected:
            await self.send(text_data=json.dumps({"type": "peer_joined", "role": ticket_data["peer_role"]}))
        await self.channel_layer.group_send(self.group_name, {
            "type": "peer.event",
            "payload": {"type": "peer_joined", "participant_id": self.scope["user"].pk, "role": self.scope["user"].role},
        })

    @staticmethod
    def consume_ticket(raw_ticket, room_id):
        ticket_hash = hashlib.sha256(raw_ticket.encode("utf-8")).hexdigest()
        with transaction.atomic():
            ticket = ConsultationSocketTicket.objects.select_for_update().select_related(
                "user", "consultation__appointment__patient__user", "consultation__appointment__doctor__user"
            ).filter(token_hash=ticket_hash).first()
            if not ticket or ticket.used_at or ticket.expires_at <= timezone.now():
                return None

            consultation = ticket.consultation
            appointment = consultation.appointment
            user = ticket.user
            room_matches = hmac.compare_digest(consultation.room_id, room_id)
            participant_matches = user.pk in (appointment.patient.user_id, appointment.doctor.user_id)
            eligible = appointment.status in (Appointment.CONFIRMED, Appointment.IN_PROGRESS) and consultation.ended_at is None
            if not room_matches or not participant_matches or not user.is_active or not eligible:
                return None

            ticket.used_at = timezone.now()
            ticket.save(update_fields=["used_at"])
            presence_digest = hashlib.sha256(f"{consultation.room_id}:{user.pk}".encode()).hexdigest()
            other_user_id = appointment.doctor.user_id if user.pk == appointment.patient.user_id else appointment.patient.user_id
            other_digest = hashlib.sha256(f"{consultation.room_id}:{other_user_id}".encode()).hexdigest()
            other_role = "doctor" if user.pk == appointment.patient.user_id else "patient"
            return {
                "user": user,
                "consultation_id": consultation.pk,
                "presence_key": f"consultation-presence:{presence_digest}",
                "peer_presence_key": f"consultation-presence:{other_digest}",
                "peer_role": other_role,
            }

    @staticmethod
    def valid_signal(payload):
        message_type = payload.get("type")
        if message_type in ("offer", "answer"):
            description = payload.get(message_type)
            return isinstance(description, dict) and isinstance(description.get("sdp"), str) and len(description["sdp"]) <= 80_000
        if message_type == "ice":
            candidate = payload.get("candidate")
            return candidate is None or (
                isinstance(candidate, dict)
                and isinstance(candidate.get("candidate"), str)
                and len(candidate["candidate"]) <= 4096
            )
        if message_type == "chat":
            return isinstance(payload.get("text"), str) and 0 < len(payload["text"].strip()) <= 2000
        if message_type == "media_state":
            return isinstance(payload.get("camera"), bool) and isinstance(payload.get("microphone"), bool)
        if message_type == "call_ended":
            return True
        if message_type == "heartbeat":
            return True
        return False

    def persist_chat(self, text):
        consultation = Consultation.objects.select_related(
            "appointment__doctor__user", "appointment__patient__user"
        ).get(pk=self.consultation_id)
        appointment = consultation.appointment
        if consultation.ended_at or self.scope["user"].pk not in (
            appointment.doctor.user_id,
            appointment.patient.user_id,
        ):
            raise ValueError("Consultation chat is no longer available")
        return Message.objects.create(consultation=consultation, sender=self.scope["user"], text=text.strip())

    async def peer_event(self, event):
        payload = event["payload"]
        if payload.get("participant_id") != self.scope["user"].pk:
            await self.send(text_data=json.dumps(payload))