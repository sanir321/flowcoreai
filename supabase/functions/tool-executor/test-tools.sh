#!/bin/bash
# Integration test suite for FlowCore tools
# Usage: SUPABASE_SERVICE_KEY="..." WORKSPACE_ID="..." ./test-tools.sh
# Requires: curl, jq

set -euo pipefail

SUPABASE_URL="${SUPABASE_URL:-https://bnpdrelienfnlkceluip.supabase.co}"
SUPABASE_KEY="${SUPABASE_SERVICE_KEY:?Set SUPABASE_SERVICE_KEY}"
WORKSPACE_ID="${WORKSPACE_ID:?Set WORKSPACE_ID}"
TOOL_URL="$SUPABASE_URL/functions/v1/tool-executor"

PASS=0
FAIL=0
TEST_ID="test-$(date +%s)"

cleanup() {
  echo "=== Cleaning up test data ==="
  curl -s -X DELETE "$SUPABASE_URL/rest/v1/appointments?workspace_id=eq.$WORKSPACE_ID&customer_name=like.TEST_%" \
    -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY" > /dev/null
}

run_tool() {
  local name="$1" args="$2" desc="$3"
  echo -n "  [$desc] $name... "
  local resp
  resp=$(curl -s -m 30 -X POST "$TOOL_URL" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"tool_name\":\"$name\",\"args\":$args,\"workspace_id\":\"$WORKSPACE_ID\"}")

  if echo "$resp" | jq -e '.error' > /dev/null 2>&1; then
    echo "FAIL: $(echo "$resp" | jq -r '.error')"
    FAIL=$((FAIL + 1))
    return 1
  else
    echo "OK"
    PASS=$((PASS + 1))
    return 0
  fi
}

run_tool_assert() {
  local name="$1" args="$2" desc="$3" assertion="$4"
  echo -n "  [$desc] $name... "
  local resp
  resp=$(curl -s -m 30 -X POST "$TOOL_URL" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"tool_name\":\"$name\",\"args\":$args,\"workspace_id\":\"$WORKSPACE_ID\"}")

  if echo "$resp" | jq -e '.error' > /dev/null 2>&1; then
    echo "FAIL: $(echo "$resp" | jq -r '.error')"
    FAIL=$((FAIL + 1))
    return 1
  fi

  if echo "$resp" | jq -e "$assertion" > /dev/null 2>&1; then
    echo "OK"
    PASS=$((PASS + 1))
  else
    echo "FAIL: assertion '$assertion' failed"
    echo "  Response: $(echo "$resp" | jq -c '.result')"
    FAIL=$((FAIL + 1))
  fi
}

trap cleanup EXIT
cleanup

echo ""
echo "=== Tool Integration Tests ==="
echo ""

echo "--- Knowledge Base ---"
run_tool_assert "match_kb_chunks" '{"query":"services"}' "KB search" '.result.kb_chunks | length > 0'

echo ""
echo "--- Appointments ---"
run_tool_assert "check_availability" '{"date":"tomorrow"}' "Check availability" '.result.availability != null'

# Create an appointment for update/cancel tests
CREATE_RESP=$(curl -s -m 30 -X POST "$TOOL_URL" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"tool_name\":\"create_appointment\",\"args\":{\"name\":\"TEST_User\",\"service\":\"cleaning\",\"date\":\"2026-07-15\",\"time\":\"10:00\"},\"workspace_id\":\"$WORKSPACE_ID\"}")
APPT_ID=$(echo "$CREATE_RESP" | jq -r '.result.id // empty')
if [ -n "$APPT_ID" ]; then
  echo "  [Created test appointment: $APPT_ID]"

  run_tool_assert "update_appointment" "{\"appointment_id\":\"$APPT_ID\",\"date\":\"2026-07-16\",\"time\":\"14:00\"}" "Update appointment" '.result.start_at | contains("2026-07-16")'
  run_tool_assert "cancel_appointment" "{\"appointment_id\":\"$APPT_ID\"}" "Cancel appointment" '.result.success == true'
else
  echo "  [SKIP] update/cancel: could not create test appointment"
  echo "  Response: $(echo "$CREATE_RESP" | jq -c '.')"
fi

echo ""
echo "--- Leads & Contacts ---"
run_tool "capture_lead" "{\"name\":\"TEST_Lead\",\"email\":\"test@lead.com\",\"notes\":\"Integration test\"}" "Capture lead"

echo ""
echo "--- Handoff & Escalation ---"
run_tool "request_handoff" "{\"target_agent\":\"sales\",\"reason\":\"Test handoff\"}" "Request handoff"
run_tool "escalation_request" "{\"reason\":\"Test escalation\"}" "Escalation request"

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
exit $FAIL
