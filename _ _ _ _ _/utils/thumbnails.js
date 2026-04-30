// thumbnails.js — procedural SVG thumbnails per issue category
// Returns a data: URL so it can be used anywhere a real image URL would be used.

(function(){
  const CAT_GLYPHS = {
    conflict:  { icon: "crosshair", shapes: "burst" },
    diplomacy: { icon: "handshake", shapes: "radial" },
    economy:   { icon: "chart",     shapes: "lines" },
    energy:    { icon: "bolt",      shapes: "rays" },
    cyber:     { icon: "grid",      shapes: "matrix" },
    other:     { icon: "dot",       shapes: "dots" }
  };

  // Seeded pseudo-random so same id produces same thumbnail
  function seededRand(seed) {
    let s = 0;
    for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) | 0;
    return function() {
      s = (s * 1664525 + 1013904223) | 0;
      return ((s >>> 0) % 10000) / 10000;
    };
  }

  function iconSvg(kind, color) {
    switch (kind) {
      case "crosshair":
        return `
          <circle cx="60" cy="60" r="22" fill="none" stroke="${color}" stroke-width="2.5" opacity="0.9"/>
          <circle cx="60" cy="60" r="10" fill="none" stroke="${color}" stroke-width="2" opacity="0.7"/>
          <circle cx="60" cy="60" r="2.5" fill="${color}"/>
          <line x1="60" y1="30" x2="60" y2="44" stroke="${color}" stroke-width="2"/>
          <line x1="60" y1="76" x2="60" y2="90" stroke="${color}" stroke-width="2"/>
          <line x1="30" y1="60" x2="44" y2="60" stroke="${color}" stroke-width="2"/>
          <line x1="76" y1="60" x2="90" y2="60" stroke="${color}" stroke-width="2"/>`;
      case "handshake":
        return `
          <path d="M28 62 L48 48 L60 54 L72 48 L92 62 L82 72 L70 64 L60 70 L50 64 L38 72 Z"
                fill="${color}" opacity="0.85"/>
          <circle cx="60" cy="54" r="4" fill="#fff" opacity="0.9"/>`;
      case "chart":
        return `
          <polyline points="25,75 40,60 52,66 66,42 80,52 95,35"
                    fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
          <circle cx="40" cy="60" r="3.5" fill="${color}"/>
          <circle cx="66" cy="42" r="3.5" fill="${color}"/>
          <circle cx="95" cy="35" r="3.5" fill="${color}"/>
          <line x1="20" y1="85" x2="100" y2="85" stroke="${color}" stroke-width="1" opacity="0.4"/>`;
      case "bolt":
        return `
          <path d="M64 28 L42 64 L58 64 L52 92 L78 54 L62 54 Z"
                fill="${color}" opacity="0.95"/>
          <path d="M64 28 L42 64 L58 64 L52 92 L78 54 L62 54 Z"
                fill="none" stroke="#fff" stroke-width="1.5" opacity="0.6"/>`;
      case "grid":
        return `
          ${[0,1,2,3,4].map(i => [0,1,2,3,4].map(j => {
            const x = 30 + j * 15, y = 30 + i * 15;
            const on = (i + j) % 2 === 0 || (i === 2 && j === 2);
            return `<rect x="${x}" y="${y}" width="10" height="10" rx="1"
                    fill="${on ? color : 'transparent'}" stroke="${color}" stroke-width="1" opacity="${on ? 0.9 : 0.4}"/>`;
          }).join('')).join('')}`;
      case "dot":
      default:
        return `<circle cx="60" cy="60" r="18" fill="${color}" opacity="0.85"/>`;
    }
  }

  function backgroundShapes(kind, color, rand) {
    // Decorative abstract shapes, subtle, behind icon
    const layers = [];
    switch (kind) {
      case "burst":
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + rand() * 0.4;
          const x1 = 60 + Math.cos(a) * 30;
          const y1 = 60 + Math.sin(a) * 30;
          const x2 = 60 + Math.cos(a) * (48 + rand() * 10);
          const y2 = 60 + Math.sin(a) * (48 + rand() * 10);
          layers.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${1 + rand() * 1.5}" opacity="${0.15 + rand() * 0.2}"/>`);
        }
        break;
      case "radial":
        for (let i = 0; i < 4; i++) {
          const r = 22 + i * 10;
          layers.push(`<circle cx="60" cy="60" r="${r}" fill="none" stroke="${color}" stroke-width="1" opacity="${0.15 - i * 0.025}"/>`);
        }
        break;
      case "lines":
        for (let i = 0; i < 6; i++) {
          const y = 20 + i * 14 + rand() * 4;
          layers.push(`<line x1="${10 + rand() * 20}" y1="${y}" x2="${90 + rand() * 20}" y2="${y + rand() * 6}" stroke="${color}" stroke-width="1" opacity="${0.1 + rand() * 0.15}"/>`);
        }
        break;
      case "rays":
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2;
          const r1 = 30 + rand() * 8;
          const r2 = 50 + rand() * 12;
          const x1 = 60 + Math.cos(a) * r1, y1 = 60 + Math.sin(a) * r1;
          const x2 = 60 + Math.cos(a) * r2, y2 = 60 + Math.sin(a) * r2;
          layers.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="2" opacity="${0.15 + rand() * 0.2}"/>`);
        }
        break;
      case "matrix":
        for (let i = 0; i < 20; i++) {
          const x = 15 + rand() * 90;
          const y = 20 + rand() * 80;
          layers.push(`<rect x="${x}" y="${y}" width="2" height="${2 + rand() * 8}" fill="${color}" opacity="${0.15 + rand() * 0.3}"/>`);
        }
        break;
      case "dots":
        for (let i = 0; i < 12; i++) {
          layers.push(`<circle cx="${10 + rand() * 100}" cy="${10 + rand() * 100}" r="${1 + rand() * 2}" fill="${color}" opacity="${0.1 + rand() * 0.3}"/>`);
        }
        break;
    }
    return layers.join('');
  }

  function generateThumbnail(issue) {
    const cat = window.CATEGORY_META[issue.category] || window.CATEGORY_META.other;
    const color = cat.color;
    const { icon, shapes } = CAT_GLYPHS[issue.category] || CAT_GLYPHS.other;
    const rand = seededRand(issue.id + issue.category);

    // Lighten/darken helpers
    function hex2rgb(h){ h=h.replace('#',''); return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]; }
    function mix(a,b,t){ return [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t].map(x=>Math.round(x)); }
    const rgb = hex2rgb(color);
    const light = `rgb(${mix(rgb,[255,255,255],0.25).join(',')})`;
    const dark  = `rgb(${mix(rgb,[20,25,35],0.55).join(',')})`;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
      <defs>
        <linearGradient id="bg_${issue.id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${light}"/>
          <stop offset="100%" stop-color="${dark}"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" fill="url(#bg_${issue.id})"/>
      ${backgroundShapes(shapes, '#ffffff', rand)}
      ${iconSvg(icon, '#ffffff')}
      <rect x="0" y="0" width="120" height="120" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
    </svg>`;
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  }

  // Cache of fetched OG images per source_url (session only)
  const ogCache = {};
  const ogListeners = new Set();

  async function fetchOGImage(url) {
    if (!url) return null;
    if (ogCache[url] !== undefined) return ogCache[url];
    ogCache[url] = null; // in-flight
    try {
      // microlink.io free tier: 50 req/day/IP, no key needed
      const r = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}&meta=false&palette=false`);
      const j = await r.json();
      const img = j?.data?.image?.url || j?.data?.logo?.url || null;
      ogCache[url] = img;
      ogListeners.forEach(fn => fn());
      return img;
    } catch {
      ogCache[url] = null;
      return null;
    }
  }

  function thumbnailFor(issue) {
    if (issue.thumbnail_url) return issue.thumbnail_url;
    // Try OG image from source_url
    if (issue.source_url) {
      const cached = ogCache[issue.source_url];
      if (cached) return cached;
      if (cached === undefined) fetchOGImage(issue.source_url); // kick off, fallback to generated for now
    }
    return generateThumbnail(issue);
  }

  function onThumbnailUpdate(fn) {
    ogListeners.add(fn);
    return () => ogListeners.delete(fn);
  }

  window.thumbnailFor = thumbnailFor;
  window.onThumbnailUpdate = onThumbnailUpdate;
})();
