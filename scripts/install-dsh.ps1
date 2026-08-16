# install-dsh.ps1 - one-command loader for dsh-plugin-xiaoliuren into a DSH profile.
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts\install-dsh.ps1
#   powershell -ExecutionPolicy Bypass -File scripts\install-dsh.ps1 -Profile headless
#   powershell -ExecutionPolicy Bypass -File scripts\install-dsh.ps1 -Source file:C:\path\to\xiaoliuren
param(
    [string]$Profile = 'web',
    [string]$Source = 'git+https://github.com/shuimo07/xiaoliuren.git',
    [switch]$SkipInstall
)

$ErrorActionPreference = 'Stop'

# 1. locate DSH home and the target profile directory
$dshHome = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $env:USERPROFILE '.dsh' }
$profileDir = Join-Path $dshHome (Join-Path 'profiles' $Profile)
if (-not (Test-Path $profileDir)) {
    Write-Error "Profile not found: $profileDir (initialize it first with 'dsh --profile $Profile')"
    exit 1
}

Write-Host "==> DSH_HOME : $dshHome"
Write-Host "==> Profile  : $profileDir"

# 2. install the package into the profile (skip with -SkipInstall)
if (-not $SkipInstall) {
    Write-Host "==> dsh plugin --profile $Profile add $Source"
    dsh plugin --profile $Profile add $Source
    if ($LASTEXITCODE -ne 0) { Write-Error "dsh plugin add failed (exit $LASTEXITCODE)"; exit 1 }
}

# 3. idempotently append the plugin row to the profile patch layer
$patchFile = Join-Path $profileDir 'cordis.patch.yml'
$rowId = 'tool-xiaoliuren'
$insertBlock = @"

# xiaoliuren divination tool plugin (dsh-plugin-xiaoliuren): time / numbers / random
- insert:
    - id: $rowId
      name: 'dsh-plugin-xiaoliuren'
      config: { calendar: solar, randomSource: crypto }
"@

if (Test-Path $patchFile) {
    $content = [System.IO.File]::ReadAllText($patchFile)
    if ($content.Contains($rowId)) {
        Write-Host "==> $patchFile already contains '$rowId' - skip"
    } else {
        [System.IO.File]::AppendAllText($patchFile, $insertBlock, (New-Object System.Text.UTF8Encoding($false)))
        Write-Host "==> Appended plugin row to $patchFile"
    }
} else {
    $header = "# Your patch layer for this dsh profile (created by install-dsh.ps1)`r`n"
    [System.IO.File]::WriteAllText($patchFile, $header + $insertBlock, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host "==> Created $patchFile with plugin row"
}

# 4. verify + restart reminder
Write-Host ''
Write-Host '==> Done. Verify:'
Write-Host "    dsh --profile $Profile --dump-config | Select-String xiaoliuren"
Write-Host '    Then restart dsh web - the "xiaoliuren" tool becomes available to the model.'
