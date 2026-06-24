'use client';

import { motion } from 'framer-motion';
import { Globe, MapPin } from 'lucide-react';

interface ViewPresetsProps {
  onNavigate: (lat: number, lng: number, zoom: number) => void;
}

const PRESETS = [
  { label: 'NIGERIA', lat: 9.0820, lng: 8.6753, zoom: 5.6, icon: '🇳🇬' },
  { label: 'ABUJA (FCT)', lat: 9.0765, lng: 7.3986, zoom: 9.5, icon: '🏛️' },
  { label: 'LAGOS', lat: 6.5244, lng: 3.3792, zoom: 9.5, icon: '🌆' },
  { label: 'NORTH-EAST', lat: 11.5, lng: 13.0, zoom: 6.5, icon: '⚠️', hot: true },
  { label: 'NORTH-WEST', lat: 11.7, lng: 6.5, zoom: 6.5, icon: '⚠️', hot: true },
  { label: 'NORTH-CENTRAL', lat: 9.5, lng: 8.0, zoom: 6.5, icon: '🔥', hot: true },
  { label: 'SOUTH-WEST', lat: 7.3, lng: 4.0, zoom: 6.8, icon: '🌍' },
  { label: 'SOUTH-EAST', lat: 5.9, lng: 7.5, zoom: 7.0, icon: '🌍' },
  { label: 'SOUTH-SOUTH', lat: 5.0, lng: 6.5, zoom: 6.8, icon: '🛢️', hot: true },
  { label: 'KANO', lat: 12.0022, lng: 8.5919, zoom: 9.5, icon: '🏙️' },
  { label: 'PORT HARCOURT', lat: 4.8156, lng: 7.0498, zoom: 9.5, icon: '⚓' },
  { label: 'BORNO', lat: 11.8333, lng: 13.1500, zoom: 7.0, icon: '⚠️', hot: true },
];

export default function ViewPresets({ onNavigate }: ViewPresetsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.7, duration: 0.6 }}
      className="glass-panel p-2.5 pointer-events-auto"
    >
      <div className="flex items-center gap-2 mb-2">
        <Globe className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
        <span className="hud-text text-[12px] text-[var(--text-primary)] tracking-widest">REGION PRESETS</span>
        <span className="gotham-tag gotham-tag--critical" style={{ fontSize: '7px', padding: '1px 4px', marginLeft: 'auto' }}>
          {PRESETS.filter(p => (p as any).hot).length} HOT
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {PRESETS.map(p => (
          <button
            key={p.label}
            onClick={() => onNavigate(p.lat, p.lng, p.zoom)}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-[10px] font-mono tracking-wider border border-transparent hover:border-[var(--border-primary)] hover:text-[var(--gold-primary)] transition-all hover:scale-[1.02] active:scale-[0.98] ${(p as any).hot ? 'text-[var(--alert-red)] hover:border-[var(--alert-red)]/30 hover:bg-[var(--alert-red)]/5' : 'text-[var(--text-muted)] hover:bg-[var(--hover-accent)]'}`}
          >
            <span className="text-[11px] flex-shrink-0">{p.icon}</span>
            <span>{p.label}</span>
            {(p as any).hot && <span className="w-1.5 h-1.5 rounded-full bg-[var(--alert-red)] animate-gecko-pulse ml-auto flex-shrink-0" />}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
