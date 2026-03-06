Set-StrictMode -Version Latest

function Get-MagickCommand {
    param(
        [string]$CallerRoot
    )

    if ($env:MAGICK_EXE -and (Test-Path $env:MAGICK_EXE)) {
        return (Resolve-Path $env:MAGICK_EXE).Path
    }

    if ($CallerRoot) {
        $candidate = Join-Path $CallerRoot "..\bin\imagemagick\magick.exe"
        if (Test-Path $candidate) {
            return (Resolve-Path $candidate).Path
        }
    }

    $cmd = Get-Command magick -ErrorAction SilentlyContinue
    if ($cmd) {
        return "magick"
    }

    return $null
}
