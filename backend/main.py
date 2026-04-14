from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routers import analyze, generate, history

app = FastAPI(
    title="OutreachOS API",
    description="Personalized job outreach automation backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router)
app.include_router(generate.router)
app.include_router(history.router)


@app.get("/")
async def root():
    return {"message": "OutreachOS API is running", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}
