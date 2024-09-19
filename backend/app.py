import psycopg2
from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import logging
import threading
from flask_sock import Sock
from psycopg2.extras import RealDictCursor
from datetime import datetime

app = Flask(__name__)
# Secret key used for session management in production environments
app.config['SECRET_KEY'] = 'put a secret key while production'

# Initialize Flask-Sock for WebSocket functionality
sock = Sock(app)

# Allow cross-origin requests from Angular frontend running on localhost:4200
CORS(app, resources={r"/*": {"origins": "http://localhost:4200"}})

# Load database details from external file
with open('database_details.json', 'r') as file:
    db_params = json.load(file)['postgresql']

# Configure logging for debugging purposes
logging.basicConfig(level=logging.INFO)

# Global set to store connected WebSocket clients
clients = set()

# Cache for previous result to avoid unnecessary broadcast if no changes detected
prev_result = []

# Flag to force broadcast when needed (e.g., after insert/delete operations)
flag = False

# Custom JSON encoder to handle datetime objects (converts them to ISO format)
class CustomEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()  # Convert datetime to ISO 8601 format
        return super().default(obj)

# Function to listen for notifications from the database
def listen_for_notifications():
    global prev_result
    while True:
        try:
            # Connect to the PostgreSQL database
            with psycopg2.connect(**db_params) as connection:
                with connection.cursor(cursor_factory=RealDictCursor) as cursor:
                    # Fetch the latest 10 notifications ordered by date
                    query = '''
                        SELECT id, date_time AS "dateTime", message, status
                        FROM notifications
                        ORDER BY date_time DESC
                        LIMIT 10
                    '''
                    cursor.execute(query)
                    notifications = cursor.fetchall()

                    # If flag is set, broadcast the notifications even if unchanged
                    global flag
                    if flag:
                        prev_result = notifications
                        flag = False 
                        broadcast_to_clients(notifications)

                    # If there is no change in notifications, skip broadcasting
                    if prev_result != [] and prev_result == notifications:
                        continue

                    # Update the previous result and broadcast changes to clients
                    prev_result = notifications
                    broadcast_to_clients(notifications)

        except psycopg2.Error as e:
            logging.error(f"Database error: {e}")

# Function to remove disconnected WebSocket clients
def remove_clients(disconnected_clients):
    clients.difference_update(disconnected_clients)

# Function to broadcast a message to all WebSocket clients
def broadcast_to_clients(message):
    disconnected_clients = set()  # Keep track of clients that fail to receive messages
    for client in clients:
        try:
            # Send the message to each client
            client.send(json.dumps(message, cls=CustomEncoder))
        except Exception as e:
            logging.error(f"Error sending message to client: {e}")
            disconnected_clients.add(client)

    # Remove clients that encountered errors
    remove_clients(disconnected_clients)

# Function to fetch notifications from the database with optional sorting and limits
def fetch_notifications(order_by, limit=None):
    try:
        with psycopg2.connect(**db_params) as connection:
            with connection.cursor(cursor_factory=RealDictCursor) as cursor:
                query = '''
                    SELECT id, date_time AS "dateTime", message, status
                    FROM notifications
                    ORDER BY date_time DESC
                '''
                # Apply limit if provided
                if limit:
                    query += f" LIMIT {limit}"

                cursor.execute(query)
                result = cursor.fetchall()
                return result

    except psycopg2.Error as e:
        logging.error(f"Database Error: {e}")
        return None

# API route to get the latest notifications (default limit is 10)
@app.route('/', methods=['GET'])
def get_latest_notifications():
    limit = request.args.get('limit', default=10, type=int)
    order_by = request.args.get('sort_by', default='date_time', type=str)

    notifications = fetch_notifications(order_by, limit)

    if notifications is not None:
        return jsonify(notifications)
    return jsonify({"error": "An error occurred while fetching notifications"}), 500

# API route to get all notifications without limit
@app.route('/all', methods=['GET'])
def get_all_notifications():
    order_by = request.args.get('sort_by', default='date_time', type=str)

    notifications = fetch_notifications(order_by)
    
    if notifications is not None:
        return jsonify(notifications)
    return jsonify({"error": "An error occurred while fetching notifications"}), 500

# API route to insert a new notification
@app.route('/insert_notification', methods=['POST'])
def insert_notification():
    data = request.get_json()

    # Validate required fields
    if not data:
        return jsonify({"error": "No data provided"}), 400

    date = data.get('dateTime')
    message = data.get('message')
    status = data.get('status')

    if not date or not message or not status:
        return jsonify({"error": "Missing required fields"}), 400

    try:
        # Insert the notification into the database
        with psycopg2.connect(**db_params) as connection:
            with connection.cursor() as cursor:
                query = 'INSERT INTO notifications (date_time, message, status) VALUES (%s, %s, %s)'
                cursor.execute(query, (date, message, status))
                connection.commit()

                global flag 
                flag = True  # Set flag to force WebSocket broadcast

                return jsonify({"success": "Notification added successfully"}), 200

    except Exception as e:
        logging.error(f"Error inserting notification: {e}")
        return jsonify({"error": "An error occurred while inserting notification"}), 500

# API route to delete notifications based on IDs
@app.route('/delete_notifications', methods=['POST'])
def delete_notifications():
    data = request.get_json()

    # Validate data
    if not data:
        return jsonify({"error": "No data provided"}), 400

    try:
        # Delete the specified notifications from the database
        with psycopg2.connect(**db_params) as connection:
            with connection.cursor() as cursor:
                for notification in data:
                    query = f"DELETE FROM notifications WHERE id = {notification['id']}"
                    cursor.execute(query)

                global flag
                flag = True  # Set flag to force WebSocket broadcast
                connection.commit()

                return jsonify({"success": "Notifications successfully deleted"}), 200

    except Exception as e:
        logging.error(f"Error deleting notifications: {e}")
        return jsonify({"error": "An error occurred while deleting notifications"}), 500

# WebSocket route to handle client connections
@sock.route('/ws')
def websocket_connection(ws):
    logging.info("Client connected via WebSocket")
    clients.add(ws)  # Add the connected client to the set

    try:
        # Keep the connection alive and handle incoming messages
        while True:
            message = ws.receive()
            if message:
                logging.info(f"Received message from client: {message}")
    except Exception as e:
        logging.error(f"WebSocket error: {e}")
    finally:
        logging.info("Client disconnected from WebSocket")
        clients.discard(ws)  # Remove the client from the set when they disconnect

# Start a background thread to listen for database notifications
def start_notification_listener():
    listener_thread = threading.Thread(target=listen_for_notifications)
    listener_thread.daemon = True
    listener_thread.start()

if __name__ == "__main__":
    # Start the notification listener and run the Flask app
    start_notification_listener()
    app.run(host='0.0.0.0', port=5000, debug=True)
