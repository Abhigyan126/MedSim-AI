from sentence_transformers import SentenceTransformer
import numpy as np
import json
import os

# Load model
model = SentenceTransformer("all-MiniLM-L6-v2")

# Define intents with synthetic variations
intents = {
    "greeting": [
        "hi", "hello", "hey", "good morning", "good evening",
        "hiya", "what's up", "greetings", "howdy"
    ],
    "login": [
        "log in", "sign in", "take me to login", "redirect me to login",
        "authenticate me", "I want to sign in", "logging in"
    ],
    "logout": [
        "log me out", "sign out", "exit my account",
        "log out of my profile", "signing out"
    ],
    "signup": [
        "create an account", "register", "sign up", "join now",
        "open a new account", "new registration"
    ],
    "profile": [
        "show my profile", "open my account", "view my details",
        "show account settings", "open profile dashboard"
    ],
    "medsim": [
        "start medical simulator", "begin medical training",
        "open medsim", "run a medical test", "launch doctor simulation",
        "start patient simulation", "begin hospital scenario"
    ]
}

# Encode all phrases and store individual embeddings
intent_texts = []
intent_labels = []
intent_vectors = []

for intent, phrases in intents.items():
    embeddings = model.encode(phrases)  # Convert all patterns to embeddings
    for i, phrase in enumerate(phrases):
        intent_texts.append(phrase)
        intent_labels.append(intent)
        intent_vectors.append(embeddings[i])  # Keep individual embeddings

# Convert to numpy arrays
intent_vectors = np.array(intent_vectors)

# Define save location
save_dir = "intent_model"
os.makedirs(save_dir, exist_ok=True)

# Save embeddings
np.savez_compressed(os.path.join(save_dir, "intents.npz"), vectors=intent_vectors, labels=intent_labels)

# Save intents mapping (optional)
with open(os.path.join(save_dir, "intents.json"), "w") as f:
    json.dump(intents, f)

print("Training complete. Embeddings saved successfully.")
