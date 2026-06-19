import { describe, it, expect, vi } from 'vitest';
import { fillTemplate, validatePlanActions } from './t3-planner.ts';

// Mock dependencies that might fail in Node environment
vi.mock('../lib/llm.ts', () => ({ callLLM: vi.fn() }));
vi.mock('../tools/executor.ts', () => ({ toolExecutor: { run: vi.fn(), flushToolCalls: vi.fn() } }));
vi.mock('../tools/registry.ts', () => ({ 
  SUBMIT_PLAN_TOOL: {}, 
  getAgentToolDefinitions: vi.fn(() => []) 
}));
vi.mock('../agents/booking.ts', () => ({ buildBookingSystemPrompt: vi.fn() }));
vi.mock('../agents/support.ts', () => ({ buildSupportSystemPrompt: vi.fn() }));
vi.mock('../agents/sales.ts', () => ({ buildSalesSystemPrompt: vi.fn() }));
vi.mock('../tools/impl/kb.ts', () => ({ matchChunks: vi.fn() }));

describe('T3 Planner Fixes', () => {
  describe('fillTemplate', () => {
    it('should not throw when template is undefined', () => {
      // @ts-ignore
      expect(() => fillTemplate(undefined, [], [])).not.toThrow();
      // @ts-ignore
      expect(fillTemplate(undefined, [], [])).toBe("");
    });

    it('should handle missing results correctly', () => {
      const actions = [{ tool: 'test_tool' }];
      const results: any[] = [undefined]; // simulate missing result
      expect(() => fillTemplate('Hello {test_tool}', actions, results)).not.toThrow();
    });
  });

  describe('validatePlanActions', () => {
    it('should not throw when plan or actions are undefined', async () => {
      const ctx: any = { supabase: { from: vi.fn(() => ({ select: vi.fn(() => ({ eq: vi.fn(() => ({ order: vi.fn(() => ({ limit: vi.fn(() => ({ maybeSingle: vi.fn() })) })))) })) })) } };
      
      // @ts-ignore
      await expect(validatePlanActions(ctx, undefined)).resolves.not.toThrow();
      
      const planWithNoActions: any = { response: 'test' };
      await validatePlanActions(ctx, planWithNoActions);
      expect(planWithNoActions.actions).toEqual([]);
    });

    it('should handle missing tool name in actions', async () => {
        const ctx: any = { 
            session: { id: 'test' },
            supabase: { 
                from: vi.fn(() => ({ 
                    select: vi.fn(() => ({ 
                        eq: vi.fn(() => ({ 
                            eq: vi.fn(() => ({
                                order: vi.fn(() => ({ 
                                    limit: vi.fn(() => ({ 
                                        maybeSingle: vi.fn(() => Promise.resolve({ data: null })) 
                                    })) 
                                })) 
                            }))
                        })) 
                    })) 
                })) 
            } 
        };
        const plan: any = { 
            response: 'test', 
            actions: [{ params: {} }] // tool name missing
        };
        await expect(validatePlanActions(ctx, plan)).resolves.not.toThrow();
        expect(plan.actions[0].tool).toBe("");
    });
  });
});
