from google import genai
import os

client = genai.Client(api_key=os.environ.get("GOOGLE_API_KEY"))

print("Modelos disponibles en tu cuenta:")
try:
    for m in client.models.list():
        # En el nuevo SDK usamos 'supported_actions'
        if 'generateContent' in m.supported_actions:
            print(f"-> {m.name}")
except Exception as e:
    print(f"Error al listar: {e}")