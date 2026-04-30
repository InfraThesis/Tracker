// Timeline.jsx — date range scrubber (two handles)
const { useState: useStateTL, useRef: useRefTL, useEffect: useEffectTL } = React;

function Timeline({ minDate, maxDate, range, setRange, lang, t }) {
  const trackRef = useRefTL(null);
  const [dragging, setDragging] = useStateTL(null); // 'start' | 'end' | null

  const span = maxDate - minDate;
  const pctStart = ((range[0] - minDate) / span) * 100;
  const pctEnd = ((range[1] - minDate) / span) * 100;

  function onPointerDown(which, e) {
    e.preventDefault();
    setDragging(which);
  }

  useEffectTL(() => {
    if (!dragging) return;
    function onMove(e) {
      const rect = trackRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const t = minDate + pct * span;
      if (dragging === "start") {
        setRange([Math.min(t, range[1] - 86400000), range[1]]);
      } else {
        setRange([range[0], Math.max(t, range[0] + 86400000)]);
      }
    }
    function onUp() { setDragging(null); }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, range, minDate, span, setRange]);

  function fmt(d) {
    const dd = new Date(d);
    if (lang === "ko") return `${dd.getFullYear()}.${String(dd.getMonth()+1).padStart(2,"0")}.${String(dd.getDate()).padStart(2,"0")}`;
    return dd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  // Generate tick marks — one per day or week depending on range
  const days = Math.ceil(span / 86400000);
  const ticks = [];
  const step = days > 60 ? 7 : 1;
  for (let i = 0; i <= days; i += step) {
    ticks.push(i / days * 100);
  }

  return (
    <div style={{
      background: "#ffffff", borderTop: "1px solid #e8eaed",
      padding: "12px 20px 14px"
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#202124", letterSpacing: 0.2 }}>
          {t("timeline")}
        </div>
        <div style={{ fontSize: 12, color: "#5f6368", fontVariantNumeric: "tabular-nums" }}>
          {fmt(range[0])} — {fmt(range[1])}
        </div>
      </div>
      <div
        ref={trackRef}
        style={{
          position: "relative", height: 28, cursor: "crosshair",
          userSelect: "none"
        }}
      >
        {/* Track */}
        <div style={{
          position: "absolute", left: 0, right: 0, top: 13, height: 3,
          background: "#e8eaed", borderRadius: 2
        }} />
        {/* Selected range */}
        <div style={{
          position: "absolute", top: 13, height: 3,
          left: `${pctStart}%`, width: `${pctEnd - pctStart}%`,
          background: "#1a73e8", borderRadius: 2
        }} />
        {/* Ticks */}
        {ticks.map((p, i) => (
          <div key={i} style={{
            position: "absolute", top: 11, left: `${p}%`,
            width: 1, height: 7, background: "#dadce0"
          }} />
        ))}
        {/* Start handle */}
        <Handle pct={pctStart} onDown={e => onPointerDown("start", e)} active={dragging==="start"} />
        {/* End handle */}
        <Handle pct={pctEnd} onDown={e => onPointerDown("end", e)} active={dragging==="end"} />
      </div>
    </div>
  );
}

function Handle({ pct, onDown, active }) {
  return (
    <div
      onMouseDown={onDown}
      style={{
        position: "absolute", top: 7, left: `calc(${pct}% - 8px)`,
        width: 16, height: 16, borderRadius: "50%",
        background: "#ffffff",
        border: `2px solid ${active ? "#174ea6" : "#1a73e8"}`,
        boxShadow: active ? "0 2px 8px rgba(26,115,232,0.4)" : "0 1px 3px rgba(0,0,0,0.15)",
        cursor: "grab",
        transition: "box-shadow .1s, border-color .1s"
      }}
    />
  );
}

window.Timeline = Timeline;
