/**
 * GECKO — Nigeria Intel Store
 *
 * A tiny file-backed JSON store for operator-entered Nigeria intelligence.
 * Four collections: incidents, infrastructure, checkpoints (point features)
 * and roads (LineString features). Seed data ships in `gecko-data/` and is
 * extended live by the data-entry console (POST /api/nigeria/<kind>).
 *
 * Storage is a plain JSON file per kind under GECKO_DATA_DIR (default
 * `<cwd>/gecko-data`). This is intentionally simple so a single operator can
 * run Gecko locally / on a VPS and own the data. For multi-user / serverless
 * deployments, swap the read/write helpers for Supabase or Postgres — the
 * record shapes below are the contract the map renders against.
 */
import { promises as fs } from 'fs';
import path from 'path';

export type IntelKind = 'incidents' | 'infrastructure' | 'checkpoints' | 'roads';

export const KINDS: IntelKind[] = ['incidents', 'infrastructure', 'checkpoints', 'roads'];

/** A geocoded point of interest (incidents / infrastructure / checkpoints). */
export interface IntelPoint {
  id: string;
  kind: Exclude<IntelKind, 'roads'>;
  category: string;          // e.g. 'kidnapping', 'refinery', 'military'
  label: string;             // short title shown on the map
  lat: number;
  lng: number;
  severity?: 'info' | 'low' | 'medium' | 'high' | 'critical';
  state?: string;            // Nigerian state / FCT
  description?: string;
  source?: string;           // who reported it
  sourceUrl?: string;        // link to corroborating report
  date?: string;             // ISO date the event/asset refers to
  seed?: boolean;            // true for shipped sample data
  createdAt: string;         // ISO timestamp the record was stored
}

/** A road / corridor as a GeoJSON LineString feature. */
export interface RoadFeature {
  type: 'Feature';
  geometry: { type: 'LineString'; coordinates: [number, number][] };
  properties: {
    id: string;
    name: string;
    roadClass?: string;      // e.g. 'expressway', 'trunk-a', 'urban'
    status?: 'open' | 'caution' | 'restricted' | 'closed';
    description?: string;
    state?: string;
    seed?: boolean;
    createdAt: string;
  };
}

// Live working data (operator-entered + initialized seed). Git-ignored so real
// field intel never leaves the machine. Override with GECKO_DATA_DIR.
const DATA_DIR = process.env.GECKO_DATA_DIR || path.join(process.cwd(), 'gecko-data');
// Pristine seed templates shipped in the repo (tracked in git). Copied into the
// live files on first run so the map renders out of the box.
const SEED_DIR = path.join(DATA_DIR, 'seed');

function fileFor(kind: IntelKind): string {
  return path.join(DATA_DIR, `${kind}.json`);
}

function seedFileFor(kind: IntelKind): string {
  return path.join(SEED_DIR, `${kind}.json`);
}

async function ensureDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJsonArray(file: string): Promise<any[] | null> {
  try {
    const raw = await fs.readFile(file, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err: any) {
    if (err?.code === 'ENOENT') return null;
    throw err;
  }
}

/**
 * Read a collection. If the live file doesn't exist yet, initialize it from the
 * tracked seed template (so a fresh clone renders immediately) and persist that
 * copy as the operator's editable working file.
 */
export async function readKind(kind: IntelKind): Promise<any[]> {
  const live = await readJsonArray(fileFor(kind));
  if (live !== null) return live;
  // First run for this kind — seed the live file from the template (or empty).
  const seed = (await readJsonArray(seedFileFor(kind))) ?? [];
  await writeKind(kind, seed);
  return seed;
}

async function writeKind(kind: IntelKind, rows: any[]): Promise<void> {
  await ensureDir();
  await fs.writeFile(fileFor(kind), JSON.stringify(rows, null, 2), 'utf8');
}

// Non-crypto id — fine for local operator data. (No Math.random ban concerns:
// this runs in the Next.js server runtime, not the workflow sandbox.)
function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const SEVERITIES = new Set(['info', 'low', 'medium', 'high', 'critical']);

/** Validate + normalize an incoming point record from the data-entry form. */
export function normalizePoint(kind: Exclude<IntelKind, 'roads'>, body: any): IntelPoint | { error: string } {
  const lat = Number(body?.lat);
  const lng = Number(body?.lng);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) return { error: 'lat must be a number between -90 and 90' };
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) return { error: 'lng must be a number between -180 and 180' };
  const label = String(body?.label || '').trim();
  if (!label) return { error: 'label is required' };
  const severity = SEVERITIES.has(body?.severity) ? body.severity : undefined;
  return {
    id: newId(kind.slice(0, 3)),
    kind,
    category: String(body?.category || 'other').trim().toLowerCase(),
    label: label.slice(0, 140),
    lat,
    lng,
    severity,
    state: body?.state ? String(body.state).trim() : undefined,
    description: body?.description ? String(body.description).slice(0, 2000) : undefined,
    source: body?.source ? String(body.source).slice(0, 200) : undefined,
    sourceUrl: body?.sourceUrl ? String(body.sourceUrl).slice(0, 500) : undefined,
    date: body?.date ? String(body.date).slice(0, 40) : undefined,
    seed: false,
    createdAt: new Date().toISOString(),
  };
}

/** Validate + normalize an incoming road LineString from the data-entry form. */
export function normalizeRoad(body: any): RoadFeature | { error: string } {
  const coords = body?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) {
    return { error: 'coordinates must be an array of at least 2 [lng,lat] pairs' };
  }
  const clean: [number, number][] = [];
  for (const c of coords) {
    const lng = Number(Array.isArray(c) ? c[0] : c?.lng);
    const lat = Number(Array.isArray(c) ? c[1] : c?.lat);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return { error: 'each coordinate needs finite lng & lat' };
    clean.push([lng, lat]);
  }
  const name = String(body?.name || body?.label || '').trim();
  if (!name) return { error: 'name is required' };
  return {
    type: 'Feature',
    geometry: { type: 'LineString', coordinates: clean },
    properties: {
      id: newId('road'),
      name: name.slice(0, 140),
      roadClass: body?.roadClass ? String(body.roadClass).trim() : 'road',
      status: ['open', 'caution', 'restricted', 'closed'].includes(body?.status) ? body.status : 'open',
      description: body?.description ? String(body.description).slice(0, 2000) : undefined,
      state: body?.state ? String(body.state).trim() : undefined,
      seed: false,
      createdAt: new Date().toISOString(),
    },
  };
}

/** Append a validated record and persist. Returns the stored record. */
export async function appendRecord(kind: IntelKind, record: any): Promise<any> {
  const rows = await readKind(kind);
  rows.push(record);
  await writeKind(kind, rows);
  return record;
}

/** Delete a record by id. Returns true if something was removed. */
export async function deleteRecord(kind: IntelKind, id: string): Promise<boolean> {
  const rows = await readKind(kind);
  const idOf = (r: any) => (kind === 'roads' ? r?.properties?.id : r?.id);
  const next = rows.filter((r) => idOf(r) !== id);
  if (next.length === rows.length) return false;
  await writeKind(kind, next);
  return true;
}
