"""Environment configuration and .env file loader for SmartCommute backend."""

import contextlib
import os
from pathlib import Path


def load_env_file() -> None:
    """Load environment variables from .env in project root or backend directory.

    Reads key-value pairs without overriding already set system environment variables.
    """
    candidates = [
        Path.cwd() / ".env",
        Path.cwd().parent / ".env",
        Path(__file__).resolve().parent.parent / ".env",
        Path(__file__).resolve().parent.parent.parent / ".env",
    ]

    for env_path in candidates:
        if env_path.is_file():
            with contextlib.suppress(OSError), open(env_path, encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    key, val = line.split("=", 1)
                    key = key.strip()
                    val = val.strip().strip("'\"")
                    if key and key not in os.environ:
                        os.environ[key] = val
            break
