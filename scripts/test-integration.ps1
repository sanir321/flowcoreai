param(
  [Parameter(Mandatory)][string]$WorkspaceId,
  [Parameter(Mandatory)][string]$ServiceKey
)

$SUPABASE_URL = "https://bnpdrelienfnlkceluip.supabase.co"
$execUrl = "$SUPABASE_URL/functions/v1/tool-executor"
$orchUrl = "$SUPABASE_URL/functions/v1/agent-orchestrator"
$restUrl = "$SUPABASE_URL/rest/v1"

$HEADERS = @{
  "Authorization" = "Bearer $ServiceKey"
  "Content-Type" = "application/json"
}
$REST_HEADERS = @{
  "apikey" = $ServiceKey
  "Authorization" = "Bearer $ServiceKey"
}

$PASS = 0; $FAIL = 0; $SKIP = 0
$TIMESTAMP = Get-Date -Format "yyyyMMddHHmmss"

function Test-Tool {
  param($Name, $Args, $Desc)
  Write-Host -NoNewline "  [$Desc] $Name... "
  try {
    $body = @{ tool_name = $Name; args = $Args; workspace_id = $WorkspaceId } | ConvertTo-Json -Compress
    $r = Invoke-WebRequest -Uri $execUrl -Method POST -Headers $HEADERS -Body $body -TimeoutSec 30 -UseBasicParsing
    $resp = $r.Content | ConvertFrom-Json
    if ($resp.error) { throw $resp.error }
    if ($resp.result -eq $null) { throw "null result" }
    Write-Host "OK"
    $script:PASS++
  } catch {
    Write-Host "FAIL: $_"
    $script:FAIL++
  }
}

function Test-Orch {
  param($Message, $Desc)
  Write-Host -NoNewline "  [$Desc] orchestrator... "
  try {
    $body = @{ workspace_id = $WorkspaceId; message = $Message; channel = "webchat" } | ConvertTo-Json -Compress
    $r = Invoke-WebRequest -Uri $orchUrl -Method POST -Headers $HEADERS -Body $body -TimeoutSec 90 -UseBasicParsing
    $resp = $r.Content | ConvertFrom-Json
    if ($resp.metadata.error) { throw $resp.metadata.error }
    $preview = $resp.response_parts[0]
    if ($preview.Length -gt 60) { $preview = $preview.Substring(0, 60) }
    Write-Host "OK ($preview...)"
    $script:PASS++
  } catch {
    Write-Host "FAIL: $_"
    $script:FAIL++
  }
}

function Test-OrchCached {
  param($Message, $Desc)
  Write-Host -NoNewline "  [$Desc] orchestrator (cached) ... "
  try {
    $body = @{ workspace_id = $WorkspaceId; message = $Message; channel = "webchat" } | ConvertTo-Json -Compress
    $r = Invoke-WebRequest -Uri $orchUrl -Method POST -Headers $HEADERS -Body $body -TimeoutSec 90 -UseBasicParsing
    $resp = $r.Content | ConvertFrom-Json
    if ($resp.metadata.error) { throw $resp.metadata.error }
    if (-not $resp.cached) { throw "not cached" }
    Write-Host "OK (cached: $($resp.cached))"
    $script:PASS++
  } catch {
    Write-Host "FAIL: $_"
    $script:FAIL++
  }
}

function Cleanup-TestData {
  Write-Host "  Cleaning up test data..."
  try {
    Invoke-WebRequest -Uri "$restUrl/contacts?workspace_id=eq.$WorkspaceId&name=like.TEST_%" -Method DELETE -Headers $REST_HEADERS -UseBasicParsing | Out-Null
  } catch { }
}

# ===== MAIN =====
Write-Host "============================================"
Write-Host " FlowCore Integration Test Suite"
Write-Host "============================================"
Write-Host "Workspace: $WorkspaceId`n"

# Prep
Cleanup-TestData

# --- Knowledge Base ---
Write-Host "--- Knowledge Base ---"
Test-Tool "match_kb_chunks" @{query="menu services"} "KB search"

# --- Appointments ---
Write-Host "`n--- Appointments ---"
Test-Tool "check_availability" @{date="2026-07-15"} "Availability check"

# --- Leads ---
Write-Host "`n--- Leads (CRM) ---"
Test-Tool "capture_lead" @{name="TEST_$TIMESTAMP"; email="test$TIMESTAMP@test.com"} "Capture lead"

# --- Handoff & Escalation ---
Write-Host "`n--- Handoff & Escalation ---"
Test-Tool "request_handoff" @{target_agent="sales"; reason="Test handoff"} "Handoff"
Test-Tool "escalation_request" @{reason="Test escalation"} "Escalation"

# --- Orchestrator (AI pipeline + KB cache) ---
Write-Host "`n--- Orchestrator & KB Cache ---"
Test-Orch "What services do you offer?" "Fresh (LLM)"
Test-OrchCached "What services do you offer?" "Repeat (cache)"

# Cleanup
Cleanup-TestData

# --- Summary ---
Write-Host "`n============================================"
Write-Host " Results: $PASS passed, $FAIL failed, $SKIP skipped"
Write-Host "============================================"
exit $FAIL
