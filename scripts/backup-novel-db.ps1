# Novel content backup - copies the SQLite database off the working disk.
#
# NOTE: ASCII-only on purpose. Windows PowerShell 5.1 reads .ps1 as ANSI/GBK
# when there is no BOM, which corrupts non-ASCII text and breaks parsing.
# Keep $BackupRoot free of Chinese characters; move snapshots elsewhere by hand.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts\backup-novel-db.ps1
#
# What this protects: backend\prisma\dev.db holds ALL novel content
# (chapters, prose, work settings, work notes). It is gitignored (*.db),
# so it has NO copy on GitHub. This script is its only off-disk protection.

$ErrorActionPreference = 'Stop'

# ---- CONFIG ----
# F: is a different physical disk from D: (where the repo lives), so this
# already survives a D: failure. Copy to Nutstore by hand when you want off-site.
$BackupRoot = 'F:\novel-backup'
$KeepCount  = 30
# ----------------

$RepoRoot = Split-Path $PSScriptRoot -Parent
$DbPath   = Join-Path $RepoRoot 'backend\prisma\dev.db'

if (-not (Test-Path $DbPath)) {
    Write-Host "Database not found: $DbPath" -ForegroundColor Red
    exit 1
}

New-Item -ItemType Directory -Force -Path $BackupRoot | Out-Null

$stamp  = Get-Date -Format 'yyyyMMdd-HHmmss'
$target = Join-Path $BackupRoot "dev.db.$stamp"

# Copy the main db plus any WAL/SHM siblings so the snapshot stays consistent.
Copy-Item $DbPath $target -Force
foreach ($suffix in @('-wal', '-shm')) {
    $side = "$DbPath$suffix"
    if (Test-Path $side) { Copy-Item $side "$target$suffix" -Force }
}

$size = (Get-Item $target).Length
Write-Host "Backed up -> $target  ($size bytes)" -ForegroundColor Green

# ---- Rotation: keep the newest $KeepCount snapshots ----
$all = Get-ChildItem $BackupRoot -Filter 'dev.db.*' |
       Where-Object { $_.Name -notmatch '-(wal|shm)$' } |
       Sort-Object LastWriteTime -Descending

if ($all.Count -gt $KeepCount) {
    $old = $all | Select-Object -Skip $KeepCount
    foreach ($f in $old) {
        Remove-Item $f.FullName -Force
        foreach ($suffix in @('-wal', '-shm')) {
            $side = $f.FullName + $suffix
            if (Test-Path $side) { Remove-Item $side -Force }
        }
        Write-Host "  rotated out: $($f.Name)" -ForegroundColor DarkGray
    }
}

Write-Host ("Snapshots kept: " + [Math]::Min($all.Count, $KeepCount) + " / $KeepCount")
