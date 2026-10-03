from fastapi import FastAPI
app = FastAPI(
    title="CampusWell API",
    description="Backend API for the CampusWell Student Wellness Management System",
    version="1.0.0"
)
@app.get("/")
def home():
    return {
        "message": "CampusWell backend is running successfully!"
    }
@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }