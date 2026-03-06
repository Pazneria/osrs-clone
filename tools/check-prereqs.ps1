param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common\resolve-magick.ps1")

function Check-Tool {
    param(
        [string]$Name,
        [bool]$Required = $true
    )

    $cmd = Get-Command $Name -ErrorAction SilentlyContinue
    if ($cmd) {
        Write-Host "[OK] $Name -> $($cmd.Source)"
        return $true
    }

    if ($Required) {
        Write-Host "[MISSING] $Name (required)"
    } else {
        Write-Host "[MISSING] $Name (optional)"
    }

    return $false
}

$allRequiredOk = $true

$allRequiredOk = (Check-Tool -Name "node" -Required $true) -and $allRequiredOk
$allRequiredOk = (Check-Tool -Name "npm" -Required $true) -and $allRequiredOk
$allRequiredOk = (Check-Tool -Name "git" -Required $true) -and $allRequiredOk

$magickCmd = Get-MagickCommand -CallerRoot (Join-Path $PSScriptRoot "pixel")
if ($magickCmd) {
    Write-Host "[OK] magick -> $magickCmd"
} else {
    Write-Host "[MISSING] magick (required)"
    $allRequiredOk = $false
}

Check-Tool -Name "blender" -Required $false | Out-Null
Check-Tool -Name "godot" -Required $false | Out-Null

if ($allRequiredOk) {
    Write-Host "All required tooling is installed."
    exit 0
}

Write-Host "One or more required tools are missing. See docs/TOOLKIT_SETUP.md for install steps."
exit 1
