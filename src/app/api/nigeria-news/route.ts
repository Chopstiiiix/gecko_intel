import { NextResponse } from 'next/server';

/**
 * GECKO — Nigeria News Feed
 *
 * Pulls headlines from major Nigerian outlets, geoparses each against a
 * gazetteer of states + major cities, and returns the located items so they
 * can be plotted on the map. Keyless / public RSS only.
 *
 * Uses the platform `fetch` + a tiny regex RSS parser (no `rss-parser`) so it
 * runs on Cloudflare Workers as well as Node.
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Minimal RSS/Atom <item> extractor — good enough for these mainstream feeds.
function stripCdata(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#8217;|&#039;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&#8230;/g, '…')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? stripCdata(m[1]) : '';
}

function parseItems(xml: string): { title: string; link: string; pubDate: string; snippet: string }[] {
  const out: { title: string; link: string; pubDate: string; snippet: string }[] = [];
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) || xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];
  for (const b of blocks) {
    out.push({
      title: tag(b, 'title'),
      link: tag(b, 'link'),
      pubDate: tag(b, 'pubDate') || tag(b, 'published') || tag(b, 'updated'),
      snippet: tag(b, 'description') || tag(b, 'summary'),
    });
  }
  return out;
}

const FEEDS: { url: string; source: string }[] = [
  { url: 'https://www.premiumtimesng.com/feed', source: 'Premium Times' },
  { url: 'https://punchng.com/feed/', source: 'Punch' },
  { url: 'https://www.vanguardngr.com/feed/', source: 'Vanguard' },
  { url: 'https://dailypost.ng/feed/', source: 'Daily Post' },
  { url: 'https://guardian.ng/feed/', source: 'Guardian NG' },
];

// Gazetteer: place name (lowercase) → [lng, lat]. Longest match wins.
const PLACES: Record<string, [number, number]> = {
  abuja: [7.3986, 9.0765], 'fct': [7.3986, 9.0765], lagos: [3.3792, 6.5244], ikeja: [3.3426, 6.6018],
  kano: [8.5919, 12.0022], ibadan: [3.9470, 7.3776], 'port harcourt': [7.0498, 4.8156], kaduna: [7.4383, 10.5167],
  maiduguri: [13.1510, 11.8333], benin: [5.6037, 6.3350], 'benin city': [5.6037, 6.3350], onitsha: [6.7860, 6.1450],
  aba: [7.3667, 5.1167], jos: [8.8920, 9.8965], ilorin: [4.5421, 8.4799], enugu: [7.5100, 6.4413],
  abeokuta: [3.3500, 7.1557], sokoto: [5.2476, 13.0059], katsina: [7.6000, 12.9908], zaria: [7.7000, 11.0667],
  bauchi: [9.8442, 10.3158], gombe: [11.1670, 10.2897], yola: [12.4954, 9.2035], calabar: [8.3250, 4.9757],
  uyo: [7.9333, 5.0500], warri: [5.7500, 5.5167], asaba: [6.7333, 6.2000], owerri: [7.0260, 5.4836],
  akure: [5.1931, 7.2526], 'ado ekiti': [5.2210, 7.6233], oshogbo: [4.5670, 7.7670], osogbo: [4.5670, 7.7670],
  makurdi: [8.5391, 7.7338], lokoja: [6.7333, 7.8023], lafia: [8.5167, 8.4833], minna: [6.5568, 9.6139],
  'birnin kebbi': [4.1994, 12.4539], dutse: [9.3390, 11.7560], damaturu: [11.9610, 11.7480], gusau: [6.6641, 12.1700],
  jalingo: [11.3600, 8.8833], 'birnin gwari': [6.5500, 10.6333], 'borno': [13.1510, 11.8333], zamfara: [6.2206, 12.1221],
  niger: [6.5568, 9.6139], plateau: [8.8920, 9.8965], benue: [8.5391, 7.7338], delta: [5.7500, 5.5167],
  rivers: [7.0498, 4.8156], anambra: [6.7860, 6.1450], imo: [7.0260, 5.4836], ogun: [3.3500, 7.1557],
  ondo: [5.1931, 7.2526], ekiti: [5.2210, 7.6233], osun: [4.5670, 7.7670], oyo: [3.9470, 7.3776],
  kwara: [4.5421, 8.4799], kogi: [6.7333, 7.8023], nasarawa: [8.5167, 8.4833], taraba: [11.3600, 8.8833],
  adamawa: [12.4954, 9.2035], yobe: [11.9610, 11.7480], jigawa: [9.3390, 11.7560], kebbi: [4.1994, 12.4539],
  bayelsa: [6.0699, 4.9267], yenagoa: [6.0699, 4.9267], ebonyi: [8.1137, 6.2649], abakaliki: [8.1137, 6.2649],
  'cross river': [8.3250, 4.9757], edo: [5.6037, 6.3350], 'akwa ibom': [7.9333, 5.0500], abia: [7.3667, 5.1167],
};

const PLACE_KEYS = Object.keys(PLACES).sort((a, b) => b.length - a.length);

function geoparse(text: string): { place: string; lng: number; lat: number } | null {
  const t = ` ${text.toLowerCase()} `;
  for (const key of PLACE_KEYS) {
    if (t.includes(` ${key} `) || t.includes(` ${key},`) || t.includes(` ${key}.`)) {
      const [lng, lat] = PLACES[key];
      return { place: key.replace(/\b\w/g, (c) => c.toUpperCase()), lng, lat };
    }
  }
  return null;
}

async function fetchFeed(url: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Gecko-Intel/1.0; +https://gecko.inspire-edge.net)' },
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function GET() {
  const settled = await Promise.allSettled(
    FEEDS.map(async (f) => {
      const xml = await fetchFeed(f.url);
      if (!xml) return [];
      return parseItems(xml).slice(0, 25).map((it) => ({ ...it, __source: f.source }));
    }),
  );

  const items: any[] = [];
  const seen = new Set<string>();
  for (const r of settled) {
    if (r.status !== 'fulfilled') continue;
    for (const it of r.value) {
      const title = (it.title || '').trim();
      if (!title || seen.has(title)) continue;
      const loc = geoparse(`${title} ${it.snippet || ''}`);
      if (!loc) continue; // only plot items we can place
      seen.add(title);
      // small jitter so co-located headlines don't perfectly overlap
      const jitter = () => (title.length % 7) * 0.012 - 0.04;
      items.push({
        title,
        link: it.link || '',
        source: it.__source,
        pubDate: it.pubDate || '',
        place: loc.place,
        lat: loc.lat + jitter(),
        lng: loc.lng + jitter(),
      });
    }
  }

  return NextResponse.json(
    { count: items.length, items },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
