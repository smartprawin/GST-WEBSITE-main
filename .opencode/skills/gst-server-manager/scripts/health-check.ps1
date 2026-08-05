# Health Check Script for Node.js Servers
# Usage: .\health-check.ps1 -Port 4000 -ProjectRoot "C:\myapp"

param(
    [int]$Port = 4000,
    [string]$ProjectRoot = "."
)

$results = @{
    NodeVersion = $null
    Dependencies = $null
    PortStatus = $null
    ServerRunning = $false
    HttpCheck = $null
    DatabaseExists = $null
    Errors = @()
}

# 1. Check Node.js
try {
    $results.NodeVersion = & node --version 2>&1
} catch {
    $results.Errors += "Node.js is not installed or not in PATH"
}

# 2. Check dependencies
if (Test-Path "$ProjectRoot\package.json") {
    $lsOutput = & npm ls 2>&1
    if ($LASTEXITCODE -ne 0) {
        $results.Dependencies = "MISSING - run 'npm install'"
    } else {
        $results.Dependencies = "OK"
    }
} else {
    $results.Errors += "No package.json found in $ProjectRoot"
}

# 3. Check port
$portCheck = netstat -ano | findstr ":$Port "
if ($portCheck) {
    $results.PortStatus = "IN USE"
    $results.ServerRunning = $true
} else {
    $results.PortStatus = "FREE"
}

# 4. HTTP check (only if server appears running)
if ($results.ServerRunning) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port/" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        $results.HttpCheck = "OK (Status: $($response.StatusCode))"
    } catch {
        $results.HttpCheck = "RESPONDING (Error page returned - may be normal)"
    }
}

# 5. Check common database files
$dbFiles = @("data.sqlite", "database.db", "app.db", "server.db")
foreach ($db in $dbFiles) {
    if (Test-Path "$ProjectRoot\$db") {
        $results.DatabaseExists = "FOUND ($db)"
        break
    }
}

# Output results
Write-Host "`n=== Server Health Check ===" -ForegroundColor Cyan
Write-Host "Node.js:      $($results.NodeVersion)" -ForegroundColor $(if ($results.NodeVersion) { "Green" } else { "Red" })
Write-Host "Dependencies: $($results.Dependencies)" -ForegroundColor $(if ($results.Dependencies -eq "OK") { "Green" } else { "Yellow" })
Write-Host "Port $Port:     $($results.PortStatus)" -ForegroundColor $(if ($results.ServerRunning) { "Green" } else { "Yellow" })
Write-Host "Server:       $(if ($results.ServerRunning) { 'RUNNING' } else { 'STOPPED' })" -ForegroundColor $(if ($results.ServerRunning) { "Green" } else { "Red" })
if ($results.HttpCheck) {
    Write-Host "HTTP:         $($results.HttpCheck)" -ForegroundColor Green
}
if ($results.DatabaseExists) {
    Write-Host "Database:     $($results.DatabaseExists)" -ForegroundColor Green
}
if ($results.Errors.Count -gt 0) {
    Write-Host "`nErrors:" -ForegroundColor Red
    $results.Errors | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
}
Write-Host "=========================`n" -ForegroundColor Cyan

return $results
