import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function proxy(request: NextRequest, path: string[]) {
  const apiKey = process.env.ADMIN_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ message: 'Admin API key not configured' }, { status: 500 });
  }

  const target = new URL(`/api/${path.join('/')}`, API_BASE);
  target.search = request.nextUrl.search;

  const headers = new Headers();
  headers.set('X-Admin-Key', apiKey);
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('Content-Type', contentType);
  if (request.headers.get('authorization')) {
    headers.set('Authorization', request.headers.get('authorization')!);
  }

  const body = ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer();

  const res = await fetch(target.toString(), {
    method: request.method,
    headers,
    body: body !== undefined ? Buffer.from(body) : undefined,
    cache: 'no-store',
  });

  const resBody = await res.arrayBuffer();
  return new NextResponse(Buffer.from(resBody), {
    status: res.status,
    headers: {
      'Content-Type': res.headers.get('content-type') || 'application/json',
    },
  });
}

export async function GET(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(request, path);
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(request, path);
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(request, path);
}

export async function PUT(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(request, path);
}

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(request, path);
}
