export class AuthError extends Error {
  status?: number;

  constructor(message = 'Unauthenticated', status = 401) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}
