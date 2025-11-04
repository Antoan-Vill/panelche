export class HttpError extends Error {
  constructor(public status: number, public data?: unknown) {
    super(`HTTP ${status}`);
    this.name = 'HttpError';
  }
}



