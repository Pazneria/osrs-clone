param(
    [Parameter(Mandatory = $true)]
    [string]$InputModel,

    [Parameter(Mandatory = $true)]
    [string]$OutputPath,

    [int]$Size = 256
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-Blender {
    if ($env:BLENDER_EXE -and (Test-Path $env:BLENDER_EXE)) {
        return (Resolve-Path $env:BLENDER_EXE).Path
    }

    $localBlender = Join-Path $PSScriptRoot "..\bin\blender\blender.exe"
    if (Test-Path $localBlender) {
        return (Resolve-Path $localBlender).Path
    }

    $cmd = Get-Command blender -ErrorAction SilentlyContinue
    if ($cmd) {
        return $cmd.Source
    }

    return $null
}

if ($Size -lt 64 -or $Size -gt 2048) {
    throw "Size must be between 64 and 2048."
}

$resolvedInput = Resolve-Path -Path $InputModel -ErrorAction Stop
$inputFull = $resolvedInput.Path

$outputFull = [System.IO.Path]::GetFullPath($OutputPath)
$outputDir = Split-Path -Parent $outputFull
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

$blenderExe = Resolve-Blender
if (-not $blenderExe) {
    throw "Blender not found. Install Blender or place blender.exe at tools/bin/blender/blender.exe."
}

$pythonScript = Join-Path $PSScriptRoot "blender-render-icon.py"
if (-not (Test-Path $pythonScript)) {
    throw "Renderer script missing: $pythonScript"
}

& $blenderExe -b -P $pythonScript -- --input "$inputFull" --output "$outputFull" --size $Size

if ($LASTEXITCODE -ne 0) {
    throw "Blender render failed with exit code $LASTEXITCODE"
}

Write-Host "Rendered icon: $outputFull"
