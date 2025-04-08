class SchemaValidator:
    def __init__(self, schema):
        self.schema = schema

    def validate(self, data, schema=None, path="root"):
        schema = schema or self.schema
        schema_type = schema.get("type")

        # Type check
        if schema_type == "object":
            if not isinstance(data, dict):
                return f"{path} should be an object"
            return self._validate_object(data, schema, path)

        elif schema_type == "array":
            if not isinstance(data, list):
                return f"{path} should be an array"
            return self._validate_array(data, schema, path)

        elif schema_type == "string":
            if not isinstance(data, str):
                return f"{path} should be a string"

        elif schema_type == "number":
            if not isinstance(data, (int, float)):
                return f"{path} should be a number"
            if "minimum" in schema and data < schema["minimum"]:
                return f"{path} should be >= {schema['minimum']}"
            if "maximum" in schema and data > schema["maximum"]:
                return f"{path} should be <= {schema['maximum']}"

        return None  # Valid

    def _validate_object(self, data, schema, path):
        errors = []

        # Required fields
        required = schema.get("required", [])
        for key in required:
            if key not in data:
                errors.append(f"{path}.{key} is required")

        # Properties
        properties = schema.get("properties", {})
        for key, value in data.items():
            if key in properties:
                error = self.validate(value, properties[key], f"{path}.{key}")
                if error:
                    errors.append(error)
            elif not schema.get("additionalProperties", True):
                errors.append(f"{path}.{key} is not allowed")

        return "\n".join(errors) if errors else None

    def _validate_array(self, data, schema, path):
        item_schema = schema.get("items", {})
        errors = []
        for i, item in enumerate(data):
            error = self.validate(item, item_schema, f"{path}[{i}]")
            if error:
                errors.append(error)
        return "\n".join(errors) if errors else None
