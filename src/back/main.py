from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from flask_pymongo import PyMongo
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, JWTManager, verify_jwt_in_request
from datetime import timedelta
from dotenv import load_dotenv
import os

#loading variables from .env
load_dotenv()
mongo_pass = os.getenv('mongo')                                         # api key for mongodb
secret = os.getenv('secret')                                            # JWT secret key

#constats
db_cluster = 'cluster0'
database_name = 'project1'
username = 'abhigyanpandeycug'

# flask initialisation
app = Flask(__name__)
CORS(app, supports_credentials=True, origins='*', allow_headers=['Content-Type', 'Authorization','Set-Cookie'], methods=['GET', 'POST', 'OPTIONS'])
bcrypt = Bcrypt(app)

# database initialisation
app.config["MONGO_URI"] = f"mongodb+srv://{username}:{mongo_pass}@{db_cluster}.o137pc7.mongodb.net/{database_name}?retryWrites=true&w=majority&appName={db_cluster}"
mongo = PyMongo(app)
users = mongo.db.users                                                  # Mongo Users Collection


# flask api configration
app.config["JWT_SECRET_KEY"] = secret 
app.config["JWT_TOKEN_LOCATION"] = ["cookies"]                          # Store JWT in HttpOnly cookies
app.config["JWT_COOKIE_SECURE"] = False                                 # Set to True in production (HTTPS)
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=1)              # 1 Day expiration of cookie
app.config["JWT_ACCESS_COOKIE_NAME"] = "access_token"                   # Change cookie name


jwt = JWTManager(app)

# Signup Route
@app.route("/signup", methods=["POST"])
def signup():
    data = request.json
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not email or not password or not username:
        return jsonify({"message": "Username, email, and password are required"}), 400

    if users.find_one({"email": email}):
        return jsonify({"message": "User with this email already exists"}), 400

    hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")
    user_data = {
        "username": username,
        "email": email,
        "password": hashed_password,
    }
    users.insert_one(user_data)

    return jsonify({"message": "User registered successfully"}), 201

# Login Route
@app.route("/login", methods=["POST"])
def login():
    data = request.json
    user = users.find_one({"email": data["email"]})

    if not user or not bcrypt.check_password_hash(user["password"], data["password"]):
        return jsonify({"message": "Invalid credentials"}), 401

    access_token = create_access_token(identity=str(user["_id"]))       # Create JWT
    response = make_response(jsonify({"message": "Login successful"}))
    response.set_cookie("access_token", access_token, httponly=True, secure=False, samesite='Lax',path='/')  # Store JWT in HttpOnly cookie
    return response


# Check Authentication Route
@app.route("/auth-check", methods=["GET"])
@jwt_required()
def auth_check():
    return jsonify({"message": "Authenticated", "user_id": get_jwt_identity()}), 200

if __name__ == "__main__":
    app.run(debug=True)

