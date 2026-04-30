// WorldMap.jsx — D3-rendered Equal Earth projection with country heatmap
// Expects window.topojson, window.d3, and TopoJSON at /assets/world-110m.json (loaded from CDN)

const { useEffect, useRef, useState, useMemo } = React;

function WorldMap({ issues, activeIssue, setActiveIssue, mapMood, lang, dateRange, t }) {
  const svgRef = useRef(null);
  const gRef = useRef(null);
  const zoomRef = useRef(null);
  const projectionRef = useRef(null);
  const centroidsRef = useRef({});
  const [centroidsTick, setCentroidsTick] = useState(0);
  const [world, setWorld] = useState(null);
  const [hover, setHover] = useState(null); // country hover (hex)
  const [hoverPin, setHoverPin] = useState(null); // hovered pin id
  const [dims, setDims] = useState({ w: 900, h: 560 });
  const [zoomK, setZoomK] = useState(1);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const wrapRef = useRef(null);

  // Load TopoJSON once
  useEffect(() => {
    let cancel = false;
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then(r => r.json())
      .then(j => { if (!cancel) setWorld(j); })
      .catch(e => console.error("topojson load", e));
    return () => { cancel = true; };
  }, []);

  // Observe container size
  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        const { width, height } = e.contentRect;
        setDims({ w: Math.max(400, width), h: Math.max(300, height) });
      }
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  // Build ISO numeric -> ISO alpha3 lookup (world-atlas uses numeric ids)
  const isoNumToAlpha3 = useMemo(() => {
    // Small lookup for the countries we actually care about — plus a fallback via the topo properties.name
    return {
      "004":"AFG","008":"ALB","012":"DZA","024":"AGO","031":"AZE","032":"ARG","036":"AUS","040":"AUT","050":"BGD","056":"BEL",
      "068":"BOL","070":"BIH","076":"BRA","100":"BGR","104":"MMR","108":"BDI","112":"BLR","116":"KHM","120":"CMR","124":"CAN",
      "140":"CAF","144":"LKA","148":"TCD","152":"CHL","156":"CHN","158":"TWN","170":"COL","178":"COG","180":"COD","188":"CRI",
      "191":"HRV","192":"CUB","196":"CYP","203":"CZE","208":"DNK","214":"DOM","218":"ECU","222":"SLV","226":"GNQ","231":"ETH",
      "232":"ERI","233":"EST","242":"FJI","246":"FIN","250":"FRA","266":"GAB","268":"GEO","270":"GMB","275":"PSE","276":"DEU",
      "288":"GHA","300":"GRC","320":"GTM","324":"GIN","328":"GUY","332":"HTI","340":"HND","348":"HUN","352":"ISL","356":"IND",
      "360":"IDN","364":"IRN","368":"IRQ","372":"IRL","376":"ISR","380":"ITA","384":"CIV","388":"JAM","392":"JPN","398":"KAZ",
      "400":"JOR","404":"KEN","408":"PRK","410":"KOR","414":"KWT","417":"KGZ","418":"LAO","422":"LBN","426":"LSO","428":"LVA",
      "430":"LBR","434":"LBY","440":"LTU","442":"LUX","450":"MDG","454":"MWI","458":"MYS","466":"MLI","478":"MRT","484":"MEX",
      "496":"MNG","498":"MDA","499":"MNE","504":"MAR","508":"MOZ","512":"OMN","516":"NAM","524":"NPL","528":"NLD","540":"NCL",
      "548":"VUT","554":"NZL","558":"NIC","562":"NER","566":"NGA","578":"NOR","586":"PAK","591":"PAN","598":"PNG","600":"PRY",
      "604":"PER","608":"PHL","616":"POL","620":"PRT","624":"GNB","626":"TLS","630":"PRI","634":"QAT","642":"ROU","643":"RUS",
      "646":"RWA","682":"SAU","686":"SEN","688":"SRB","694":"SLE","702":"SGP","703":"SVK","704":"VNM","705":"SVN","706":"SOM",
      "710":"ZAF","716":"ZWE","724":"ESP","728":"SSD","729":"SDN","740":"SUR","748":"SWZ","752":"SWE","756":"CHE","760":"SYR",
      "762":"TJK","764":"THA","768":"TGO","780":"TTO","784":"ARE","788":"TUN","792":"TUR","795":"TKM","800":"UGA","804":"UKR",
      "807":"MKD","818":"EGY","826":"GBR","834":"TZA","840":"USA","854":"BFA","858":"URY","860":"UZB","862":"VEN","887":"YEM",
      "894":"ZMB"
    };
  }, []);

  // EU members for the special "EU" pseudo-country
  const EU_MEMBERS = useMemo(() => new Set([
    "AUT","BEL","BGR","HRV","CYP","CZE","DNK","EST","FIN","FRA","DEU","GRC","HUN","IRL","ITA","LVA","LTU","LUX","MLT","NLD","POL","PRT","ROU","SVK","SVN","ESP","SWE"
  ]), []);

  // Per-country aggregates: max severity and dominant category within date range
  const countryAgg = useMemo(() => {
    const agg = {}; // iso -> { sevMax, sevSum, byCat:{}, issues:[] }
    issues.forEach(iss => {
      const t = new Date(iss.date).getTime();
      if (t < dateRange[0] || t > dateRange[1]) return;
      iss.countries.forEach(code => {
        const targets = code === "EU" ? [...EU_MEMBERS] : [code];
        targets.forEach(iso => {
          if (!agg[iso]) agg[iso] = { sevMax: 0, sevSum: 0, byCat: {}, issues: [] };
          agg[iso].sevMax = Math.max(agg[iso].sevMax, iss.severity);
          agg[iso].sevSum += iss.severity;
          agg[iso].byCat[iss.category] = (agg[iso].byCat[iss.category] || 0) + iss.severity;
          agg[iss.id] = true; // prevent dupes — not needed but harmless
          agg[iso].issues.push(iss);
        });
      });
    });
    // pick dominant category per country
    Object.values(agg).forEach(a => {
      if (!a || !a.byCat) return;
      let best = null, bestV = -1;
      Object.entries(a.byCat).forEach(([k,v]) => { if (v>bestV){bestV=v;best=k;} });
      a.dominant = best;
    });
    return agg;
  }, [issues, dateRange, EU_MEMBERS]);

  // Render map
  useEffect(() => {
    if (!world || !window.d3 || !window.topojson) return;
    const d3 = window.d3, topojson = window.topojson;
    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);
    svg.selectAll("defs.mapdefs").remove();

    // Setup d3-zoom for pan + zoom (Google-Maps-style)
    if (!zoomRef.current) {
      const zoom = d3.zoom()
        .scaleExtent([1, 12])
        .on("zoom", (event) => {
          g.attr("transform", event.transform);
          setZoomK(event.transform.k);
          setTransform({ x: event.transform.x, y: event.transform.y, k: event.transform.k });
          // Counter-scale strokes so borders stay crisp when zoomed in
          g.selectAll("path.country").attr("stroke-width", d => {
            const iso = isoNumToAlpha3[String(d.id).padStart(3,"0")];
            const base = activeIsosRef.current.has(iso) ? 1.4 : 0.5;
            return base / event.transform.k;
          });
          g.selectAll("path.grat").attr("stroke-width", 0.4 / event.transform.k);
          g.selectAll("path.sphere").attr("stroke-width", 0.5 / event.transform.k);
        });
      svg.call(zoom).on("dblclick.zoom", null);
      // Double-click to zoom in at point
      svg.on("dblclick", (event) => {
        const [mx, my] = d3.pointer(event, svg.node());
        svg.transition().duration(350).call(
          zoom.scaleBy, 1.8,
          [mx, my]
        );
      });
      zoomRef.current = zoom;
    }

    const countries = topojson.feature(world, world.objects.countries).features;

    const projection = d3.geoEqualEarth()
      .fitExtent([[8, 8], [dims.w - 8, dims.h - 8]], { type: "Sphere" });
    const path = d3.geoPath(projection);
    projectionRef.current = projection;

    // build centroid lookup for pins
    const centroidsByIso = {};
    countries.forEach(f => {
      const iso = isoNumToAlpha3[String(f.id).padStart(3,"0")];
      if (!iso) return;
      try { centroidsByIso[iso] = path.centroid(f); } catch {}
    });
    centroidsRef.current = centroidsByIso;
    setCentroidsTick(x => x + 1);

    // Sphere background (ocean)
    g.selectAll("path.sphere").data([{ type: "Sphere" }])
      .join("path")
      .attr("class", "sphere")
      .attr("d", path)
      .attr("fill", mapMood.ocean)
      .attr("stroke", mapMood.oceanStroke)
      .attr("stroke-width", 0.5);

    // Graticule
    const graticule = d3.geoGraticule10();
    g.selectAll("path.grat").data([graticule])
      .join("path")
      .attr("class", "grat")
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", mapMood.graticule)
      .attr("stroke-width", 0.4)
      .attr("opacity", 0.5);

    // Countries
    const sel = g.selectAll("path.country").data(countries, d => d.id);
    sel.join(
      enter => enter.append("path").attr("class", "country"),
      update => update,
      exit => exit.remove()
    )
      .attr("d", path)
      .attr("fill", d => fillForCountry(d, isoNumToAlpha3, countryAgg, mapMood))
      .attr("stroke", mapMood.border)
      .attr("stroke-width", 0.5)
      .style("cursor", d => {
        const iso = isoNumToAlpha3[String(d.id).padStart(3,"0")];
        return countryAgg[iso] ? "pointer" : "default";
      })
      .on("mousemove", (event, d) => {
        const iso = isoNumToAlpha3[String(d.id).padStart(3,"0")];
        const a = countryAgg[iso];
        if (!a) { setHover(null); return; }
        const rect = svgRef.current.getBoundingClientRect();
        setHover({
          iso,
          name: (window.COUNTRY_META[iso]?.[lang]) || d.properties?.name || iso,
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          issues: a.issues,
          sevMax: a.sevMax,
          dominant: a.dominant
        });
      })
      .on("mouseleave", () => setHover(null))
      .on("click", (event, d) => {
        const iso = isoNumToAlpha3[String(d.id).padStart(3,"0")];
        const a = countryAgg[iso];
        if (a && a.issues.length) {
          // Pick highest-severity issue for this country
          const top = [...a.issues].sort((x,y) => y.severity - x.severity)[0];
          setActiveIssue(top);
        }
      });

  }, [world, dims, countryAgg, mapMood, lang, isoNumToAlpha3, setActiveIssue]);

  // Overlay: highlight active issue's countries
  const activeIsos = useMemo(() => {
    if (!activeIssue) return new Set();
    const out = new Set();
    activeIssue.countries.forEach(c => {
      if (c === "EU") EU_MEMBERS.forEach(m => out.add(m));
      else out.add(c);
    });
    return out;
  }, [activeIssue, EU_MEMBERS]);

  const activeIsosRef = useRef(activeIsos);
  useEffect(() => { activeIsosRef.current = activeIsos; }, [activeIsos]);

  // Active outline effect
  useEffect(() => {
    if (!world) return;
    const g = d3.select(gRef.current);
    g.selectAll("path.country")
      .attr("stroke", d => {
        const iso = isoNumToAlpha3[String(d.id).padStart(3,"0")];
        return activeIsos.has(iso) ? "#111" : mapMood.border;
      })
      .attr("stroke-width", d => {
        const iso = isoNumToAlpha3[String(d.id).padStart(3,"0")];
        const base = activeIsos.has(iso) ? 1.4 : 0.5;
        return base / zoomK;
      });
  }, [activeIsos, world, mapMood, isoNumToAlpha3, zoomK]);

  // Compute pin positions from centroids + issues
  const pins = useMemo(() => {
    const out = [];
    const seen = new Set();
    const fresh = [...issues].sort((a,b) => b.severity - a.severity || new Date(b.date) - new Date(a.date));
    fresh.forEach(iss => {
      const inRange = (() => {
        const t = new Date(iss.date).getTime();
        return t >= dateRange[0] && t <= dateRange[1];
      })();
      if (!inRange) return;
      iss.countries.forEach(c => {
        const targets = c === "EU" ? ["DEU"] : [c]; // single pin for EU at Germany centroid
        targets.forEach(iso => {
          const key = iss.id + "|" + iso;
          if (seen.has(key)) return;
          seen.add(key);
          const cen = centroidsRef.current[iso];
          if (!cen || isNaN(cen[0])) return;
          out.push({ issue: iss, iso, baseX: cen[0], baseY: cen[1] });
        });
      });
    });
    return out;
  }, [issues, dateRange, centroidsTick]);

  // Cluster by proximity to avoid overlap — show highest-severity pin per cluster cell
  const displayedPins = useMemo(() => {
    // In screen space at current zoom
    const cellSize = 36; // px
    const cells = new Map();
    pins.forEach(p => {
      const sx = p.baseX * transform.k + transform.x;
      const sy = p.baseY * transform.k + transform.y;
      const cx = Math.floor(sx / cellSize);
      const cy = Math.floor(sy / cellSize);
      const key = cx + "," + cy;
      const existing = cells.get(key);
      const pp = { ...p, sx, sy, extras: 0 };
      if (!existing) {
        cells.set(key, pp);
      } else {
        // keep higher severity; tally extras
        if (p.issue.severity > existing.issue.severity) {
          pp.extras = existing.extras + 1;
          cells.set(key, pp);
        } else {
          existing.extras += 1;
        }
      }
    });
    return Array.from(cells.values());
  }, [pins, transform]);

  function zoomBy(factor) {
    const d3 = window.d3;
    if (!zoomRef.current || !svgRef.current) return;
    d3.select(svgRef.current).transition().duration(250).call(zoomRef.current.scaleBy, factor);
  }
  function zoomReset() {
    const d3 = window.d3;
    if (!zoomRef.current || !svgRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.transform, d3.zoomIdentity);
  }

  // Tooltip
  const tip = hover && (
    <div
      style={{
        position: "absolute",
        left: Math.min(hover.x + 14, dims.w - 260),
        top: Math.min(hover.y + 14, dims.h - 120),
        background: "#ffffff",
        border: "1px solid #dadce0",
        borderRadius: 8,
        boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
        padding: "10px 12px",
        fontSize: 12,
        pointerEvents: "none",
        zIndex: 5,
        minWidth: 220,
        maxWidth: 260,
        color: "#202124"
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{hover.name}</div>
      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
        <span style={{
          display: "inline-block", width: 8, height: 8, borderRadius: 2,
          background: (window.CATEGORY_META[hover.dominant] || {}).color
        }} />
        <span style={{ color: "#5f6368" }}>
          {(window.CATEGORY_META[hover.dominant] || {})[lang]} · {t("sev")} {hover.sevMax}
        </span>
      </div>
      <div style={{ color: "#3c4043", lineHeight: 1.35 }}>
        {hover.issues.slice(0,2).map(i => (
          <div key={i.id} style={{ marginBottom: 2 }}>• {i[`title_${lang}`]}</div>
        ))}
        {hover.issues.length > 2 && (
          <div style={{ color: "#5f6368", marginTop: 2 }}>+ {hover.issues.length - 2} {t("more")}</div>
        )}
      </div>
    </div>
  );

  return (
    <div ref={wrapRef} style={{ position: "relative", width: "100%", height: "100%", background: mapMood.bg, overflow: "hidden" }}>
      <svg ref={svgRef} width={dims.w} height={dims.h} style={{ display: "block", cursor: "grab" }}
           onMouseDown={e => { e.currentTarget.style.cursor = "grabbing"; }}
           onMouseUp={e => { e.currentTarget.style.cursor = "grab"; }}
           onMouseLeave={e => { e.currentTarget.style.cursor = "grab"; }}>
        <g ref={gRef} />
      </svg>

      {/* Zoom controls (Google-Maps-style) */}
      <div style={{
        position: "absolute", right: 12, top: 12,
        display: "flex", flexDirection: "column",
        background: "#fff", border: "1px solid #dadce0", borderRadius: 8,
        boxShadow: "0 1px 4px rgba(0,0,0,0.12)", overflow: "hidden", zIndex: 4
      }}>
        <button onClick={() => zoomBy(1.6)} style={zoomBtnS} title="Zoom in">+</button>
        <div style={{ height: 1, background: "#e8eaed" }} />
        <button onClick={() => zoomBy(1/1.6)} style={zoomBtnS} title="Zoom out">−</button>
        <div style={{ height: 1, background: "#e8eaed" }} />
        <button onClick={zoomReset} style={{...zoomBtnS, fontSize: 11}} title="Reset">⟲</button>
      </div>
      {!world && (
        <div style={{
          position: "absolute", inset: 0, display: "grid", placeItems: "center",
          color: "#5f6368", fontSize: 13
        }}>{t("loadingMap")}</div>
      )}
      {tip}

      {/* Pin overlay — absolute-positioned HTML pins on top of SVG */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {displayedPins.map(p => {
          const iss = p.issue;
          const cat = window.CATEGORY_META[iss.category] || window.CATEGORY_META.other;
          const sev = iss.severity;
          const isActive = activeIssue && activeIssue.id === iss.id;
          const showPreview = sev >= 4 || isActive || hoverPin === iss.id;
          const pinSize = 10 + sev * 2.5; // 12.5 .. 22.5
          return (
            <div
              key={iss.id + "|" + p.iso}
              style={{
                position: "absolute",
                left: p.sx, top: p.sy,
                transform: "translate(-50%, -100%)",
                pointerEvents: "auto",
                zIndex: isActive ? 20 : (showPreview ? 10 : 5)
              }}
              onMouseEnter={() => setHoverPin(iss.id)}
              onMouseLeave={() => setHoverPin(null)}
              onClick={(e) => { e.stopPropagation(); setActiveIssue(iss); }}
            >
              {/* Pulse halo for high-severity */}
              {sev >= 4 && (
                <span style={{
                  position: "absolute", left: "50%", bottom: 2,
                  transform: "translate(-50%, 50%)",
                  width: pinSize * 1.6, height: pinSize * 1.6,
                  borderRadius: "50%", background: cat.color,
                  opacity: 0.22, animation: "geoPulse 1.8s ease-out infinite"
                }} />
              )}
              {/* Teardrop pin */}
              <svg width={pinSize} height={pinSize * 1.35} viewBox="0 0 20 27" style={{
                display: "block", cursor: "pointer",
                filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.3))"
              }}>
                <path d="M10 0 C 4 0, 0 4, 0 10 C 0 17, 10 27, 10 27 C 10 27, 20 17, 20 10 C 20 4, 16 0, 10 0 Z"
                      fill={cat.color} stroke="#fff" strokeWidth="1.5" />
                <circle cx="10" cy="10" r="3.2" fill="#fff" />
              </svg>
              {p.extras > 0 && (
                <span style={{
                  position: "absolute", top: -4, right: -8,
                  background: "#202124", color: "#fff", fontSize: 9, fontWeight: 600,
                  borderRadius: 10, padding: "1px 5px", border: "1.5px solid #fff",
                  lineHeight: 1.3
                }}>+{p.extras}</span>
              )}
              {/* Preview card (auto for high severity, else on hover) */}
              {showPreview && (
                <div style={{
                  position: "absolute", left: "50%", bottom: `calc(100% + 6px)`,
                  transform: "translateX(-50%)",
                  background: "#fff", border: `1px solid ${isActive ? cat.color : "#dadce0"}`,
                  borderRadius: 8, padding: "8px 10px",
                  boxShadow: isActive
                    ? `0 4px 16px ${hexToRgba(cat.color, 0.3)}`
                    : "0 2px 10px rgba(0,0,0,0.12)",
                  width: 220, fontSize: 11, color: "#202124",
                  lineHeight: 1.35, pointerEvents: "auto"
                }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 5, marginBottom: 4,
                    fontSize: 10, color: cat.color, fontWeight: 600,
                    textTransform: "uppercase", letterSpacing: 0.4
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: cat.color }} />
                    {cat[lang]} · {t("sev")} {sev}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 12, lineHeight: 1.3, marginBottom: 3 }}>
                    {iss[`title_${lang}`]}
                  </div>
                  <div style={{ fontSize: 10, color: "#5f6368" }}>
                    {window.formatDate ? window.formatDate(iss.date, lang) : iss.date}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{
        position: "absolute", left: 12, bottom: 12, background: "rgba(255,255,255,0.95)",
        border: "1px solid #dadce0", borderRadius: 8, padding: "8px 10px", fontSize: 11,
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)", color: "#202124"
      }}>
        <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 11, letterSpacing: 0.3 }}>{t("legend")}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {Object.entries(window.CATEGORY_META).filter(([k]) => k !== "other").map(([k, v]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 10, height: 10, background: v.color, borderRadius: 2, display: "inline-block" }} />
              <span>{v[lang]}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 10, color: "#5f6368" }}>{t("severityNote")}</div>
        <div style={{ display: "flex", gap: 2, marginTop: 4 }}>
          {[1,2,3,4,5].map(s => (
            <div key={s} style={{
              width: 14, height: 8, background: `rgba(217,48,37,${0.18 + s*0.16})`, borderRadius: 1
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function fillForCountry(feature, isoNumToAlpha3, agg, mood) {
  const iso = isoNumToAlpha3[String(feature.id).padStart(3,"0")];
  const a = agg[iso];
  if (!a || !a.dominant) return mood.land;
  const cat = window.CATEGORY_META[a.dominant] || window.CATEGORY_META.other;
  const sev = a.sevMax; // 1..5
  // mix base color with white/land based on severity
  const alpha = 0.22 + (sev - 1) * 0.16; // 0.22..0.86
  return hexToRgba(cat.color, alpha);
}

const zoomBtnS = {
  width: 32, height: 32, border: "none", background: "#fff",
  color: "#3c4043", fontSize: 18, fontWeight: 500, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  lineHeight: 1, padding: 0
};

function hexToRgba(hex, a) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0,2), 16);
  const g = parseInt(h.substring(2,4), 16);
  const b = parseInt(h.substring(4,6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

window.WorldMap = WorldMap;
