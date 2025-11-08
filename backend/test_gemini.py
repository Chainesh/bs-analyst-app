import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# List available models
print("Available models:")
for model in genai.list_models():
    if 'generateContent' in model.supported_generation_methods:
        print(f"  - {model.name}")

# Test generation
try:
    model = genai.GenerativeModel("gemini-1.5-flash-latest")
    response = model.generate_content("Say hello")
    print(f"\nTest successful: {response.text}")
except Exception as e:
    print(f"\nTest failed: {e}")