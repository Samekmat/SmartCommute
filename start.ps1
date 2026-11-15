<#
.SYNOPSIS
    Starts both SmartCommute backend (FastAPI) and frontend (React Vite) via unified runner.
#>
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

python "$ScriptDir\run.py"
