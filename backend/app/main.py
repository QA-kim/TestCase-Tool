from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.core.config import settings
from app.api.v1 import auth, projects, testcases, testruns, testresults, users, folders, statistics
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
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "http://localhost:5174",
        "https://testcase-e27a4.web.app",
        "https://testcase-e27a4.firebaseapp.com",
        "https://tms.r-e.kr",
        "http://tms.r-e.kr"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global rate limiting middleware for all API routes
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Apply global rate limiting to protect against abuse"""
    # Skip rate limiting for health check and root
    if request.url.path in ["/", "/health"]:
        return await call_next(request)

    # Apply default rate limit: 100 requests per minute per IP
    # This protects against basic DoS attacks
    try:
        # Check if the request exceeds the rate limit
        # Note: Individual endpoints may have stricter limits
        remote_addr = get_remote_address(request)
        key = f"global:{remote_addr}"

        # Get or create rate limit state
        if not hasattr(app.state, 'rate_limit_cache'):
            app.state.rate_limit_cache = {}

        import time
        from collections import deque

        now = time.time()
        if key not in app.state.rate_limit_cache:
            app.state.rate_limit_cache[key] = deque()

        # Clean old requests (older than 1 minute)
        requests = app.state.rate_limit_cache[key]
        while requests and requests[0] < now - 60:
            requests.popleft()

        # Check if limit exceeded
        if len(requests) >= 100:
            return Response(
                content='{"detail":"요청 횟수 제한을 초과했습니다. 잠시 후 다시 시도해주세요."}',
                status_code=429,
                media_type="application/json",
                headers={"Retry-After": "60"}
            )

        # Add current request
        requests.append(now)

    except Exception as e:
        # Log error but don't block requests if rate limiting fails
        print(f"Rate limiting error: {e}")

    return await call_next(request)


# Include routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(projects.router, prefix=f"{settings.API_V1_STR}/projects", tags=["projects"])
app.include_router(folders.router, prefix=f"{settings.API_V1_STR}/folders", tags=["folders"])
app.include_router(testcases.router, prefix=f"{settings.API_V1_STR}/testcases", tags=["testcases"])
app.include_router(testruns.router, prefix=f"{settings.API_V1_STR}/testruns", tags=["testruns"])
app.include_router(testresults.router, prefix=f"{settings.API_V1_STR}/testresults", tags=["testresults"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])
app.include_router(statistics.router, prefix=f"{settings.API_V1_STR}/statistics", tags=["statistics"])


@app.get("/")
@app.head("/")
def root():
    return {"message": "TCMS API with Firebase Firestore", "version": "1.0.0"}


@app.get("/health")
@app.head("/health")
def health_check():
    return {"status": "healthy", "database": "firestore"}
