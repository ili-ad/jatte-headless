'use client';

import { useEffect } from 'react';
import { setAuthToken } from '../../../libs/stream-chat-shim/src/api/chatAPI';

export default function AuthBootstrap() {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/token/', { credentials: 'same-origin' });
        const json = await res.json();
        if (!cancelled && json?.token) {
          setAuthToken(json.token);
        }
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('token bootstrap failed', e);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
