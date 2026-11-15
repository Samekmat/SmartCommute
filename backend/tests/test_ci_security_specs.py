"""Automated verification tests for CI security configurations and workflows.

Validates that enterprise-grade security scans, Dependabot configurations,
secret leak prevention, SAST analysis, and CodeQL workflows conform strictly
to repository standards and specifications.
"""

import tomllib
from pathlib import Path
from typing import Any

import yaml


def _get_repo_root() -> Path:
    """Return the absolute path to the repository root directory."""
    return Path(__file__).resolve().parents[2]


def _load_yaml(relative_path: str) -> dict[str, Any]:
    """Ensure a YAML configuration file exists and return its parsed dictionary."""
    file_path = _get_repo_root() / relative_path
    assert file_path.is_file(), f"{relative_path} must exist"
    with file_path.open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    assert isinstance(data, dict), f"{relative_path} must parse into a YAML mapping"
    return data


def test_dependabot_configuration() -> None:
    """Validate .github/dependabot.yml exists and monitors all required ecosystems."""
    config = _load_yaml(".github/dependabot.yml")

    assert config.get("version") == 2, "Dependabot version must be 2"
    updates = config.get("updates", [])
    assert isinstance(updates, list) and len(updates) >= 4, (
        "Dependabot must configure pip, root npm, frontend npm, and github-actions"
    )

    ecosystem_dirs = {(u.get("package-ecosystem"), u.get("directory")) for u in updates}

    assert ("github-actions", "/") in ecosystem_dirs
    assert ("npm", "/") in ecosystem_dirs
    assert ("npm", "/frontend") in ecosystem_dirs
    assert ("pip", "/backend") in ecosystem_dirs

    for update in updates:
        schedule = update.get("schedule", {})
        assert schedule.get("interval") == "weekly", (
            f"Schedule interval for {update.get('package-ecosystem')} must be weekly"
        )


def test_security_workflow_structure_and_jobs() -> None:
    """Validate .github/workflows/security.yml contains all required security jobs."""
    workflow = _load_yaml(".github/workflows/security.yml")

    triggers = workflow.get("on") or workflow.get(True) or {}
    assert "push" in triggers, "Workflow must trigger on push"
    assert "pull_request" in triggers, "Workflow must trigger on pull_request"

    perms = workflow.get("permissions")
    assert perms == {"contents": "read"} or (
        isinstance(perms, dict) and perms.get("contents") == "read"
    ), "Global workflow permissions must default to contents: read"

    jobs = workflow.get("jobs", {})
    expected_jobs = [
        "dependency-audit",
        "secret-scan",
        "sast-python",
        "dependency-review",
        "container-security",
    ]
    for expected in expected_jobs:
        assert expected in jobs, f"Job '{expected}' missing from security.yml"


def test_codeql_workflow_structure_and_matrix() -> None:
    """Validate .github/workflows/codeql.yml configures Python and TypeScript analysis."""
    workflow = _load_yaml(".github/workflows/codeql.yml")

    jobs = workflow.get("jobs", {})
    analyze_job = jobs.get("analyze", {})
    job_perms = analyze_job.get("permissions", {})
    top_perms = workflow.get("permissions", {})
    assert (
        job_perms.get("security-events") == "write"
        or top_perms.get("security-events") == "write"
    ), "CodeQL requires security-events: write permission to publish findings"

    strategy = analyze_job.get("strategy", {})
    matrix = strategy.get("matrix", {})
    languages = matrix.get("language", [])
    assert "python" in languages, "CodeQL matrix must include 'python'"
    assert "javascript-typescript" in languages, (
        "CodeQL matrix must include 'javascript-typescript'"
    )


def test_gitleaks_configuration_file() -> None:
    """Validate .gitleaks.toml configures proper allowlist for synthetic test fixtures."""
    gitleaks_path = _get_repo_root() / ".gitleaks.toml"
    assert gitleaks_path.is_file(), ".gitleaks.toml must exist"

    with gitleaks_path.open("r", encoding="utf-8") as f:
        config = tomllib.loads(f.read())

    assert "allowlist" in config, ".gitleaks.toml must define an allowlist"
    allowlist = config["allowlist"]
    assert "regexes" in allowlist or "paths" in allowlist
