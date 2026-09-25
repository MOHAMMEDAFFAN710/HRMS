import os
import sys
import eventlet
from eventlet import wsgi

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'healthcare_backend.settings')

from healthcare_backend.wsgi import application

if __name__ == '__main__':
    host = '0.0.0.0'
    port = 8000
    print(f'Starting healthcare backend with Socket.IO on http://{host}:{port}')
    wsgi.server(eventlet.listen((host, port)), application)