// App.jsx — top-level composition
const { useState: useStateApp, useEffect: useEffectApp, useMemo: useMemoApp } = React;

const TRANSLATIONS = {
  ko: {
    appTitle: "지정학 이슈 트래커",
    search: "제목/국가 검색",
    all: "전체",
    none: "없음",
    collapseSide: "사이드 숨기기",
    expandSide: "사이드 보이기",
    addIssue: "이슈 추가",
    reviewIssue: "이슈 검토",
    resetData: "초기화",
    confirmReset: "모든 사용자 입력 이슈를 삭제하고 초기 데이터로 되돌릴까요?",
    sourceLink: "출처 링크 (선택)",
    pasteText: "본문 / 메모 / 기사 텍스트",
    pastePlaceholder: "기사 본문이나 메모를 붙여넣으세요. 지역·카테고리·심각도는 AI가 자동 분류합니다.",
    date: "날짜",
    parse: "분석하기",
    parsing: "분석 중…",
    parseFailed: "분석 실패",
    pasteEmpty: "링크 또는 텍스트를 입력하세요.",
    reviewBeforeAdd: "자동 분류된 내용을 확인하고 필요하면 수정하세요.",
    titleKo: "제목 (한)", titleEn: "제목 (영)",
    summaryKo: "요약 (한)", summaryEn: "요약 (영)",
    categoryL: "카테고리", sevL: "심각도", countriesISO3: "국가 (ISO3 코드, 쉼표구분)",
    cancel: "취소", back: "뒤로", addToMap: "지도에 추가",
    timeline: "타임라인",
    filterByCategory: "카테고리 필터",
    issuesCount: "건",
    noIssues: "해당 기간/카테고리에 표시할 이슈가 없습니다.",
    legend: "범례",
    severityNote: "진하기 = 심각도",
    sev: "심각도", more: "건 더보기",
    source: "원문",
    delete: "삭제",
    loadingMap: "지도 불러오는 중…",
    tweaks: "Tweaks"
  },
  en: {
    appTitle: "Geopolitical Issue Tracker",
    search: "Search title / country",
    all: "All",
    none: "None",
    collapseSide: "Hide sidebar",
    expandSide: "Show sidebar",
    addIssue: "Add issue",
    reviewIssue: "Review issue",
    resetData: "Reset",
    confirmReset: "Delete all user-added issues and restore seed data?",
    sourceLink: "Source link (optional)",
    pasteText: "Body / note / article text",
    pastePlaceholder: "Paste article text or a note. AI will classify region, category, and severity automatically.",
    date: "Date",
    parse: "Parse",
    parsing: "Parsing…",
    parseFailed: "Parse failed",
    pasteEmpty: "Please provide a link or text.",
    reviewBeforeAdd: "Review the AI-classified result and edit if needed.",
    titleKo: "Title (KO)", titleEn: "Title (EN)",
    summaryKo: "Summary (KO)", summaryEn: "Summary (EN)",
    categoryL: "Category", sevL: "Severity", countriesISO3: "Countries (ISO-3 codes, comma-sep.)",
    cancel: "Cancel", back: "Back", addToMap: "Add to map",
    timeline: "Timeline",
    filterByCategory: "Filter by category",
    issuesCount: "items",
    noIssues: "No issues match the current date range and filters.",
    legend: "Legend",
    severityNote: "Intensity = severity",
    sev: "Severity", more: "more",
    source: "Source",
    delete: "Delete",
    loadingMap: "Loading map…",
    tweaks: "Tweaks"
  }
};

const MOODS = {
  "google-light": {
    name: { ko: "구글 라이트", en: "Google Light" },
    bg: "#e5e3df", ocean: "#aadaff", oceanStroke: "#9ac9f0",
    land: "#f5f5f2", border: "#cfd5dc", graticule: "#ffffff"
  },
  "paper": {
    name: { ko: "종이 지도", en: "Paper Map" },
    bg: "#f2ede2", ocean: "#e4dccc", oceanStroke: "#c9bea7",
    land: "#faf6eb", border: "#c9bea7", graticule: "#d9cfb8"
  },
  "dark": {
    name: { ko: "다크", en: "Dark" },
    bg: "#1f2329", ocean: "#2a3441", oceanStroke: "#3a4755",
    land: "#384252", border: "#4a5566", graticule: "#303a46"
  }
};

const DEFAULT_TWEAKS = /*EDITMODE-BEGIN*/{
  "mapMood": "google-light",
  "defaultLang": "ko"
}/*EDITMODE-END*/;

function App() {
  const [lang, setLang] = useStateApp(() => {
    return localStorage.getItem("geo.lang") || DEFAULT_TWEAKS.defaultLang;
  });
  const [, forceRender] = useStateApp(0);
  useEffectApp(() => {
    if (!window.onThumbnailUpdate) return;
    return window.onThumbnailUpdate(() => forceRender(x => x + 1));
  }, []);
  const [moodKey, setMoodKey] = useStateApp(() => localStorage.getItem("geo.mood") || DEFAULT_TWEAKS.mapMood);
  const [issues, setIssues] = useStateApp(() => {
    try {
      const saved = localStorage.getItem("geo.issues");
      if (saved) return JSON.parse(saved);
    } catch {}
    return window.SEED_ISSUES;
  });
  const [remoteLoaded, setRemoteLoaded] = useStateApp(false);

  // Fetch canonical issues.json on first load (unless user has local edits)
  useEffectApp(() => {
    if (remoteLoaded) return;
    const hasLocal = localStorage.getItem("geo.issues.userEdited") === "1";
    if (hasLocal) { setRemoteLoaded(true); return; }
    fetch("data/issues.json?v=" + Date.now())
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(arr => {
        if (Array.isArray(arr) && arr.length) {
          setIssues(arr);
        }
      })
      .catch(() => {})
      .finally(() => setRemoteLoaded(true));
  }, []);
  const [activeIssue, setActiveIssue] = useStateApp(null);
  const [showPaste, setShowPaste] = useStateApp(false);
  const [editMode, setEditMode] = useStateApp(false);

  const t = (k) => (TRANSLATIONS[lang] && TRANSLATIONS[lang][k]) || k;

  // Persist
  useEffectApp(() => localStorage.setItem("geo.lang", lang), [lang]);
  useEffectApp(() => localStorage.setItem("geo.mood", moodKey), [moodKey]);
  useEffectApp(() => localStorage.setItem("geo.issues", JSON.stringify(issues)), [issues]);

  // Tweak mode wiring
  useEffectApp(() => {
    function onMsg(e) {
      if (!e.data || typeof e.data !== "object") return;
      if (e.data.type === "__activate_edit_mode") setEditMode(true);
      if (e.data.type === "__deactivate_edit_mode") setEditMode(false);
    }
    window.addEventListener("message", onMsg);
    window.parent.postMessage({ type: "__edit_mode_available" }, "*");
    return () => window.removeEventListener("message", onMsg);
  }, []);

  // Date bounds from all issues
  const [minDate, maxDate] = useMemoApp(() => {
    const times = issues.map(i => new Date(i.date).getTime());
    if (!times.length) {
      const now = Date.now();
      return [now - 30*86400000, now];
    }
    const mn = Math.min(...times), mx = Math.max(...times);
    // pad by 1 day each side
    return [mn - 86400000, mx + 86400000];
  }, [issues]);

  const [range, setRange] = useStateApp(() => [0, 0]);
  useEffectApp(() => {
    // reset range when bounds change meaningfully
    setRange(prev => {
      if (prev[0] === 0 && prev[1] === 0) return [minDate, maxDate];
      // clamp
      return [Math.max(minDate, prev[0]), Math.min(maxDate, prev[1])];
    });
  }, [minDate, maxDate]);

  const [filters, setFilters] = useStateApp(() => ({
    categories: new Set(Object.keys(window.CATEGORY_META).filter(k => k !== "other"))
  }));
  const [query, setQuery] = useStateApp("");
  const [sideOpen, setSideOpen] = useStateApp(() => localStorage.getItem("geo.sideOpen") !== "0");
  useEffectApp(() => localStorage.setItem("geo.sideOpen", sideOpen ? "1" : "0"), [sideOpen]);

  // Filtered issues for side panel (also drives map)
  const filteredIssues = useMemoApp(() => {
    const q = query.trim().toLowerCase();
    return issues
      .filter(i => {
        const t = new Date(i.date).getTime();
        return t >= range[0] && t <= range[1];
      })
      .filter(i => filters.categories.has(i.category) || i.category === "other")
      .filter(i => {
        if (!q) return true;
        const hay = [
          i.title_ko, i.title_en, i.summary_ko, i.summary_en,
          ...(i.countries || []).map(c => (window.COUNTRY_META[c]?.ko || "") + " " + (window.COUNTRY_META[c]?.en || "") + " " + c)
        ].join(" ").toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [issues, range, filters, query]);

  function handleAdd(issue) {
    setIssues(prev => [issue, ...prev]);
    setActiveIssue(issue);
    localStorage.setItem("geo.issues.userEdited", "1");
  }
  function handleDelete(id) {
    setIssues(prev => prev.filter(i => i.id !== id));
    setActiveIssue(null);
    localStorage.setItem("geo.issues.userEdited", "1");
  }

  function sendTweakUpdate(edits) {
    window.parent.postMessage({ type: "__edit_mode_set_keys", edits }, "*");
  }

  const mood = MOODS[moodKey] || MOODS["google-light"];

  return (
    <div style={{
      height: "100vh", width: "100vw", display: "grid",
      gridTemplateColumns: sideOpen ? "1fr 380px" : "1fr 0px",
      gridTemplateRows: "34px 56px 1fr auto",
      gridTemplateAreas: `"ticker ticker" "header header" "map side" "timeline side"`,
      background: "#f8f9fa",
      fontFamily: "'Noto Sans KR', 'Helvetica Neue', Helvetica, Arial, sans-serif",
      color: "#202124",
      transition: "grid-template-columns .25s ease"
    }}>
      {/* Ticker */}
      <div style={{ gridArea: "ticker" }}>
        <MarketTicker lang={lang} />
      </div>
      {/* Header */}
      <div style={{
        gridArea: "header", display: "flex", alignItems: "center",
        padding: "0 20px", background: "#fff",
        borderBottom: "1px solid #e8eaed", gap: 16
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LogoMark />
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.2 }}>{t("appTitle")}</div>
        </div>
        <div style={{ flex: 1 }} />

        {/* Search */}
        <div style={{ position: "relative" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
          </svg>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t("search")}
            style={{
              width: 200, padding: "7px 10px 7px 30px",
              border: "1px solid #dadce0", borderRadius: 6,
              fontSize: 13, color: "#202124", outline: "none",
              background: "#f8f9fa"
            }}
            onFocus={e => e.target.style.background = "#fff"}
            onBlur={e => e.target.style.background = "#f8f9fa"}
          />
        </div>
        <button
          onClick={() => setShowPaste(true)}
          style={{
            padding: "7px 14px", border: "none", borderRadius: 6,
            background: "#1a73e8", color: "#fff",
            fontSize: 13, fontWeight: 500, cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 6
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> {t("addIssue")}
        </button>
        <button
          onClick={() => {
            if (confirm(t("confirmReset"))) {
              localStorage.removeItem("geo.issues.userEdited");
              fetch("data/issues.json?v=" + Date.now())
                .then(r => r.json())
                .then(arr => { setIssues(arr); setActiveIssue(null); })
                .catch(() => { setIssues(window.SEED_ISSUES); setActiveIssue(null); });
            }
          }}
          style={{
            padding: "7px 12px", border: "1px solid #dadce0", borderRadius: 6,
            background: "#fff", color: "#3c4043",
            fontSize: 13, cursor: "pointer"
          }}
        >{t("resetData")}</button>

        {/* Toggle sidebar */}
        <button
          onClick={() => setSideOpen(v => !v)}
          title={sideOpen ? t("collapseSide") : t("expandSide")}
          style={{
            padding: "7px 10px", border: "1px solid #dadce0", borderRadius: 6,
            background: "#fff", color: "#3c4043", cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {sideOpen ? <><path d="M9 3v18"/><rect x="3" y="3" width="18" height="18" rx="2"/></> : <><path d="M15 3v18"/><rect x="3" y="3" width="18" height="18" rx="2"/></>}
          </svg>
        </button>

        {/* Lang toggle */}
        <div style={{
          display: "inline-flex", border: "1px solid #dadce0", borderRadius: 6, overflow: "hidden"
        }}>
          {["ko","en"].map(l => (
            <button key={l} onClick={() => setLang(l)} style={{
              padding: "6px 12px", border: "none",
              background: lang === l ? "#e8f0fe" : "#fff",
              color: lang === l ? "#1a73e8" : "#5f6368",
              fontWeight: lang === l ? 600 : 500, fontSize: 12, cursor: "pointer"
            }}>{l.toUpperCase()}</button>
          ))}
        </div>
      </div>

      {/* Map */}
      <div style={{ gridArea: "map", position: "relative", overflow: "hidden" }}>
        <WorldMap
          issues={filteredIssues}
          activeIssue={activeIssue}
          setActiveIssue={setActiveIssue}
          mapMood={mood}
          lang={lang}
          dateRange={range}
          t={t}
        />
      </div>

      {/* Side panel */}
      <div style={{ gridArea: "side", overflow: "hidden", opacity: sideOpen ? 1 : 0, transition: "opacity .2s" }}>
        <SidePanel
          issues={filteredIssues}
          activeIssue={activeIssue}
          setActiveIssue={setActiveIssue}
          lang={lang}
          t={t}
          filters={filters}
          setFilters={setFilters}
          onDeleteIssue={handleDelete}
        />
      </div>

      {/* Timeline */}
      <div style={{ gridArea: "timeline" }}>
        <Timeline
          minDate={minDate}
          maxDate={maxDate}
          range={range}
          setRange={setRange}
          lang={lang}
          t={t}
        />
      </div>

      {/* Paste modal */}
      {showPaste && (
        <PasteModal
          onClose={() => setShowPaste(false)}
          onAdd={handleAdd}
          lang={lang}
          t={t}
        />
      )}

      {/* Tweaks panel */}
      {editMode && (
        <div style={{
          position: "fixed", right: 16, bottom: 16, width: 240,
          background: "#fff", border: "1px solid #dadce0", borderRadius: 10,
          padding: 14, boxShadow: "0 8px 24px rgba(0,0,0,0.14)", zIndex: 90
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{t("tweaks")}</div>
          <div style={{ fontSize: 11, color: "#5f6368", marginBottom: 4 }}>Map mood</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
            {Object.entries(MOODS).map(([k, v]) => (
              <button key={k} onClick={() => { setMoodKey(k); sendTweakUpdate({ mapMood: k }); }} style={{
                textAlign: "left", padding: "6px 10px",
                border: `1px solid ${moodKey === k ? "#1a73e8" : "#dadce0"}`,
                background: moodKey === k ? "#e8f0fe" : "#fff",
                color: moodKey === k ? "#1a73e8" : "#3c4043",
                borderRadius: 6, fontSize: 12, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 8
              }}>
                <span style={{ width: 14, height: 14, borderRadius: 3, background: v.ocean, border: `1px solid ${v.border}` }} />
                {v.name[lang]}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "#5f6368", marginBottom: 4 }}>Default language</div>
          <div style={{ display: "flex", gap: 4 }}>
            {["ko","en"].map(l => (
              <button key={l} onClick={() => sendTweakUpdate({ defaultLang: l })} style={{
                flex: 1, padding: "6px", border: "1px solid #dadce0",
                background: DEFAULT_TWEAKS.defaultLang === l ? "#e8f0fe" : "#fff",
                color: DEFAULT_TWEAKS.defaultLang === l ? "#1a73e8" : "#3c4043",
                borderRadius: 6, fontSize: 12, cursor: "pointer"
              }}>{l.toUpperCase()}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LogoMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden>
      <circle cx="13" cy="13" r="11" fill="#1a73e8" />
      <circle cx="13" cy="13" r="11" fill="none" stroke="#fff" strokeOpacity="0.35" strokeDasharray="2 2" />
      <path d="M13 3 C 8 10, 8 16, 13 23 M3 13 C 10 8, 16 8, 23 13" stroke="#fff" strokeWidth="1.2" fill="none" opacity="0.9" />
      <circle cx="13" cy="13" r="2" fill="#fff" />
    </svg>
  );
}

window.App = App;
