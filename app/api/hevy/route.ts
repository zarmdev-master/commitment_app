import { NextRequest, NextResponse } from 'next/server';

const HEVY_BASE = 'https://api.hevyapp.com';

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get('x-hevy-api-key');
  if (!apiKey) return NextResponse.json({ error: 'Missing API key' }, { status: 401 });

  const page     = req.nextUrl.searchParams.get('page') || '1';
  const pageSize = req.nextUrl.searchParams.get('pageSize') || '10';

  try {
    const res = await fetch(
      `${HEVY_BASE}/v1/workouts?page=${page}&pageSize=${pageSize}`,
      { headers: { 'api-key': apiKey }, next: { revalidate: 0 } }
    );
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text || 'Hevy API error' }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to reach Hevy' }, { status: 502 });
  }
}
