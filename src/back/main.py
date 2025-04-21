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
from datetime import datetime
import datetime
import random
import hashlib
import base64
import json
import os
from wsgiref import validate

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

sample_schema_bot = {
  "type": "object",
  "required": ["message"],
  "properties": {
    "message": { "type": "string" }
  },
  "additionalProperties": False
}


# init Symptom Cache DB
db_symptom_cache = SymptomCache(DB_PATH, DB_CACHE_LIMIT_UNIQUE)


#load Intentclassifier
#intent_classifier = IntentClassifier()

#initialise llm
llm = LLM()

# init schema validator
schema_validator = SchemaValidator(sample_schema)
schema_validator_bot = SchemaValidator(sample_schema_bot)

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

try:
    mongo = PyMongo(app)
    users = mongo.db.users  # Mongo Users Collection
    profile = mongo.db.profile
except Exception as e:
    print(f'Error {e},\nError Connecting to database')
    exit()

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
@jwt_required()
def get_symptoms():
    """
    Fetches Symptoms for a given dieses
    """
    try:
        data = request.get_json()
        disease = data.get("disease", None)
        disease = disease.lower().rstrip()
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

@app.route('/patientResponse', methods=['POST'])
@jwt_required()
def PatientBot():
    data = request.get_json()
    symptoms = data.get("symptoms", None)
    response = data.get("userResponse", None)
    chatHistory = data.get("ChatHistory", None)
    if not response:
        return jsonify({"error": "response is required in the request body"}), 400
    if not symptoms:
        return jsonify({"error": "symptoms is required in the request body"}), 400
    if not chatHistory:
        return jsonify({"error": "Chat History is required in the request body"}), 400
    response_schema = '''
    {
    message: String,
    }
    '''
    prompt = f"you are a virtual patient , i will give you patient symptoms symptoms: {symptoms}, and the query from doctor please respond to the query, query: {response}, answer as patient for the query based on the symptoms, here are previous chat logs {chatHistory}. respond in the following schema and make a object message with your response, please dont reply with symptoms i only want response in message key and response as value"
    llm_response = llm.model(prompt)
    parsed = json.loads(llm_response)
    validation = schema_validator_bot.validate(parsed)
    if validation == None:
        return jsonify(parsed)
    else:
        return ({"message": "Schema Not valid , please try again."})
        print(validation)

def flatten_report(report):
    flat = {}

    categories = report["categories"]
    med_comp = categories["Medical Competency"]

    flat["Symptoms Relevance"] = med_comp["Symptoms Relevance"]
    flat["Clinical Reasoning"] = med_comp["Clinical Reasoning"]
    flat["RED flag identification"] = med_comp["RED flag identification"]
    flat["Prescription understanding"] = med_comp["Prescription understanding"]

    flat["Communication style"] = categories["Communication style"]
    flat["Presentation Quality"] = categories["Presentation Quality"]
    flat["Correctly Diagnosed"] = categories["Correctly Diagnosed"]

    return flat

def get_user_email_id_info_from_jwt():
    access_token = request.cookies.get("access_token")
    if not access_token:
        raise ValueError("Missing token")

    try:
        decoded_token = decode_token(access_token)
        user_id = decoded_token["sub"]
        user = users.find_one({"_id": ObjectId(user_id)}, {"username": 1, "email": 1})
        if not user:
            raise LookupError("User not found")
        return user_id, user["username"], user["email"]
    except Exception as e:
        raise ValueError(f"Invalid token: {str(e)}")



#Issue 37 SUbmit Button
@app.route('/generateReport', methods=['POST'])
@jwt_required()
def generateReport():
    data = request.get_json()
    symptoms = data.get("symptoms", None)
    response = data.get("userResponse", None)
    chatHistory = data.get("ChatHistory", None)
    disease = data.get("disease", None)

    # Required field checks
    if not disease:
        return jsonify({"error": "disease is required in the request body"}), 400
    if not response:
        return jsonify({"error": "response is required in the request body"}), 400
    if not symptoms:
        return jsonify({"error": "symptoms is required in the request body"}), 400

    # JSON schema for validating the LLM report
    response_schema = {
        "type": "object",
        "additionalProperties": False,
        "required": ["Report"],
        "properties": {
            "Report": {
                "type": "object",
                "additionalProperties": False,
                "required": ["Result", "categories"],
                "properties": {
                    "Result": {
                        "type": "object",
                        "additionalProperties": False,
                        "required": ["Positive", "Negative"],
                        "properties": {
                            "Positive": {"type": "string"},
                            "Negative": {"type": "string"}
                        }
                    },
                    "categories": {
                        "type": "object",
                        "additionalProperties": False,
                        "required": ["Medical Competency", "Communication style", "Presentation Quality", "Correctly Diagnosed"],
                        "properties": {
                            "Medical Competency": {
                                "type": "object",
                                "additionalProperties": False,
                                "properties": {
                                    "Symptoms Relevance": {"type": "integer"},
                                    "Clinical Reasoning": {"type": "integer"},
                                    "RED flag identification": {"type": "integer"},
                                    "Prescription understanding": {"type": "integer"}
                                },
                                "required": ["Symptoms Relevance", "Clinical Reasoning", "RED flag identification", "Prescription understanding"]
                            },
                            "Communication style": {"type": "integer"},
                            "Presentation Quality": {"type": "integer"},
                            "Correctly Diagnosed": {"type": "integer"}
                        }
                    }
                }
            }
        }
    }

    # Construct prompt strictly as JSON including the schema and desired output structure
    payload = {
        "role": "You are a medical professor",
        "task": "Evaluate a doctor's diagnosys to a virtual patient and generate a structured report based on the disease provided. also the correctly diagnosed is either 0 or 1. give positive or negeative feedback, negetive feedback should be whatever they have done wrong not what they could have done , keep this also in consideration but with less wieght in response json correctly aligned to its respective categories. grade them fairly 0 min max 10.",
        "inputs": {
            "symptoms": symptoms,
            "doctor_response": response,
            "chat_history": chatHistory,
            "disease": disease,
        },
        "output_schema": response_schema,
        "output_instructions": "Return a JSON object with root key 'Report' matching the provided schema exactly"
    }

    prompt = json.dumps(payload)

    # Generate LLM response
    llm_response = llm.model(prompt)

    try:
        parsed = json.loads(llm_response)
    except json.JSONDecodeError as e:
        return jsonify({"error": "LLM response is not valid JSON", "details": str(e)}), 500

    # Validate against the strict Report schema
    validation = schema_validator_bot.validate(parsed, schema=response_schema)

    if validation is None:
        try:
            user_id, username, email = get_user_email_id_info_from_jwt()
        except ValueError as e:
            return jsonify({"message": str(e)}), 401
        except LookupError as e:
            return jsonify({"message": str(e)}), 404

        report_data = parsed.get("Report", {})
        flat_report = flatten_report(report_data)

        log_entry = {
            "user_id": ObjectId(user_id),
            "email": email,
            "timestamp": datetime.datetime.now(datetime.timezone.utc),
            **flat_report  # unpack the flattened report directly into the doc
        }

        mongo.db.profile.insert_one(log_entry)
        return jsonify(parsed)
    else:
        print("Validation failed:", validation)
        return jsonify({"message": "Schema not valid, please try again."}), 400

if __name__ == "__main__":
    app.run(debug=True)
