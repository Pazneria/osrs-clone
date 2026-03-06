param(
    [Parameter(Mandatory = $true)]
    [string]$InputDir,

    [string]$OutputDir = "",

    [int]$CellSize = 6,

    [int]$PaletteColors = 24,

    [int]$Upscale = 6,

    [switch]$Recurse
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$resolvedInputDir = Resolve-Path -Path $InputDir -ErrorAction Stop
$inputDirPath = $resolvedInputDir.Path

if ($OutputDir -eq "") {
    $OutputDir = Join-Path $inputDirPath "pixelized"
}

New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null

$scriptPath = Join-Path $PSScriptRoot "pixelize.ps1"
if (-not (Test-Path $scriptPath)) {
    throw "Could not find pixelize.ps1 at '$scriptPath'."
}

$extensions = @("*.png", "*.jpg", "*.jpeg", "*.webp", "*.bmp")
$searchOptions = @{}
if ($Recurse) { $searchOptions.Recurse = $true }

$files = @(
    foreach ($pattern in $extensions) {
        Get-ChildItem -Path $inputDirPath -File -Filter $pattern @searchOptions
    }
)

if ($files.Count -eq 0) {
    Write-Host "No input images found in: $inputDirPath"
    exit 0
}

$count = 0
foreach ($file in $files) {
    $baseName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
    $outputFile = Join-Path $OutputDir "$baseName-pixel.png"

    & $scriptPath `
        -InputPath $file.FullName `
        -OutputPath $outputFile `
        -CellSize $CellSize `
        -PaletteColors $PaletteColors `
        -Upscale $Upscale

    $count++
}

Write-Host "Processed $count image(s). Output directory: $OutputDir"
