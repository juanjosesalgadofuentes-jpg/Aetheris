from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import vertexai
from vertexai.language_models import ChatModel

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
    # Using PaLM 2 (chat-bison) which is widely available in older/restricted projects
    chat_model = ChatModel.from_pretrained("chat-bison")
    print(f"Vertex AI (PaLM 2) initialized for project {PROJECT_ID} in {LOCATION}")
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
    return {"message": "Aetheris Backend (PaLM 2 Powered) is running"}

@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        # 1. Prepare the Context
        # PaLM 2 handles context in the 'context' parameter of start_chat
        
        truncated_content = request.content[:10000] # PaLM context window is smaller than Gemini
        
        context_prompt = f"""
        You are Aetheris, an AI assistant for web browsing.
        
        Current Page Context:
        - Title: {request.title}
        - URL: {request.url}
        - Content: {truncated_content}
        
        Instructions:
        Answer the user's query based strictly on the provided page content.
        Be concise, accurate, and professional.
        """

        # 2. Call Vertex AI (PaLM 2)
        chat = chat_model.start_chat(context=context_prompt)
        
        response = chat.send_message(
            request.query,
            max_output_tokens=1024,
            temperature=0.2,
            top_p=0.8,
            top_k=40
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
