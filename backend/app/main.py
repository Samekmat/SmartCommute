"""FastAPI application entry point for SmartCommute."""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session

from app.config import load_env_file
from app.database import engine, init_db
from app.routers import ai, commutes, routes
from app.seed import seed_database

# Load .env file if present
load_env_file()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Manage application startup and shutdown lifecycle events.

    Initializes database tables via SQLModel metadata and executes
    idempotent seeding of sample routes and commute history on initial startup.

    Parameters
    ----------
    app : FastAPI
        FastAPI application instance.

    Yields
    ------
    None
        Yields control back to the ASGI server runtime.
    """
    init_db()
    with Session(engine) as session:
        seed_database(session)
    yield


app = FastAPI(
    title="SmartCommute API",
    description="Backend API for SmartCommute MVP: eco tracking, live weather, and AI recommendations.",
    version="0.1.0",
    lifespan=lifespan,
)

# Explicit CORS configuration required by AGENTS.md
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes.router)
app.include_router(commutes.router)
app.include_router(ai.router)
