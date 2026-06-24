<div align="center">

# 🦎 GECKO

### Nigeria Intelligence & Situational-Awareness Platform

**A real-time intelligence dashboard for Nigeria — map security incidents, critical infrastructure, security checkpoints, road corridors and live geoparsed news across all 36 states + the FCT, with a built-in data-entry console to plot fresh field intel live.**

Built on a GPU-accelerated MapLibre map (Next.js 16 + TypeScript). Forked from and powered by the open-source [Osiris](https://github.com/simplifaisoul/osiris) OSINT engine.

</div>

---

## Overview

Gecko is a focused, self-hosted situational-awareness platform for Nigeria. It keeps the powerful Osiris map/feed engine (aviation, maritime, seismic, weather, sanctions, RECON toolkit, etc. all remain available as toggleable global layers) but re-centres the experience on Nigeria and adds a first-class **operator data pipeline** so you can input and curate your own verified intelligence.

The map opens on Nigeria and ships with Nigeria-specific layers turned on by default.

### Nigeria Intel Layers

| Layer | What it shows | Source |
|-------|---------------|--------|
| **Security Incidents** | Banditry, kidnapping, terrorism, communal clashes, protests, IED/piracy — severity-coded | Operator-entered (Data Entry console) |
| **Infrastructure / Assets** | Airports, seaports, refineries, power stations, bridges, telecom, gov/military sites | Seed (public facts) + operator-entered |
| **Security Checkpoints** | Military / police / customs / JTF / vigilante checkpoints | Operator-entered |
| **Roads / Corridors** | Major highways & corridors with open / caution / restricted / closed status | Seed + operator-entered |
| **Nigeria News Feed** | Headlines from Premium Times, Punch, Vanguard, Daily Post, Guardian NG — geoparsed onto the map | Public RSS (keyless) |

> The shipped incidents & checkpoints are clearly-labelled **SAMPLE / SEED** records so the map renders out of the box. Replace them with real, sourced intelligence via the Data Entry console and delete the samples.

---

## Data Entry Console

Click **DATA ENTRY** (top-right) or press **`N`** to open the operator console. From there you can:

- Plot **incidents**, **infrastructure**, **checkpoints** and **roads**
- Set category, Nigerian state, severity, description, source, source URL and date
- **Grab coordinates from the live map cursor** — hover the map, then click *Grab map cursor* (for roads, add multiple points to trace a corridor)
- See every record currently on the map, click to fly to it, or delete it

Submissions are validated server-side and persisted to a simple JSON store, then the layer refreshes so your point appears immediately.

### Where the data lives

All operator data is stored as plain JSON under `gecko-data/`:

```
gecko-data/
  incidents.json
  infrastructure.json
  checkpoints.json
  roads.json          # GeoJSON LineString features
```

Override the location with `GECKO_DATA_DIR`. This file-backed store is ideal for a single operator running Gecko locally or on a VPS. For multi-user / serverless deployments, swap the read/write helpers in `src/lib/nigeria-store.ts` for Supabase or Postgres — the record shapes are the rendering contract.

### API

```
GET    /api/nigeria/incidents          → { kind, count, items: [...] }
GET    /api/nigeria/roads              → { kind, count, items: FeatureCollection.features }
POST   /api/nigeria/<kind>             → add a record   (incidents|infrastructure|checkpoints|roads)
DELETE /api/nigeria/<kind>?id=...      → remove a record
GET    /api/nigeria-news               → geoparsed Nigerian headlines
```

`<kind>` is one of `incidents | infrastructure | checkpoints | roads`.

Example — add an incident from the command line:

```bash
curl -X POST http://localhost:3000/api/nigeria/incidents \
  -H 'Content-Type: application/json' \
  -d '{"label":"Kidnapping on A2","category":"kidnapping","lat":10.31,"lng":7.42,
       "severity":"high","state":"Kaduna","source":"field report","date":"2026-06-24"}'
```

---

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The map opens on Nigeria with the intel layers live.

### Region presets

The view presets (left panel) jump to Nigeria, the FCT, Lagos, Kano, Port Harcourt, Borno and each geopolitical zone (North-East/West/Central, South-West/East/South).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Map Engine | MapLibre GL JS (WebGL) |
| Animations | Framer Motion |
| Icons | Lucide React |
| Store | File-backed JSON (`gecko-data/`) — swappable for Supabase/Postgres |

---

## Credits & License

Gecko is a Nigeria-focused fork of **[Osiris](https://github.com/simplifaisoul/osiris)** by [simplifaisoul](https://github.com/simplifaisoul). The underlying global OSINT engine, map and feed integrations are their work, used under the MIT License. All Nigeria-specific layers, the data-entry pipeline and rebranding are Gecko additions.

MIT — see [LICENSE](LICENSE).
