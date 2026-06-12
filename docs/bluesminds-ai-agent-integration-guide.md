# BluesMinds AI Agent Integration Guide

> **Base URL:** `https://api.bluesminds.com/v1` | **Console:** [api.bluesminds.com/console](https://api.bluesminds.com/console) | **Community:** [t.me/apibluesminds](https://t.me/apibluesminds)

---
## 📌 Overview

**BluesMinds** is a unified AI gateway that provides a **single, OpenAI-compatible API endpoint** to access hundreds of Large Language Models (LLMs) from multiple providers (OpenAI, Anthropic, Google, Mistral, etc.).

For AI agents, BluesMinds offers:
- ✅ **Automatic failover** – Traffic shifts to healthy providers instantly
- ✅ **Cost optimization** – Routes to the most cost-effective model automatically
- ✅ **Privacy controls** – Logs can be disabled per-request
- ✅ **Drop-in compatibility** – Works with existing OpenAI SDKs unchanged

---

## 🔑 Quick Setup

### 1. Get Your API Key
1. Sign in at [api.bluesminds.com/console](https://api.bluesminds.com/console)
2. Navigate to **Tokens → Create New Token**
3. Copy the key (starts with `sk-`)
4. Store it securely as an environment variable:
   ```bash
   export BLUESMINDS_API_KEY="sk-your-key-here"
   ```

### 2. Configure Your Agent
Set the base URL and API key in your agent's LLM configuration:
```python
base_url = "https://api.bluesminds.com/v1"
api_key = "sk-your-key-here"  # or from environment variable
```

---

## 🛠️ Usage Examples

### Python (OpenAI SDK)
```python
import os
import openai

# Configure client
client = openai.OpenAI(
    api_key=os.getenv("BLUESMINDS_API_KEY"),
    base_url="https://api.bluesminds.com/v1"
)

# Chat completion
response = client.chat.completions.create(
    model="gpt-4o",  # or "mistral-large", "claude-3-sonnet", etc.
    messages=[
        {"role": "system", "content": "You are a helpful AI assistant."},
        {"role": "user", "content": "What is BluesMinds?"}
    ],
    temperature=0.7
)

print(response.choices[0].message.content)
```

### JavaScript (OpenAI SDK)
```javascript
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.BLUESMINDS_API_KEY,
  baseURL: "https://api.bluesminds.com/v1",
});

const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    { role: "system", content: "You are a helpful AI assistant." },
    { role: "user", content: "What is BluesMinds?" },
  ],
  temperature: 0.7,
});

console.log(response.choices[0].message.content);
```

### cURL (Direct HTTP)
```bash
curl -X POST "https://api.bluesminds.com/v1/chat/completions" \
  -H "Authorization: Bearer $BLUESMINDS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "system", "content": "You are a helpful AI assistant."},
      {"role": "user", "content": "What is BluesMinds?"}
    ],
    "temperature": 0.7
  }'
```

---

## 🎯 Model Selection

### Available Models
BluesMinds supports **hundreds of models** from various providers. You can use:
- **Plain IDs**: `gpt-4o`, `mistral-large`, `claude-3-sonnet`
- **Provider-prefixed IDs**: `openai/gpt-4o`, `anthropic/claude-3-sonnet`, `mistral/mistral-large`

### Popular Models for Agents
| Model ID | Provider | Best For |
|---------|----------|----------|
| `gpt-4o` | OpenAI | General-purpose, high intelligence |
| `gpt-4o-mini` | OpenAI | Cost-effective, fast |
| `claude-3-sonnet` | Anthropic | Reasoning, structured outputs |
| `claude-3-haiku` | Anthropic | Fast, low-cost |
| `mistral-large` | Mistral | Open-source alternative |
| `gemini-1.5-pro` | Google | Multimodal, long context |

> 💡 **Tip:** BluesMinds automatically routes to the best provider for each model ID.

---

## ⚙️ Advanced Configuration

### Disable Logging (Privacy)
Add `log: false` to disable logging for sensitive requests:
```python
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Sensitive query"}],
    log=False  # Disable logging for this request
)
```

### Custom Headers
```python
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}],
    extra_headers={
        "X-Custom-Header": "value",
        "X-No-Log": "true"  # Alternative way to disable logging
    }
)
```

### Rate Limiting
- **RPM (Requests Per Minute)** is enforced per API key
- Check your limits in the [console](https://api.bluesminds.com/console)
- Handle rate limits with exponential backoff:
  ```python
  import time
  from openai import RateLimitError
  
  max_retries = 3
  for attempt in range(max_retries):
      try:
          response = client.chat.completions.create(...)
          break
      except RateLimitError:
          time.sleep(2 ** attempt)  # Exponential backoff
  ```

---

## 🤖 AI Agent Best Practices

### 1. **Use Multiple Models**
Route different tasks to appropriate models:
```python
def get_model_for_task(task_type):
    models = {
        "complex_reasoning": "gpt-4o",
        "fast_response": "gpt-4o-mini",
        "cost_sensitive": "mistral-large",
        "structured_data": "claude-3-sonnet"
    }
    return models.get(task_type, "gpt-4o")
```

### 2. **Implement Fallback Logic**
```python
def call_llm_with_fallback(messages, models_to_try):
    for model in models_to_try:
        try:
            response = client.chat.completions.create(
                model=model,
                messages=messages
            )
            return response
        except Exception as e:
            print(f"Failed with {model}: {e}")
            continue
    raise Exception("All models failed")

# Usage
response = call_llm_with_fallback(
    messages=[{"role": "user", "content": "Hello"}],
    models_to_try=["gpt-4o", "claude-3-sonnet", "mistral-large"]
)
```

### 3. **Cache Responses**
```python
from functools import lru_cache

@lru_cache(maxsize=1000)
def get_cached_response(prompt, model="gpt-4o"):
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content
```

### 4. **Monitor Costs**
```python
import tiktoken

def count_tokens(text, model="gpt-4o"):
    encoding = tiktoken.encoding_for_model(model)
    return len(encoding.encode(text))

# Track usage
input_tokens = count_tokens(prompt)
output_tokens = count_tokens(response)
total_cost = (input_tokens * 0.00001) + (output_tokens * 0.00003)  # Example pricing
```

---

## 📊 Monitoring & Analytics

### Dashboard
- View usage, costs, and performance at [api.bluesminds.com/console](https://api.bluesminds.com/console)
- Track requests, errors, and latency

### Custom Metrics
```python
import time

start_time = time.time()
response = client.chat.completions.create(...)
latency = time.time() - start_time

# Log metrics
print(f"Model: {response.model}")
print(f"Latency: {latency:.2f}s")
print(f"Input tokens: {response.usage.prompt_tokens}")
print(f"Output tokens: {response.usage.completion_tokens}")
```

---

## 🚨 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| **Authentication failed** | Verify your API key starts with `sk-` and is correctly set |
| **Model not found** | Check the model ID in the [Models List](https://doc.bluesminds.com/docs/models) |
| **Rate limit exceeded** | Implement exponential backoff or request a limit increase |
| **Provider unavailable** | BluesMinds will auto-failover; check [status page](https://api.bluesminds.com/status) |
| **Slow responses** | Try a different model or check provider status |

### Debug Mode
```python
import logging
import httpx

# Enable debug logging
logging.basicConfig(level=logging.DEBUG)

# Or use httpx for detailed request/response logging
client = openai.OpenAI(
    api_key=os.getenv("BLUESMINDS_API_KEY"),
    base_url="https://api.bluesminds.com/v1",
    http_client=httpx.Client(event_hooks={"request": [print], "response": [print]})
)
```

---

## 📚 Resources

- [Official Documentation](https://doc.bluesminds.com/docs)
- [Quickstart Guide](https://doc.bluesminds.com/docs/quickstart)
- [API Reference](https://doc.bluesminds.com/docs/api)
- [Models List](https://doc.bluesminds.com/docs/models)
- [Pricing](https://doc.bluesminds.com/docs/pricing)
- [Community (Telegram)](https://t.me/apibluesminds)

---

## 🔄 Migration from Direct Provider APIs

### Before (Direct OpenAI)
```python
client = openai.OpenAI(api_key="sk-openai-key")
```

### After (BluesMinds)
```python
client = openai.OpenAI(
    api_key="sk-bluesminds-key",
    base_url="https://api.bluesminds.com/v1"
)
```

> ✅ **No other code changes needed!**

---

## 💡 Pro Tips

1. **Use model aliases** for easier switching:
   ```python
   MODELS = {
       "default": "gpt-4o",
       "fast": "gpt-4o-mini",
       "cheap": "mistral-large"
   }
   ```

2. **Set timeout** for long-running requests:
   ```python
   client = openai.OpenAI(
       api_key=os.getenv("BLUESMINDS_API_KEY"),
       base_url="https://api.bluesminds.com/v1",
       timeout=30.0  # 30 seconds
   )
   ```

3. **Use streaming** for real-time responses:
   ```python
   stream = client.chat.completions.create(
       model="gpt-4o",
       messages=[{"role": "user", "content": "Hello"}],
       stream=True
   )
   for chunk in stream:
       print(chunk.choices[0].delta.content, end="", flush=True)
   ```

4. **Batch processing** for multiple requests:
   ```python
   from concurrent.futures import ThreadPoolExecutor
   
   def process_prompt(prompt):
       response = client.chat.completions.create(
           model="gpt-4o",
           messages=[{"role": "user", "content": prompt}]
       )
       return response.choices[0].message.content
   
   prompts = ["Prompt 1", "Prompt 2", "Prompt 3"]
   with ThreadPoolExecutor(max_workers=5) as executor:
       results = list(executor.map(process_prompt, prompts))
   ```

---

*Last updated: June 12, 2026*