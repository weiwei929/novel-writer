# TASK-621 docs governance - batch 2 migration
# Usage (from repo root):
#   powershell -ExecutionPolicy Bypass -File scripts\docs-governance-migrate.ps1
#
# NOTE: This file is intentionally ASCII-only. Windows PowerShell 5.1 reads .ps1
# as ANSI/GBK when there is no BOM, which corrupts non-ASCII text and breaks parsing.
#
# Uses git mv only. No deletions. Doc count must be identical before/after.

$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)

Write-Host "=== Pre-flight ===" -ForegroundColor Cyan
$dirty = git status --porcelain
if ($dirty) {
    Write-Host "Working tree is dirty. Commit or stash first:" -ForegroundColor Red
    Write-Host $dirty
    exit 1
}
$before = (Get-ChildItem docs -Filter *.md -Recurse).Count
Write-Host "Markdown files under docs/ BEFORE: $before"

New-Item -ItemType Directory -Force -Path docs\journal | Out-Null
New-Item -ItemType Directory -Force -Path docs\journal\0608-constitutional-guidance | Out-Null
New-Item -ItemType Directory -Force -Path docs\journal\day1-reviews | Out-Null
New-Item -ItemType Directory -Force -Path docs\journal\early-drafts | Out-Null
New-Item -ItemType Directory -Force -Path docs\archive\process | Out-Null
New-Item -ItemType Directory -Force -Path docs\design\archive | Out-Null
New-Item -ItemType Directory -Force -Path docs\tasks\archive | Out-Null

function Move-Doc($src, $dstDir) {
    if (Test-Path $src) {
        git mv --force $src $dstDir
        if ($LASTEXITCODE -eq 0) { Write-Host "  moved: $src" -ForegroundColor DarkGreen }
        else { Write-Host "  FAILED: $src" -ForegroundColor Red }
    }
}

function Move-Glob($srcDir, $dstDir) {
    if (Test-Path $srcDir) {
        Get-ChildItem $srcDir -Filter *.md -File | ForEach-Object {
            Move-Doc $_.FullName $dstDir
        }
    }
}

# ---------------------------------------------------------------
# 1. Learning archive -> docs\journal\
# ---------------------------------------------------------------
Write-Host "`n=== 1. Learning archive -> docs\journal\ ===" -ForegroundColor Cyan

Write-Host "1.1 thinklogs"
Move-Glob 'docs\thinklogs' 'docs\journal'

Write-Host "1.2 0608 constitutional guidance"
Move-Glob 'docs\design\0608-constitutional-guidance' 'docs\journal\0608-constitutional-guidance'

Write-Host "1.3 Day-1 reviews"
Move-Glob 'docs\plan' 'docs\journal\day1-reviews'

Write-Host "1.4 early drafts (zh)"
Move-Glob 'docs\requirements' 'docs\journal\early-drafts'
Move-Glob 'docs\architecture' 'docs\journal\early-drafts'

Write-Host "1.5 design-phase discussions"
foreach ($f in @(
    'cursor-discussion-2026-06-05-foundation.md',
    'cursor-go-2026-06-05-foundation.md',
    'cursor-handoff-2026-06-05.md',
    'creative-v2-consultation-agenda.md',
    'creative-v2-constitution-draft.md'
)) { Move-Doc "docs\design\$f" 'docs\journal' }

Write-Host "1.6 historical E2E baseline"
Move-Doc 'docs\BASELINE_E2E_V01.md' 'docs\journal'

# ---------------------------------------------------------------
# 2. Historical archive -> docs\archive\process\ etc.
# ---------------------------------------------------------------
Write-Host "`n=== 2. Historical archive ===" -ForegroundColor Cyan

Write-Host "2.1 milestones / development / technical"
Move-Glob 'docs\milestones'   'docs\archive\process'
Move-Glob 'docs\development'  'docs\archive\process'
Move-Glob 'docs\technical'    'docs\archive\process'

Write-Host "2.2 closed task cards -> docs\tasks\archive\"
foreach ($f in @(
    'COMMIT-SUMMARY-TASK-011-016.md','EXECUTION-REPORT-TASK-014-016.md',
    'M1-B-STAGE-MODAL-TODO.md','REPORT-TASK-102-CREATIVE-GROUP-INCIDENT-2026-06-02.md',
    'TASK-001.md','TASK-002.md','TASK-011.md','TASK-012.md','TASK-013.md','TASK-014.md',
    'TASK-015.md','TASK-016.md','TASK-200.md','TASK-201.md','TASK-202.md','TASK-203.md',
    'TASK-204.md','TASK-616-B-A3.md','TASK-616-B-closure.md','TASK-616-C-A.md',
    'TASK-616-C-A2.md','TASK-616-C-D-consultation.md','TASK-616-D-A.md','TASK-616-D-B.md',
    'TASK-616-D-consultation.md','TASK-617-A-cursor-self-optimize.md',
    'TASK-618-quick-writing-loop.md','TASK-619-draft-recovery-offline-guard.md',
    'TASK-620-chapter-origin-flow-alignment.md','TASK-P1-a-entry-governance.md',
    'TASK-P1-b-entry-governance.md','icon-swap-guide.md'
)) { Move-Doc "docs\tasks\$f" 'docs\tasks\archive' }

Write-Host "2.3 superseded design docs -> docs\design\archive\"
foreach ($f in @(
    'ai-integration-design.md','code-conflict-analysis.md','day1-design.md',
    'day1-handoff-brief.md','day1-vps-code-index.md','v2-migration-map.md',
    'overall-architecture.md','editorial-dept-v2.md','editorial-library-v2.md',
    'file-staging-v2.md','intake-flow-v2.md'
)) { Move-Doc "docs\design\$f" 'docs\design\archive' }

# ---------------------------------------------------------------
# 3. Remove now-empty directories
# ---------------------------------------------------------------
Write-Host "`n=== 3. Cleanup empty dirs ===" -ForegroundColor Cyan
foreach ($d in @(
    'docs\thinklogs','docs\plan','docs\requirements','docs\architecture',
    'docs\milestones','docs\development','docs\technical',
    'docs\design\0608-constitutional-guidance'
)) {
    if (Test-Path $d) {
        $left = Get-ChildItem $d -Recurse -File
        if ($left.Count -eq 0) {
            Remove-Item $d -Force -Recurse
            Write-Host "  removed empty: $d" -ForegroundColor DarkGray
        } else {
            Write-Host "  KEPT (still has $($left.Count) file(s)): $d" -ForegroundColor Yellow
            $left | ForEach-Object { Write-Host "      $($_.Name)" -ForegroundColor Yellow }
        }
    }
}

# ---------------------------------------------------------------
# 4. Verify
# ---------------------------------------------------------------
Write-Host "`n=== 4. Verify ===" -ForegroundColor Cyan
$after = (Get-ChildItem docs -Filter *.md -Recurse).Count
Write-Host "Markdown files under docs/ AFTER : $after  (BEFORE: $before)"
if ($after -ne $before) {
    Write-Host "WARNING: count changed. Pure moves must not change the total." -ForegroundColor Red
} else {
    Write-Host "OK - zero document loss" -ForegroundColor Green
}

Write-Host "`nLIVE docs (excluding journal/ and archive/):" -ForegroundColor Cyan
Get-ChildItem docs -Filter *.md -Recurse |
    Where-Object { $_.FullName -notmatch '\\journal\\|\\archive\\' } |
    ForEach-Object { '  ' + $_.FullName.Replace((Get-Location).Path + '\', '') } |
    Sort-Object

Write-Host "`nCounts:" -ForegroundColor Cyan
Write-Host ("  journal/ : " + (Get-ChildItem docs\journal -Filter *.md -Recurse).Count)
Write-Host ("  archive/ : " + ((Get-ChildItem docs -Filter *.md -Recurse | Where-Object { $_.FullName -match '\\archive\\' }).Count))

Write-Host "`n=== Next ===" -ForegroundColor Cyan
Write-Host '  git add -A'
Write-Host '  git commit -m "docs(governance): batch 1+2"'
Write-Host '  git push'
