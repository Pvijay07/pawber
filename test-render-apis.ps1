$base = "https://pawber.onrender.com"
$results = @()

function Test-Endpoint {
    param([string]$Method, [string]$Path, [string]$Body, [string]$Description)
    
    $url = "$base$Path"
    Write-Host "`n[$Method] $Path - $Description" -ForegroundColor Cyan
    
    try {
        $params = @{
            Uri = $url
            Method = $Method
            ContentType = "application/json"
            UseBasicParsing = $true
            ErrorAction = "Stop"
        }
        if ($Body) {
            $params.Body = $Body
        }
        
        $response = Invoke-WebRequest @params
        $status = $response.StatusCode
        $body = $response.Content
        $truncBody = if ($body.Length -gt 200) { $body.Substring(0, 200) + "..." } else { $body }
        Write-Host "  Status: $status - OK" -ForegroundColor Green
        Write-Host "  Response: $truncBody"
        return @{ Path = $Path; Method = $Method; Status = $status; Result = "PASS"; Description = $Description }
    }
    catch {
        $statusCode = 0
        $errorBody = ""
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            try {
                $stream = $_.Exception.Response.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($stream)
                $errorBody = $reader.ReadToEnd()
            } catch {}
        }
        
        # Expected errors (401 for auth-required, 404 for param routes)
        $expectedError = ($statusCode -eq 401) -or ($statusCode -eq 403)
        
        if ($expectedError) {
            Write-Host "  Status: $statusCode - Expected (auth required)" -ForegroundColor Yellow
            Write-Host "  Response: $errorBody"
            return @{ Path = $Path; Method = $Method; Status = $statusCode; Result = "PASS (auth required)"; Description = $Description }
        } else {
            Write-Host "  Status: $statusCode - FAILED" -ForegroundColor Red
            Write-Host "  Response: $errorBody"
            Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
            return @{ Path = $Path; Method = $Method; Status = $statusCode; Result = "FAIL"; Description = $Description }
        }
    }
}

Write-Host "============================================" -ForegroundColor White
Write-Host "  PetCare API - Render Deployment Tests" -ForegroundColor White
Write-Host "  Base URL: $base" -ForegroundColor White
Write-Host "============================================" -ForegroundColor White

# ============ HEALTH ============
$results += Test-Endpoint "GET" "/health" "" "Root health check"
$results += Test-Endpoint "GET" "/api/health" "" "API health check"

# ============ AUTH (Public) ============
$results += Test-Endpoint "POST" "/api/auth/signin" '{"email":"test@test.com","password":"test123"}' "Sign in (test creds)"
$results += Test-Endpoint "POST" "/api/auth/signup" '{"email":"apitest_render@test.com","password":"test123456","full_name":"API Test"}' "Sign up (test)"
$results += Test-Endpoint "POST" "/api/auth/refresh" '{"refresh_token":"invalid_token"}' "Refresh token (invalid)"

# ============ AUTH (Protected) ============
$results += Test-Endpoint "GET" "/api/auth/me" "" "Get profile (no auth)"
$results += Test-Endpoint "POST" "/api/auth/signout" "" "Sign out (no auth)"

# ============ SERVICES (Public) ============
$results += Test-Endpoint "GET" "/api/services" "" "List services"
$results += Test-Endpoint "GET" "/api/services/categories" "" "List service categories"

# ============ EVENTS (Public) ============
$results += Test-Endpoint "GET" "/api/events" "" "List events"

# ============ PROVIDERS (Public) ============
$results += Test-Endpoint "GET" "/api/providers" "" "List providers"

# ============ REVIEWS (Public) ============
# Cannot test without a real provider ID - will get 500 or empty

# ============ SLOTS (Public) ============
# Cannot test without a real provider ID

# ============ BOOKINGS (Protected) ============
$results += Test-Endpoint "GET" "/api/bookings" "" "List bookings (no auth)"
$results += Test-Endpoint "POST" "/api/bookings" '{}' "Create booking (no auth)"

# ============ PETS (Protected) ============
$results += Test-Endpoint "GET" "/api/pets" "" "List pets (no auth)"

# ============ WALLET (Protected) ============
$results += Test-Endpoint "GET" "/api/wallet" "" "Get wallet (no auth)"
$results += Test-Endpoint "GET" "/api/wallet/transactions" "" "Wallet transactions (no auth)"

# ============ NOTIFICATIONS (Protected) ============
$results += Test-Endpoint "GET" "/api/notifications" "" "List notifications (no auth)"

# ============ PAYMENTS (Protected) ============
$results += Test-Endpoint "GET" "/api/payments" "" "Payment history (no auth)"

# ============ ADMIN (Protected) ============
$results += Test-Endpoint "GET" "/api/admin/dashboard" "" "Admin dashboard (no auth)"
$results += Test-Endpoint "GET" "/api/admin/users" "" "Admin users (no auth)"
$results += Test-Endpoint "GET" "/api/admin/providers" "" "Admin providers (no auth)"
$results += Test-Endpoint "GET" "/api/admin/bookings" "" "Admin bookings (no auth)"
$results += Test-Endpoint "GET" "/api/admin/coupons" "" "Admin coupons (no auth)"

# ============ DEBUG ============
$results += Test-Endpoint "GET" "/api/debug/supabase" "" "Debug supabase connection"

# ============ NON-EXISTENT ROUTE ============
$results += Test-Endpoint "GET" "/api/nonexistent" "" "404 test"

# ============ SUMMARY ============
Write-Host "`n`n============================================" -ForegroundColor White
Write-Host "  TEST RESULTS SUMMARY" -ForegroundColor White
Write-Host "============================================" -ForegroundColor White

$pass = ($results | Where-Object { $_.Result -like "PASS*" }).Count
$fail = ($results | Where-Object { $_.Result -eq "FAIL" }).Count
$total = $results.Count

Write-Host "`nTotal: $total | Pass: $pass | Fail: $fail" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Red" })

Write-Host "`nDetailed Results:" -ForegroundColor White
foreach ($r in $results) {
    $color = if ($r.Result -eq "FAIL") { "Red" } elseif ($r.Result -like "PASS*") { "Green" } else { "Yellow" }
    Write-Host "  [$($r.Method)] $($r.Path) => $($r.Status) ($($r.Result)) - $($r.Description)" -ForegroundColor $color
}

# Show failures specifically
$failures = $results | Where-Object { $_.Result -eq "FAIL" }
if ($failures.Count -gt 0) {
    Write-Host "`n FAILED ENDPOINTS:" -ForegroundColor Red
    foreach ($f in $failures) {
        Write-Host "  [$($f.Method)] $($f.Path) - Status: $($f.Status) - $($f.Description)" -ForegroundColor Red
    }
}
