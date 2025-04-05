from django.urls import re_path
from api.consumers import MyConsumer  # Create a WebSocket consumer

websocket_urlpatterns = [
    re_path(r"ws/socket.io/", MyConsumer.as_asgi()),
]
