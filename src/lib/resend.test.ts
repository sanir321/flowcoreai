import { expect, test, vi, beforeAll } from 'vitest';
import { Resend } from 'resend';

beforeAll(() => {
  process.env.RESEND_API_KEY = 're_test_123';
});

import { resend } from './resend';

test('resend client is initialized', () => {
  expect(resend).toBeInstanceOf(Resend);
});
