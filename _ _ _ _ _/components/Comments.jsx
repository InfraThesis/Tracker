// Comments.jsx — Giscus comments embedded per issue
// Requires GISCUS_CONFIG to be set on window (see index.html). If not configured,
// renders a friendly placeholder so the app still works locally.

const { useEffect: useEffectC, useRef: useRefC } = React;

function Comments({ issue, lang }) {
  const ref = useRefC(null);

  useEffectC(() => {
    if (!ref.current) return;
    const cfg = window.GISCUS_CONFIG;
    // Clear prior iframe (when switching issues)
    ref.current.innerHTML = "";

    if (!cfg || !cfg.repo || cfg.repo.includes("OWNER/")) return; // not configured

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.crossOrigin = "anonymous";
    script.async = true;
    script.setAttribute("data-repo", cfg.repo);
    script.setAttribute("data-repo-id", cfg.repoId);
    script.setAttribute("data-category", cfg.category || "General");
    script.setAttribute("data-category-id", cfg.categoryId);
    script.setAttribute("data-mapping", "specific");
    script.setAttribute("data-term", "issue:" + issue.id);
    script.setAttribute("data-strict", "1");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "bottom");
    script.setAttribute("data-theme", "light");
    script.setAttribute("data-lang", lang === "ko" ? "ko" : "en");
    script.setAttribute("data-loading", "lazy");
    ref.current.appendChild(script);
  }, [issue && issue.id, lang]);

  if (!issue) return null;
  const cfg = window.GISCUS_CONFIG;
  const notConfigured = !cfg || !cfg.repo || cfg.repo.includes("OWNER/");

  return (
    <div style={{
      padding: "14px 16px 18px", borderTop: "1px solid #e8eaed", background: "#fff"
    }}>
      <div style={{
        fontSize: 12, fontWeight: 600, color: "#202124",
        letterSpacing: 0.2, marginBottom: 10,
        display: "flex", alignItems: "center", gap: 6
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        {lang === "ko" ? "덧글" : "Comments"}
      </div>
      {notConfigured ? (
        <div style={{
          fontSize: 12, color: "#5f6368", lineHeight: 1.5,
          background: "#f8f9fa", border: "1px dashed #dadce0", borderRadius: 6,
          padding: "10px 12px"
        }}>
          {lang === "ko"
            ? "덧글 기능을 활성화하려면 배포 후 Giscus 설정(index.html 의 GISCUS_CONFIG)을 채워주세요. 자세한 방법은 README.md 참고."
            : "To enable comments, fill in GISCUS_CONFIG in the HTML file after deploying. See README.md."}
        </div>
      ) : (
        <div ref={ref} />
      )}
    </div>
  );
}

window.Comments = Comments;
