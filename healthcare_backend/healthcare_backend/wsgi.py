"""
WSGI config for healthcare_backend project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/wsgi/
"""

import os

try:
    import socketio
except ModuleNotFoundError:  # pragma: no cover - optional dependency for chat support
    socketio = None

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'healthcare_backend.settings')

django_app = get_wsgi_application()

if socketio is not None:
    sio = socketio.Server(
        async_mode='eventlet',
        cors_allowed_origins='*',
        logger=False,
        engineio_logger=False,
    )
    application = socketio.WSGIApp(sio, django_app)

    @sio.event
    def connect(sid, environ, auth=None):
        print(f'Client connected: {sid}')
        sio.emit('message', {'text': 'Connected to healthcare chat.', 'sender': 'doctor'}, to=sid)

    @sio.event
    def disconnect(sid):
        print(f'Client disconnected: {sid}')

    @sio.on('message')
    def handle_message(sid, data):
        payload = data
        if isinstance(payload, str):
            payload = {'text': payload, 'sender': 'patient'}
        payload.setdefault('sender', 'patient')
        print(f'Message from {sid}: {payload}')
        sio.emit('message', payload)
else:
    application = django_app