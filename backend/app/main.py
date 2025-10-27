from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.core.config import settings
from app.api.v1 import auth, projects, testcases, testruns, testresults, users
from app.middleware import SecurityHeadersMiddleware

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    version="1.0.0"
)

# Add rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Security headers middleware (add first)
app.add_middleware(SecurityHeadersMiddleware)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "https://testcase-e27a4.web.app",
        "https://testcase-e27a4.firebaseapp.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(projects.router, prefix=f"{settings.API_V1_STR}/projects", tags=["projects"])
app.include_router(testcases.router, prefix=f"{settings.API_V1_STR}/testcases", tags=["testcases"])
app.include_router(testruns.router, prefix=f"{settings.API_V1_STR}/testruns", tags=["testruns"])
app.include_router(testresults.router, prefix=f"{settings.API_V1_STR}/testresults", tags=["testresults"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])


@app.get("/")
def root():
    return {"message": "TCMS API with Firebase Firestore", "version": "1.0.0"}


@app.get("/health")
def health_check():
    return {"status": "healthy", "database": "firestore"}
