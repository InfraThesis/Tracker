// SidePanel.jsx — list of issues + detail view
const { useState: useStateSP } = React;

function SidePanel({ issues, activeIssue, setActiveIssue, lang, t, filters, setFilters, onDeleteIssue }) {
  const cats = window.CATEGORY_META;

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      background: "#ffffff", borderLeft: "1px solid #e8eaed"
    }}>
      {/* Filter chips */}
      <div style={{
        padding: "14px 16px 10px", borderBottom: "1px solid #e8eaed"
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#202124", letterSpacing: 0.2 }}>
            {t("filterByCategory")}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setFilters({ ...filters, categories: new Set(Object.keys(cats).filter(k => k !== "other")) })}
              style={{ border: "none", background: "transparent", color: "#1a73e8", fontSize: 11, cursor: "pointer", padding: 0 }}
            >{t("all")}</button>
            <span style={{ color: "#dadce0" }}>|</span>
            <button
              onClick={() => setFilters({ ...filters, categories: new Set() })}
              style={{ border: "none", background: "transparent", color: "#5f6368", fontSize: 11, cursor: "pointer", padding: 0 }}
            >{t("none")}</button>
            <span style={{ fontSize: 11, color: "#5f6368", marginLeft: 4 }}>
              {issues.length} {t("issuesCount")}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {Object.entries(cats).filter(([k]) => k !== "other").map(([k, v]) => {
            const on = filters.categories.has(k);
            return (
              <button
                key={k}
                onClick={() => {
                  const next = new Set(filters.categories);
                  if (on) next.delete(k); else next.add(k);
                  setFilters({ ...filters, categories: next });
                }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "5px 10px", borderRadius: 999,
                  border: `1px solid ${on ? v.color : "#dadce0"}`,
                  background: on ? hexA(v.color, 0.1) : "#fff",
                  color: on ? v.color : "#3c4043",
                  fontSize: 12, fontWeight: on ? 600 : 500,
                  cursor: "pointer", transition: "all .15s"
                }}
              >
                <span style={{ width: 7, height: 7, background: v.color, borderRadius: 2 }} />
                {v[lang]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Issue list */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {issues.length === 0 && (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "#5f6368", fontSize: 13 }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#bdc1c6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 10, opacity: 0.8 }}>
              <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>
            </svg>
            <div>{t("noIssues")}</div>
          </div>
        )}
        {issues.map(iss => {
          const cat = cats[iss.category] || cats.other;
          const active = activeIssue && activeIssue.id === iss.id;
          return (
            <div
              key={iss.id}
              onClick={() => setActiveIssue(iss)}
              style={{
                padding: "14px 16px",
                borderBottom: "1px solid #f1f3f4",
                cursor: "pointer",
                background: active ? "#e8f0fe" : "transparent",
                borderLeft: active ? `3px solid ${cat.color}` : "3px solid transparent",
                transition: "background .1s"
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#f8f9fa"; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              <div style={{ display: "flex", gap: 12 }}>
                <img src={window.thumbnailFor(iss)} alt="" width={56} height={56} style={{
                  flexShrink: 0, borderRadius: 6, display: "block",
                  background: "#0a0f18", objectFit: "cover"
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8, marginBottom: 6,
                    fontSize: 11, color: "#5f6368", flexWrap: "wrap"
                  }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "2px 7px", borderRadius: 4, background: hexA(cat.color, 0.12),
                      color: cat.color, fontWeight: 600, fontSize: 11
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cat.color }} />
                      {cat[lang]}
                    </span>
                    <span>·</span>
                    <span>{formatDate(iss.date, lang)}</span>
                    <span>·</span>
                    <SevDots sev={iss.severity} />
                  </div>
                  <div style={{
                    fontSize: 14, fontWeight: 600, color: "#202124",
                    lineHeight: 1.35, marginBottom: 4
                  }}>
                    {iss[`title_${lang}`]}
                  </div>
                  <div style={{ fontSize: 12, color: "#5f6368" }}>
                    {iss.cities && iss.cities.length && window.CITY_META ? (
                      <>
                        {iss.cities.slice(0, 3).map(ck => {
                          const c = window.CITY_META[ck];
                          return c ? (c[lang] || c.en) : ck;
                        }).join(" · ")}
                        {iss.cities.length > 3 && ` +${iss.cities.length - 3}`}
                      </>
                    ) : (
                      <>
                        {iss.countries.slice(0,4).map(c => (window.COUNTRY_META[c]?.[lang]) || c).join(" · ")}
                        {iss.countries.length > 4 && ` +${iss.countries.length - 4}`}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail footer */}
      {activeIssue && (
        <div style={{ maxHeight: "55%", overflowY: "auto", borderTop: "1px solid #e8eaed", background: "#fafbfc" }}>
          <IssueDetail issue={activeIssue} lang={lang} t={t} onDelete={() => onDeleteIssue(activeIssue.id)} onClose={() => setActiveIssue(null)} />
          {window.Comments && <window.Comments issue={activeIssue} lang={lang} />}
        </div>
      )}
    </div>
  );
}

function IssueDetail({ issue, lang, t, onDelete, onClose }) {
  const cat = window.CATEGORY_META[issue.category] || window.CATEGORY_META.other;
  return (
    <div style={{
      background: "#fafbfc", padding: 0
    }}>
      <div style={{ position: "relative", width: "100%", height: 120, background: "#0a0f18" }}>
        <img src={window.thumbnailFor(issue)} alt="" style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", display: "block"
        }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.75) 100%)"
        }} />
        <button onClick={onClose} style={{
          position: "absolute", top: 8, right: 8,
          width: 24, height: 24, borderRadius: "50%",
          border: "none", background: "rgba(0,0,0,0.5)", color: "#fff",
          cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0
        }}>×</button>
        <div style={{
          position: "absolute", left: 14, bottom: 10, right: 14,
          color: "#fff", fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
          textTransform: "uppercase", textShadow: "0 1px 2px rgba(0,0,0,0.6)"
        }}>
          <span style={{ color: cat.color }}>●</span> {cat[lang]} · {t("sev")} {issue.severity}
        </div>
      </div>
      <div style={{ padding: "12px 16px 16px" }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#202124", lineHeight: 1.35 }}>
          {issue[`title_${lang}`]}
        </div>
        <div style={{ fontSize: 12, color: "#5f6368", marginTop: 4 }}>
          {formatDate(issue.date, lang)} · {issue.countries.map(c => (window.COUNTRY_META[c]?.[lang]) || c).join(", ")}
        </div>
        <div style={{ fontSize: 13, color: "#3c4043", marginTop: 10, lineHeight: 1.55 }}>
          {issue[`summary_${lang}`]}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, gap: 8 }}>
          {issue.source_url ? (
            <a href={issue.source_url} target="_blank" rel="noreferrer" style={{
              fontSize: 12, color: "#1a73e8", textDecoration: "none"
            }}>
              {issue.source_name || t("source")} ↗
            </a>
          ) : <span />}
          <button onClick={onDelete} style={{
            border: "1px solid #dadce0", background: "#fff", color: "#5f6368",
            fontSize: 11, padding: "4px 10px", borderRadius: 4, cursor: "pointer"
          }}>{t("delete")}</button>
        </div>
      </div>
    </div>
  );
}

function SevDots({ sev }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{
          width: 5, height: 5, borderRadius: "50%",
          background: i <= sev ? "#d93025" : "#dadce0"
        }} />
      ))}
    </span>
  );
}

function formatDate(iso, lang) {
  const d = new Date(iso);
  if (lang === "ko") return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")}`;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function hexA(hex, a) {
  const h = hex.replace("#","");
  const r = parseInt(h.substring(0,2),16), g = parseInt(h.substring(2,4),16), b = parseInt(h.substring(4,6),16);
  return `rgba(${r},${g},${b},${a})`;
}

window.SidePanel = SidePanel;
window.formatDate = formatDate;
