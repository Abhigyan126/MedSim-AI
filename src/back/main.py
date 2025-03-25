from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route("/", methods=["GET"])
def home():
    return "Flask server is running!"

# only for testing not final deplyable
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    
    print(f"🔹 Received Login Request: {data}")

    # Dummy credentials for testing
    valid_username = "admin"
    valid_password = "password123"

    if data.get("username") == valid_username and data.get("password") == valid_password:
        return jsonify({"message": "Login successful"}), 200  # 200 OK
    else:
        return jsonify({"error": "Invalid credentials"}), 401  # 401 Unauthorized

if __name__ == "__main__":
    app.run(debug=True)

"""
login sucess : curl -X POST http://127.0.0.1:5000/login -H "Content-Type: application/json" -d '{"username": "admin", "password": "password123"}'
login failed : curl -X POST http://127.0.0.1:5000/login -H "Content-Type: application/json" -d '{"username": "wrong", "password": "test"}'
"""