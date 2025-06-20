///home/iliad/dev/jatte-headless/frontend/src/lib/stream-adapter/tokenManager.ts

export class TokenManager {
  loadTokenPromise: Promise<string> | null = null;
  type: 'static' | 'provider' = 'static';
  token?: string;
  tokenProvider?: (() => Promise<string>) | string;

  constructor(token?: string) {
    if (token) {
      this.token = token;
    }
  }

  async setTokenOrProvider(tokenOrProvider: string | (() => Promise<string>)) {
    if (typeof tokenOrProvider === 'function') {
      this.type = 'provider';
      this.tokenProvider = tokenOrProvider;
    } else {
      this.type = 'static';
      this.token = tokenOrProvider;
    }
    await this.loadToken();
  }

  reset() {
    this.token = undefined;
    this.tokenProvider = undefined;
    this.type = 'static';
    this.loadTokenPromise = null;
  }

  tokenReady() {
    return this.loadTokenPromise;
  }

  async loadToken() {
    if (this.type === 'static') {
      this.loadTokenPromise = Promise.resolve(this.token as string);
      return this.loadTokenPromise;
    }
    if (this.tokenProvider && typeof this.tokenProvider !== 'string') {
      this.loadTokenPromise = Promise.resolve(this.tokenProvider()).then(t => {
        this.token = t;
        return t;
      });
      return this.loadTokenPromise;
    }
    throw new Error('No token or provider');
  }

  getToken() {
    if (!this.token) throw new Error('token not set');
    return this.token;
  }

  isStatic() {
    return this.type === 'static';
  }

  async refreshToken(apiUrl: string): Promise<string> {
    if (!this.token) throw new Error('token not set');
    const res = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!res.ok) throw new Error('refreshToken failed');
    const data = await res.json();
    this.token = data.token;
    return this.token!;
  }
}
