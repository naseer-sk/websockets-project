import psycopg2
from flask import Flask, jsonify, request
import json
import logging
import threading
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config['SECRET_KEY'] = 'put a secret key while production'
socketio = SocketIO(app)

with open('details.json', 'r') as file:
    db_params = json.load(file)['postgresql']

def listen_for_notifications():
    try:
        with psycopg2.connect(
                host=db_params['host'],
                dbname=db_params['dbname'],
                user=db_params['user'],
                password=db_params['password'],
                port=db_params['port']
            ) as connection:
            connection.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT)
            with connection.cursor() as cursor:
                cursor.execute('LISTEN notifications_channel')

                while True:
                    connection.poll()
                    while connection.notifies:
                        notify = connection.notifies.pop(0)
                        print(f"Received notification: {notify.payload}")
                        socketio.emit('notification', json.loads(notify.payload), broadcast=True)
    except psycopg2.Error as e:
        logging.error(f"Database error: {e}")

def fetch_notifications(limit=None):
    try:
        with psycopg2.connect(
                host=db_params['host'],
                dbname=db_params['dbname'],
                user=db_params['user'],
                password=db_params['password'],
                port=db_params['port']
            ) as connection:
            with connection.cursor() as cursor:
                query = '''
                    SELECT id, date_time AS dateTime, message, status
                    FROM notifications
                    ORDER BY date_time DESC
                '''
                if limit:
                    query += f" LIMIT {limit}"

                cursor.execute(query)
                notifications = cursor.fetchall()

                result = [{
                    "id": notification[0],
                    "dateTime": notification[1],
                    "message": notification[2],
                    "status": notification[3]
                } for notification in notifications]

                return result

    except psycopg2.Error as e:
        logging.error(f"Database Error: {e}")
        return None

@app.route('/')
def get_latest_notifications():
    limit = request.args.get('limit', default=10, type=int)
    notifications = fetch_notifications(limit)

    if notifications:
        return jsonify(notifications)
    return jsonify({"error": "An error occurred while fetching notifications"}), 500


@app.route('/all')
def get_all_notifications():
    notifications = fetch_notifications()

    if notifications:
        return jsonify(notifications)
    return jsonify({"error": "An error occurred while fetching notifications"}), 500

def start_notification_listener():
    listener_thread = threading.Thread(target=listen_for_notifications)
    listener_thread.daemon = True
    listener_thread.start()

if __name__ == "__main__":
    start_notification_listener()  
    socketio.run(app, debug=True)  
