#
# Imports
#

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_redoc_html
from fastapi.responses import HTMLResponse, JSONResponse

# Perso

from app.config import Env, get_settings
from app.lifespan import lifespan
from app.shared.exceptions import AppError
from app.shared.router import routes

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    # Default FastAPI uses redoc@next which often renders blank.
    redoc_url=None,
    # ReDoc still struggles with OpenAPI 3.1 (blank page).
    openapi_version="3.0.2",
)

# CORS
# Note: browsers reject Access-Control-Allow-Origin: * together with
# Access-Control-Allow-Credentials: true. Use explicit origins.

_cors_origins = (
    [
        "http://localhost:8089",
        "https://localhost:8089",
        "http://127.0.0.1:8089",
        "https://127.0.0.1:8089",
    ]
    if settings.APP_ENV == Env.DEVELOPMENT
    else settings.CORS_ALLOW_ORIGINS_PROD
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes under /api (same contract as accountsv2)

app.include_router(routes, prefix=settings.APP_PREFIX)


@app.get("/redoc", include_in_schema=False)
async def redoc() -> HTMLResponse:
    """
        Serve ReDoc with a pinned stable CDN build.
    """
    return get_redoc_html(
        openapi_url=app.openapi_url,
        title=f"{settings.APP_NAME} - ReDoc",
        redoc_js_url=(
            "https://cdn.jsdelivr.net/npm/redoc@2.1.5/"
            "bundles/redoc.standalone.js"
        ),
    )


@app.exception_handler(AppError)
async def app_error_handler(
    request: Request,
    exc: AppError,
) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.to_detail()},
    )


@app.exception_handler(Exception)
async def exception_handler(
    request: Request,
    exc: Exception,
) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={
            "detail": {
                "user_safe_title": "Erreur inattendue",
                "user_safe_description": (
                    "Une erreur inattendue du serveur "
                    "est survenue."
                ),
                "dev": str(exc),
            }
        },
    )
