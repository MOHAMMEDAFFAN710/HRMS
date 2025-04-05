"""
WSGI config for healthcare_backend project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/wsgi/
"""

import os
import socketio
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'healthcare_backend.settings')

# Socket.IO setup
sio = socketio.Server(async_mode='eventlet', cors_allowed_origins='*')
django_app = get_wsgi_application()
application = socketio.WSGIApp(sio, django_app)

@sio.event
def connect(sid, environ):
    print(f'Client connected: {sid}')

@sio.event
def disconnect(sid):
    print(f'Client disconnected: {sid}')