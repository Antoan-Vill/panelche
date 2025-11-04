import { NextResponse } from 'next/server';

export const ok = <T>(data: T, init?: ResponseInit) =>
  NextResponse.json({ success: true, data }, init);

export const error = (status: number, message: string, details?: unknown) =>
  NextResponse.json({ success: false, error: { message, details } }, { status });

export const badRequest = (message: string, details?: unknown) => error(400, message, details);
export const notFound = (message = 'Not found') => error(404, message);
export const serverError = (message = 'Internal error', details?: unknown) => error(500, message, details);



