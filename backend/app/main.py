from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import auth, projects, testcases

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(projects.router, prefix=f"{settings.API_V1_STR}/projects", tags=["projects"])
app.include_router(testcases.router, prefix=f"{settings.API_V1_STR}/testcases", tags=["testcases"])


@app.get("/")
def root():
    return {"message": "TCMS API with Firebase Firestore", "version": "1.0.0"}


@app.get("/health")
def health_check():
    return {"status": "healthy", "database": "firestore"}
