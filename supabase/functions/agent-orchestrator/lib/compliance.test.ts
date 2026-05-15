import { describe, it, expect, vi, beforeAll } from 'vitest'

// Mock the esm.sh URL import (SupabaseClient is only used as a type)
vi.mock('https://esm.sh/@supabase/supabase-js@2.39.7', () => ({ SupabaseClient: class {} }))

const { calculateTypingDelay, checkWhatsAppWindow, logWindowExpired } = await import('./compliance.ts')

describe('calculateTypingDelay', () => {
  it('returns correct delay for short message', () => {
    expect(calculateTypingDelay('Hello')).toBe(60)
  })

  it('caps delay at MAX_TYPING_DELAY_MS (1500)', () => {
    const longMsg = 'x'.repeat(200)
    expect(calculateTypingDelay(longMsg)).toBe(1500)
  })

  it('returns 0 for empty message', () => {
    expect(calculateTypingDelay('')).toBe(0)
  })

  it('scales linearly within bounds', () => {
    expect(calculateTypingDelay('Hello world')).toBe(132)
    expect(calculateTypingDelay('A')).toBe(12)
    expect(calculateTypingDelay('x'.repeat(125))).toBe(1500)
  })
})

describe('checkWhatsAppWindow', () => {
  it('returns not expired when within 24h', async () => {
    const mockSupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({
              data: { last_customer_message_at: new Date().toISOString() },
              error: null
            })
          })
        })
      })
    }
    const result = await checkWhatsAppWindow(mockSupabase as any, 'session-1')
    expect(result.expired).toBe(false)
  })

  it('returns expired when over 24h', async () => {
    const past = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
    const mockSupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({
              data: { last_customer_message_at: past },
              error: null
            })
          })
        })
      })
    }
    const result = await checkWhatsAppWindow(mockSupabase as any, 'session-2')
    expect(result.expired).toBe(true)
  })

  it('returns not expired when no last message timestamp', async () => {
    const mockSupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: { last_customer_message_at: null }, error: null })
          })
        })
      })
    }
    const result = await checkWhatsAppWindow(mockSupabase as any, 'session-3')
    expect(result.expired).toBe(false)
  })

  it('returns not expired on query error', async () => {
    const mockSupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: { message: 'DB error' } })
          })
        })
      })
    }
    const result = await checkWhatsAppWindow(mockSupabase as any, 'session-4')
    expect(result.expired).toBe(false)
  })
})

describe('logWindowExpired', () => {
  it('inserts escalation log', async () => {
    let inserted = false
    const mockSupabase = {
      from: () => ({
        insert: () => {
          inserted = true
          return { error: null }
        }
      })
    }
    await logWindowExpired(mockSupabase as any, 'ws-1', 'session-1')
    expect(inserted).toBe(true)
  })

  it('handles insert error gracefully', async () => {
    const mockSupabase = {
      from: () => ({
        insert: () => ({ error: { message: 'Insert failed' } })
      })
    }
    await expect(logWindowExpired(mockSupabase as any, 'ws-1', 'session-1')).resolves.toBeUndefined()
  })
})
