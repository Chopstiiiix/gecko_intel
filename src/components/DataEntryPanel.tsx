'use client';

/**
 * GECKO — Data Entry Console
 *
 * Operator console for plotting fresh Nigeria field intel onto the map.
 * Submits to /api/nigeria/<kind>; on success the parent refetches the layer
 * so the new point/line appears live. Coordinates can be typed, grabbed from
 * the live map cursor, or read from the current map centre.
 */
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Crosshair, Trash2, Plus, MapPin, RefreshCw } from 'lucide-react';

type Kind = 'incidents' | 'infrastructure' | 'checkpoints' | 'roads';

const KIND_META: Record<Kind, { label: string; categories: string[]; color: string }> = {
  incidents: {
    label: 'Security Incident',
    color: '#FF3D3D',
    categories: ['kidnapping', 'banditry', 'terrorism', 'armed-robbery', 'communal-clash', 'protest', 'unrest', 'ied-explosion', 'piracy', 'cultism', 'other'],
  },
  infrastructure: {
    label: 'Infrastructure / Asset',
    color: '#26A69A',
    categories: ['airport', 'seaport', 'refinery', 'power', 'pipeline', 'bridge', 'telecom', 'government', 'military-base', 'hospital', 'market', 'other'],
  },
  checkpoints: {
    label: 'Security Checkpoint',
    color: '#448AFF',
    categories: ['military', 'police', 'customs', 'immigration', 'vigilante', 'joint-task-force', 'toll', 'other'],
  },
  roads: {
    label: 'Road / Corridor',
    color: '#FFB300',
    categories: ['expressway', 'trunk-a', 'trunk-b', 'urban', 'rural', 'bridge', 'other'],
  },
};

const SEVERITIES = ['info', 'low', 'medium', 'high', 'critical'];
const ROAD_STATUS = ['open', 'caution', 'restricted', 'closed'];

const NG_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River',
  'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano',
  'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo',
  'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  getCursorCoord: () => { lat: number; lng: number } | null;
  onFlyTo?: (lat: number, lng: number, zoom?: number) => void;
}

const inputCls =
  'w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-[11px] text-[var(--text-primary)] font-mono outline-none focus:border-[var(--gold-primary)]/60 transition-colors';
const labelCls = 'block text-[9px] font-mono tracking-wider text-[var(--text-muted)] mb-1 uppercase';

export default function DataEntryPanel({ open, onClose, onSaved, getCursorCoord, onFlyTo }: Props) {
  const [kind, setKind] = useState<Kind>('incidents');
  const [form, setForm] = useState<any>({ severity: 'medium', status: 'open' });
  const [roadPoints, setRoadPoints] = useState<[number, number][]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const meta = KIND_META[kind];

  const loadItems = useCallback(async (k: Kind) => {
    try {
      const res = await fetch(`/api/nigeria/${k}`, { cache: 'no-store' });
      const json = await res.json();
      setItems(Array.isArray(json.items) ? json.items : []);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    if (open) loadItems(kind);
  }, [open, kind, loadItems]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const grabCursor = () => {
    const c = getCursorCoord();
    if (!c) {
      setMsg({ kind: 'err', text: 'Move the mouse over the map first, then grab.' });
      return;
    }
    if (kind === 'roads') {
      setRoadPoints((p) => [...p, [+c.lng.toFixed(5), +c.lat.toFixed(5)]]);
    } else {
      set('lat', +c.lat.toFixed(5));
      set('lng', +c.lng.toFixed(5));
    }
    setMsg(null);
  };

  const submit = async () => {
    setBusy(true);
    setMsg(null);
    try {
      let payload: any;
      if (kind === 'roads') {
        if (roadPoints.length < 2) throw new Error('A road needs at least 2 points. Use "Grab map cursor" along the route.');
        payload = {
          name: form.label,
          roadClass: form.category || 'road',
          status: form.status || 'open',
          state: form.state,
          description: form.description,
          coordinates: roadPoints,
        };
      } else {
        payload = {
          category: form.category || meta.categories[0],
          label: form.label,
          lat: form.lat,
          lng: form.lng,
          severity: form.severity,
          state: form.state,
          description: form.description,
          source: form.source,
          sourceUrl: form.sourceUrl,
          date: form.date,
        };
      }
      const res = await fetch(`/api/nigeria/${kind}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'save failed');
      setMsg({ kind: 'ok', text: `Saved "${form.label}" to ${kind}.` });
      setForm({ severity: 'medium', status: 'open' });
      setRoadPoints([]);
      await loadItems(kind);
      onSaved();
    } catch (e: any) {
      setMsg({ kind: 'err', text: e?.message || 'save failed' });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    await fetch(`/api/nigeria/${kind}?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    await loadItems(kind);
    onSaved();
  };

  if (!open) return null;

  const idOf = (it: any) => (kind === 'roads' ? it?.properties?.id : it?.id);
  const labelOf = (it: any) => (kind === 'roads' ? it?.properties?.name : it?.label);
  const seedOf = (it: any) => (kind === 'roads' ? it?.properties?.seed : it?.seed);
  const flyTo = (it: any) => {
    if (!onFlyTo) return;
    if (kind === 'roads') {
      const c = it?.geometry?.coordinates?.[0];
      if (c) onFlyTo(c[1], c[0], 9);
    } else {
      onFlyTo(it.lat, it.lng, 11);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      className="absolute top-[70px] right-3 z-[400] w-[340px] max-h-[82vh] overflow-y-auto glass-panel p-4 pointer-events-auto"
      style={{ borderTop: `2px solid ${meta.color}` }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4" style={{ color: meta.color }} />
          <span className="text-[12px] font-mono tracking-widest text-[var(--text-primary)]">DATA ENTRY</span>
        </div>
        <button onClick={onClose} className="text-[var(--text-muted)] hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* kind selector */}
      <div className="grid grid-cols-2 gap-1.5 mb-3">
        {(Object.keys(KIND_META) as Kind[]).map((k) => (
          <button
            key={k}
            onClick={() => { setKind(k); setMsg(null); }}
            className={`px-2 py-1.5 rounded text-[9px] font-mono tracking-wider border transition-all ${
              kind === k
                ? 'text-black font-bold'
                : 'text-[var(--text-muted)] border-white/10 hover:border-white/30'
            }`}
            style={kind === k ? { background: KIND_META[k].color, borderColor: KIND_META[k].color } : {}}
          >
            {KIND_META[k].label.split(' ')[0].toUpperCase()}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        <div>
          <label className={labelCls}>{kind === 'roads' ? 'Road name' : 'Label / title'} *</label>
          <input className={inputCls} value={form.label || ''} onChange={(e) => set('label', e.target.value)} placeholder={kind === 'roads' ? 'e.g. Kaduna–Birnin Gwari Rd' : 'e.g. Kidnapping on A2'} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Category</label>
            <select className={inputCls} value={form.category || ''} onChange={(e) => set('category', e.target.value)}>
              <option value="">— select —</option>
              {meta.categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>State</label>
            <select className={inputCls} value={form.state || ''} onChange={(e) => set('state', e.target.value)}>
              <option value="">— select —</option>
              {NG_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {kind !== 'roads' ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Latitude *</label>
                <input className={inputCls} type="number" step="any" value={form.lat ?? ''} onChange={(e) => set('lat', e.target.value)} placeholder="9.0820" />
              </div>
              <div>
                <label className={labelCls}>Longitude *</label>
                <input className={inputCls} type="number" step="any" value={form.lng ?? ''} onChange={(e) => set('lng', e.target.value)} placeholder="8.6753" />
              </div>
            </div>
            {kind !== 'infrastructure' && (
              <div>
                <label className={labelCls}>Severity</label>
                <select className={inputCls} value={form.severity || 'medium'} onChange={(e) => set('severity', e.target.value)}>
                  {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
          </>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelCls} style={{ marginBottom: 0 }}>Route points ({roadPoints.length})</label>
              <select className="bg-black/40 border border-white/10 rounded px-1 py-0.5 text-[9px] text-[var(--text-primary)] font-mono" value={form.status || 'open'} onChange={(e) => set('status', e.target.value)}>
                {ROAD_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="bg-black/30 border border-white/10 rounded p-2 max-h-[80px] overflow-y-auto text-[9px] font-mono text-[var(--text-muted)]">
              {roadPoints.length === 0 ? 'Grab map-cursor points along the route →' : roadPoints.map((p, i) => (
                <div key={i} className="flex justify-between"><span>{i + 1}. {p[1].toFixed(4)}, {p[0].toFixed(4)}</span>
                  <button onClick={() => setRoadPoints((arr) => arr.filter((_, j) => j !== i))} className="text-[var(--alert-red)]">×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={grabCursor} className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded border border-[var(--gold-primary)]/40 text-[10px] font-mono tracking-wider text-[var(--gold-primary)] hover:bg-[var(--gold-primary)]/10 transition-colors">
          <Crosshair className="w-3.5 h-3.5" /> {kind === 'roads' ? 'ADD MAP-CURSOR POINT' : 'GRAB MAP CURSOR'}
        </button>

        <div>
          <label className={labelCls}>Description</label>
          <textarea className={inputCls} rows={2} value={form.description || ''} onChange={(e) => set('description', e.target.value)} placeholder="What happened / what is this?" />
        </div>

        {kind !== 'roads' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Source</label>
              <input className={inputCls} value={form.source || ''} onChange={(e) => set('source', e.target.value)} placeholder="reporter / agency" />
            </div>
            <div>
              <label className={labelCls}>Date</label>
              <input className={inputCls} type="date" value={form.date || ''} onChange={(e) => set('date', e.target.value)} />
            </div>
          </div>
        )}
        {kind !== 'roads' && (
          <div>
            <label className={labelCls}>Source URL</label>
            <input className={inputCls} value={form.sourceUrl || ''} onChange={(e) => set('sourceUrl', e.target.value)} placeholder="https://…" />
          </div>
        )}

        {msg && (
          <div className={`text-[10px] font-mono px-2 py-1.5 rounded ${msg.kind === 'ok' ? 'text-[#26A69A] bg-[#26A69A]/10' : 'text-[var(--alert-red)] bg-[var(--alert-red)]/10'}`}>
            {msg.text}
          </div>
        )}

        <button onClick={submit} disabled={busy} className="w-full flex items-center justify-center gap-1.5 py-2 rounded text-[11px] font-mono font-bold tracking-wider text-black disabled:opacity-50 transition-opacity" style={{ background: meta.color }}>
          {busy ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} PLOT TO MAP
        </button>
      </div>

      {/* existing records */}
      <div className="mt-4 pt-3 border-t border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-mono tracking-wider text-[var(--text-muted)] uppercase">{kind} on map ({items.length})</span>
          <button onClick={() => loadItems(kind)} className="text-[var(--text-muted)] hover:text-white"><RefreshCw className="w-3 h-3" /></button>
        </div>
        <div className="space-y-1 max-h-[160px] overflow-y-auto">
          {items.map((it) => (
            <div key={idOf(it)} className="flex items-center justify-between gap-2 bg-black/30 rounded px-2 py-1.5">
              <button onClick={() => flyTo(it)} className="flex items-center gap-1.5 text-left min-w-0 group">
                <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: meta.color }} />
                <span className="text-[10px] font-mono text-[var(--text-primary)] truncate group-hover:text-[var(--gold-primary)]">{labelOf(it)}</span>
                {seedOf(it) && <span className="text-[8px] font-mono text-[var(--text-muted)] border border-white/15 rounded px-1">SEED</span>}
              </button>
              <button onClick={() => remove(idOf(it))} className="text-[var(--text-muted)] hover:text-[var(--alert-red)] flex-shrink-0"><Trash2 className="w-3 h-3" /></button>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
