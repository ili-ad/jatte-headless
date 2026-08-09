// libs/jatte-headless/frontend/src/app/api/rooms/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8000';

type RoomsParams = { params: Promise<{ path: string[] }> };

async function proxyRooms(
  req: NextRequest,
  { params }: RoomsParams,
) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'rooms_proxy_auth_missing' }, { status: 401 });
  }
  const { path } = await params;
  const url = `${BACKEND}/api/rooms/${path.join('/')}/`;
  const resp = await fetch(url, {
    method: req.method,
    headers: {
      'Content-Type': req.headers.get('content-type') ?? 'application/json',
      Authorization: authHeader,
    },
    body: req.method === 'GET' ? undefined : await req.text(),
    credentials: 'include',
  });

  return new NextResponse(await resp.text(), {
    status: resp.status,
    headers: resp.headers,
  });
}

// Keep the original POST handler for the upstream app:
export async function POST(req: NextRequest, ctx: RoomsParams) {
  return proxyRooms(req, ctx);
}
