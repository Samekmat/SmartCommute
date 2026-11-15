"""Single-file runner to start both SmartCommute backend and frontend concurrently."""

import contextlib
import os
import platform
import shutil
import signal
import subprocess
import sys
import threading
import time
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"

IS_WINDOWS = platform.system() == "Windows"

# ANSI Color codes for clean terminal multiplexing
COLOR_CYAN = "\033[96m"
COLOR_GREEN = "\033[92m"
COLOR_YELLOW = "\033[93m"
COLOR_RED = "\033[91m"
COLOR_BOLD = "\033[1m"
COLOR_RESET = "\033[0m"


def enable_windows_ansi() -> None:
    """Enable ANSI virtual terminal processing on Windows platforms."""
    if IS_WINDOWS:
        os.system("")


def load_env_variables() -> None:
    """Load key-value environment pairs from .env file if present."""
    candidates = [ROOT_DIR / ".env", BACKEND_DIR / ".env"]
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


def print_log(prefix: str, color: str, message: str) -> None:
    """Print a prefixed and colorized log message to stdout.

    Parameters
    ----------
    prefix : str
        Source tag (e.g. 'BACKEND', 'FRONTEND', 'SYSTEM').
    color : str
        ANSI color code.
    message : str
        Text to display.
    """
    clean_msg = message.rstrip("\r\n")
    if clean_msg:
        print(f"{color}{COLOR_BOLD}[{prefix}]{COLOR_RESET} {clean_msg}", flush=True)


def stream_output(pipe, prefix: str, color: str) -> None:
    """Read lines from a process output pipe and forward them to stdout.

    Parameters
    ----------
    pipe : IO[bytes] | IO[str]
        Readable stdout/stderr pipe from subprocess.
    prefix : str
        Source identifier tag.
    color : str
        ANSI color code for prefix.
    """
    try:
        for line in iter(pipe.readline, ""):
            if not line:
                break
            print_log(prefix, color, line)
    except (ValueError, UnicodeDecodeError):
        return
    finally:
        with contextlib.suppress(OSError):
            pipe.close()


def resolve_backend_command() -> list[str]:
    """Determine the optimal command to start the FastAPI backend.

    Prefers `uv run uvicorn`, falls back to backend venv uvicorn or python module.

    Returns
    -------
    list[str]
        Command line arguments list.
    """
    uv_path = shutil.which("uv")
    if uv_path:
        return ["uv", "run", "uvicorn", "app.main:app", "--reload", "--port", "8000"]

    venv_uvicorn = BACKEND_DIR / (
        ".venv/Scripts/uvicorn.exe" if IS_WINDOWS else ".venv/bin/uvicorn"
    )
    if venv_uvicorn.is_file():
        return [str(venv_uvicorn), "app.main:app", "--reload", "--port", "8000"]

    return [
        sys.executable,
        "-m",
        "uvicorn",
        "app.main:app",
        "--reload",
        "--port",
        "8000",
    ]


def resolve_frontend_command() -> tuple[list[str], bool]:
    """Determine the command to start the React Vite frontend dev server.

    Returns
    -------
    tuple[list[str], bool]
        Tuple of (command arguments list, shell flag).
    """
    if IS_WINDOWS:
        npm_cmd = shutil.which("npm.cmd") or shutil.which("npm")
        if npm_cmd:
            return [npm_cmd, "run", "dev"], False
        return ["npm", "run", "dev"], True

    npm_bin = shutil.which("npm") or "npm"
    return [npm_bin, "run", "dev"], False


def kill_process_tree(proc: subprocess.Popen) -> None:
    """Terminate a process and all its child processes cleanly.

    Parameters
    ----------
    proc : subprocess.Popen
        Process instance to terminate.
    """
    if proc.poll() is not None:
        return

    pid = proc.pid
    if IS_WINDOWS:
        # Use taskkill /F /T to terminate child processes (Vite/Uvicorn reloader workers)
        subprocess.run(
            ["taskkill", "/F", "/T", "/PID", str(pid)],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )
    else:
        try:
            os.killpg(os.getpgid(pid), signal.SIGTERM)
        except (ProcessLookupError, PermissionError):
            proc.terminate()


def main() -> None:
    """Orchestrate starting and monitoring both backend and frontend servers."""
    enable_windows_ansi()
    load_env_variables()

    banner = f"""
{COLOR_CYAN}======================================================================{COLOR_RESET}
{COLOR_BOLD}  SmartCommute — Unified Full-Stack Runner{COLOR_RESET}
{COLOR_CYAN}======================================================================{COLOR_RESET}
  Backend API & Swagger:  {COLOR_BOLD}http://localhost:8000/docs{COLOR_RESET}
  Frontend Web App:       {COLOR_BOLD}http://localhost:5173{COLOR_RESET}

  {COLOR_YELLOW}Press Ctrl+C at any time to gracefully terminate both services.{COLOR_RESET}
{COLOR_CYAN}======================================================================{COLOR_RESET}
"""
    print(banner, flush=True)

    if not BACKEND_DIR.is_dir() or not FRONTEND_DIR.is_dir():
        print_log(
            "ERROR",
            COLOR_RED,
            f"Missing required directories in {ROOT_DIR}. Ensure backend/ and frontend/ exist.",
        )
        sys.exit(1)

    backend_cmd = resolve_backend_command()
    frontend_cmd, frontend_shell = resolve_frontend_command()

    print_log("SYSTEM", COLOR_YELLOW, f"Starting backend:  {' '.join(backend_cmd)}")
    print_log("SYSTEM", COLOR_YELLOW, f"Starting frontend: {' '.join(frontend_cmd)}")

    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=str(BACKEND_DIR),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        encoding="utf-8",
        errors="replace",
        start_new_session=not IS_WINDOWS,
    )

    frontend_proc = subprocess.Popen(
        frontend_cmd,
        cwd=str(FRONTEND_DIR),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        encoding="utf-8",
        errors="replace",
        shell=frontend_shell,
        start_new_session=not IS_WINDOWS,
    )

    threads = [
        threading.Thread(
            target=stream_output,
            args=(backend_proc.stdout, "BACKEND", COLOR_CYAN),
            daemon=True,
        ),
        threading.Thread(
            target=stream_output,
            args=(frontend_proc.stdout, "FRONTEND", COLOR_GREEN),
            daemon=True,
        ),
    ]

    for thread in threads:
        thread.start()

    try:
        while True:
            # Check if any process died unexpectedly
            b_code = backend_proc.poll()
            f_code = frontend_proc.poll()

            if b_code is not None:
                print_log(
                    "SYSTEM", COLOR_RED, f"Backend process exited with code {b_code}."
                )
                break
            if f_code is not None:
                print_log(
                    "SYSTEM", COLOR_RED, f"Frontend process exited with code {f_code}."
                )
                break

            time.sleep(0.5)

    except KeyboardInterrupt:
        print_log(
            "SYSTEM",
            COLOR_YELLOW,
            "Interrupt signal received (Ctrl+C). Shutting down...",
        )
    finally:
        print_log("SYSTEM", COLOR_YELLOW, "Stopping backend server...")
        kill_process_tree(backend_proc)

        print_log("SYSTEM", COLOR_YELLOW, "Stopping frontend server...")
        kill_process_tree(frontend_proc)

        backend_proc.wait(timeout=5)
        frontend_proc.wait(timeout=5)

        print_log("SYSTEM", COLOR_GREEN, "All services successfully stopped. Bye!")


if __name__ == "__main__":
    main()
