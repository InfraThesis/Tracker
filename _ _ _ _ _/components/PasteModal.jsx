// PasteModal.jsx — paste text/link, parse via Claude into a structured issue
const { useState: useStatePM } = React;

function PasteModal({ onClose, onAdd, lang, t }) {
  const [text, setText] = useStatePM("");
  const [url, setUrl] = useStatePM("");
  const [date, setDate] = useStatePM(new Date().toISOString().slice(0,10));
  const [loading, setLoading] = useStatePM(false);
  const [preview, setPreview] = useStatePM(null);
  const [error, setError] = useStatePM("");
  const [stage, setStage] = useStatePM("input"); // input | preview

  async function handleParse() {
    if (!text.trim() && !url.trim()) {
      setError(t("pasteEmpty"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const prompt = `You are a geopolitical news classifier. Given the text below, return STRICT JSON (no markdown) with this schema:
{
  "title_ko": string (Korean headline, concise),
  "title_en": string (English headline, concise),
  "summary_ko": string (2-3 sentences, Korean),
  "summary_en": string (2-3 sentences, English),
  "countries": string[] (ISO-3166 alpha-3 codes, e.g. "USA", "CHN"; use "EU" for European Union if relevant),
  "cities": string[] (optional; city keys from this list if relevant: kyiv, kharkiv, odesa, donetsk, moscow, stpetersburg, jerusalem, telaviv, gaza, tehran, beirut, damascus, baghdad, riyadh, istanbul, ankara, beijing, shanghai, hongkong, taipei, kaohsiung, tokyo, osaka, seoul, busan, pyongyang, newdelhi, mumbai, srinagar, islamabad, karachi, dhaka, bangkok, jakarta, manila, hanoi, singapore, london, paris, berlin, brussels, warsaw, rome, madrid, athens, amsterdam, washington, newyork, losangeles, mexicocity, tijuana, brasilia, saopaulo, caracas, georgetown, buenosaires, ottawa, cairo, khartoum, addisababa, nairobi, lagos, capetown, niamey, bamako, canberra, sydney),
  "category": one of "conflict" | "diplomacy" | "economy" | "energy" | "cyber" | "other",
  "severity": integer 1-5 (1=minor, 5=major crisis),
  "source_name": string (short source name if identifiable, else "User input")
}

Text/Link to classify:
${url ? "URL: " + url + "\n" : ""}${text}

Return ONLY the JSON object, no prose.`;
      const resp = await window.claude.complete(prompt);
      // strip code fences if present
      const clean = resp.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
      const parsed = JSON.parse(clean);
      const issue = {
        id: "u_" + Date.now().toString(36),
        date,
        countries: parsed.countries || [],
        cities: Array.isArray(parsed.cities) ? parsed.cities.filter(c => window.CITY_META && window.CITY_META[c]) : [],
        category: parsed.category || "other",
        severity: Math.max(1, Math.min(5, parseInt(parsed.severity) || 3)),
        title_ko: parsed.title_ko || text.slice(0,60),
        title_en: parsed.title_en || text.slice(0,60),
        summary_ko: parsed.summary_ko || text,
        summary_en: parsed.summary_en || text,
        source_url: url || "",
        source_name: parsed.source_name || "User input"
      };
      setPreview(issue);
      setStage("preview");
    } catch (e) {
      console.error(e);
      setError(t("parseFailed") + " (" + e.message + ")");
    } finally {
      setLoading(false);
    }
  }

  function handleConfirm() {
    onAdd(preview);
    onClose();
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(32,33,36,0.5)",
      display: "grid", placeItems: "center", zIndex: 100
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 12, width: 560, maxWidth: "92vw",
          maxHeight: "88vh", overflowY: "auto",
          boxShadow: "0 12px 48px rgba(0,0,0,0.25)"
        }}
      >
        <div style={{
          padding: "16px 20px", borderBottom: "1px solid #e8eaed",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#202124" }}>
            {stage === "input" ? t("addIssue") : t("reviewIssue")}
          </div>
          <button onClick={onClose} style={{
            border: "none", background: "transparent", fontSize: 20,
            cursor: "pointer", color: "#5f6368", lineHeight: 1
          }}>×</button>
        </div>

        {stage === "input" && (
          <div style={{ padding: 20 }}>
            <label style={labelS}>{t("sourceLink")}</label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://..."
              style={inputS}
            />

            <label style={{ ...labelS, marginTop: 14 }}>{t("pasteText")}</label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={t("pastePlaceholder")}
              rows={8}
              style={{ ...inputS, resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }}
            />

            <label style={{ ...labelS, marginTop: 14 }}>{t("date")}</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={inputS}
            />

            {error && <div style={{ color: "#d93025", fontSize: 12, marginTop: 10 }}>{error}</div>}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
              <button onClick={onClose} style={btnSecondary}>{t("cancel")}</button>
              <button
                onClick={handleParse}
                disabled={loading}
                style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }}
              >
                {loading ? t("parsing") : t("parse")}
              </button>
            </div>
          </div>
        )}

        {stage === "preview" && preview && (
          <div style={{ padding: 20 }}>
            <div style={{ fontSize: 12, color: "#5f6368", marginBottom: 6 }}>
              {t("reviewBeforeAdd")}
            </div>
            <PreviewField label={t("titleKo")} value={preview.title_ko} onChange={v => setPreview({...preview, title_ko: v})} />
            <PreviewField label={t("titleEn")} value={preview.title_en} onChange={v => setPreview({...preview, title_en: v})} />
            <PreviewField label={t("summaryKo")} value={preview.summary_ko} onChange={v => setPreview({...preview, summary_ko: v})} textarea />
            <PreviewField label={t("summaryEn")} value={preview.summary_en} onChange={v => setPreview({...preview, summary_en: v})} textarea />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div>
                <label style={labelS}>{t("categoryL")}</label>
                <select value={preview.category} onChange={e => setPreview({...preview, category: e.target.value})} style={inputS}>
                  {Object.entries(window.CATEGORY_META).map(([k,v]) => (
                    <option key={k} value={k}>{v[lang]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelS}>{t("sevL")}</label>
                <select value={preview.severity} onChange={e => setPreview({...preview, severity: parseInt(e.target.value)})} style={inputS}>
                  {[1,2,3,4,5].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={labelS}>{t("date")}</label>
                <input type="date" value={preview.date} onChange={e => setPreview({...preview, date: e.target.value})} style={inputS} />
              </div>
            </div>
            <PreviewField
              label={t("countriesISO3")}
              value={preview.countries.join(", ")}
              onChange={v => setPreview({...preview, countries: v.split(/[,\s]+/).map(s=>s.trim().toUpperCase()).filter(Boolean)})}
            />

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
              <button onClick={() => setStage("input")} style={btnSecondary}>← {t("back")}</button>
              <button onClick={handleConfirm} style={btnPrimary}>{t("addToMap")}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewField({ label, value, onChange, textarea }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={labelS}>{label}</label>
      {textarea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} style={{...inputS, resize:"vertical", fontFamily:"inherit"}} />
      ) : (
        <input value={value} onChange={e => onChange(e.target.value)} style={inputS} />
      )}
    </div>
  );
}

const labelS = { display: "block", fontSize: 11, fontWeight: 600, color: "#5f6368", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 };
const inputS = { width: "100%", padding: "8px 10px", border: "1px solid #dadce0", borderRadius: 6, fontSize: 13, color: "#202124", outline: "none", fontFamily: "inherit", boxSizing: "border-box", background: "#fff" };
const btnPrimary = { padding: "8px 16px", border: "none", borderRadius: 6, background: "#1a73e8", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" };
const btnSecondary = { padding: "8px 16px", border: "1px solid #dadce0", borderRadius: 6, background: "#fff", color: "#3c4043", fontSize: 13, fontWeight: 500, cursor: "pointer" };

window.PasteModal = PasteModal;
