# Auto-Fix Script for Node.js Server Issues
# Usage: .\auto-fix.ps1 -Port 4000 -ProjectRoot "C:\myapp"

param(
    [int]$Port = 4000,
    [string]$ProjectRoot = "."
)

$fixesApplied = @()

# Fix 1: Install missing dependencies
if (Test-Path "$ProjectRoot\package.json") {
    $nodeModulesExists = Test-Path "$ProjectRoot\node_modules"
    if (-not $nodeModulesExists) {
        Write-Host "Fixing: Installing missing dependencies..." -ForegroundColor Yellow
        Push-Location $ProjectRoot
        & npm install
        Pop-Location
        if ($LASTEXITCODE -eq 0) {
            $fixesApplied += "Installed npm dependencies"
            Write-Host "  -> Fixed: Dependencies installed" -ForegroundColor Green
        } else {
            Write-Host "  -> Failed: npm install returned error" -ForegroundColor Red
        }
    }
}

# Fix 2: Kill stale process on port
$portLine = netstat -ano | findstr ":$Port " | Select-Object -First 1
if ($portLine) {
    $pid = ($portLine -split '\s+')[-1]
    if ($pid -match '^\d+$') {
        Write-Host "Fixing: Killing stale process $pid on port $Port..." -ForegroundColor Yellow
        & taskkill /PID $pid /F 2>&1 | Out-Null
        Start-Sleep -Seconds 2
        $fixesApplied += "Killed stale process PID $pid on port $Port"
        Write-Host "  -> Fixed: Process $pid terminated" -ForegroundColor Green
    }
}

# Fix 3: Remove SQLite WAL/SHM files (potential lock)
$dbFiles = Get-ChildItem -Path $ProjectRoot -Filter "*.sqlite*" -ErrorAction SilentlyContinue
$walFiles = $dbFiles | Where-Object { $_.Name -match '\.(sqlite-wal|sqlite-shm)$' }
if ($walFiles) {
    Write-Host "Fixing: Removing stale SQLite WAL/SHM files..." -ForegroundColor Yellow
    foreach ($f in $walFiles) {
        Remove-Item $f.FullName -Force -ErrorAction SilentlyContinue
        $fixesApplied += "Removed $($f.Name)"
        Write-Host "  -> Removed: $($f.Name)" -ForegroundColor Green
    }
}

# Fix 4: Create error log file if missing
if (-not (Test-Path "$ProjectRoot\server.err")) {
    New-Item -ItemType File -Path "$ProjectRoot\server.err" -Force | Out-Null
    $fixesApplied += "Created server.err log file"
}

# Summary
Write-Host "`n=== Auto-Fix Summary ===" -ForegroundColor Cyan
if ($fixesApplied.Count -eq 0) {
    Write-Host "No fixes needed - all checks passed." -ForegroundColor Green
} else {
    $fixesApplied | ForEach-Object { Write-Host "  [OK] $_" -ForegroundColor Green }
}
Write-Host "========================`n" -ForegroundColor Cyan

return $fixesApplied
