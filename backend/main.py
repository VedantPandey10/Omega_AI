import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Omega AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class ChatRequest(BaseModel):
    text: str

@app.post("/chat")
async def chat(req: ChatRequest):
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are Omega, a helpful, polite, and accurate AI assistant. Answer clearly and concisely."},
                {"role": "user", "content": req.text}
            ],
            max_tokens=150,
            temperature=0.7,
        )
        
        reply = response.choices[0].message.content.strip()
        
        return {"reply": reply}
    except Exception as e:
        return {"reply": f"Error: {str(e)}"}

