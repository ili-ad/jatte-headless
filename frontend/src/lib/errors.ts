export class AuthError extends Error {
  constructor(message = 'Unauthenticated') {
    super(message);
    this.name = 'AuthError';
  }
}
