import sqlite3
import hashlib
import random
import json

class SymptomCache:
    def __init__(self, db_path='symptom_cache.db', limit=10):
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.cursor = self.conn.cursor()
        self.limit = limit
        self.create_table()

    def create_table(self):
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS symptom_cache (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                disease TEXT NOT NULL,
                symptoms_json TEXT NOT NULL,
                hash TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(disease, hash)
            )
        ''')
        self.conn.commit()

    def get_cached_symptoms(self, disease):
        self.cursor.execute("SELECT symptoms_json FROM symptom_cache WHERE disease=?", (disease,))
        results = self.cursor.fetchall()
        return [json.loads(r[0]) for r in results]

    def cache_symptoms(self, disease, symptoms):
        json_str = json.dumps(symptoms, sort_keys=True)
        hash_val = hashlib.sha256(json_str.encode()).hexdigest()
        try:
            self.cursor.execute("INSERT INTO symptom_cache (disease, symptoms_json, hash) VALUES (?, ?, ?)",
                                (disease, json_str, hash_val))
            self.conn.commit()
        except sqlite3.IntegrityError:
            pass  # Already exists

        self._trim_cache(disease)

    def _trim_cache(self, disease):
        self.cursor.execute(
            "DELETE FROM symptom_cache WHERE id IN (SELECT id FROM symptom_cache WHERE disease=? ORDER BY timestamp ASC LIMIT -1 OFFSET ?)",
            (disease, self.limit)
        )
        self.conn.commit()
