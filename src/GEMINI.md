# FlowCore — Frontend & UI Guidelines

This document provides rules and standards for developing the FlowCore dashboard interface.

## 1. Brand Voice & Typography
- **Approachable Intelligence:** Avoid harsh technical jargon. Use terms like "Assistant", "Template", and "Connection" instead of "Neural", "Protocol", or "Node".
- **Typography:** Use the standard refined font weights (Semibold/Bold). Avoid "boxy" or aggressive uppercase headers.
- **Tone:** Professional, direct, and minimalist.

## 2. Component Standards
- **Backgrounds:** Use pure white backgrounds for primary content areas. Avoid muddy gray (`bg-gray-50`) blocks.
- **Borders:** Use subtle, light borders (`border-gray-100`) to define structure.
- **Interactions:** Every button should have a `scale-95` active state and a smooth hover transition.

## 3. Data Management
- **Workspace Context:** Always use the `useWorkspace` hook to retrieve the active `workspaceId`. Never hardcode IDs.
- **Real-time Synchronization:** Maintain the "Live Feed" status indicator in the Inbox. Ensure that all data fetching has a polling fallback in case WebSockets are blocked.

## 4. Inbox Logic
- **Tab State:** Map `status: escalated` to "To do", `status: active` to "Active", and `status: resolved` to "Done".
- **Auto-Switch:** Automatically transition to the "Active" tab if the "To do" list is empty but messages are waiting.
