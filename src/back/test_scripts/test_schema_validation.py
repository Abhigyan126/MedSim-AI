import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from schema_validation import SchemaValidator

# Sample schema reused from main.py
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

validator = SchemaValidator(sample_schema)

# 20 challenging LLM-style samples
test_cases = {
    "1. Valid minimal": [{"name": "Fever", "description": "Mild fever", "severity": 1, "location": "Head"}],
    "2. Valid max severity": [{"name": "Chest Pain", "description": "Intense pressure", "severity": 5, "location": "Cardiovascular"}],
    "3. Missing description": [{"name": "Cough", "severity": 3, "location": "Respiratory"}],
    "4. Severity below min": [{"name": "Pain", "description": "Sharp", "severity": -1, "location": "Legs"}],
    "5. Severity above max": [{"name": "Fever", "description": "High", "severity": 6, "location": "Head"}],
    "6. Extra field present": [{"name": "Fatigue", "description": "Low energy", "severity": 2, "location": "Neurological", "duration": "2 days"}],
    "7. Wrong type for severity": [{"name": "Nausea", "description": "Vomiting", "severity": "high", "location": "Gastrointestinal"}],
    "8. Nested object invalid": [{"name": "Burn", "description": {"text": "redness"}, "severity": 2, "location": "Hands"}],
    "9. Empty name": [{"name": "", "description": "Dull pain", "severity": 2, "location": "Head"}],
    "10. Non-string location": [{"name": "Itchiness", "description": "Skin irritation", "severity": 1, "location": 123}],
    "11. Missing all fields": [{}],
    "12. Invalid JSON shape (object instead of array)": {"name": "Fever", "description": "Hot body", "severity": 3, "location": "Head"},
    "13. Mixed valid and invalid": [
        {"name": "Valid", "description": "Works", "severity": 3, "location": "Legs"},
        {"name": "Invalid", "description": 123, "severity": 3, "location": "Legs"}
    ],
    "14. Severity as float": [{"name": "Headache", "description": "Mild", "severity": 2.5, "location": "Head"}],
    "15. Uppercase field names (should fail)": [{"Name": "Cold", "Description": "Shivering", "Severity": 1, "Location": "Respiratory"}],
    "16. Malformed data": "this is not even a list",
    "17. Empty array": [],
    "18. Partially correct object": [{"name": "Pain", "description": "Muscle", "severity": 4}],
    "19. Null severity": [{"name": "Headache", "description": "Dull pain", "severity": None, "location": "Head"}],
    "20. Valid complex description": [{"name": "Migraine", "description": "Pulsating pain, worse with light and sound!", "severity": 4, "location": "Head"}]
}

# Run validations
for label, data in test_cases.items():
    print(f"--- {label} ---")
    try:
        result = validator.validate(data)
        print(result or "✅ Valid")
    except Exception as e:
        print(f"❌ Exception: {e}")
    print()
