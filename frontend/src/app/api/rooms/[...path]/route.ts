//frontend/src/app/api/rooms/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8000';

export async function POST(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  const url = `${BACKEND}/api/rooms/${params.path.join('/')}/`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': req.headers.get('content-type') ?? 'application/json',
      Authorization: req.headers.get('authorization') ?? '',
    },
    body: await req.text(),
    credentials: 'include',
  });

  return new NextResponse(await resp.text(), {
    status: resp.status,
    headers: resp.headers,
  });
}
