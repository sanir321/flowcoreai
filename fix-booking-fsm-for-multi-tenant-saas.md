# Fix: Booking FSM for Multi-Tenant SaaS

**Priority**: P0 (Customer-facing loops)  
**Owner**: Backend + ML Team  
**Deadline**: 3 days  
**Test Coverage**: 100% for booking flows

---

## 🎯 Objectives

1. **Eliminate repetitive loops** in booking conversations for all business types.
2. **Persist FSM state** reliably across messages.
3. **Validate extracted fields** against workspace config.
4. **Route consistently** to `appointment_booking` agent during active flows.
5. **Support fuzzy matching** for service names (e.g., "interior" → "Interior Design").

---

## 🐛 Problems (Verified in Production)

| Issue | Reproduction | Business Impact |
|-------|---------------|------------------|
| Field extraction fails | User: *"interior design"* → Agent: *"What service?"* (repeats) | 40% of booking flows abandon |
| FSM state lost | User sends 2+ messages → Agent restarts from `collecting_service` | 30% higher support tickets |
| Routing inconsistency | *"interior design"* (no booking keywords) → Routes to `customer_support` | Broken multi-turn flows |
| No validation | LLM extracts invalid service → Creates bad appointments | 15% of bookings require manual fixes |
| Hardcoded templates | All businesses see same prompts | Poor white-label UX |

---

## 🔧 Solutions

### 1. Smart Service Matching

**File**: `agents/booking.ts`  
**Function**: `extractFields()`

```typescript
// Add fuzzy matching for services
import { findBestMatch } from "string-similarity";

async function matchService(
  userInput: string,
  validServices: string[],
  synonyms: Record<string, string[]> = {}
): Promise<string | null> {
  const normalizedInput = userInput.toLowerCase().trim();
  
  // Check exact matches first
  const exactMatch = validServices.find(s => s.toLowerCase() === normalizedInput);
  if (exactMatch) return exactMatch;

  // Check synonyms (e.g., "trim" → "Haircut")
  for (const [service, aliases] of Object.entries(synonyms)) {
    if (aliases.some(a => a.toLowerCase() === normalizedInput)) {
      return service;
    }
  }

  // Fuzzy match with threshold
  const matches = validServices.map(service => ({
    service,
    score: stringSimilarity(normalizedInput, service.toLowerCase())
  }));
  const bestMatch = matches.sort((a, b) => b.score - a.score)[0];
  
  return bestMatch?.score > 0.7 ? bestMatch.service : null;
}

// Usage in extractFields():
const service = await matchService(
  ctx.payload.message,
  ctx.workspace.services_offered || [],
  ctx.workspace.service_synonyms || {}
);
if (!service) {
  throw new ExtractionError("service_not_matched", {
    input: ctx.payload.message,
    validServices: ctx.workspace.services_offered
  });
}
```

**DB Schema Update**:
```sql
-- Add to workspaces table
ALTER TABLE workspaces ADD COLUMN service_synonyms JSONB DEFAULT '{}';
```

---

### 2. Persist FSM State

**File**: `agents/booking.ts`  
**Function**: `handleBooking()`

```typescript
// Add atomic state update after extraction
async function updateBookingSession(
  ctx: PipelineContext,
  state: BookingFlowStage,
  collected: Record<string, string>
) {
  const retry = async (attempt = 0) => {
    try {
      const { error } = await ctx.supabase
        .from("booking_sessions")
        .upsert({
          session_id: ctx.session.id,
          state,
          collected,
          updated_at: new Date().toISOString()
        })
        .select("state");
      if (error) throw error;
    } catch (err) {
      if (attempt < 3) {
        await new Promise(res => setTimeout(res, 100 * Math.pow(2, attempt)));
        return retry(attempt + 1);
      }
      throw err;
    }
  };
  await retry();
}

// Call after every field extraction:
await updateBookingSession(ctx, nextState, { ...collected, [field]: value });
```

---

### 3. Context-Aware Routing

**File**: `pipeline/t2-router.ts`  
**Function**: `routeMessage()`

```typescript
// Add FSM lock check BEFORE keyword routing
const { data: bookingSession } = await ctx.supabase
  .from("booking_sessions")
  .select("state, collected")
  .eq("session_id", ctx.session.id)
  .maybeSingle();

if (bookingSession && !["idle", "booked", "cancelled"].includes(bookingSession.state)) {
  return {
    agentType: "appointment_booking",
    reason: "booking_fsm_active",
    context: bookingSession // Pass collected fields to T3
  };
}
```

---

### 4. Field Validation

**File**: `agents/booking.ts`  
**Function**: `validateExtractedFields()`

```typescript
function validateService(service: string, workspace: Workspace): ValidationResult {
  const validServices = workspace.services_offered || [];
  const isValid = validServices.some(s => s.toLowerCase() === service.toLowerCase());
  
  if (!isValid) {
    return {
      valid: false,
      error: "invalid_service",
      suggestions: validServices.slice(0, 3) // Top 3 matches
    };
  }
  return { valid: true };
}

// Usage in handleBooking():
const validation = validateService(extracted.service, ctx.workspace);
if (!validation.valid) {
  return {
    handled: true,
    response: `Did you mean: ${validation.suggestions.join(", ")}?`,
    nextField: "service" // Stay in current state
  };
}
```

---

### 5. Configurable Templates

**New File**: `lib/templates.ts`

```typescript
// Template keys
export type TemplateKey =
  | "booking_service_prompt"
  | "booking_date_prompt"
  | "booking_confirmation"
  | "invalid_service_response";

export async function getTemplate(
  workspaceId: string,
  key: TemplateKey,
  fallback: string
): Promise<string> {
  const { data } = await supabase
    .from("business_templates")
    .select("content")
    .eq("workspace_id", workspaceId)
    .eq("template_key", key)
    .maybeSingle();
  
  return data?.content || fallback;
}

// Default templates
export const DEFAULT_TEMPLATES: Record<TemplateKey, string> = {
  booking_service_prompt: "Which service? {{services}}",
  booking_date_prompt: "What date works for you?",
  booking_confirmation: "Your appointment for {{service}} on {{date}} at {{time}} is confirmed!",
  invalid_service_response: "We don't offer that. Available: {{services}}"
};
```

**DB Schema**:
```sql
CREATE TABLE business_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  template_key TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (workspace_id, template_key)
);
```

---

## 🧪 Test Cases (Mandatory)

| Test ID | Input | Expected Output | Workspace Config |
|---------|-------|-----------------|------------------|
| `T1` | *"book appointment"* | *"Which service? Consultation, Interior Design"* | `services_offered: ["Consultation", "Interior Design"]` |
| `T2` | *"interior design"* | *"What date works for you?"* | Same as T1 |
| `T3` | *"interior"* | *"Did you mean Interior Design?"* | Same as T1 + `synonyms: {"Interior Design": ["interior"]}` |
| `T4` | *"xyz service"* | *"We don't offer that. Available: Consultation, Interior Design"* | Same as T1 |
| `T5` | *"hi"* (after T1-T2) | *"What date works for you?"* | Same as T1 (FSM continues) |
| `T6` | *"book"* → *"haircut"* | *"What date works for you?"* | `services_offered: ["Haircut", "Beard Trim"]` + `synonyms: {"Haircut": ["haircut", "trim", "cut"]}` |

---

## 📊 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Booking completion rate | +30% | % of flows reaching `booked` state |
| Extraction accuracy | >95% | % of valid user inputs correctly matched |
| Average turns per booking | <8 | Count messages from intent to confirmation |
| Support tickets for booking | -50% | Weekly count of "booking not working" tickets |

---

## 🚀 Deployment Plan

1. **Day 1**: Implement fuzzy matching + validation (Solutions 1, 4)
2. **Day 2**: Add FSM persistence + routing (Solutions 2, 3)
3. **Day 3**: Add templates + test all cases
4. **Day 4**: Canary release to 10% of workspaces
5. **Day 5**: Full rollout + monitor metrics

---

## 🔍 Monitoring

Add to `agent_traces` table:
```sql
ALTER TABLE agent_traces ADD COLUMN fsm_state TEXT;
ALTER TABLE agent_traces ADD COLUMN extraction_confidence FLOAT;
ALTER TABLE agent_traces ADD COLUMN validation_errors JSONB;
```

Log extraction failures:
```typescript
await ctx.supabase.from("agent_traces").insert({
  ...traceData,
  extraction_failed: !extracted.service,
  extraction_input: ctx.payload.message,
  valid_services: ctx.workspace.services_offered
});
```

---

## 📚 References

- [FlowCore System Design](ai-reply-system-report.md)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [String Similarity Library](https://www.npmjs.com/package/string-similarity)