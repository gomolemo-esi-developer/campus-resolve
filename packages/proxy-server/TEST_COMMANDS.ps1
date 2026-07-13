# Campus Admin API Testing Commands (PowerShell)
# Run these commands to test all endpoints

# Set variables
$headers = @{
  "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test"
  "Content-Type" = "application/json"
}
$BASE = "http://localhost:8088/api/admin"

# 1. CREATE campus (POST)
Write-Host "1. CREATE campus" -ForegroundColor Green
$campus = '{"name":"Main Campus","location":"City Center","abbreviation":"MC"}'
$campusResponse = Invoke-WebRequest -Uri "$BASE/campuses" -Method POST -Headers $headers -Body $campus
$campusId = ($campusResponse.Content | ConvertFrom-Json).data.id
Write-Host "Created campus: $campusId`n"

# 2. LIST campuses (GET)
Write-Host "2. LIST campuses" -ForegroundColor Green
Invoke-WebRequest -Uri "$BASE/campuses" -Method GET -Headers $headers
Write-Host "`n"

# 3. GET single campus
Write-Host "3. GET single campus" -ForegroundColor Green
Invoke-WebRequest -Uri "$BASE/campuses/$campusId" -Method GET -Headers $headers
Write-Host "`n"

# 4. UPDATE campus
Write-Host "4. UPDATE campus" -ForegroundColor Green
$updateJson = '{"name":"Updated Campus Name"}'
Invoke-WebRequest -Uri "$BASE/campuses/$campusId" -Method PUT -Headers $headers -Body $updateJson
Write-Host "`n"

# 5. DELETE campus
Write-Host "5. DELETE campus" -ForegroundColor Green
Invoke-WebRequest -Uri "$BASE/campuses/$campusId" -Method DELETE -Headers $headers
Write-Host "`n"

# 6. TEST validation error (missing required field)
Write-Host "6. TEST 400 validation error" -ForegroundColor Yellow
$invalid = '{"location":"City Center"}'
try {
  Invoke-WebRequest -Uri "$BASE/campuses" -Method POST -Headers $headers -Body $invalid
} catch {
  Write-Host "Expected 400 error: $($_.Exception.Message)`n"
}

# 7. TEST 401 (no auth header)
Write-Host "7. TEST 401 unauthorized" -ForegroundColor Yellow
try {
  Invoke-WebRequest -Uri "$BASE/campuses" -Method GET
} catch {
  Write-Host "Expected 401 error: $($_.Exception.Message)`n"
}

# 8. TEST validation - invalid email format
Write-Host "8. TEST 400 invalid email" -ForegroundColor Yellow
$invalidStaff = '{"name":"John","email":"invalid-email","campusId":"123"}'
try {
  Invoke-WebRequest -Uri "$BASE/staff" -Method POST -Headers $headers -Body $invalidStaff
} catch {
  Write-Host "Expected 400 error: $($_.Exception.Message)`n"
}

# 9. TEST 404 (non-existent record)
Write-Host "9. TEST 404 not found" -ForegroundColor Yellow
try {
  Invoke-WebRequest -Uri "$BASE/campuses/00000000-0000-0000-0000-000000000000" -Method GET -Headers $headers
} catch {
  Write-Host "Expected 404 error: $($_.Exception.Message)`n"
}

Write-Host "10. CHECK audit logs in Supabase Dashboard > SQL Editor:" -ForegroundColor Cyan
Write-Host "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;" -ForegroundColor Cyan
