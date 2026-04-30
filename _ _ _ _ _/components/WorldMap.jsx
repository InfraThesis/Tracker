// WorldMap.jsx — Google Earth-style orthographic globe
// Drag to rotate, wheel to zoom, pins auto-hide when on the back side

const { useEffect, useRef, useState, useMemo } = React;

function WorldMap({ issues, activeIssue, setActiveIssue, mapMood, lang, dateRange, t }) {
  const svgRef = useRef(null);
  const gRef = useRef(null);
  const projectionRef = useRef(null);
  const centroidsRef = useRef({}); // iso -> [lng, lat]
  const [centroidsTick, setCentroidsTick] = useState(0);
  const [world, setWorld] = useState(null);
  const [hover, setHover] = useState(null);
  const [hoverPin, setHoverPin] = useState(null);
  const [dims, setDims] = useState({ w: 900, h: 560 });
  const [rotation, setRotation] = useState([-20, -15, 0]); // start centered on EU/Africa
  const [scale, setScale] = useState(null);
  const [rerenderTick, setRerenderTick] = useState(0);
  const [textureReady, setTextureReady] = useState(false);
  const wrapRef = useRef(null);
  const textureCanvasRef = useRef(null);
  const textureImgRef = useRef(null);
  const globeCanvasRef = useRef(null);

  useEffect(() => {
    let cancel = false;
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then(r => r.json())
      .then(j => { if (!cancel) setWorld(j); })
      .catch(e => console.error("topojson load", e));
    return () => { cancel = true; };
  }, []);

  // Load Blue Marble-style equirectangular Earth texture (NASA public domain via Wikipedia)
  useEffect(() => {
    const srcs = [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Land_ocean_ice_2048.jpg/1024px-Land_ocean_ice_2048.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Blue_Marble_Next_Generation_%2B_topography_%2B_bathymetry.jpg/1024px-Blue_Marble_Next_Generation_%2B_topography_%2B_bathymetry.jpg"
    ];
    let cancel = false;
    (async () => {
      for (const src of srcs) {
        try {
          const img = await new Promise((res, rej) => {
            const im = new Image();
            im.crossOrigin = "anonymous";
            im.onload = () => res(im);
            im.onerror = rej;
            im.src = src;
          });
          if (cancel) return;
          const cnv = document.createElement("canvas");
          cnv.width = img.naturalWidth;
          cnv.height = img.naturalHeight;
          const ctx = cnv.getContext("2d", { willReadFrequently: true });
          ctx.drawImage(img, 0, 0);
          textureImgRef.current = img;
          textureCanvasRef.current = ctx.getImageData(0, 0, cnv.width, cnv.height);
          setTextureReady(true);
          return;
        } catch {}
      }
    })();
    return () => { cancel = true; };
  }, []);

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

  const isoNumToAlpha3 = useMemo(() => ({
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
  }), []);

  const EU_MEMBERS = useMemo(() => new Set([
    "AUT","BEL","BGR","HRV","CYP","CZE","DNK","EST","FIN","FRA","DEU","GRC","HUN","IRL","ITA","LVA","LTU","LUX","MLT","NLD","POL","PRT","ROU","SVK","SVN","ESP","SWE"
  ]), []);

  const countryAgg = useMemo(() => {
    const agg = {};
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
          agg[iso].issues.push(iss);
        });
      });
    });
    Object.values(agg).forEach(a => {
      let best = null, bestV = -1;
      Object.entries(a.byCat).forEach(([k,v]) => { if (v>bestV){bestV=v;best=k;} });
      a.dominant = best;
    });
    return agg;
  }, [issues, dateRange, EU_MEMBERS]);

  // Render globe
  useEffect(() => {
    if (!world || !window.d3 || !window.topojson) return;
    const d3 = window.d3, topojson = window.topojson;
    const g = d3.select(gRef.current);

    const countries = topojson.feature(world, world.objects.countries).features;

    const initScale = Math.min(dims.w, dims.h) * 0.46;
    const useScale = scale ?? initScale;
    if (scale == null) setScale(initScale);

    const projection = d3.geoOrthographic()
      .translate([dims.w / 2, dims.h / 2])
      .scale(useScale)
      .rotate(rotation)
      .clipAngle(90);
    projectionRef.current = projection;
    const path = d3.geoPath(projection);

    // store lng/lat centroids (constant) for pin projection later
    if (!Object.keys(centroidsRef.current).length) {
      const c = {};
      countries.forEach(f => {
        const iso = isoNumToAlpha3[String(f.id).padStart(3,"0")];
        if (!iso) return;
        try { c[iso] = d3.geoCentroid(f); } catch {}
      });
      centroidsRef.current = c;
      setCentroidsTick(x => x + 1);
    }

    // Sphere stroke only (texture canvas handles fill)
    g.selectAll("path.sphere").data([{ type: "Sphere" }])
      .join("path")
      .attr("class", "sphere")
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", "rgba(150,200,240,0.35)")
      .attr("stroke-width", 0.6);

    // Graticule
    const graticule = d3.geoGraticule10();
    g.selectAll("path.grat").data([graticule])
      .join("path")
      .attr("class", "grat")
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", "rgba(255,255,255,0.08)")
      .attr("stroke-width", 0.4);

    // Countries
    const sel = g.selectAll("path.country").data(countries, d => d.id);
    sel.join(
      enter => enter.append("path").attr("class", "country"),
      update => update,
      exit => exit.remove()
    )
      .attr("d", path)
      .attr("fill", d => fillForCountry(d, isoNumToAlpha3, countryAgg))
      .attr("stroke", "rgba(255,255,255,0.22)")
      .attr("stroke-width", 0.35)
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
          issues: a.issues, sevMax: a.sevMax, dominant: a.dominant
        });
      })
      .on("mouseleave", () => setHover(null))
      .on("click", (event, d) => {
        const iso = isoNumToAlpha3[String(d.id).padStart(3,"0")];
        const a = countryAgg[iso];
        if (a && a.issues.length) {
          const top = [...a.issues].sort((x,y) => y.severity - x.severity)[0];
          setActiveIssue(top);
        }
      });

    setRerenderTick(x => x + 1);
  }, [world, dims, countryAgg, lang, isoNumToAlpha3, setActiveIssue, rotation, scale]);

  // Active highlight
  const activeIsos = useMemo(() => {
    if (!activeIssue) return new Set();
    const out = new Set();
    activeIssue.countries.forEach(c => {
      if (c === "EU") EU_MEMBERS.forEach(m => out.add(m));
      else out.add(c);
    });
    return out;
  }, [activeIssue, EU_MEMBERS]);

  useEffect(() => {
    if (!world || !window.d3) return;
    const g = window.d3.select(gRef.current);
    g.selectAll("path.country")
      .attr("stroke", d => {
        const iso = isoNumToAlpha3[String(d.id).padStart(3,"0")];
        return activeIsos.has(iso) ? "#fff" : "rgba(255,255,255,0.25)";
      })
      .attr("stroke-width", d => {
        const iso = isoNumToAlpha3[String(d.id).padStart(3,"0")];
        return activeIsos.has(iso) ? 1.6 : 0.4;
      });
  }, [activeIsos, world, isoNumToAlpha3, rerenderTick]);

  // Drag to rotate
  useEffect(() => {
    if (!svgRef.current || !window.d3) return;
    const d3 = window.d3;
    const svg = d3.select(svgRef.current);
    let start = null, startRot = null;
    const drag = d3.drag()
      .on("start", (event) => {
        start = [event.x, event.y];
        startRot = rotation;
      })
      .on("drag", (event) => {
        if (!start) return;
        const dx = event.x - start[0];
        const dy = event.y - start[1];
        const sensitivity = 180 / (scale ?? 300);
        const lambda = startRot[0] + dx * sensitivity;
        const phi = Math.max(-85, Math.min(85, startRot[1] - dy * sensitivity));
        setRotation([lambda, phi, startRot[2]]);
      });
    svg.call(drag);

    const onWheel = (e) => {
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * 0.001);
      setScale(s => Math.max(Math.min(dims.w, dims.h) * 0.3, Math.min((s ?? 300) * factor, Math.min(dims.w, dims.h) * 3)));
    };
    svgRef.current.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      svg.on(".drag", null);
      if (svgRef.current) svgRef.current.removeEventListener("wheel", onWheel);
    };
  }, [rotation, scale, dims]);

  // Auto-rotate when idle (slow)
  const [autoRotate, setAutoRotate] = useState(false);
  useEffect(() => {
    if (!autoRotate) return;
    let raf, last = performance.now();
    const tick = (now) => {
      const dt = now - last; last = now;
      setRotation(([l, p, g]) => [l + dt * 0.008, p, g]);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [autoRotate]);

  // Paint Earth texture onto globe canvas via inverse orthographic mapping
  useEffect(() => {
    if (!textureReady || !globeCanvasRef.current || scale == null) return;
    const cnv = globeCanvasRef.current;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = dims.w, H = dims.h;
    if (cnv.width !== W * dpr || cnv.height !== H * dpr) {
      cnv.width = W * dpr; cnv.height = H * dpr;
      cnv.style.width = W + "px"; cnv.style.height = H + "px";
    }
    const ctx = cnv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const tex = textureCanvasRef.current;
    if (!tex) return;
    const TW = tex.width, TH = tex.height;
    const tdata = tex.data;

    const cx = W / 2, cy = H / 2;
    const R = scale;
    const R2 = R * R;

    // Rotation matrix (same convention as d3.geoOrthographic with .rotate([lam, phi, 0]))
    const lam0 = -rotation[0] * Math.PI / 180;
    const phi0 = -rotation[1] * Math.PI / 180;
    const cosPhi0 = Math.cos(phi0), sinPhi0 = Math.sin(phi0);
    const cosLam0 = Math.cos(lam0), sinLam0 = Math.sin(lam0);

    // Lighting direction (from upper-left-front) in world space
    const LX = -0.35, LY = -0.4, LZ = 0.85;
    const Llen = Math.sqrt(LX*LX + LY*LY + LZ*LZ);
    const lx = LX/Llen, ly = LY/Llen, lz = LZ/Llen;

    const img = ctx.getImageData(0, 0, W, H);
    const data = img.data;

    // Bounding box around the globe disc (skip pixels far outside)
    const minX = Math.max(0, Math.floor(cx - R - 2));
    const maxX = Math.min(W, Math.ceil(cx + R + 2));
    const minY = Math.max(0, Math.floor(cy - R - 2));
    const maxY = Math.min(H, Math.ceil(cy + R + 2));

    for (let py = minY; py < maxY; py++) {
      const dy = py - cy;
      const dy2 = dy * dy;
      for (let px = minX; px < maxX; px++) {
        const dx = px - cx;
        const d2 = dx*dx + dy2;
        if (d2 > R2) continue;
        // Point on sphere in view space (camera looking down +Z)
        const vz = Math.sqrt(R2 - d2);
        const vx = dx, vy = dy;
        // Normalize
        const nx = vx / R, ny = vy / R, nz = vz / R;

        // Unrotate: invert rotation R_y(phi0) * R_z(lam0)
        // View coords -> world coords
        // First undo phi (rotation about x-axis): [1,0,0; 0,cos,-sin; 0,sin,cos] applied on (cam->world)
        // We rotate BY +phi to undo (d3 applies -phi to take world->cam approximately)
        const y1 = ny * cosPhi0 + nz * sinPhi0;
        const z1 = -ny * sinPhi0 + nz * cosPhi0;
        const x1 = nx;
        // Undo lambda (rotation about z-axis through y-swap): rotate by -lam around y
        const xW = x1 * cosLam0 - z1 * sinLam0;
        const zW = x1 * sinLam0 + z1 * cosLam0;
        const yW = y1;

        // Convert world-space xyz to lon/lat
        const lat = Math.asin(-yW);
        const lon = Math.atan2(xW, zW);

        // Sample equirectangular texture
        let u = (lon + Math.PI) / (2 * Math.PI);
        let v = (Math.PI / 2 - lat) / Math.PI;
        if (u < 0) u += 1; if (u >= 1) u -= 1;
        const tx = Math.floor(u * TW) | 0;
        const ty = Math.floor(v * TH) | 0;
        const ti = (ty * TW + tx) * 4;
        let r = tdata[ti], gc = tdata[ti+1], b = tdata[ti+2];

        // Lambertian shading
        const ndotl = nx*lx + ny*ly + nz*lz;
        const shade = Math.max(0.25, ndotl); // ambient 0.25
        // Ambient rim teal near edge
        const rim = Math.pow(1 - (vz / R), 3); // 0 at center, 1 at limb
        const rimR = 40, rimG = 70, rimB = 110;

        r = r * shade + rimR * rim * 0.5;
        gc = gc * shade + rimG * rim * 0.5;
        b = b * shade + rimB * rim * 0.5;
        if (r > 255) r = 255; if (gc > 255) gc = 255; if (b > 255) b = 255;

        const di = (py * W + px) * 4;
        data[di] = r; data[di+1] = gc; data[di+2] = b; data[di+3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [textureReady, rotation, scale, dims]);

  // Pins
  const pins = useMemo(() => {
    const out = [];
    const seen = new Set();
    const CITIES = window.CITY_META || {};
    const fresh = [...issues].sort((a,b) => b.severity - a.severity || new Date(b.date) - new Date(a.date));
    fresh.forEach(iss => {
      const t = new Date(iss.date).getTime();
      if (t < dateRange[0] || t > dateRange[1]) return;
      // Prefer city-level pins if the issue specifies cities
      if (Array.isArray(iss.cities) && iss.cities.length) {
        iss.cities.forEach(ck => {
          const city = CITIES[ck];
          if (!city) return;
          const key = iss.id + "|city|" + ck;
          if (seen.has(key)) return;
          seen.add(key);
          out.push({ issue: iss, iso: city.country, cityKey: ck, city, lng: city.lng, lat: city.lat });
        });
        return;
      }
      // Fallback to country centroid
      iss.countries.forEach(c => {
        const targets = c === "EU" ? ["DEU"] : [c];
        targets.forEach(iso => {
          const key = iss.id + "|" + iso;
          if (seen.has(key)) return;
          seen.add(key);
          const lnglat = centroidsRef.current[iso];
          if (!lnglat || isNaN(lnglat[0])) return;
          out.push({ issue: iss, iso, lng: lnglat[0], lat: lnglat[1] });
        });
      });
    });
    return out;
  }, [issues, dateRange, centroidsTick]);

  // Project pins with current rotation; filter back-face
  const displayedPins = useMemo(() => {
    const proj = projectionRef.current;
    if (!proj) return [];
    const d3 = window.d3;
    // For back-face detection: dot product of point direction with camera direction
    const lam = -rotation[0] * Math.PI / 180;
    const phi = -rotation[1] * Math.PI / 180;
    const cam = [Math.cos(phi)*Math.cos(lam), Math.cos(phi)*Math.sin(lam), Math.sin(phi)];
    const visible = [];
    pins.forEach(p => {
      const lng = p.lng * Math.PI / 180;
      const lat = p.lat * Math.PI / 180;
      const v = [Math.cos(lat)*Math.cos(lng), Math.cos(lat)*Math.sin(lng), Math.sin(lat)];
      const dot = v[0]*cam[0] + v[1]*cam[1] + v[2]*cam[2];
      if (dot < 0.05) return; // on back
      const xy = proj([p.lng, p.lat]);
      if (!xy) return;
      visible.push({ ...p, sx: xy[0], sy: xy[1], dot });
    });
    // Cluster in screen space
    const cellSize = 36;
    const cells = new Map();
    visible.forEach(p => {
      const cx = Math.floor(p.sx / cellSize);
      const cy = Math.floor(p.sy / cellSize);
      const key = cx + "," + cy;
      const ex = cells.get(key);
      const pp = { ...p, extras: 0 };
      if (!ex) cells.set(key, pp);
      else if (p.issue.severity > ex.issue.severity) {
        pp.extras = ex.extras + 1;
        cells.set(key, pp);
      } else ex.extras += 1;
    });
    return Array.from(cells.values());
  }, [pins, rotation, scale, dims, rerenderTick]);

  function zoomBy(factor) {
    setScale(s => Math.max(Math.min(dims.w, dims.h) * 0.3, Math.min((s ?? 300) * factor, Math.min(dims.w, dims.h) * 3)));
  }
  function resetView() {
    setRotation([-20, -15, 0]);
    setScale(Math.min(dims.w, dims.h) * 0.46);
  }

  const cx = dims.w / 2, cy = dims.h / 2;
  const R = scale ?? 300;

  return (
    <div ref={wrapRef} style={{
      position: "relative", width: "100%", height: "100%",
      background: "radial-gradient(ellipse at 30% 20%, #1a2845 0%, #0a1020 50%, #030510 100%)",
      overflow: "hidden"
    }}>
      {/* Starfield */}
      <StarField w={dims.w} h={dims.h} />

      {/* Earth texture canvas (painted via inverse orthographic mapping) */}
      <canvas ref={globeCanvasRef} style={{
        position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none"
      }} />

      <svg ref={svgRef} width={dims.w} height={dims.h} style={{ display: "block", cursor: "grab", position: "relative", zIndex: 3 }}
           onMouseDown={e => { e.currentTarget.style.cursor = "grabbing"; }}
           onMouseUp={e => { e.currentTarget.style.cursor = "grab"; }}
           onMouseLeave={e => { e.currentTarget.style.cursor = "grab"; }}>
        <defs>
          <radialGradient id="oceanGrad" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#3d6ea5" />
            <stop offset="55%" stopColor="#1f4577" />
            <stop offset="100%" stopColor="#0d2447" />
          </radialGradient>
          <radialGradient id="atmoGlow" cx="50%" cy="50%" r="50%">
            <stop offset="85%" stopColor="rgba(110,170,230,0)" />
            <stop offset="95%" stopColor="rgba(110,170,230,0.35)" />
            <stop offset="100%" stopColor="rgba(110,170,230,0)" />
          </radialGradient>
          <radialGradient id="globeShade" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="75%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
          </radialGradient>
        </defs>
        {/* Atmosphere glow behind the globe */}
        <circle cx={cx} cy={cy} r={R * 1.12} fill="url(#atmoGlow)" />
        <g ref={gRef} />
        {/* Shading overlay on top to give 3D feel */}
        <circle cx={cx} cy={cy} r={R} fill="url(#globeShade)" pointerEvents="none" />
      </svg>

      {/* Zoom + controls */}
      <div style={{
        position: "absolute", right: 12, top: 12,
        display: "flex", flexDirection: "column",
        background: "rgba(20,24,32,0.85)", border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 8, boxShadow: "0 2px 10px rgba(0,0,0,0.4)", overflow: "hidden", zIndex: 4,
        backdropFilter: "blur(8px)"
      }}>
        <button onClick={() => zoomBy(1.4)} style={globeBtnS} title="Zoom in">+</button>
        <div style={{ height: 1, background: "rgba(255,255,255,0.08)" }} />
        <button onClick={() => zoomBy(1/1.4)} style={globeBtnS} title="Zoom out">−</button>
        <div style={{ height: 1, background: "rgba(255,255,255,0.08)" }} />
        <button onClick={resetView} style={{...globeBtnS, fontSize: 12}} title="Reset">⟲</button>
        <div style={{ height: 1, background: "rgba(255,255,255,0.08)" }} />
        <button onClick={() => setAutoRotate(v => !v)} style={{
          ...globeBtnS, fontSize: 12, color: autoRotate ? "#8ab4f8" : "#e8eaed"
        }} title="Auto-rotate">↻</button>
      </div>

      {/* Tooltip */}
      {hover && (
        <div style={{
          position: "absolute",
          left: Math.min(hover.x + 14, dims.w - 260),
          top: Math.min(hover.y + 14, dims.h - 120),
          background: "rgba(20,24,32,0.92)", border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 8, boxShadow: "0 4px 18px rgba(0,0,0,0.5)",
          padding: "10px 12px", fontSize: 12, pointerEvents: "none", zIndex: 5,
          minWidth: 220, maxWidth: 260, color: "#e8eaed", backdropFilter: "blur(8px)"
        }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{hover.name}</div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: (window.CATEGORY_META[hover.dominant] || {}).color, display: "inline-block" }} />
            <span style={{ color: "#9aa0a6" }}>
              {(window.CATEGORY_META[hover.dominant] || {})[lang]} · {t("sev")} {hover.sevMax}
            </span>
          </div>
          <div style={{ color: "#bdc1c6", lineHeight: 1.35 }}>
            {hover.issues.slice(0,2).map(i => <div key={i.id}>• {i[`title_${lang}`]}</div>)}
            {hover.issues.length > 2 && <div style={{ color: "#9aa0a6", marginTop: 2 }}>+ {hover.issues.length - 2} {t("more")}</div>}
          </div>
        </div>
      )}

      {/* Pins overlay */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 3 }}>
        {displayedPins.map(p => {
          const iss = p.issue;
          const cat = window.CATEGORY_META[iss.category] || window.CATEGORY_META.other;
          const sev = iss.severity;
          const isActive = activeIssue && activeIssue.id === iss.id;
          const showPreview = sev >= 5 || isActive || hoverPin === iss.id;
          const pinSize = 10 + sev * 2.5;
          const alpha = Math.min(1, 0.4 + p.dot * 1.2); // fade toward limb
          return (
            <div key={iss.id + "|" + (p.cityKey || p.iso)}
              style={{
                position: "absolute", left: p.sx, top: p.sy,
                transform: "translate(-50%, -100%)",
                pointerEvents: "auto", opacity: alpha,
                zIndex: isActive ? 20 : showPreview ? 10 : 5
              }}
              onMouseEnter={() => setHoverPin(iss.id)}
              onMouseLeave={() => setHoverPin(null)}
              onClick={e => { e.stopPropagation(); setActiveIssue(iss); }}
            >
              {sev >= 4 && (
                <span style={{
                  position: "absolute", left: "50%", bottom: 2,
                  transform: "translate(-50%, 50%)",
                  width: pinSize * 1.6, height: pinSize * 1.6,
                  borderRadius: "50%", background: cat.color,
                  opacity: 0.3, animation: "geoPulse 1.8s ease-out infinite"
                }} />
              )}
              <svg width={pinSize} height={pinSize * 1.35} viewBox="0 0 20 27" style={{
                display: "block", cursor: "pointer",
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))"
              }}>
                <path d="M10 0 C 4 0, 0 4, 0 10 C 0 17, 10 27, 10 27 C 10 27, 20 17, 20 10 C 20 4, 16 0, 10 0 Z"
                      fill={cat.color} stroke="#fff" strokeWidth="1.5" />
                <circle cx="10" cy="10" r="3.2" fill="#fff" />
              </svg>
              {p.city && scale > 380 && !showPreview && (
                <span style={{
                  position: "absolute", left: "calc(100% + 4px)", top: 2,
                  whiteSpace: "nowrap", fontSize: 10, fontWeight: 600,
                  color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.6)",
                  pointerEvents: "none", letterSpacing: 0.2
                }}>{p.city[lang] || p.city.en}</span>
              )}
              {p.extras > 0 && (
                <span style={{
                  position: "absolute", top: -4, right: -8,
                  background: "#202124", color: "#fff", fontSize: 9, fontWeight: 600,
                  borderRadius: 10, padding: "1px 5px", border: "1.5px solid #fff", lineHeight: 1.3
                }}>+{p.extras}</span>
              )}
              {showPreview && (
                <div style={{
                  position: "absolute", left: "50%", bottom: "calc(100% + 6px)",
                  transform: "translateX(-50%)",
                  background: "rgba(20,24,32,0.95)", border: `1px solid ${isActive ? cat.color : "rgba(255,255,255,0.15)"}`,
                  borderRadius: 8, padding: 0, overflow: "hidden",
                  boxShadow: isActive ? `0 4px 16px ${hexToRgba(cat.color, 0.4)}` : "0 4px 14px rgba(0,0,0,0.55)",
                  width: 220, fontSize: 11, color: "#e8eaed", lineHeight: 1.35,
                  pointerEvents: "auto", backdropFilter: "blur(8px)"
                }}>
                  <img src={window.thumbnailFor(iss)} alt="" style={{
                    display: "block", width: "100%", height: 68,
                    objectFit: "cover", background: "#0a0f18"
                  }} />
                  <div style={{ padding: "8px 10px" }}>
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
                    <div style={{ fontSize: 10, color: "#9aa0a6" }}>
                      {window.formatDate ? window.formatDate(iss.date, lang) : iss.date}
                      {p.city && ` · ${p.city[lang] || p.city.en}`}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!world && (
        <div style={{
          position: "absolute", inset: 0, display: "grid", placeItems: "center",
          color: "#9aa0a6", fontSize: 13, zIndex: 10
        }}>{t("loadingMap")}</div>
      )}

      {/* Legend (globe theme) */}
      <div style={{
        position: "absolute", left: 12, bottom: 12,
        background: "rgba(20,24,32,0.85)", border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 8, padding: "8px 10px", fontSize: 11,
        boxShadow: "0 2px 10px rgba(0,0,0,0.4)", color: "#e8eaed", zIndex: 4,
        backdropFilter: "blur(8px)"
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
      </div>
    </div>
  );
}

function StarField({ w, h }) {
  const stars = useMemo(() => {
    // Stable seeded-like stars so they don't reshuffle on render
    const arr = [];
    const rng = mulberry32(42);
    for (let i = 0; i < 160; i++) {
      arr.push({
        x: rng() * 100,
        y: rng() * 100,
        r: 0.4 + rng() * 1.2,
        o: 0.3 + rng() * 0.7,
        tw: rng() > 0.7
      });
    }
    return arr;
  }, []);
  return (
    <svg width={w} height={h} style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }}>
      {stars.map((s, i) => (
        <circle
          key={i} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="#fff" opacity={s.o}
          style={s.tw ? { animation: `twinkle ${2 + (i % 4)}s ease-in-out infinite` } : undefined}
        />
      ))}
    </svg>
  );
}

function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function fillForCountry(feature, isoNumToAlpha3, agg) {
  const iso = isoNumToAlpha3[String(feature.id).padStart(3,"0")];
  const a = agg[iso];
  // Base: transparent so Earth texture shows through
  if (!a || !a.dominant) return "rgba(0,0,0,0)";
  const cat = window.CATEGORY_META[a.dominant] || window.CATEGORY_META.other;
  const sev = a.sevMax;
  const alpha = 0.42 + (sev - 1) * 0.12;
  return hexToRgba(cat.color, alpha);
}

const globeBtnS = {
  width: 32, height: 32, border: "none", background: "transparent",
  color: "#e8eaed", fontSize: 18, fontWeight: 500, cursor: "pointer",
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
