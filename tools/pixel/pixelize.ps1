param(
    [Parameter(Mandatory = $true)]
    [string]$InputPath,

    [string]$OutputPath = "",

    [int]$CellSize = 6,

    [int]$PaletteColors = 24,

    [int]$Upscale = 6
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "..\common\resolve-magick.ps1")
$magickCmd = Get-MagickCommand -CallerRoot $PSScriptRoot
if (-not $magickCmd) {
    throw "ImageMagick not found. Put magick.exe at tools/bin/imagemagick/magick.exe, or install ImageMagick and add 'magick' to PATH."
}

$resolvedInput = Resolve-Path -Path $InputPath -ErrorAction Stop
$inputFullPath = $resolvedInput.Path

if ($OutputPath -eq "") {
    $inputDir = Split-Path -Parent $inputFullPath
    $inputBase = [System.IO.Path]::GetFileNameWithoutExtension($inputFullPath)
    $OutputPath = Join-Path $inputDir "$inputBase-pixel.png"
}

if ($CellSize -lt 1) { throw "CellSize must be >= 1." }
if ($PaletteColors -lt 2) { throw "PaletteColors must be >= 2." }
if ($Upscale -lt 1) { throw "Upscale must be >= 1." }

$sizeString = & $magickCmd identify -format "%w %h" "$inputFullPath"
$parts = $sizeString -split " "
if ($parts.Length -ne 2) {
    throw "Could not read image dimensions from '$inputFullPath'."
}

[int]$width = $parts[0]
[int]$height = $parts[1]

$targetW = [Math]::Max(16, [Math]::Round($width / $CellSize))
$targetH = [Math]::Max(16, [Math]::Round($height / $CellSize))
$finalW = [Math]::Max(16, $targetW * $Upscale)
$finalH = [Math]::Max(16, $targetH * $Upscale)

& $magickCmd `
    "$inputFullPath" `
    -filter point -resize "$($targetW)x$($targetH)!" `
    -colors $PaletteColors -dither FloydSteinberg `
    -filter point -resize "$($finalW)x$($finalH)!" `
    "$OutputPath"

Write-Host "Pixelized image written to: $OutputPath"
Write-Host "Source: ${width}x${height} -> Reduced: ${targetW}x${targetH} -> Final: ${finalW}x${finalH}"
