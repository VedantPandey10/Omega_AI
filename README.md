# Omega AI

Omega AI is a sophisticated AI assistant platform featuring a facial-gesture-controlled virtual keyboard and a smart chatbot interface.

## Features

- **Face Tracker**: Control navigation and input using facial gestures (blinks).
- **Virtual Keyboard**: A specialized keyboard designed for accessibility through face tracking.
- **AI Chatbot**: Fast and intelligent responses powered by OpenAI's GPT-3.5.

## Tech Stack

### Frontend
- **React** (Vite)
- **TypeScript**
- **TensorFlow.js** (Face Landmarks Detection)
- **Vanilla CSS**

### Backend
- **FastAPI** (Python)
- **OpenAI API**
- **Pydantic** for data validation

## Setup Instructions

### Backend
1. Go to the `backend` directory.
2. Create a virtual environment: `python -m venv venv`.
3. Activate it: `venv\Scripts\activate`.
4. Install dependencies: `pip install -r requirements.txt`.
5. Create a `.env` file with your `OPENAI_API_KEY`.
6. Run the server: `python main.py`.

### Frontend
1. Go to the `frontend` directory.
2. Install dependencies: `npm install`.
3. Run the development server: `npm run dev`.
