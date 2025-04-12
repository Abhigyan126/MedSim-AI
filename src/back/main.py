from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from flask_pymongo import PyMongo
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, JWTManager, unset_jwt_cookies, decode_token
from datetime import timedelta
from bson import ObjectId
from dotenv import load_dotenv
from chatbot.inference import IntentClassifier
from identity_icon import IdentIcon
from schema_validation import SchemaValidator
from symptom_cache import SymptomCache
from llm import LLM
import random
import hashlib
import base64
import json
import os

# constants
SYMPTOM_DB_CACHE_THRESHOLD = 0.1 # change to original for deployment 0.7
DB_PATH = 'symptom_cache.db'
DB_CACHE_LIMIT_UNIQUE = 10

# sample schema
sample_schema = {
    "type": "array",
    "items": {
        "type": "object",
        "required": ["name", "description", "severity", "location"],
        "properties": {
            "name": {"type": "string"},
            "description": {"type": "string"},
            "severity": {
                "type": "number",
                "minimum": 0,
                "maximum": 5
            },
            "location": {"type": "string"}
        },
        "additionalProperties": False
    }
}

# init Symptom Cache DB
db_symptom_cache = SymptomCache(DB_PATH, DB_CACHE_LIMIT_UNIQUE)


#load Intentclassifier
#intent_classifier = IntentClassifier()

#initialise llm
llm = LLM()

# init schema validator
schema_validator = SchemaValidator(sample_schema)

#loading variables from .env
load_dotenv()
mongo_pass = os.getenv('mongo')                                         # api key for mongodb
secret = os.getenv('secret')                                            # JWT secret key

#constats
DB_CLUSTER = 'cluster0'
DATABASE_NAME = 'project1'
MONGO_USERNAME = 'abhigyanpandeycug'

# flask initialisation
app = Flask(__name__)
CORS(app, supports_credentials=True, origins='*', allow_headers=['Content-Type', 'Authorization','Set-Cookie'], methods=['GET', 'POST', 'OPTIONS'])
bcrypt = Bcrypt(app)

# database initialisation
app.config["MONGO_URI"] = f"mongodb+srv://{MONGO_USERNAME}:{mongo_pass}@{DB_CLUSTER}.o137pc7.mongodb.net/{DATABASE_NAME}?retryWrites=true&w=majority&appName={DB_CLUSTER}"
mongo = PyMongo(app)
users = mongo.db.users                                                  # Mongo Users Collection


# flask api configration
app.config["JWT_SECRET_KEY"] = secret
app.config["JWT_TOKEN_LOCATION"] = ["cookies"]                          # Store JWT in HttpOnly cookies
app.config["JWT_COOKIE_SECURE"] = False                                 # Set to True in production (HTTPS)
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=1)              # 1 Day expiration of cookie
app.config["JWT_ACCESS_COOKIE_NAME"] = "access_token"                 # Change cookie name
app.config["JWT_COOKIE_CSRF_PROTECT"] = False  # Enable CSRF protection for cookies

jwt = JWTManager(app)

# Helper Functions
def get_username_from_jwt():
    access_token = request.cookies.get("access_token")
    if not access_token:
        return jsonify({"message": "Missing token"}), 401
    try:
        decoded_token = decode_token(access_token)
        user_id = decoded_token["sub"]
        user = users.find_one({"_id": ObjectId(user_id)}, {"username": 1, "email": 1, "_id": 0})
        if not user:
            return jsonify({"message": "User not found"}), 404
        return jsonify({"username": user["username"], "email": user["email"]}), 200
    except Exception as e:
        return jsonify({"message": "Invalid token", "error": str(e)}), 401

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

    if not user:
        return jsonify({"message": "Invalid Email", "cust_error": 40101}), 401
    if not bcrypt.check_password_hash(user["password"], data["password"]):
        return jsonify({"message": "Invalid Password", "cust_error": 40102}), 401


    access_token = create_access_token(identity=str(user["_id"]))       # Create JWT
    email = user["email"]
    email_hash = hashlib.sha256(email.encode()).digest()                # Creates a Decodable token
    session_token = base64.urlsafe_b64encode(email_hash).decode()       # Creates a Non Decodable Token

    response = make_response(jsonify({"message": "Login successful",
                                    "session_token": session_token
                                    }))
    response.set_cookie("access_token", access_token, httponly=True, secure=False, samesite='Lax',path='/')  # Store JWT in HttpOnly cookie
    return response

# Logout Route
@app.route("/logout", methods=["POST"])
def logout():
    response = jsonify({"message": "Logout successful"})
    unset_jwt_cookies(response)  # This clears the JWT token stored in cookies
    return response

# Check Authentication Route
@app.route("/auth-check", methods=["GET"])
@jwt_required()
def auth_check():
    return jsonify({"message": "Authenticated", "user_id": get_jwt_identity()}), 200

#retuen the username for a given cookie token
@app.route("/getusername", methods=["GET"])
@jwt_required()
def getusername():
    return get_username_from_jwt()
"""
@app.route("/intent", methods=["POST"])
@jwt_required()
def get_intent():
    print(request.headers)
    data = request.get_json()                                   # Use get_json() to avoid errors
    if "message" not in data:
        return {"error": "Missing 'message' field"}, 400        # Handle missing data
    to_predict = str(data['message'])
    prediction = intent_classifier.get_intent(to_predict)       # Use instance method
    print(prediction)
    return {"intent": f'{prediction}'}                          # Return response as JSON
"""

@app.route('/get_identicon', methods=['GET'])
@jwt_required()
def get_identicon():
    """
    Fetches the user's identicon using the authenticated JWT user ID.
    """
    try:
        user_id = get_jwt_identity()                            # Extract user ID from JWT token
        mongo_key = str(ObjectId(user_id))                      # Ensure it's in ObjectId format
        svg_img = IdentIcon.generate_identicon_svg(mongo_key)
        response = make_response(jsonify({
            "svg": f"data:image/svg+xml;base64,{svg_img}"
        }))
        # Set cache headers - 24 hours (in seconds)
        response.headers["Cache-Control"] = "private, max-age=86400"
        return response
    except Exception as e:
        return jsonify({"message": "Invalid User ID", "error": str(e)}), 400

@app.route('/get_symptoms', methods=['POST'])
def get_symptoms():
    """
    Fetches Symptoms for a given dieses
    """
    try:
        data = request.get_json()
        disease = data.get("disease", None)
        if not disease:
            return jsonify({"error": "Disease is required in the request body"}), 400

        use_cache = random.random() <= 0.7
        if use_cache:
            cached = db_symptom_cache.get_cached_symptoms(disease)
            if cached:
                return jsonify(random.choice(cached))

        locations = "'Head', 'Respiratory', 'Cardiovascular', 'Gastrointestinal', 'Neurological', 'Urinary', 'Hands', 'Legs', 'Reproductive System'"
        schema = ''' the following is the schema to give the output in {
      "name": "Headache",
      "description": "Throbbing pain, primarily in the temples",
      "severity": 5,
      "location": "Head"
    } '''
        prompt = f"You are A paitent visiting a doctor, your job is to tell the doctor your symptoms for the following disease {disease}. {schema},  also keep in mind that severity should be in numbers datatype not string in json and must be below 5 and non negetive. provide the output in a list of jsons, the following are the possible locations {locations}. Dont give null as location give some system name if its not there, but please try to kepp the names available as much as possible"
        response = llm.model(prompt)
        parsed = json.loads(response)
        validation = schema_validator.validate(parsed)
        if validation == None:
            db_symptom_cache.cache_symptoms(disease, parsed)
            return jsonify(parsed)
        else:
            print(response)
            print(validation)
            return jsonify({"error": 'generated schema not valid'})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
