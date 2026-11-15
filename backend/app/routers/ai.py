"""FastAPI router for AI Advisor provider configuration and credential status."""

import os
from typing import Final

from fastapi import APIRouter, status

from app.config import save_env_variable
from app.schemas import AIConfigRequest, AIConfigResponse, AIStatusResponse
from app.services.ai_advisor import get_ai_status

router = APIRouter(prefix="/api/ai", tags=["AI"])

PROVIDER_ENV_MAP: Final[dict[str, str]] = {
    "gemini": "GEMINI_API_KEY",
    "openai": "OPENAI_API_KEY",
    "claude": "ANTHROPIC_API_KEY",
}


@router.get("/status", response_model=AIStatusResponse)
def get_provider_status() -> AIStatusResponse:
    """Return presence status of API keys for all supported AI providers.

    Never exposes the raw secrets, returning only boolean flags.

    Returns
    -------
    AIStatusResponse
        Status of gemini, openai, and claude configuration and default selection.
    """
    status_data = get_ai_status()
    return AIStatusResponse.model_validate(status_data)


@router.post("/config", response_model=AIConfigResponse, status_code=status.HTTP_200_OK)
def update_provider_config(request: AIConfigRequest) -> AIConfigResponse:
    """Register or persist an API key for a selected AI provider.

    Parameters
    ----------
    request : AIConfigRequest
        Target provider, API key, and whether to persist into the local .env file.

    Returns
    -------
    AIConfigResponse
        Confirmation of provider configuration update.
    """
    env_var = PROVIDER_ENV_MAP[request.provider]
    clean_key = request.api_key.strip()

    if request.save_to_env:
        save_env_variable(env_var, clean_key)
        msg = f"Key for {request.provider} saved to local .env and loaded into environment."
    else:
        os.environ[env_var] = clean_key
        msg = f"Key for {request.provider} registered for current runtime session."

    return AIConfigResponse(
        provider=request.provider,
        saved_to_env=request.save_to_env,
        message=msg,
    )
