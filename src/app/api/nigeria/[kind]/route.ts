import { NextResponse } from 'next/server';
import {
  KINDS,
  IntelKind,
  readKind,
  appendRecord,
  deleteRecord,
  normalizePoint,
  normalizeRoad,
} from '@/lib/nigeria-store';

/**
 * GECKO — Nigeria Intel API
 *
 *   GET    /api/nigeria/incidents        → { kind, count, items: [...] }
 *   GET    /api/nigeria/roads            → { kind, count, items: FeatureCollection.features }
 *   POST   /api/nigeria/<kind>           → add a record (data-entry console)
 *   DELETE /api/nigeria/<kind>?id=...    → remove a record
 *
 * `kind` is one of: incidents | infrastructure | checkpoints | roads.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function assertKind(kind: string): kind is IntelKind {
  return (KINDS as string[]).includes(kind);
}

export async function GET(_req: Request, ctx: { params: Promise<{ kind: string }> }) {
  const { kind } = await ctx.params;
  if (!assertKind(kind)) return NextResponse.json({ error: 'unknown kind' }, { status: 404 });
  const items = await readKind(kind);
  return NextResponse.json(
    { kind, count: items.length, items },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function POST(req: Request, ctx: { params: Promise<{ kind: string }> }) {
  const { kind } = await ctx.params;
  if (!assertKind(kind)) return NextResponse.json({ error: 'unknown kind' }, { status: 404 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  // Delete-over-POST: some edge firewalls (incl. the default Cloudflare WAF on
  // this zone) block the HTTP DELETE method, so the data-entry console removes
  // records via POST { op: 'delete', id }.
  if (body && body.op === 'delete') {
    if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const removed = await deleteRecord(kind, String(body.id));
    return NextResponse.json({ ok: removed }, { status: removed ? 200 : 404 });
  }

  const normalized =
    kind === 'roads' ? normalizeRoad(body) : normalizePoint(kind, body);

  if ('error' in normalized) {
    return NextResponse.json({ error: normalized.error }, { status: 422 });
  }

  const stored = await appendRecord(kind, normalized);
  return NextResponse.json({ ok: true, kind, record: stored }, { status: 201 });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ kind: string }> }) {
  const { kind } = await ctx.params;
  if (!assertKind(kind)) return NextResponse.json({ error: 'unknown kind' }, { status: 404 });
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id query param required' }, { status: 400 });
  const removed = await deleteRecord(kind, id);
  return NextResponse.json({ ok: removed }, { status: removed ? 200 : 404 });
}
