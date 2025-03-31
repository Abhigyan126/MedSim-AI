from sentence_transformers import SentenceTransformer
import numpy as np
import os

class IntentClassifier:
    def __init__(self, model_name="all-MiniLM-L6-v2", save_dir="chatbot/intent_model/"):
        self.model = SentenceTransformer(model_name)
        self.data_file = os.path.join(save_dir, "intents.npz")
        self.intent_vectors, self.intent_labels = self._load_intents()
    
    def _load_intents(self):
        if not os.path.exists(self.data_file):
            raise FileNotFoundError(f"Intent data file not found: {self.data_file}")
        
        data = np.load(self.data_file, allow_pickle=True)
        return data["vectors"], data["labels"]
    
    def get_intent(self, user_input):
        """Find the best matching intent using precomputed embeddings."""
        user_vector = self.model.encode([user_input])[0]         # Convert input to embedding
        similarities = np.dot(self.intent_vectors, user_vector)  # Fast similarity computation

        best_match_index = np.argmax(similarities)
        return self.intent_labels[best_match_index]
