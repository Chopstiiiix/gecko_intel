'use client';

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane, Satellite, Activity, Sun, AlertTriangle, Camera, Flame, Target,
  CloudLightning, Radiation, Tv, Anchor, Ship, Newspaper,
  Network, Share2, Radio, Mountain, Route, Landmark, PanelLeftClose, Crosshair
} from 'lucide-react';

interface LayerPanelProps {
  data: any;
  activeLayers: any;
  setActiveLayers: React.Dispatch<React.SetStateAction<any>>;
  isMobile?: boolean;
  theme?: 'core' | 'ghost';
  setTheme?: (theme: 'core' | 'ghost') => void;
  onDataEntry?: () => void;
  onCollapse?: () => void;
}

const getLayerGroups = (theme: 'core' | 'ghost') => {
  const isGhost = theme === 'ghost';
  const phantomPurple = '#8FA376';
  const ghostPriv = '#C9D8A8';
  const ghostGov = '#5F8443';

  const flightCom = isGhost ? phantomPurple : '#D29B3B';
  const flightPriv = isGhost ? ghostPriv : '#D29B3B';
  const flightGov = isGhost ? ghostGov : '#D29B3B';
  const flightMil = '#B0492F';

  return [
  {
    label: 'NIGERIA',
    fullLabel: 'NIGERIA INTEL',
    color: '#5F8443',
    layers: [
      { key: 'ng_incidents', label: 'Security Incidents', icon: AlertTriangle, color: '#B0492F', dataKey: 'ng_incidents' },
      { key: 'ng_infrastructure', label: 'Infrastructure / Assets', icon: Landmark, color: '#5F8443', dataKey: 'ng_infrastructure' },
      { key: 'ng_checkpoints', label: 'Security Checkpoints', icon: Shield, color: '#C9D8A8', dataKey: 'ng_checkpoints' },
      { key: 'ng_roads', label: 'Roads / Corridors', icon: Route, color: '#D29B3B', dataKey: 'ng_roads' },
      { key: 'ng_news', label: 'Nigeria News Feed', icon: Newspaper, color: '#E9E5D6', dataKey: 'ng_news_items' },
    ],
  },
  {
    label: 'SDK',
    fullLabel: 'GECKO SDK',
    color: '#294922',
    layers: [
      { key: 'sdk_sea', label: 'Maritime Lines', icon: Anchor, color: '#8FA376', dataKey: 'sdk_entities' },
      { key: 'sdk_ransomware', label: 'Ransomware Feed', icon: AlertTriangle, color: '#B0492F', dataKey: 'sdk_entities' },
    ],
  },
  {
    label: 'AVIATION',
    fullLabel: 'AVIATION',
    color: flightCom,
    layers: [
      { key: 'flights', label: 'Commercial', icon: Plane, color: flightCom, dataKey: 'commercial_flights' },
      { key: 'private', label: 'Private', icon: Plane, color: flightPriv, dataKey: 'private_flights' },
      { key: 'jets', label: 'Private Jets', icon: Plane, color: flightGov, dataKey: 'private_jets' },
      { key: 'military', label: 'Military', icon: Shield, color: flightMil, dataKey: 'military_flights' },
    ],
  },
  {
    label: 'MARITIME',
    fullLabel: 'MARITIME',
    color: '#5F8443',
    layers: [
      { key: 'maritime', label: 'Maritime / Naval', icon: Ship, color: '#5F8443', dataKey: 'maritime_ships,maritime_ports,maritime_chokepoints' },
    ],
  },
  {
    label: 'SPACE',
    fullLabel: 'SPACE TRACKING',
    color: '#5F8443',
    layers: [
      { key: 'satellites', label: 'All Satellites', icon: Satellite, color: '#5F8443', dataKey: 'satellites' },
      { key: 'sat_comms', label: 'Starlink / Comms', icon: Satellite, color: '#5F8443', dataKey: 'satellites', catKey: 'comms' },
      { key: 'sat_military', label: 'Military / Intel', icon: Satellite, color: '#B0492F', dataKey: 'satellites', catKey: 'military' },
      { key: 'sat_navigation', label: 'GPS / Navigation', icon: Satellite, color: '#C9D8A8', dataKey: 'satellites', catKey: 'navigation' },
      { key: 'sat_earth', label: 'Earth Observation', icon: Satellite, color: '#C9D8A8', dataKey: 'satellites', catKey: 'earth_obs' },
      { key: 'sat_science', label: 'Stations / Telescopes', icon: Satellite, color: '#D29B3B', dataKey: 'satellites', catKey: 'science' },
    ],
  },
  {
    label: 'SURVEIL',
    fullLabel: 'SURVEILLANCE',
    color: '#8FA376',
    layers: [
      { key: 'cctv', label: 'CCTV Cameras', icon: Camera, color: '#8FA376', dataKey: 'cameras' },
      { key: 'live_news', label: 'Live News Feeds', icon: Tv, color: '#E9E5D6', dataKey: 'live_feeds' },
    ],
  },
  {
    label: 'HAZARD',
    fullLabel: 'NATURAL HAZARDS',
    color: '#D29B3B',
    layers: [
      { key: 'earthquakes', label: 'Earthquakes (24h)', icon: Activity, color: '#D29B3B', dataKey: 'earthquakes' },
      { key: 'fires', label: 'Active Fires', icon: Flame, color: '#D29B3B', dataKey: 'fires' },
      { key: 'weather', label: 'Severe Weather', icon: CloudLightning, color: '#8FA376', dataKey: 'weather_events' },
    ],
  },
  {
    label: 'THREAT',
    fullLabel: 'THREATS & INFRA',
    color: '#B0492F',
    layers: [
      { key: 'infrastructure', label: 'Nuclear Facilities', icon: Radiation, color: '#5F8443', dataKey: 'infrastructure' },
      { key: 'global_incidents', label: 'Global Incidents', icon: AlertTriangle, color: '#B0492F', dataKey: 'gdelt' },
      { key: 'gps_jamming', label: 'GPS Jamming', icon: Radio, color: '#B0492F', dataKey: 'gps_jamming' },
    ],
  },
  {
    label: 'NETWORK',
    fullLabel: 'NETWORK INTEL',
    color: '#B0492F',
    layers: [

      { key: 'malware', label: 'Live Malware', icon: AlertTriangle, color: '#B0492F', dataKey: 'malware_threats' },
    ],
  },
  {
    label: 'DISPLAY',
    fullLabel: 'DISPLAY',
    color: '#C9D8A8',
    layers: [
      { key: 'day_night', label: 'Day / Night Cycle', icon: Sun, color: '#C9D8A8', dataKey: '' },
      { key: 'terrain_3d', label: '3D Terrain & Buildings', icon: Mountain, color: '#5F8443', dataKey: '' },
    ],
  },
  ];
};

// SVG component for Shield which was missing in the imports above
function Shield(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}

function LayerPanel({ data, activeLayers, setActiveLayers, isMobile, theme = 'core', setTheme, onDataEntry, onCollapse }: LayerPanelProps) {
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);

  const LAYER_GROUPS = getLayerGroups(theme);
  const ALL_LAYERS = LAYER_GROUPS.flatMap(g => g.layers);

  const toggle = (key: string) => setActiveLayers((prev: any) => ({ ...prev, [key]: !prev[key] }));
  
  const getCount = (dk: string, catKey?: string): number | null => {
    if (!dk) return null;
    // For satellite sub-layers, use category_counts from the API
    if (catKey && data.category_counts) {
      return data.category_counts[catKey] || 0;
    }
    let total = 0;
    let found = false;
    for (const k of dk.split(',')) {
      if (data[k] && Array.isArray(data[k])) {
        total += data[k].length;
        found = true;
      }
    }
    return found ? total : null;
  };

  if (isMobile) {
    return (
      <div className="flex flex-col gap-4 py-2">
        {LAYER_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-2">
            <div
              className="text-[10px] font-bold font-mono tracking-widest border-b border-white/10 pb-1 text-white"
            >
              {group.fullLabel}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {group.layers.map((layer) => {
                const isLayerActive = activeLayers[layer.key];
                const count = getCount(layer.dataKey, layer.catKey);
                
                return (
                  <button
                    key={layer.key}
                    onClick={() => {
                      if (layer.key === 'sdk_ransomware') {
                        alert('Ransomware Feed - Coming Soon');
                      } else {
                        toggle(layer.key);
                      }
                    }}
                    className={`flex items-center gap-2 px-2 py-2 rounded border transition-colors ${
                      isLayerActive 
                        ? 'bg-white/10 border-white/20' 
                        : 'bg-transparent border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div 
                      className={`w-2 h-2 rounded-full border flex-shrink-0 transition-all ${
                        isLayerActive ? 'bg-current border-current scale-100' : 'bg-transparent border-white/30 scale-75'
                      }`}
                      style={{ color: isLayerActive ? layer.color : 'inherit' }}
                    />
                    <span className={`text-[9px] font-mono uppercase tracking-wider flex-1 text-left ${isLayerActive ? 'text-white' : 'text-white/60'}`}>
                      {layer.label}
                    </span>
                    {count !== null && (
                      <span className="text-[8px] font-mono tabular-nums opacity-60">
                        {count.toLocaleString()}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

      </div>
    );
  }

  return (
    <motion.div 
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute top-0 left-0 h-full w-[80px] border-r border-[rgba(143,163,118,0.25)] flex flex-col pt-28 pb-6 z-[300] pointer-events-auto"
      style={{ background: '#10150D', boxShadow: '4px 0 24px rgba(0,0,0,0.6)' }}
    >
      {onCollapse && (
        <button
          onClick={onCollapse}
          title="Collapse sidebar (L)"
          aria-label="Collapse sidebar"
          className="mx-auto mb-5 w-9 h-9 rounded-lg flex items-center justify-center text-[#8FA376] hover:text-white hover:bg-white/10 transition-colors"
        >
          <PanelLeftClose className="w-[18px] h-[18px]" />
        </button>
      )}

      <div className="flex-1 flex flex-col gap-8 px-2">
        {LAYER_GROUPS.map((group) => {
          const groupActiveCount = group.layers.filter(l => activeLayers[l.key]).length;
          const isActive = groupActiveCount > 0;
          const isHovered = hoveredGroup === group.label;

          return (
            <div 
              key={group.label} 
              className="relative flex justify-center items-center"
              onMouseEnter={() => setHoveredGroup(group.label)}
              onMouseLeave={() => setHoveredGroup(null)}
            >
              {/* The Vertical Label */}
              <div 
                className={`text-[10px] font-mono font-bold cursor-pointer select-none transition-all duration-300 flex items-center justify-center`}
                style={{
                  writingMode: 'horizontal-tb',
                  color: '#FFFFFF',
                  textShadow: 'none',
                  letterSpacing: '0.1em',
                  opacity: isActive ? 1 : (isHovered ? 0.85 : 0.55),
                }}
              >
                {group.label}
              </div>

              {/* Slide-out Menu */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, x: -10, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, x: -5, filter: 'blur(2px)' }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute left-[70px] top-1/2 -translate-y-1/2 min-w-[240px] rounded-xl p-3 z-[80] pointer-events-auto"
                    style={{
                      background: '#294922',
                      border: '1px solid rgba(201,216,168,0.25)',
                      boxShadow: '0 18px 48px rgba(0,0,0,0.6)'
                    }}
                  >
                    <div className="text-[11px] font-bold font-mono mb-3 tracking-widest border-b border-[#C9D8A8]/20 pb-2 text-[#E9E5D6]">
                      {group.fullLabel}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {group.layers.map((layer) => {
                        const isLayerActive = activeLayers[layer.key];
                        const count = getCount(layer.dataKey, layer.catKey);
                        const Icon = layer.icon || Shield;
                        
                        return (
                          <button
                            key={layer.key}
                            onClick={() => {
                              if (layer.key === 'sdk_ransomware') {
                                alert('Ransomware Feed - Coming Soon');
                              } else {
                                toggle(layer.key);
                              }
                            }}
                            className="w-full flex items-center gap-3 px-2 py-1.5 rounded bg-transparent hover:bg-white/10 transition-colors group"
                          >
                            <div
                              className={`w-2.5 h-2.5 rounded-full border flex-shrink-0 transition-all duration-300 ${isLayerActive ? 'bg-current scale-100' : 'bg-transparent border-[#C9D8A8]/40 scale-75'}`}
                              style={{ color: isLayerActive ? layer.color : 'inherit', borderColor: isLayerActive ? 'rgba(201,216,168,0.6)' : undefined }}
                            />
                            <span className={`text-[11px] font-mono uppercase tracking-wider flex-1 text-left transition-colors duration-200 ${isLayerActive ? 'text-white font-semibold' : 'text-[#C9D8A8]/70 group-hover:text-white'}`}>
                              {layer.label}
                            </span>
                            {count !== null && (
                              <span className="text-[9px] font-mono tabular-nums text-[#E9E5D6] opacity-80">
                                {count.toLocaleString()}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* DATA ENTRY — pinned to the bottom of the sidebar */}
      {onDataEntry && (
        <div className="px-2 pt-3 mt-2 border-t border-[rgba(143,163,118,0.2)]">
          <button
            onClick={onDataEntry}
            title="Add Nigeria field intel (N)"
            className="w-full flex flex-col items-center justify-center gap-1 py-2.5 rounded-lg transition-colors"
            style={{ background: '#D29B3B', color: '#0B0E09' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#E0AC4E')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#D29B3B')}
          >
            <Crosshair className="w-4 h-4" />
            <span className="text-[7px] font-mono font-bold tracking-[0.12em] leading-tight text-center">DATA ENTRY</span>
          </button>
        </div>
      )}

    </motion.div>
  );
}

export default memo(LayerPanel);
