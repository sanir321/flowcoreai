/**
 * /supabase/functions/agent-orchestrator/lib/circuit-breaker.ts
 * Implements the Circuit Breaker pattern to protect against LLM timeouts and failures.
 */

type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitBreakerConfig {
  failureThreshold: number;   // failures before opening
  recoveryTimeout: number;    // ms before trying again
  callTimeout: number;        // ms before a single call is considered failed
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 3,
  recoveryTimeout: 30_000,  // 30 seconds
  callTimeout: 8_000,       // 8 seconds
};

class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: CircuitState = 'closed';
  private config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async execute<T>(
    fn: () => Promise<T>,
    fallback: () => T
  ): Promise<{ result: T; usedFallback: boolean; circuitOpen: boolean }> {
    
    // If open, check if recovery timeout has passed
    if (this.state === 'open') {
      const timeSinceFailure = Date.now() - this.lastFailureTime;
      if (timeSinceFailure < this.config.recoveryTimeout) {
        // Still open — return fallback immediately
        console.log("[CIRCUIT] Circuit is OPEN. Using fallback immediately.");
        return { result: fallback(), usedFallback: true, circuitOpen: true };
      }
      // Recovery window passed — try half-open
      console.log("[CIRCUIT] Recovery window passed. Attempting HALF-OPEN.");
      this.state = 'half-open';
    }

    try {
      // Race between the actual call and a timeout
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Circuit timeout')), this.config.callTimeout)
        ),
      ]);

      // Success — reset
      this.onSuccess();
      return { result, usedFallback: false, circuitOpen: false };

    } catch (err: any) {
      console.error(`[CIRCUIT] Call failed: ${err.message}`);
      this.onFailure();
      return { result: fallback(), usedFallback: true, circuitOpen: this.state === 'open' };
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    console.log(`[CIRCUIT] Failure recorded. Count: ${this.failures}`);
    if (this.failures >= this.config.failureThreshold) {
      console.error("[CIRCUIT] Failure threshold reached. Opening circuit.");
      this.state = 'open';
    }
  }

  getState() { return this.state; }
  getFailures() { return this.failures; }
}

// Export a singleton — one breaker for Groq API across all requests
export const groqCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  recoveryTimeout: 30_000,
  callTimeout: 10_000, // 10 seconds for more complex logic
});
