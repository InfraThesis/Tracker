// MarketTicker.jsx — live markets via Stooq (indices/commodities), CoinGecko (crypto), exchangerate.host (FX)
const { useState: useStateMT, useEffect: useEffectMT, useRef: useRefMT } = React;

// Stooq symbols. Stooq serves CSV with simple CORS; used by many public finance widgets.
// Format: https://stooq.com/q/l/?s=SYMBOL&f=sd2t2ohlcv&h&e=csv
const STOOQ_INDICES = [
  { code: "KOSPI",    region: "KR",  sym: "^kospi" },
  { code: "KOSDAQ",   region: "KR",  sym: "^kosdaq" },
  { code: "NIKKEI",   region: "JP",  sym: "^nkx" },
  { code: "HSI",      region: "HK",  sym: "^hsi" },
  { code: "SHCOMP",   region: "CN",  sym: "^shc" },
  { code: "S&P 500",  region: "US",  sym: "^spx" },
  { code: "NASDAQ",   region: "US",  sym: "^ndx" },
  { code: "DOW",      region: "US",  sym: "^dji" },
  { code: "STOXX 600",region: "EU",  sym: "^stoxx" },
  { code: "DAX",      region: "DE",  sym: "^dax" },
  { code: "FTSE 100", region: "UK",  sym: "^ftm" },
  { code: "CAC 40",   region: "FR",  sym: "^cac" },
];

const STOOQ_COMMODITIES = [
  { code: "BRENT", region: "OIL", sym: "cb.f",  ccy: "$" },
  { code: "WTI",   region: "OIL", sym: "cl.f",  ccy: "$" },
  { code: "GOLD",  region: "OIL", sym: "gc.f",  ccy: "$" },
];

const FX_PAIRS = [
  { code: "USD/KRW", region: "FX", from: "USD", to: "KRW", ccy: "₩" },
  { code: "USD/JPY", region: "FX", from: "USD", to: "JPY", ccy: "¥" },
  { code: "EUR/USD", region: "FX", from: "EUR", to: "USD", ccy: "$" },
];

const CRYPTO = [
  { code: "BTC", region: "CR", id: "bitcoin",  ccy: "$" },
  { code: "ETH", region: "CR", id: "ethereum", ccy: "$" },
];

// ------- fetchers -------

async function fetchStooqBatch(items) {
  // Stooq supports comma-separated symbols in one request
  const syms = items.map(i => i.sym).join(",");
  const stooqUrl = `https://stooq.com/q/l/?s=${encodeURIComponent(syms)}&f=sd2t2ohlcv&h&e=csv`;
  // Try direct first, then CORS-proxy fallbacks
  const attempts = [
    stooqUrl,
    `https://corsproxy.io/?${encodeURIComponent(stooqUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(stooqUrl)}`,
    `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(stooqUrl)}`,
    `https://proxy.cors.sh/${stooqUrl}`,
  ];
  let text = null, lastErr = null;
  for (const url of attempts) {
    try {
      const res = await fetch(url);
      if (!res.ok) { lastErr = new Error("stooq " + res.status); continue; }
      text = await res.text();
      if (text && text.length > 20) break;
    } catch (e) { lastErr = e; }
  }
  if (!text) throw lastErr || new Error("stooq: all attempts failed");

  const lines = text.trim().split(/\r?\n/);
  const header = lines.shift();
  const cols = header.split(",").map(s => s.toLowerCase());
  const idxSymbol = cols.indexOf("symbol");
  const idxClose  = cols.indexOf("close");
  const idxOpen   = cols.indexOf("open");

  const out = {};
  lines.forEach(line => {
    const parts = line.split(",");
    const sym = (parts[idxSymbol] || "").toLowerCase();
    const close = parseFloat(parts[idxClose]);
    const open = parseFloat(parts[idxOpen]);
    if (!isFinite(close) || close <= 0) return;
    const pct = isFinite(open) && open > 0 ? ((close - open) / open) * 100 : 0;
    out[sym] = { price: close, pct };
  });
  return out;
}

async function fetchFx(pairs) {
  // exchangerate.host returns base-to-many rates. Group by `from`.
  const byFrom = {};
  pairs.forEach(p => { (byFrom[p.from] = byFrom[p.from] || []).push(p); });
  const out = {};
  for (const from of Object.keys(byFrom)) {
    const symbols = byFrom[from].map(p => p.to).join(",");
    const latestUrl = `https://api.exchangerate.host/latest?base=${from}&symbols=${symbols}`;
    const y = new Date(); y.setDate(y.getDate() - 1);
    const yStr = y.toISOString().slice(0, 10);
    const histUrl = `https://api.exchangerate.host/${yStr}?base=${from}&symbols=${symbols}`;
    // fallback: open.er-api.com (no history, so 0 pct)
    const fallbackUrl = `https://open.er-api.com/v6/latest/${from}`;

    let latest = null, hist = null;
    try {
      const r = await fetch(latestUrl);
      if (r.ok) latest = await r.json();
    } catch {}
    if (!latest || !latest.rates) {
      try {
        const r = await fetch(fallbackUrl);
        if (r.ok) {
          const j = await r.json();
          if (j && j.rates) latest = { rates: j.rates };
        }
      } catch {}
    }
    try {
      const r = await fetch(histUrl);
      if (r.ok) hist = await r.json();
    } catch {}

    if (!latest || !latest.rates) continue;
    byFrom[from].forEach(p => {
      const cur = latest.rates?.[p.to];
      const prev = hist?.rates?.[p.to];
      if (!isFinite(cur)) return;
      const pct = isFinite(prev) && prev > 0 ? ((cur - prev) / prev) * 100 : 0;
      out[p.code] = { price: cur, pct };
    });
  }
  return out;
}

async function fetchCrypto(items) {
  const ids = items.map(i => i.id).join(",");
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("coingecko " + res.status);
  const data = await res.json();
  const out = {};
  items.forEach(i => {
    const d = data[i.id];
    if (!d) return;
    out[i.code] = { price: d.usd, pct: d.usd_24h_change || 0 };
  });
  return out;
}

// ------- formatting -------

function fmtPrice(p, code) {
  if (code === "EUR/USD") return p.toFixed(4);
  if (code.startsWith("USD/")) return p.toFixed(2);
  if (p >= 1000) return p.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return p.toFixed(2);
}

// Fallback baselines used when a source is down (so the ticker is never empty)
const FALLBACK = {
  "KOSPI": 2742.18, "KOSDAQ": 885.42, "NIKKEI": 38921.5, "HSI": 19433.6, "SHCOMP": 3184.22,
  "S&P 500": 5742.3, "NASDAQ": 18214.7, "DOW": 42180.9, "STOXX 600": 524.11,
  "DAX": 19821.4, "FTSE 100": 8412.55, "CAC 40": 7642.18,
  "USD/KRW": 1382.4, "USD/JPY": 152.18, "EUR/USD": 1.082,
  "BRENT": 92.4, "WTI": 88.22, "GOLD": 2654.1, "BTC": 67420, "ETH": 3218.5
};

function MarketTicker({ lang }) {
  const [entries, setEntries] = useStateMT(() => {
    // seed with fallback values so something renders before first fetch
    return [
      ...STOOQ_INDICES.map(m => ({ ...m, price: FALLBACK[m.code], pct: 0, stale: true })),
      ...STOOQ_COMMODITIES.map(m => ({ ...m, price: FALLBACK[m.code], pct: 0, stale: true })),
      ...FX_PAIRS.map(m => ({ ...m, price: FALLBACK[m.code], pct: 0, stale: true })),
      ...CRYPTO.map(m => ({ ...m, price: FALLBACK[m.code], pct: 0, stale: true })),
    ];
  });
  const [lastUpdate, setLastUpdate] = useStateMT(null);
  const [status, setStatus] = useStateMT("loading"); // loading | live | partial | error
  const mountedRef = useRefMT(true);

  useEffectMT(() => {
    mountedRef.current = true;
    async function loadAll() {
      const results = {}; // code -> {price, pct}
      let ok = 0, total = 4;
      try {
        const idx = await fetchStooqBatch(STOOQ_INDICES);
        STOOQ_INDICES.forEach(m => {
          const q = idx[m.sym.toLowerCase()];
          if (q) results[m.code] = q;
        });
        ok += 1;
      } catch (e) { console.warn("indices fail", e); }
      try {
        const com = await fetchStooqBatch(STOOQ_COMMODITIES);
        STOOQ_COMMODITIES.forEach(m => {
          const q = com[m.sym.toLowerCase()];
          if (q) results[m.code] = q;
        });
        ok += 1;
      } catch (e) { console.warn("commodities fail", e); }
      try {
        const fx = await fetchFx(FX_PAIRS);
        Object.assign(results, fx);
        ok += 1;
      } catch (e) { console.warn("fx fail", e); }
      try {
        const cr = await fetchCrypto(CRYPTO);
        Object.assign(results, cr);
        ok += 1;
      } catch (e) { console.warn("crypto fail", e); }

      if (!mountedRef.current) return;
      setEntries(prev => prev.map(m => {
        const r = results[m.code];
        if (r) return { ...m, price: r.price, pct: r.pct, stale: false };
        return { ...m, stale: true };
      }));
      setLastUpdate(new Date());
      setStatus(ok === total ? "live" : ok > 0 ? "partial" : "error");
    }
    loadAll();
    const iv = setInterval(loadAll, 60_000);
    return () => { mountedRef.current = false; clearInterval(iv); };
  }, []);

  // Duplicate list to make the CSS loop seamless
  const doubled = [...entries, ...entries];

  const statusColor = status === "live" ? "#34a853" : status === "partial" ? "#fbbc04" : status === "error" ? "#ea4335" : "#9aa0a6";
  const statusLabel = lang === "ko"
    ? ({ loading: "불러오는 중", live: "실시간", partial: "부분 연결", error: "오프라인" }[status])
    : ({ loading: "Loading",      live: "Live",   partial: "Partial",    error: "Offline" }[status]);

  return (
    <div style={{
      height: 34, width: "100%",
      background: "#202124", color: "#e8eaed",
      borderBottom: "1px solid #000",
      overflow: "hidden", position: "relative",
      fontFeatureSettings: '"tnum" 1'
    }}>
      <div style={{
        position: "absolute", left: 0, top: 0, height: "100%",
        display: "flex", alignItems: "center", gap: 8,
        padding: "0 12px",
        background: "linear-gradient(90deg, #202124 70%, rgba(32,33,36,0))",
        zIndex: 2, fontSize: 10, fontWeight: 600, letterSpacing: 1.2, color: "#9aa0a6",
        textTransform: "uppercase", pointerEvents: "none"
      }}>
        <span title={statusLabel} style={{
          width: 6, height: 6, background: statusColor, borderRadius: "50%",
          boxShadow: `0 0 8px ${statusColor}`,
          animation: status === "live" ? "geoPulse2 1.6s ease-in-out infinite" : "none"
        }} />
        {lang === "ko" ? "주요 시장" : "Markets"} · <span style={{ color: statusColor }}>{statusLabel}</span>
      </div>

      <div className="ticker-track" style={{
        position: "absolute", left: 0, top: 0, height: "100%",
        display: "flex", alignItems: "center", whiteSpace: "nowrap",
        paddingLeft: 180,
        animation: "tickerScroll 140s linear infinite",
        willChange: "transform"
      }}>
        {doubled.map((m, i) => {
          const up = m.pct >= 0;
          const color = m.stale ? "#9aa0a6" : (up ? "#34a853" : "#ea4335");
          return (
            <div key={i} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "0 18px", fontSize: 12, lineHeight: 1,
              opacity: m.stale ? 0.55 : 1
            }}>
              <span style={{
                fontSize: 9, color: "#5f6368", letterSpacing: 0.4, fontWeight: 600,
                padding: "2px 4px", border: "1px solid #3c4043", borderRadius: 3
              }}>{m.region}</span>
              <span style={{ color: "#e8eaed", fontWeight: 500 }}>{m.code}</span>
              <span style={{ color: "#bdc1c6", fontVariantNumeric: "tabular-nums" }}>
                {m.ccy || ""}{fmtPrice(m.price, m.code)}
              </span>
              <span style={{
                color, fontVariantNumeric: "tabular-nums", fontWeight: 600,
                display: "inline-flex", alignItems: "center", gap: 2
              }}>
                <span style={{ fontSize: 9 }}>{m.stale ? "·" : (up ? "▲" : "▼")}</span>
                {m.stale ? "—" : `${up ? "+" : ""}${m.pct.toFixed(2)}%`}
              </span>
              <span style={{ color: "#3c4043", margin: "0 2px" }}>·</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.MarketTicker = MarketTicker;
