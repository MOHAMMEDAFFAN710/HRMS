from eventlet import wsgi
import eventlet
from healthcare_backend.wsgi import application

if __name__ == '__main__':
    wsgi.server(eventlet.listen(('localhost', 8000)), application)