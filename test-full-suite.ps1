$base = "http://localhost:4000/api"
$totalTests = 0; $passed = 0; $failed = 0; $failures = @()

function Test-Endpoint {
    param($name, $method, $url, $body, $expectStatus, $token)
    $script:totalTests++
    $h = @{}
    if ($token) { $h["Authorization"] = "Bearer $token" }
    try {
        $params = @{ Uri = $url; Method = $method; Headers = $h; UseBasicParsing = $true; TimeoutSec = 10 }
        if ($body -and $method -ne "GET" -and $method -ne "DELETE") {
            $params.Body = $body; $params.ContentType = "application/json"
        }
        $resp = Invoke-WebRequest @params
        $status = $resp.StatusCode
        if ($status -eq $expectStatus) {
            $script:passed++; Write-Host "  PASS  [$status] $name" -ForegroundColor Green
        } else {
            $script:failed++; $script:failures += "$name (expected $expectStatus, got $status)"
            Write-Host "  FAIL  [$status] $name (expected $expectStatus)" -ForegroundColor Red
        }
        try { return ($resp.Content | ConvertFrom-Json) } catch { return $resp.Content }
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        if ($code -eq $expectStatus) {
            $script:passed++; Write-Host "  PASS  [$code] $name" -ForegroundColor Green
        } else {
            $script:failed++; $script:failures += "$name (expected $expectStatus, got $code)"
            Write-Host "  FAIL  [$code] $name (expected $expectStatus)" -ForegroundColor Red
        }
        return $null
    }
}

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  DIGITAL FAMILY TREE - FULL API TEST SUITE" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# ========== AUTH ==========
Write-Host "--- AUTH ---" -ForegroundColor Yellow
$r1 = Test-Endpoint "Register User 1" POST "$base/auth/register" '{"name":"Shabzaib Test","email":"shabzaib@test.com","password":"Test123456"}' 201
$r2 = Test-Endpoint "Register User 2" POST "$base/auth/register" '{"name":"Ahmed Khan","email":"ahmed@test.com","password":"Test123456"}' 201
$r3 = Test-Endpoint "Register User 3" POST "$base/auth/register" '{"name":"Ali Shah","email":"ali@test.com","password":"Test123456"}' 201
$l1 = Test-Endpoint "Login User 1" POST "$base/auth/login" '{"email":"shabzaib@test.com","password":"Test123456"}' 201
$t1 = $l1.access_token
$l2 = Test-Endpoint "Login User 2" POST "$base/auth/login" '{"email":"ahmed@test.com","password":"Test123456"}' 201
$t2 = $l2.access_token
$l3 = Test-Endpoint "Login User 3" POST "$base/auth/login" '{"email":"ali@test.com","password":"Test123456"}' 201
$t3 = $l3.access_token
Test-Endpoint "Duplicate Email" POST "$base/auth/register" '{"name":"Dup","email":"shabzaib@test.com","password":"Test123456"}' 409
Test-Endpoint "Wrong Password" POST "$base/auth/login" '{"email":"shabzaib@test.com","password":"wrong"}' 401
Test-Endpoint "Me" GET "$base/auth/me" $null 200 $t1
Test-Endpoint "Me No Token" GET "$base/auth/me" $null 401
$refreshBody = @{ refreshToken = $l1.refresh_token } | ConvertTo-Json
Test-Endpoint "Refresh Token" POST "$base/auth/refresh" $refreshBody 201
$logoutResp = Test-Endpoint "Logout" POST "$base/auth/logout" $null 200 $t1
$l1b = Test-Endpoint "Re-login" POST "$base/auth/login" '{"email":"shabzaib@test.com","password":"Test123456"}' 201
$t1 = $l1b.access_token

# ========== PROFILE ==========
Write-Host "`n--- PROFILE ---" -ForegroundColor Yellow
Test-Endpoint "Get Profile" GET "$base/profile" $null 200 $t1
$profileBody = @{ displayName = "Shabzaib Khan"; gender = "male"; country = "Pakistan"; city = "Islamabad" } | ConvertTo-Json
Test-Endpoint "Update Profile" PATCH "$base/profile" $profileBody 200 $t1
Test-Endpoint "Profile Completion" GET "$base/profile/completion" $null 200 $t1
Test-Endpoint "Profile Settings" GET "$base/profile/settings" $null 200 $t1
Test-Endpoint "Profile Privacy Fields" GET "$base/profile/privacy-fields" $null 200 $t1
$privacyBody = @{ profileVisibility = "FAMILY"; emailVisibility = "ONLY_ME" } | ConvertTo-Json
Test-Endpoint "Update Privacy" PATCH "$base/profile/privacy" $privacyBody 200 $t1
$occBody = @{ occupation = "Software Engineer"; company = "DFT"; education = "MIT" } | ConvertTo-Json
Test-Endpoint "Update Occupation" PATCH "$base/profile" $occBody 200 $t1
Test-Endpoint "Profile Sessions" GET "$base/profile/sessions" $null 200 $t1

# ========== FAMILIES ==========
Write-Host "`n--- FAMILIES ---" -ForegroundColor Yellow
$f1body = @{ name = "Khan Family"; description = "Main test family" } | ConvertTo-Json
$fam1 = Test-Endpoint "Create Family 1" POST "$base/families" $f1body 201 $t1
$f2body = @{ name = "Shah Family"; description = "Second family" } | ConvertTo-Json
$fam2 = Test-Endpoint "Create Family 2" POST "$base/families" $f2body 201 $t2
$f3body = @{ name = "Khan Heritage"; description = "Heritage family" } | ConvertTo-Json
$fam3 = Test-Endpoint "Create Family 3" POST "$base/families" $f3body 201 $t1
Test-Endpoint "List My Families" GET "$base/families" $null 200 $t1
Test-Endpoint "Get Family 1" GET "$base/families/$($fam1.id)" $null 200 $t1
$updBody = @{ name = "Khan Family Updated"; description = "Updated" } | ConvertTo-Json
Test-Endpoint "Update Family 1" PATCH "$base/families/$($fam1.id)" $updBody 200 $t1
Test-Endpoint "Family Limit" GET "$base/families/limit" $null 200 $t1
Test-Endpoint "Dashboard Stats" GET "$base/families/stats" $null 200 $t1

# ========== MEMBERS ==========
Write-Host "`n--- MEMBERS ---" -ForegroundColor Yellow
$m1body = @{ firstName = "Abdul"; lastName = "Khan"; gender = "male"; birthDate = "1950-01-15"; bio = "Patriarch" } | ConvertTo-Json
$mem1 = Test-Endpoint "Add Member Abdul" POST "$base/families/$($fam1.id)/members" $m1body 201 $t1
$m2body = @{ firstName = "Fatima"; lastName = "Khan"; gender = "female"; birthDate = "1952-06-20"; bio = "Matriarch" } | ConvertTo-Json
$mem2 = Test-Endpoint "Add Member Fatima" POST "$base/families/$($fam1.id)/members" $m2body 201 $t1
$m3body = @{ firstName = "Omar"; lastName = "Khan"; gender = "male"; birthDate = "1975-03-10"; bio = "Son" } | ConvertTo-Json
$mem3 = Test-Endpoint "Add Member Omar" POST "$base/families/$($fam1.id)/members" $m3body 201 $t1
$m4body = @{ firstName = "Ayesha"; lastName = "Khan"; gender = "female"; birthDate = "1978-11-05"; bio = "Daughter" } | ConvertTo-Json
$mem4 = Test-Endpoint "Add Member Ayesha" POST "$base/families/$($fam1.id)/members" $m4body 201 $t1
$m5body = @{ firstName = "Hassan"; lastName = "Khan"; gender = "male"; birthDate = "2000-07-22"; bio = "Grandson" } | ConvertTo-Json
$mem5 = Test-Endpoint "Add Member Hassan" POST "$base/families/$($fam1.id)/members" $m5body 201 $t1
$m6body = @{ firstName = "Rashid"; lastName = "Shah"; gender = "male"; birthDate = "1960-04-12" } | ConvertTo-Json
$m6 = Test-Endpoint "Add Member Rashid" POST "$base/families/$($fam2.id)/members" $m6body 201 $t2
$m7body = @{ firstName = "Zainab"; lastName = "Shah"; gender = "female"; birthDate = "1962-08-18" } | ConvertTo-Json
$m7 = Test-Endpoint "Add Member Zainab" POST "$base/families/$($fam2.id)/members" $m7body 201 $t2
Test-Endpoint "List Members" GET "$base/families/$($fam1.id)/members" $null 200 $t1
Test-Endpoint "Get Member Abdul" GET "$base/families/$($fam1.id)/members/$($mem1.id)" $null 200 $t1
$updMem = @{ bio = "Updated Patriarch" } | ConvertTo-Json
Test-Endpoint "Update Member Abdul" PATCH "$base/families/$($fam1.id)/members/$($mem1.id)" $updMem 200 $t1
Test-Endpoint "Family Tree" GET "$base/families/$($fam1.id)/tree" $null 200 $t1

# ========== RELATIONSHIPS ==========
Write-Host "`n--- RELATIONSHIPS ---" -ForegroundColor Yellow
$rhBody = @{ fromMemberId = $mem1.id; toMemberId = $mem2.id; type = "HUSBAND" } | ConvertTo-Json
Test-Endpoint "Abdul-Husband Fatima" POST "$base/relationships" $rhBody 201 $t1
$rwBody = @{ fromMemberId = $mem2.id; toMemberId = $mem1.id; type = "WIFE" } | ConvertTo-Json
Test-Endpoint "Fatima-Wife Abdul" POST "$base/relationships" $rwBody 201 $t1
$rf1Body = @{ fromMemberId = $mem1.id; toMemberId = $mem3.id; type = "FATHER" } | ConvertTo-Json
Test-Endpoint "Abdul-Father Omar" POST "$base/relationships" $rf1Body 201 $t1
$rm1Body = @{ fromMemberId = $mem2.id; toMemberId = $mem3.id; type = "MOTHER" } | ConvertTo-Json
Test-Endpoint "Fatima-Mother Omar" POST "$base/relationships" $rm1Body 201 $t1
$rf2Body = @{ fromMemberId = $mem1.id; toMemberId = $mem4.id; type = "FATHER" } | ConvertTo-Json
Test-Endpoint "Abdul-Father Ayesha" POST "$base/relationships" $rf2Body 201 $t1
$rm2Body = @{ fromMemberId = $mem2.id; toMemberId = $mem4.id; type = "MOTHER" } | ConvertTo-Json
Test-Endpoint "Fatima-Mother Ayesha" POST "$base/relationships" $rm2Body 201 $t1
$rf3Body = @{ fromMemberId = $mem3.id; toMemberId = $mem5.id; type = "FATHER" } | ConvertTo-Json
Test-Endpoint "Omar-Father Hassan" POST "$base/relationships" $rf3Body 201 $t1
$selfBody = @{ fromMemberId = $mem1.id; toMemberId = $mem1.id; type = "FATHER" } | ConvertTo-Json
Test-Endpoint "Self Relationship" POST "$base/relationships" $selfBody 400 $t1
Test-Endpoint "Cycle Detection" POST "$base/relationships" (@{ fromMemberId = $mem5.id; toMemberId = $mem1.id; type = "FATHER" } | ConvertTo-Json) 409 $t1
Test-Endpoint "List Relationships" GET "$base/families/$($fam1.id)/relationships" $null 200 $t1

# ========== TIMELINE ==========
Write-Host "`n--- TIMELINE ---" -ForegroundColor Yellow
$e1body = @{ familyId = $fam1.id; eventType = "BIRTH"; title = "Abdul Birth"; date = "1950-01-15"; location = "Peshawar"; visibility = "PUBLIC" } | ConvertTo-Json
$evt1 = Test-Endpoint "Create Birth Event" POST "$base/timeline" $e1body 201 $t1
$e2body = @{ familyId = $fam1.id; eventType = "MARRIAGE"; title = "Abdul Fatima Wedding"; date = "1972-12-01"; location = "Islamabad"; visibility = "FAMILY" } | ConvertTo-Json
$evt2 = Test-Endpoint "Create Marriage Event" POST "$base/timeline" $e2body 201 $t1
$e3body = @{ familyId = $fam1.id; eventType = "BIRTH"; title = "Omar Birth"; date = "1975-03-10"; location = "Lahore"; visibility = "PUBLIC" } | ConvertTo-Json
$evt3 = Test-Endpoint "Create Birth Event 2" POST "$base/timeline" $e3body 201 $t1
Test-Endpoint "List All Events" GET "$base/timeline" $null 200 $t1
Test-Endpoint "Get Event" GET "$base/timeline/$($evt1.id)" $null 200 $t1
$updEvt = @{ title = "Abdul Birth Updated"; location = "Peshawar Updated" } | ConvertTo-Json
Test-Endpoint "Update Event" PATCH "$base/timeline/$($evt2.id)" $updEvt 200 $t1
Test-Endpoint "Event Stats" GET "$base/timeline/stats" $null 200 $t1
Test-Endpoint "Upcoming Events" GET "$base/timeline/upcoming" $null 200 $t1
Test-Endpoint "Today Events" GET "$base/timeline/today" $null 200 $t1
Test-Endpoint "Recent Events" GET "$base/timeline/recent" $null 200 $t1
Test-Endpoint "Birthday Events" GET "$base/timeline/birthdays" $null 200 $t1
Test-Endpoint "Anniversary Events" GET "$base/timeline/anniversaries" $null 200 $t1
Test-Endpoint "Family Events" GET "$base/timeline/family/$($fam1.id)" $null 200 $t1
Test-Endpoint "Member Events" GET "$base/timeline/member/$($mem1.id)" $null 200 $t1
Test-Endpoint "Event Participants" GET "$base/timeline/$($evt1.id)/participants" $null 200 $t1
$rsvpBody = @{ rsvpStatus = "ACCEPTED" } | ConvertTo-Json
Test-Endpoint "RSVP Event" POST "$base/timeline/$($evt1.id)/rsvp" $rsvpBody 201 $t1
Test-Endpoint "Get Event Reminders" GET "$base/timeline/$($evt1.id)/reminders" $null 200 $t1
Test-Endpoint "Cancel Event" PATCH "$base/timeline/$($evt1.id)/cancel" $null 200 $t1
Test-Endpoint "Complete Event" PATCH "$base/timeline/$($evt2.id)/complete" $null 200 $t1
Test-Endpoint "Widget" GET "$base/timeline/widget" $null 200 $t1
Test-Endpoint "Calendar" GET "$base/timeline/calendar?year=2026&month=7" $null 200 $t1
Test-Endpoint "Delete Event" DELETE "$base/timeline/$($evt3.id)" $null 200 $t1

# ========== MEMORIES ==========
Write-Host "`n--- MEMORIES ---" -ForegroundColor Yellow
$mk1body = @{ title = "Eid Celebration"; description = "Family gathering"; story = "Wonderful celebration"; familyId = $fam1.id; location = "Islamabad"; visibility = "PUBLIC"; tags = "eid,family" } | ConvertTo-Json
$mry1 = Test-Endpoint "Create Memory Eid" POST "$base/memories" $mk1body 201 $t1
$mk2body = @{ title = "Grandpa Story"; description = "Story about Abdul"; familyId = $fam1.id; visibility = "FAMILY" } | ConvertTo-Json
$mry2 = Test-Endpoint "Create Memory Story" POST "$base/memories" $mk2body 201 $t1
$mk3body = @{ title = "Private Note"; description = "Personal memory"; familyId = $fam1.id; visibility = "ONLY_ME" } | ConvertTo-Json
$mry3 = Test-Endpoint "Create Memory Private" POST "$base/memories" $mk3body 201 $t1
Test-Endpoint "List All Memories" GET "$base/memories" $null 200 $t1
Test-Endpoint "Get Memory Eid" GET "$base/memories/$($mry1.id)" $null 200 $t1
$updMry = @{ title = "Eid Celebration Updated"; tags = "eid,family,updated" } | ConvertTo-Json
Test-Endpoint "Update Memory" PATCH "$base/memories/$($mry1.id)" $updMry 200 $t1
Test-Endpoint "Memory Stats" GET "$base/memories/stats" $null 200 $t1
Test-Endpoint "Family Memories" GET "$base/memories/family/$($fam1.id)" $null 200 $t1
$cmBody = @{ content = "Great memory!" } | ConvertTo-Json
Test-Endpoint "Add Comment" POST "$base/memories/$($mry1.id)/comments" $cmBody 201 $t1
$rxBody = @{ type = "LIKE" } | ConvertTo-Json
Test-Endpoint "Add Reaction" POST "$base/memories/$($mry1.id)/reactions" $rxBody 201 $t1

# ========== SEARCH ==========
Write-Host "`n--- SEARCH ---" -ForegroundColor Yellow
Test-Endpoint "Global Search" GET "$base/search?q=Khan" $null 200 $t1
Test-Endpoint "Search Users" GET "$base/search?q=Ahmed&type=users" $null 200 $t1
Test-Endpoint "Search Members" GET "$base/search?q=Abdul&type=members" $null 200 $t1
Test-Endpoint "Search Families" GET "$base/search?q=Khan&type=families" $null 200 $t1
Test-Endpoint "Search Short Query" GET "$base/search?q=A" $null 200 $t1
$secSearch = Test-Endpoint "PII Check" GET "$base/search?q=ahmed@test.com" $null 200 $t1
$totalTests++; if ($secSearch.users.Count -eq 0) { $passed++; Write-Host "  PASS  Email not searchable" -ForegroundColor Green } else { $failed++; $failures += "Email is searchable!"; Write-Host "  FAIL  Email is searchable!" -ForegroundColor Red }

# ========== DISCOVERY ==========
Write-Host "`n--- DISCOVERY ---" -ForegroundColor Yellow
Test-Endpoint "Discovery" GET "$base/discovery" $null 200 $t1
Test-Endpoint "Discovery Stats" GET "$base/discovery/stats" $null 200 $t1

# ========== DUPLICATES ==========
Write-Host "`n--- DUPLICATES ---" -ForegroundColor Yellow
Test-Endpoint "Detect Duplicates" GET "$base/duplicates/detect" $null 200 $t1
Test-Endpoint "List Duplicates" GET "$base/duplicates" $null 200 $t1

# ========== MERGE ==========
Write-Host "`n--- MERGE ---" -ForegroundColor Yellow
$mreqBody = @{ sourceFamilyId = $fam3.id; targetFamilyId = $fam1.id } | ConvertTo-Json
$mreq = Test-Endpoint "Create Merge Request" POST "$base/merge/request" $mreqBody 201 $t1
Test-Endpoint "List Merge Requests" GET "$base/merge" $null 200 $t1
Test-Endpoint "Merge History" GET "$base/merge/history" $null 200 $t1

# ========== NOTIFICATIONS ==========
Write-Host "`n--- NOTIFICATIONS ---" -ForegroundColor Yellow
Test-Endpoint "List Notifications" GET "$base/notifications" $null 200 $t1
Test-Endpoint "Notification Stats" GET "$base/notifications/stats" $null 200 $t1
Test-Endpoint "Unread Count" GET "$base/notifications/unread" $null 200 $t1
Test-Endpoint "Preferences" GET "$base/notifications/preferences" $null 200 $t1

# ========== ACTIVITIES ==========
Write-Host "`n--- ACTIVITIES ---" -ForegroundColor Yellow
Test-Endpoint "List Activities" GET "$base/activities" $null 200 $t1
Test-Endpoint "My Activities" GET "$base/activities/me" $null 200 $t1
Test-Endpoint "Activity Stats" GET "$base/activities/stats" $null 200 $t1
Test-Endpoint "Family Activities" GET "$base/activities/family/$($fam1.id)" $null 200 $t1

# ========== ADMIN ==========
Write-Host "`n--- ADMIN ---" -ForegroundColor Yellow
$ah = @{ "X-Admin-Key" = "dft-admin-secret-key-2024" }
try { $r = Invoke-WebRequest -Uri "$base/users/stats" -Headers $ah -UseBasicParsing -TimeoutSec 5; $script:totalTests++; $script:passed++; Write-Host "  PASS  [200] Admin User Stats" -ForegroundColor Green } catch { $script:totalTests++; $script:failed++; $script:failures += "Admin User Stats"; Write-Host "  FAIL  Admin User Stats" -ForegroundColor Red }
try { $r = Invoke-WebRequest -Uri "$base/users" -Headers $ah -UseBasicParsing -TimeoutSec 5; $script:totalTests++; $script:passed++; Write-Host "  PASS  [200] Admin Users List" -ForegroundColor Green } catch { $script:totalTests++; $script:failed++; $script:failures += "Admin Users List"; Write-Host "  FAIL  Admin Users List" -ForegroundColor Red }
try { $r = Invoke-WebRequest -Uri "$base/families/all" -Headers $ah -UseBasicParsing -TimeoutSec 5; $script:totalTests++; $script:passed++; Write-Host "  PASS  [200] Admin Families List" -ForegroundColor Green } catch { $script:totalTests++; $script:failed++; $script:failures += "Admin Families List"; Write-Host "  FAIL  Admin Families List" -ForegroundColor Red }
try { $r = Invoke-WebRequest -Uri "$base/notifications/all" -Headers $ah -UseBasicParsing -TimeoutSec 5; $script:totalTests++; $script:passed++; Write-Host "  PASS  [200] Admin Notifications" -ForegroundColor Green } catch { $script:totalTests++; $script:failed++; $script:failures += "Admin Notifications"; Write-Host "  FAIL  Admin Notifications" -ForegroundColor Red }
try { $r = Invoke-WebRequest -Uri "$base/notifications/analytics" -Headers $ah -UseBasicParsing -TimeoutSec 5; $script:totalTests++; $script:passed++; Write-Host "  PASS  [200] Admin Notification Analytics" -ForegroundColor Green } catch { $script:totalTests++; $script:failed++; $script:failures += "Admin Notification Analytics"; Write-Host "  FAIL  Admin Notification Analytics" -ForegroundColor Red }

# ========== SECURITY ==========
Write-Host "`n--- SECURITY ---" -ForegroundColor Yellow
$hasPII = $false
$searchRes = Test-Endpoint "PII: No email" GET "$base/search?q=Ahmed" $null 200 $t1
$totalTests++; if ($searchRes -and $searchRes.users) { foreach ($u in $searchRes.users) { if ($u.email) { $hasPII = $true } } }
if ($hasPII) { $failed++; $failures += "Email PII exposed"; Write-Host "  FAIL  Email PII exposed" -ForegroundColor Red } else { $passed++; Write-Host "  PASS  No email in search results" -ForegroundColor Green }
$hasPhone = $false
$totalTests++; if ($searchRes -and $searchRes.users) { foreach ($u in $searchRes.users) { if ($u.phone) { $hasPhone = $true } } }
if ($hasPhone) { $failed++; $failures += "Phone PII exposed"; Write-Host "  FAIL  Phone PII exposed" -ForegroundColor Red } else { $passed++; Write-Host "  PASS  No phone in search results" -ForegroundColor Green }
# Account lockout
$lockedOut = $false
for ($i = 1; $i -le 5; $i++) { try { Invoke-WebRequest -Uri "$base/auth/login" -Method POST -Body '{"email":"ali@test.com","password":"WrongPass"}' -ContentType "application/json" -UseBasicParsing -TimeoutSec 5 } catch {} }
try { Invoke-WebRequest -Uri "$base/auth/login" -Method POST -Body '{"email":"ali@test.com","password":"Test123456"}' -ContentType "application/json" -UseBasicParsing -TimeoutSec 5 } catch { $lockedOut = $true }
$totalTests++; if ($lockedOut) { $passed++; Write-Host "  PASS  Account lockout works" -ForegroundColor Green } else { $failed++; $failures += "Account lockout broken"; Write-Host "  FAIL  Account lockout broken" -ForegroundColor Red }

# ========== RESULTS ==========
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  RESULTS: $passed PASSED / $failed FAILED / $totalTests TOTAL" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Yellow" })
Write-Host "============================================" -ForegroundColor Cyan
if ($failures.Count -gt 0) { Write-Host "`nFAILURES:" -ForegroundColor Red; foreach ($f in $failures) { Write-Host "  - $f" -ForegroundColor Red } }
Write-Host ""
