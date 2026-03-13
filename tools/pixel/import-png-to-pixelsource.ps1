param(
    [Parameter(Mandatory = $true)]
    [string]$InputPath,

    [Parameter(Mandatory = $true)]
    [string]$AssetId,

    [string]$OutputPath = "",

    [int]$CanvasSize = 32
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ($AssetId -notmatch '^[a-z0-9_]+$') {
    throw "AssetId must match ^[a-z0-9_]+$"
}

if ($CanvasSize -ne 32) {
    throw "CanvasSize must be 32 in v1"
}

if ($OutputPath -eq "") {
    $projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
    $OutputPath = Join-Path $projectRoot "assets\pixel-src\$AssetId.json"
}

Add-Type -AssemblyName System.Drawing

$inputFull = (Resolve-Path -Path $InputPath -ErrorAction Stop).Path
$bitmap = [System.Drawing.Bitmap]::FromFile($inputFull)
$scaled = $null

try {
    $scale = [Math]::Min($CanvasSize / [double]$bitmap.Width, $CanvasSize / [double]$bitmap.Height)
    $targetWidth = [Math]::Max(1, [Math]::Min($CanvasSize, [Math]::Round($bitmap.Width * $scale)))
    $targetHeight = [Math]::Max(1, [Math]::Min($CanvasSize, [Math]::Round($bitmap.Height * $scale)))

    $scaled = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight)
    $graphics = [System.Drawing.Graphics]::FromImage($scaled)
    try {
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
        $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $graphics.DrawImage($bitmap, 0, 0, $targetWidth, $targetHeight)
    }
    finally {
        $graphics.Dispose()
    }

    $offsetX = [Math]::Floor(($CanvasSize - $targetWidth) / 2)
    $offsetY = [Math]::Floor(($CanvasSize - $targetHeight) / 2)
    $symbolPool = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!$%&*+=?@#^~;:/,<>[]{}()|-_"
    $nextSymbolIndex = 0

    $palette = [ordered]@{
        "." = "transparent"
    }
    $symbolByColor = @{}
    $rows = New-Object System.Collections.Generic.List[string]

    for ($y = 0; $y -lt $CanvasSize; $y++) {
        $rowChars = New-Object char[] $CanvasSize
        for ($x = 0; $x -lt $CanvasSize; $x++) {
            $symbol = "."
            $sx = $x - $offsetX
            $sy = $y - $offsetY
            if ($sx -ge 0 -and $sx -lt $targetWidth -and $sy -ge 0 -and $sy -lt $targetHeight) {
                $color = $scaled.GetPixel($sx, $sy)
                if ($color.A -gt 0) {
                    $hex = "#{0:x2}{1:x2}{2:x2}{3:x2}" -f $color.R, $color.G, $color.B, $color.A
                    if (-not $symbolByColor.ContainsKey($hex)) {
                        if ($nextSymbolIndex -ge $symbolPool.Length) {
                            throw "Ran out of palette symbols while importing '$InputPath'"
                        }
                        $symbol = $symbolPool[$nextSymbolIndex]
                        $nextSymbolIndex += 1
                        $symbolByColor[$hex] = [string]$symbol
                        $palette[[string]$symbol] = $hex
                    }
                    $symbol = $symbolByColor[$hex]
                }
            }
            $rowChars[$x] = $symbol[0]
        }
        $rows.Add((-join $rowChars))
    }

    $payload = [ordered]@{
        id = $AssetId
        width = 32
        height = 32
        palette = $palette
        pixels = $rows
        model = [ordered]@{
            depth = 4
            scale = 0.05
            groundVariant = "copy"
        }
    }

    $outputDir = Split-Path -Parent $OutputPath
    if (-not (Test-Path $outputDir)) {
        New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
    }

    $payload | ConvertTo-Json -Depth 8 | Set-Content -Path $OutputPath
    Write-Host "Imported pixel source: $OutputPath"
}
finally {
    if ($scaled) { $scaled.Dispose() }
    $bitmap.Dispose()
}
