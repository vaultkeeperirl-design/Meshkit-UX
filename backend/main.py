from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import endpoints

app = FastAPI(title="Mergekit Studio API")

# Configure CORS for the frontend Vite server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the main router
app.include_router(endpoints.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Mergekit Studio Backend is running!"}

if __name__ == "__main__":
    import uvicorn
    import sys
    import multiprocessing

    # Required for PyInstaller multiprocessing support
    multiprocessing.freeze_support()

    # Run the server
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
