# Design Document: FlowCore AI Agent Migration to Groq

## 1. Overview
Migrate the FlowCore AI Orchestrator from Kilo (Mistral) to Groq (DeepSeek/Llama/GPT-OSS) to achieve ultra-low latency and more robust tool usage. 

## 2. Model Stack
| Tier | Model ID | Role |
| :--- | :--- | :--- |
| **Primary** | `openai/gpt-oss-120b` | Main reasoning, tool selection, and response generation. |
| **Fallback 1**| `llama-3.3-70b-versatile` | High-reliability fallback if Primary fails or is rate-limited. |
| **Fallback 2**| `llama-3.1-8b-instant` | Lightweight/Emergency fallback for greetings or simple classification. |

## 3. Unified Tool Architecture
The current "Router -> Execute -> Generate" flow will be unified into a **Tool-Aware Orchestrator**:

1. **One-Call Intent & Tool Selection:** The Primary model receives the message, history, and a list of tool definitions.
2. **Native Tool Calling:** Use OpenAI-compatible `tools` array for `match_kb_chunks`, `check_availability`, `create_appointment`, and `capture_lead`.
3. **Deterministic Execution:** The orchestrator executes the requested tool and feeds the result back to the model for the final response in a single efficient loop.

## 4. Key Improvements
- **Speed:** Expected latency reduction from 3-5s down to <1s.
- **KB Search:** Fix the embedding logic (currently padding to 1536 incorrectly) by using a more consistent embedding provider or ensuring 384d match.
- **Tool Robustness:** Native tool calling reduces the risk of the model "imagining" tool results.

## 5. Success Criteria
- [ ] Successful E2E message flow on WhatsApp using Groq.
- [ ] Latency < 1s for standard queries.
- [ ] 100% success rate on appointment booking tool selection in test suite.
