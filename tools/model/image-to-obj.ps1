param(
    [Parameter(Mandatory = $true)]
    [string]$InputPath,

    [Parameter(Mandatory = $true)]
    [string]$OutputPath,

    [int]$Size = 32,

    [int]$Depth = 4,

    [double]$Threshold = 35,

    [double]$Scale = 0.05,

    [ValidateSet("auto", "alpha", "luma")]
    [string]$Mode = "auto"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "..\common\resolve-magick.ps1")
$magickCmd = Get-MagickCommand -CallerRoot (Join-Path $PSScriptRoot "..\pixel")
if (-not $magickCmd) {
    throw "ImageMagick not found. Put magick.exe at tools/bin/imagemagick/magick.exe, or install ImageMagick and add 'magick' to PATH."
}

if ($Size -lt 8 -or $Size -gt 256) { throw "Size must be between 8 and 256." }
if ($Depth -lt 1 -or $Depth -gt 64) { throw "Depth must be between 1 and 64." }
if ($Threshold -lt 1 -or $Threshold -gt 99) { throw "Threshold must be between 1 and 99." }
if ($Scale -le 0) { throw "Scale must be > 0." }

$inputFull = (Resolve-Path -Path $InputPath -ErrorAction Stop).Path
$outputFull = [System.IO.Path]::GetFullPath($OutputPath)
$outputDir = Split-Path -Parent $outputFull
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

function Get-MaskPixels {
    param(
        [string]$MaskMode,
        [double]$ThresholdValue,
        [bool]$Negate = $true
    )

    if ($MaskMode -eq "alpha") {
        $maskText = & $magickCmd "$inputFull" -alpha extract -resize "$($Size)x$($Size)!" -threshold "$($ThresholdValue)%" txt:-
    } else {
        if ($Negate) {
            $maskText = & $magickCmd "$inputFull" -background white -alpha remove -alpha off -colorspace gray -negate -resize "$($Size)x$($Size)!" -threshold "$($ThresholdValue)%" txt:-
        } else {
            $maskText = & $magickCmd "$inputFull" -background white -alpha remove -alpha off -colorspace gray -resize "$($Size)x$($Size)!" -threshold "$($ThresholdValue)%" txt:-
        }
    }

    $pixels = New-Object 'System.Collections.Generic.HashSet[string]'

    foreach ($line in ($maskText -split "`r?`n")) {
        if ($line -match '^(\d+),(\d+):\s+\((\d+)(?:,\d+,\d+)?') {
            $x = [int]$Matches[1]
            $y = [int]$Matches[2]
            $value = [int]$Matches[3]

            if ($x -ge 0 -and $x -lt $Size -and $y -ge 0 -and $y -lt $Size -and $value -gt 0) {
                [void]$pixels.Add("$x,$y")
            }
        }
    }

    return ,$pixels
}

$chosenMode = $Mode
if ($Mode -eq "auto") {
    $alphaMask = Get-MaskPixels -MaskMode "alpha" -ThresholdValue $Threshold
    $alphaRatio = $alphaMask.Count / ($Size * $Size)

    if ($alphaRatio -gt 0.95 -or $alphaRatio -lt 0.005) {
        $candidateThresholds = @($Threshold, 20, 10, 5)
        $maskPixels = New-Object 'System.Collections.Generic.HashSet[string]'

        foreach ($t in $candidateThresholds) {
            $tryNegated = Get-MaskPixels -MaskMode "luma" -ThresholdValue $t -Negate $true
            if ($tryNegated.Count -gt 0) {
                $maskPixels = $tryNegated
                break
            }

            $tryNormal = Get-MaskPixels -MaskMode "luma" -ThresholdValue $t -Negate $false
            if ($tryNormal.Count -gt 0) {
                $maskPixels = $tryNormal
                break
            }
        }

        $chosenMode = "luma"
    } else {
        $maskPixels = $alphaMask
        $chosenMode = "alpha"
    }
} else {
    $maskPixels = Get-MaskPixels -MaskMode $Mode -ThresholdValue $Threshold
}

if ($maskPixels.Count -eq 0) {
    throw "No solid pixels found after thresholding. Try lowering Threshold or using Mode luma."
}

$voxels = New-Object 'System.Collections.Generic.HashSet[string]'
foreach ($px in $maskPixels) {
    $xy = $px -split ","
    $x = [int]$xy[0]
    $y = [int]$xy[1]

    for ($z = 0; $z -lt $Depth; $z++) {
        [void]$voxels.Add("$x,$y,$z")
    }
}

$vertexMap = New-Object 'System.Collections.Generic.Dictionary[string,int]'
$vertexLines = New-Object 'System.Collections.Generic.List[string]'
$faceLines = New-Object 'System.Collections.Generic.List[string]'

function Add-Vertex {
    param([double]$x, [double]$y, [double]$z)

    $key = "{0:F6},{1:F6},{2:F6}" -f $x, $y, $z
    if ($vertexMap.ContainsKey($key)) {
        return $vertexMap[$key]
    }

    $index = $vertexMap.Count + 1
    $vertexMap[$key] = $index
    $vertexLines.Add(("v {0:F6} {1:F6} {2:F6}" -f $x, $y, $z))
    return $index
}

function Add-Face {
    param(
        [double[]]$a,
        [double[]]$b,
        [double[]]$c,
        [double[]]$d
    )

    $ia = Add-Vertex -x $a[0] -y $a[1] -z $a[2]
    $ib = Add-Vertex -x $b[0] -y $b[1] -z $b[2]
    $ic = Add-Vertex -x $c[0] -y $c[1] -z $c[2]
    $id = Add-Vertex -x $d[0] -y $d[1] -z $d[2]

    $faceLines.Add("f $ia $ib $ic $id")
}

function Has-Voxel {
    param([int]$x, [int]$y, [int]$z)
    return $voxels.Contains("$x,$y,$z")
}

$offsetX = -$Size / 2
$offsetZ = -$Depth / 2

foreach ($key in $voxels) {
    $parts = $key -split ","
    $x = [int]$parts[0]
    $y = [int]$parts[1]
    $z = [int]$parts[2]

    $x0 = ($x + $offsetX) * $Scale
    $x1 = ($x + 1 + $offsetX) * $Scale

    $yFromBottom = $Size - 1 - $y
    $y0 = $yFromBottom * $Scale
    $y1 = ($yFromBottom + 1) * $Scale

    $z0 = ($z + $offsetZ) * $Scale
    $z1 = ($z + 1 + $offsetZ) * $Scale

    if (-not (Has-Voxel -x ($x + 1) -y $y -z $z)) {
        Add-Face -a @($x1, $y0, $z0) -b @($x1, $y1, $z0) -c @($x1, $y1, $z1) -d @($x1, $y0, $z1)
    }

    if (-not (Has-Voxel -x ($x - 1) -y $y -z $z)) {
        Add-Face -a @($x0, $y0, $z1) -b @($x0, $y1, $z1) -c @($x0, $y1, $z0) -d @($x0, $y0, $z0)
    }

    if (-not (Has-Voxel -x $x -y ($y + 1) -z $z)) {
        Add-Face -a @($x0, $y1, $z1) -b @($x1, $y1, $z1) -c @($x1, $y1, $z0) -d @($x0, $y1, $z0)
    }

    if (-not (Has-Voxel -x $x -y ($y - 1) -z $z)) {
        Add-Face -a @($x1, $y0, $z1) -b @($x0, $y0, $z1) -c @($x0, $y0, $z0) -d @($x1, $y0, $z0)
    }

    if (-not (Has-Voxel -x $x -y $y -z ($z + 1))) {
        Add-Face -a @($x0, $y0, $z1) -b @($x1, $y0, $z1) -c @($x1, $y1, $z1) -d @($x0, $y1, $z1)
    }

    if (-not (Has-Voxel -x $x -y $y -z ($z - 1))) {
        Add-Face -a @($x1, $y0, $z0) -b @($x0, $y0, $z0) -c @($x0, $y1, $z0) -d @($x1, $y1, $z0)
    }
}

$modelName = [System.IO.Path]::GetFileNameWithoutExtension($outputFull)
$outLines = New-Object 'System.Collections.Generic.List[string]'
$outLines.Add("# Generated by tools/model/image-to-obj.ps1")
$outLines.Add("o $modelName")
foreach ($line in $vertexLines) { $outLines.Add($line) }
foreach ($line in $faceLines) { $outLines.Add($line) }

Set-Content -Path $outputFull -Value $outLines

Write-Host "Model generated: $outputFull"
Write-Host "Mode: $chosenMode"
Write-Host "Pixels used: $($maskPixels.Count) / $($Size * $Size)"
Write-Host "Depth: $Depth voxels | Scale: $Scale"
Write-Host "Vertices: $($vertexLines.Count) | Faces: $($faceLines.Count)"
