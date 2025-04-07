import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold

import os
from dotenv import load_dotenv

class LLM():
    def __init__(self) -> None:
        pass
    def model(self, message):
        load_dotenv()
        model = genai.GenerativeModel(model_name="gemini-1.5-flash")
        genai.configure(api_key=os.getenv("key"))
        generation_config = {
            "temperature": 1,
            "top_p": 0.95,
            "top_k": 39,
            "max_output_tokens": 8192,
            "response_mime_type": "application/json",
        }

        try:
            response = model.generate_content([message], safety_settings={
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
            }, generation_config=generation_config)
            return response.text
        except Exception as e:
            print( f"Error: {e}")