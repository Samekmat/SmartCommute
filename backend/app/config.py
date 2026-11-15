"""Environment configuration and .env file loader for SmartCommute backend."""

import contextlib
import os
from pathlib import Path


def find_env_file() -> Path:
    """Locate active or primary .env file in project root or backend directory.

    Returns
    -------
    Path
        Path to existing or preferred .env file location.
    """
    candidates = [
        Path.cwd() / ".env",
        Path.cwd().parent / ".env",
        Path(__file__).resolve().parent.parent / ".env",
        Path(__file__).resolve().parent.parent.parent / ".env",
    ]

    for env_path in candidates:
        if env_path.is_file():
            return env_path

    # Fallback to project root relative to backend module
    return Path(__file__).resolve().parent.parent.parent / ".env"


def load_env_file() -> None:
    """Load environment variables from .env in project root or backend directory.

    Reads key-value pairs without overriding already set system environment variables.
    """
    env_file = find_env_file()
    if env_file.is_file():
        with contextlib.suppress(OSError), open(env_file, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, val = line.split("=", 1)
                key = key.strip()
                val = val.strip().strip("'\"")
                if key and key not in os.environ:
                    os.environ[key] = val


def save_env_variable(key: str, value: str) -> None:
    """Save or update an environment variable in the local .env file.

    Parameters
    ----------
    key : str
        Environment variable name (e.g. GEMINI_API_KEY, OPENAI_API_KEY).
    value : str
        Secret or credential value to store.
    """
    os.environ[key] = value
    env_file = find_env_file()

    lines: list[str] = []
    found = False
    if env_file.is_file():
        with contextlib.suppress(OSError), open(env_file, encoding="utf-8") as f:
            lines = f.readlines()

    new_lines: list[str] = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith((f"{key}=", f"{key} =")):
            new_lines.append(f"{key}={value}\n")
            found = True
        else:
            new_lines.append(line)

    if not found:
        if new_lines and not new_lines[-1].endswith("\n"):
            new_lines[-1] += "\n"
        new_lines.append(f"{key}={value}\n")

    with open(env_file, "w", encoding="utf-8") as f:
        f.writelines(new_lines)
