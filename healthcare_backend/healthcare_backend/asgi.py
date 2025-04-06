"""
ASGI config for healthcare_backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from api.routing import websocket_urlpatterns  # Import WebSocket URLs
from channels.auth import AuthMiddlewareStack

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'healthcare_backend.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),  # Handles regular HTTP requests
    "websocket": AuthMiddlewareStack(  # Handles WebSocket connections
        URLRouter(websocket_urlpatterns)
    ),
})

