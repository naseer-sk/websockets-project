from flask import Flask, jsonify
import mysql.connector
from mysql.connector import Error as MySQLError

app = Flask(__name__)

@app.route('/')
def home():
    return "Welcome to the application"

@app.route('/getDetails')
def get_details():
    try:
        conn = mysql.connector.connect(
            user="admin",
            password="admin123",
            host="localhost",
            database="notifications"
        )

        query = '''
            SELECT 
                id,
                date_time AS dateTime,
                msg,
                status
            FROM 
                all_notifications
        '''
        
        with conn.cursor(dictionary=True) as cursor:
            cursor.execute(query)
            details = cursor.fetchall()

        conn.close()
        
        return jsonify(details)

    except MySQLError as e:
        print("MySQL error:", e)
        return jsonify({"error": "Database connection failed"}), 500

    except mysql.connector.errors.ProgrammingError as e:
        print("SQL error:", e)
        return jsonify({"error": "Invalid SQL query"}), 400

    except mysql.connector.errors.OperationalError as e:
        print("Operational error:", e)
        return jsonify({"error": "Database operation timed out"}), 504

    except mysql.connector.errors.IntegrityError as e:
        print("Data integrity error:", e)
        return jsonify({"error": "Data integrity violation"}), 409

    except Exception as e:
        print("Something went wrong:", e)
        return jsonify({"error": "An unexpected error occurred"}), 500

if __name__ == "__main__":
    app.run(debug=True)
