param(
  [string]$WorkspaceId = "ead9f860-eeb6-4fac-8a08-cc48dc8a528f",
  [int]$PollInterval = 3,
  [switch]$Live
)

$ErrorActionPreference = "Stop"

# ─── Config ────────────────────────────────────────────────────────────────
$SupabaseUrl = "https://bnpdrelienfnlkceluip.supabase.co"
$ServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJucGRyZWxpZW5mbmxrY2VsdWlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njg1ODI0MiwiZXhwIjoyMDkyNDM0MjQyfQ.OURQfh3fe0ZFpHzKfis3ym6-v0Ug2qbwBdIEalJr6CU"
$Headers = @{ "apikey" = $ServiceKey; "Authorization" = "Bearer $ServiceKey" }

# ─── Helpers ───────────────────────────────────────────────────────────────
function Get-Data($Url) {
  try { return (Invoke-WebRequest -Uri $Url -Headers $Headers -UseBasicParsing).Content | ConvertFrom-Json }
  catch { return @() }
}

function Get-LastSeenMessageId() {
  $path = Join-Path $env:TEMP "flowter_monitor_lastid.txt"
  if (Test-Path $path) { return Get-Content $path } else { return "" }
}

function Set-LastSeenMessageId($id) {
  $path = Join-Path $env:TEMP "flowter_monitor_lastid.txt"
  Set-Content -Path $path -Value $id
}

function Get-EdgeFunctionLogs($FuncName, $Limit = 10) {
  try {
    $r = Invoke-WebRequest -Uri "${SupabaseUrl}/rest/v1/edge_function_logs?function_name=eq.${FuncName}&order=created_at.desc&limit=${Limit}" -Headers $Headers -UseBasicParsing -ErrorAction SilentlyContinue
    return ($r.Content | ConvertFrom-Json)
  } catch { return @() }
}

# ─── Render ────────────────────────────────────────────────────────────────
function Write-Divider() { Write-Host ("─" * 72) -ForegroundColor DarkGray }

function Format-Duration($Ms) {
  if ($Ms -lt 1000) { return "${Ms}ms" }
  else { return "{0:N2}s" -f ($Ms / 1000) }
}

function Write-AppStatus() {
  Write-Host "╔══════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
  Write-Host "║                    FLOWTER - LIVE MONITOR                         ║" -ForegroundColor Cyan
  Write-Host "║  Workspace: $($WorkspaceId.Substring(0,8))... | Poll: ${PollInterval}s | Ctrl+C to stop        ║" -ForegroundColor Cyan
  Write-Host "╚══════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
  Write-Host ""
}

function Write-HealthSummary() {
  # Quick API health checks
  $results = @{}
  
  try {
    $r = Invoke-WebRequest -Uri "${SupabaseUrl}/rest/v1/appointments?workspace_id=eq.${WorkspaceId}&select=id&limit=1" -Headers $Headers -UseBasicParsing
    $results.Supabase = "OK"
  } catch { $results.Supabase = "FAIL" }

  $results | Format-Table @{N="Service";E={$_.Name}}, @{N="Status";E={$_.Value}} -HideTableHeaders | Out-String | ForEach-Object { Write-Host $_ -NoNewline }
  Write-Divider
}

function Write-NewMessage($Msg) {
  $dir = if ($Msg.direction -eq 'inbound') { "⬆ IN" } else { "⬇ OUT" }
  $role = $Msg.role.PadRight(9)
  $time = if ($Msg.created_at) { [DateTime]$Msg.created_at } else { Get-Date }
  $preview = ($Msg.content -replace "`n"," ").Substring(0, [Math]::Min(80, $Msg.content.Length))
  
  $color = if ($Msg.direction -eq 'inbound') { "Yellow" } else { "Green" }
  $agentLabel = if ($Msg.agent_type) { " [$($Msg.agent_type)]" } else { "" }
  
  Write-Host "[$($time.ToString('HH:mm:ss'))] " -NoNewline -ForegroundColor DarkGray
  Write-Host "$dir " -NoNewline -ForegroundColor $color
  Write-Host "$role" -NoNewline -ForegroundColor Gray
  Write-Host "$agentLabel" -NoNewline -ForegroundColor DarkCyan
  Write-Host " $preview"
  
  # Show metadata if available
  if ($Msg.metadata) {
    $meta = if ($Msg.metadata -is [string]) { $Msg.metadata | ConvertFrom-Json } else { $Msg.metadata }
    if ($meta.cached) { Write-Host "       ⚡ Cached KB response" -ForegroundColor Magenta }
    if ($meta.trace_id) { Write-Host "       Trace: $($meta.trace_id.Substring(0,8))..." -ForegroundColor DarkGray }
    if ($meta.handoff_count -and $meta.handoff_count -gt 0) { Write-Host "       🔀 Handoffs: $($meta.handoff_count)" -ForegroundColor Cyan }
  }
}

function Write-SessionStatus($Session) {
  Write-Host "Session: $($Session.id.Substring(0,8))... | " -NoNewline -ForegroundColor Cyan
  Write-Host "Agent: " -NoNewline
  Write-Host "$($Session.agent_type)" -NoNewline -ForegroundColor DarkCyan
  Write-Host " | Status: " -NoNewline
  $sColor = if ($Session.status -eq 'active') { "Green" } else { "Red" }
  Write-Host "$($Session.status)" -NoNewline -ForegroundColor $sColor
  Write-Host " | Messages: $($Session.message_count)" -NoNewline -ForegroundColor Gray
  if ($Session.last_message_at) {
    $last = [DateTime]$Session.last_message_at
    Write-Host " | Last: $($last.ToString('HH:mm:ss'))" -ForegroundColor DarkGray
  } else { Write-Host "" }
}

# ─── Main Monitor ──────────────────────────────────────────────────────────
function Start-Monitor() {
  $lastId = Get-LastSeenMessageId
  Write-Host "Last seen message ID: $lastId" -ForegroundColor DarkGray
  Write-AppStatus
  
  # Show recent session state
  $sessions = Get-Data "${SupabaseUrl}/rest/v1/conversation_sessions?workspace_id=eq.${WorkspaceId}&status=eq.active&order=updated_at.desc&limit=5"
  if ($sessions) {
    Write-Host "Active Sessions:" -ForegroundColor White
    foreach ($s in $sessions) { Write-SessionStatus $s }
    Write-Divider
  }
  
  Write-Host "Waiting for messages... (send one from WhatsApp/widget)" -ForegroundColor DarkGray
  Write-Host ""
  
  # Poll for new messages
  while ($true) {
    $messages = Get-Data "${SupabaseUrl}/rest/v1/messages?workspace_id=eq.${WorkspaceId}&order=created_at.asc&limit=50"
    
    if ($messages -and $messages.Count -gt 0) {
      $newMessages = if ($lastId) { $messages | Where-Object { $_.id -gt $lastId -and $_.id -ne $lastId } } else { $messages[-3..-1] }
      
      foreach ($msg in $newMessages) {
        # Calculate response time if this is an outbound message and we saw the inbound
        if ($msg.direction -eq 'outbound') {
          $prevMsg = $messages | Where-Object { $_.direction -eq 'inbound' -and $_.session_id -eq $msg.session_id -and $_.created_at -lt $msg.created_at } | Select-Object -Last 1
          if ($prevMsg) {
            $inTime = [DateTime]$prevMsg.created_at
            $outTime = [DateTime]$msg.created_at
            $responseMs = ($outTime - $inTime).TotalMilliseconds
            Write-Host "⏱ Response time: " -NoNewline -ForegroundColor DarkGray
            $rtColor = if ($responseMs -gt 15000) { "Red" } elseif ($responseMs -gt 8000) { "Yellow" } else { "Green" }
            Write-Host "$(Format-Duration $responseMs)" -ForegroundColor $rtColor
          }
        }
        
        Write-NewMessage $msg
        $lastId = $msg.id
        Set-LastSeenMessageId $lastId
      }
    }
    
    if (-not $Live) { break }  # Single shot mode
    
    $elapsed = [Diagnostics.Stopwatch]::StartNew()
    while ($elapsed.Elapsed.TotalSeconds -lt $PollInterval) {
      $remaining = $PollInterval - $elapsed.Elapsed.TotalSeconds
      Write-Host "`r  Next poll in $([Math]::Ceiling($remaining))s...  " -NoNewline -ForegroundColor DarkGray
      Start-Sleep -Milliseconds 500
    }
    Write-Host "`r$( ' ' * 30)" -NoNewline  # Clear the countdown line
  }
}

# ─── Tool Trace Mode ───────────────────────────────────────────────────────
function Show-ToolTraces() {
  param([string]$SessionId)
  
  Write-Host ""
  Write-Host "=== Tool Execution Trace ===" -ForegroundColor Cyan
  
  # Check the edge function logs if available
  $logs = Get-EdgeFunctionLogs "agent-orchestrator" 20
  if ($logs -and $logs.Count -gt 0) {
    Write-Host "Latest Edge Function Logs:" -ForegroundColor White
    foreach ($log in $logs) {
      $t = [DateTime]$log.created_at
      Write-Host "  [$($t.ToString('HH:mm:ss'))] $($log.message)" -ForegroundColor DarkGray
    }
  } else {
    Write-Host "  (edge function logs table not available)" -ForegroundColor DarkGray
  }
  
  # If we were using a trace table, show it here
  # For now, show the conversation flow from messages
  $msgs = Get-Data "${SupabaseUrl}/rest/v1/messages?session_id=eq.${SessionId}&order=created_at.asc&limit=30"
  if ($msgs) {
    Write-Host "`nMessage Flow:" -ForegroundColor White
    $i = 0
    foreach ($m in $msgs) {
      $i++
      $dir = if ($m.direction -eq 'inbound') { "→ USER" } else { "← AI  " }
      $agentInfo = if ($m.agent_type) { " [$($m.agent_type)]" } else { "" }
      $preview = ($m.content -replace "`n"," ").Substring(0, [Math]::Min(100, $m.content.Length))
      Write-Host "  Step $i".PadRight(8) -NoNewline -ForegroundColor DarkGray
      Write-Host "$dir " -NoNewline -ForegroundColor $(if ($m.direction -eq 'inbound') { "Yellow" } else { "Green" })
      Write-Host "$agentInfo" -NoNewline -ForegroundColor DarkCyan
      Write-Host " $preview"
    }
  }
}

# ─── Entry ─────────────────────────────────────────────────────────────────
Clear-Host
Write-Host "╔══════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    FLOWTER MONITOR v1.0                            ║" -ForegroundColor Cyan
Write-Host "╠══════════════════════════════════════════════════════════════════════╣" -ForegroundColor Cyan
Write-Host "║  Commands:                                                         ║" -ForegroundColor Cyan
Write-Host "║  1 - Monitor live messages                                         ║" -ForegroundColor Cyan
Write-Host "║  2 - Show tool traces for a session                                ║" -ForegroundColor Cyan
Write-Host "║  3 - Check system health                                           ║" -ForegroundColor Cyan
Write-Host "║  4 - Show recent edge function logs                                ║" -ForegroundColor Cyan
Write-Host "║  5 - Monitor + trace (full)                                        ║" -ForegroundColor Cyan
Write-Host "║  Q - Quit                                                          ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

do {
  Write-Host ""
  $choice = Read-Host "Select option"
  
  switch ($choice) {
    "1" { Start-Monitor }
    "2" {
      $sid = Read-Host "Enter session ID (or press Enter for latest)"
      if (-not $sid) {
        $latest = Get-Data "${SupabaseUrl}/rest/v1/conversation_sessions?workspace_id=eq.${WorkspaceId}&order=updated_at.desc&limit=1"
        if ($latest) { $sid = $latest[0].id; Write-Host "Using latest: $sid" -ForegroundColor DarkGray }
      }
      if ($sid) { Show-ToolTraces -SessionId $sid }
    }
    "3" { Write-HealthSummary }
    "4" {
      $logs = Get-EdgeFunctionLogs "agent-orchestrator" 30
      if ($logs -and $logs.Count -gt 0) {
        Write-Host "Edge Function Logs:" -ForegroundColor Cyan
        $logs | ForEach-Object {
          $t = [DateTime]$_.created_at
          Write-Host "  [$($t.ToString('HH:mm:ss'))] $($_.message)" -ForegroundColor DarkGray
        }
      } else {
        Write-Host "No logs available (table may not exist)" -ForegroundColor Yellow
      }
    }
    "5" { Start-Monitor }
  }
} while ($choice -ne "Q" -and $choice -ne "q")
