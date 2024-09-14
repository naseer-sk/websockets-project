import psycopg2
from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import logging
import threading
from flask_sockets import Sockets
from psycopg2.extras import RealDictCursor

app = Flask(__name__)
app.config['SECRET_KEY'] = 'put a secret key while production'
sockets = Sockets(app)
CORS(app, resources={r"/*": {"origins": "http://localhost:4200"}})

# Load database details from a JSON file
with open('details.json', 'r') as file:
    db_params = json.load(file)['postgresql']

logging.basicConfig(level=logging.INFO)

# Store WebSocket clients
clients = set()  # Using a set instead of a list for efficient add/remove operations

# Function to listen for PostgreSQL notifications
def listen_for_notifications():
    while True:
        try:
            with psycopg2.connect(**db_params) as connection:
                connection.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT)
                with connection.cursor() as cursor:
                    cursor.execute('LISTEN notifications_channel')
                    logging.info("Listening on notifications_channel...")

                    while True:
                        connection.poll()
                        while connection.notifies:
                            notify = connection.notifies.pop(0)
                            logging.info(f"Received notification: {notify.payload}")
                            try:
                                broadcast_to_clients(notify.payload)
                                logging.info(f"Sent notification to WebSocket clients: {notify.payload}")
                            except json.JSONDecodeError:
                                logging.error(f"Invalid JSON payload: {notify.payload}")
        except psycopg2.Error as e:
            logging.error(f"Database error: {e}")
            # Wait before attempting to reconnect
            time.sleep(5)

# Function to broadcast a message to all WebSocket clients
def broadcast_to_clients(message):
    disconnected_clients = set()
    for client in clients:
        try:
            client.send(message)
        except Exception as e:
            logging.error(f"Error sending message to client: {e}")
            disconnected_clients.add(client)
    
    # Remove disconnected clients
    clients.difference_update(disconnected_clients)

# Function to fetch notifications from the database
def fetch_notifications(limit=None):
    try:
        with psycopg2.connect(**db_params) as connection:
            with connection.cursor(cursor_factory=RealDictCursor) as cursor:
                query = '''
                    SELECT id, date_time AS "dateTime", message, status
                    FROM notifications
                    ORDER BY date_time DESC
                '''
                if limit:
                    query += f" LIMIT {limit}"

                cursor.execute(query)
                return cursor.fetchall()

    except psycopg2.Error as e:
        logging.error(f"Database Error: {e}")
        return None

@app.route('/')
def get_latest_notifications():
    limit = request.args.get('limit', default=10, type=int)
    notifications = fetch_notifications(limit)

    if notifications is not None:
        return jsonify(notifications)
    return jsonify({"error": "An error occurred while fetching notifications"}), 500

@app.route('/all')
def get_all_notifications():
    notifications = fetch_notifications()

    if notifications is not None:
        return jsonify(notifications)
    return jsonify({"error": "An error occurred while fetching notifications"}), 500

@sockets.route('/ws')
def websocket_connection(ws):
    logging.info("Client connected via WebSocket")
    clients.add(ws)

    try:
        while not ws.closed:
            message = ws.receive()
            if message:
                logging.info(f"Received message from client: {message}")
    except Exception as e:
        logging.error(f"WebSocket error: {e}")
    finally:
        logging.info("Client disconnected from WebSocket")
        clients.discard(ws)

def start_notification_listener():
    listener_thread = threading.Thread(target=listen_for_notifications)
    listener_thread.daemon = True
    listener_thread.start()

if __name__ == "__main__":
    start_notification_listener()
    from gevent import pywsgi
    from geventwebsocket.handler import WebSocketHandler
    server = pywsgi.WSGIServer(('0.0.0.0', 5000), app, handler_class=WebSocketHandler)
    print("Server is running on http://localhost:5000")
    server.serve_forever()