# Design Spec: Personality Traits UI in Agent Hub

## Goal
Replace the generic "System Instructions" textarea with a structured "Personality Traits" UI to allow users to more easily define their agent's behavior.

## Scope
- Modify `src/app/(dashboard)/agent-hub/[agentId]/page.tsx`
- Implement structured controls for Tone, Formality, Brevity, and Proactivity.
- Add a "Custom Directives" field for specialized instructions.
- Ensure seamless integration with `UpdateAgentConfigSchema`.

## UI Design
The "Persona" tab will now contain:
1. **Agent Identity:** Agent Name input (unchanged).
2. **Personality Traits:** A 2x2 grid of Select controls:
   - **Tone:** `professional`, `friendly`, `enthusiastic`
   - **Formality:** `formal`, `casual`
   - **Brevity:** `concise`, `standard`, `detailed`
   - **Proactivity:** `passive`, `standard`, `assertive`
3. **Custom Directives:** A smaller textarea for `config.traits.custom_directives`.

### Visual Style
- Consistent with existing dashboard: `rounded-xl`, `bg-gray-50/30`, `#c65f39` accents.
- High-quality `Select` components from `@/components/ui/select`.

## Data Integration
- **Form Path:** `config.traits.<trait_name>`
- **Schema Validation:** Handled by `UpdateAgentConfigSchema`.
- **Initialization:** Ensure `config.traits` values are correctly populated from the agent's current config.

## Success Criteria
- Users can select traits from dropdowns.
- Traits are saved correctly to the backend on "Save Changes".
- The UI maintains visual consistency with the rest of the application.
