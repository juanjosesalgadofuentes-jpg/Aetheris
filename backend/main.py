from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import vertexai
from vertexai.generative_models import GenerativeModel, SafetySetting

# Load environment variables (useful for local dev, but Cloud Run uses built-in env vars)
from dotenv import load_dotenv
load_dotenv()

app = FastAPI()

# Enable CORS (Cross-Origin Resource Sharing)
# This is crucial for the Chrome Extension to communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Configuration
# Ideally provided by environment variables in Cloud Run
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "your-project-id")
LOCATION = os.getenv("GOOGLE_CLOUD_REGION", "us-central1")

# Initialize Vertex AI
# This uses Application Default Credentials (IAM), so no API keys needed!
try:
    vertexai.init(project=PROJECT_ID, location=LOCATION)
    # Using the standard stable Gemini model (Maximum Compatibility)
    model = GenerativeModel("gemini-1.0-pro")
    print(f"Vertex AI initialized for project {PROJECT_ID} in {LOCATION}")
except Exception as e:
    print(f"Warning: Vertex AI initialization failed (expected during build/without creds): {e}")

class ChatRequest(BaseModel):
    url: str
    title: str
    content: str
    query: str
    history: Optional[List[dict]] = []

@app.get("/")
async def root():
    return {"message": "Aetheris Backend (Vertex AI Powered) is running"}

@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        # 1. Prepare the Prompt
        # In a real "Prompt Registry" workflow, you might load a specific prompt template here.
        # For now, we construct the prompt professionally.
        
        truncated_content = request.content[:30000] # Gemini handles large context well!
        
        prompt = f"""
        Context Information:
        - Page Title: {request.title}
        - URL: {request.url}
        
        Page Content:
        {truncated_content}
        
        User Query: {request.query}
        
        Instructions:
        You are Aetheris. Answer the user's query based strictly on the provided page content.
        Be concise, accurate, and professional.
        """

        # 2. Call Vertex AI (Gemini)
        # Note: No secret keys passed here. Security is handled by Google Cloud IAM.
        
        # Construct chat history if available (simplified for this demo)
        chat_history = []
        if request.history:
            # Logic to Map history to vertexai Content/Part objects would go here
            pass

        response = model.generate_content(
            prompt,
            generation_config={
                "max_output_tokens": 1000,
                "temperature": 0.2,
                "top_p": 0.8,
                "top_k": 40,
            },
            stream=False,
        )

        answer = response.text

        return {
            "response": answer
        }

    except Exception as e:
        print(f"Error processing request: {e}")
        # Detailed error logging for backend, generic for frontend
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Cloud Run expects the app to listen on PORT environment variable
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
