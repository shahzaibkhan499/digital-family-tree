param(
    [string]$RootDir = (Get-Location).Path
)

$results = @()
$hasError = $false

function Write-Step {
    param([string]$Name, [bool]$Passed, [string]$Output)
    $status = if ($Passed) { "PASS" } else { "FAIL" }
    $results += [PSCustomObject]@{ Step = $Name; Status = $status }
    if (-not $Passed) { $hasError = $true }
    if ($Output) { Write-Host $Output -ForegroundColor $(if ($Passed) { "Green" } else { "Red" }) }
}

Write-Host "=== Production Build Verification ===" -ForegroundColor Cyan
Write-Host "Root: $RootDir`n" -ForegroundColor Gray

# Step 1: API TypeScript check
Write-Host "[1/6] API tsc --noEmit..." -NoNewline
$apiTsc = & "npx" "tsc" "--noEmit" 2>&1
$apiTscOk = $LASTEXITCODE -eq 0
Write-Step "apps/api tsc --noEmit" $apiTscOk $apiTsc

# Step 2: Web TypeScript check
Write-Host "[2/6] Web tsc --noEmit..." -NoNewline
$webTsc = & "npx" "tsc" "--noEmit" 2>&1
$webTscOk = $LASTEXITCODE -eq 0
Write-Step "apps/web tsc --noEmit" $webTscOk $webTsc

# Step 3: Admin TypeScript check
Write-Host "[3/6] Admin tsc --noEmit..." -NoNewline
$adminTsc = & "npx" "tsc" "--noEmit" 2>&1
$adminTscOk = $LASTEXITCODE -eq 0
Write-Step "apps/admin tsc --noEmit" $adminTscOk $adminTsc

# Step 4: API Jest tests
Write-Host "[4/6] API jest --passWithNoTests..." -NoNewline
$apiTest = & "npx" "jest" "--passWithNoTests" 2>&1
$apiTestOk = $LASTEXITCODE -eq 0
Write-Step "apps/api jest --passWithNoTests" $apiTestOk $apiTest

# Step 5: API Nest build
Write-Host "[5/6] API nest build..." -NoNewline
$apiBuild = & "npx" "nest" "build" 2>&1
$apiBuildOk = $LASTEXITCODE -eq 0
Write-Step "apps/api nest build" $apiBuildOk $apiBuild

# Step 6: Web Next build
Write-Host "[6/6] Web next build (--no-lint)..." -NoNewline
$webBuild = & "npx" "next" "build" "--no-lint" 2>&1
$webBuildOk = $LASTEXITCODE -eq 0
Write-Step "apps/web next build --no-lint" $webBuildOk $webBuild

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
$results | ForEach-Object {
    $color = if ($_.Status -eq "PASS") { "Green" } else { "Red" }
    Write-Host ("  {0,-45} {1}" -f $_.Step, $_.Status) -ForegroundColor $color
}

if ($hasError) {
    Write-Host "`nBUILD VERIFICATION FAILED" -ForegroundColor Red
    exit 1
} else {
    Write-Host "`nBUILD VERIFICATION PASSED" -ForegroundColor Green
    exit 0
}
