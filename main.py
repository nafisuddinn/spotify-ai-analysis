import os
from dotenv import load_dotenv
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
import google.generativeai as genai

# environment variables
load_dotenv()

SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# Configure Gemini API with API key
genai.configure(api_key=GOOGLE_API_KEY)

# Initialize Spotify client
sp = spotipy.Spotify(auth_manager=SpotifyClientCredentials(
    client_id=SPOTIFY_CLIENT_ID,
    client_secret=SPOTIFY_CLIENT_SECRET,
))

# Initialize FastAPI app
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# below is the track model
class Track(BaseModel):
    name: str
    artist: str
    uri: str

@app.get("/")
def read_root():
    return {"message": "Welcome to the Spotify AI App"}

# Spotify login URL
@app.get("/login")
async def login():
    return {
        "url": f"https://accounts.spotify.com/authorize"
               f"?client_id={SPOTIFY_CLIENT_ID}"
               f"&redirect_uri=http://localhost:5173/callback"
               f"&response_type=code"
               f"&scope=playlist-read-private"
    }

# Spotify authentication callback -- make sure you run the backend or else it comes up as error 500
@app.get("/callback")
async def callback(code: str):
    token_url = "https://accounts.spotify.com/api/token"
    payload = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": "http://localhost:5173/callback",
        "client_id": SPOTIFY_CLIENT_ID,
        "client_secret": SPOTIFY_CLIENT_SECRET,
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}

    token_response = requests.post(token_url, data=payload, headers=headers)
    if token_response.status_code != 200:
        raise HTTPException(status_code=500, detail="Failed to authenticate with Spotify")

    token_data = token_response.json()
    access_token = token_data.get("access_token")

    if not access_token:
        raise HTTPException(status_code=500, detail="Missing access token")

    return {"access_token": access_token}

# analyze playlist using Gemini API
@app.post("/analyze-playlist")
async def analyze_playlist(tracks: List[Track]):
    if not tracks:
        raise HTTPException(status_code=400, detail="No tracks provided for analysis")

    try:
        track_names = [f"{track.name} by {track.artist}" for track in tracks]
        prompt_text = f"Short description of what the qualities of the person who listen to this playlist: {', '.join(track_names)}"

        # Use Gemini API to generate a summary
        model = genai.GenerativeModel("gemini-pro") #make sure its the right model, OR ELSE IT DIDNT WORK.
        response = model.generate_content(prompt_text)

        # Return the summary
        return {"summary": response.text} #this method was way easier and lesss complicated AND ACTUALLY WORKS

    except Exception as e:
        return {"error": str(e)}
