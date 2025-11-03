import { describe, it, expect } from 'vitest';
import { ok, error, badRequest, notFound, serverError } from './response';

describe('response helpers', () => {
  it('ok wraps data with success: true', async () => {
    const res = ok({ foo: 'bar' });
    const json = await res.json();
    expect(json).toEqual({ success: true, data: { foo: 'bar' } });
  });

  it('error returns standardized error', async () => {
    const res = error(418, 'teapot', { extra: true });
    expect(res.status).toBe(418);
    const json = await res.json();
    expect(json).toEqual({ success: false, error: { message: 'teapot', details: { extra: true } } });
  });

  it('badRequest, notFound, serverError shortcuts', async () => {
    expect((await badRequest('x').json()).success).toBe(false);
    expect((await notFound('x').json()).success).toBe(false);
    expect((await serverError('x').json()).success).toBe(false);
  });
});


