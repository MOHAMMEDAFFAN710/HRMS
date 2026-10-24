from django.urls import re_path
from api.consumers import ConsultationConsumer

websocket_urlpatterns = [
    re_path(r"ws/consultations/(?P<room_id>[A-Za-z0-9_-]+)/$", ConsultationConsumer.as_asgi()),
]
