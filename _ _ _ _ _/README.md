# 지정학 이슈 트래커 — 배포 가이드

정적 사이트로 배포하고 이슈별 덧글까지 붙이는 가장 쉬운 경로입니다.

---

## 1. Netlify Drop 으로 배포 (5분)

1. 프로젝트 폴더 전체를 ZIP으로 받기 (Claude 채팅에서 "프로젝트 전체 다운로드" 또는 수동)
2. https://app.netlify.com/drop 접속
3. 폴더를 드래그 → 자동 업로드 → `xxx.netlify.app` URL 즉시 발급
4. (선택) Site settings → Change site name 에서 `geopolitics-tracker` 같은 원하는 이름으로 변경

이제 URL 로 누구나 접속 가능합니다.

**대안:**
- **Vercel**: https://vercel.com → Add New → Import a folder
- **GitHub Pages**: GitHub에 레포 만들고 Settings → Pages → 배포 브랜치 지정
- **Cloudflare Pages**: https://pages.cloudflare.com

---

## 2. 이슈 업데이트 (C 방식: 본인만 추가)

모든 이슈는 `data/issues.json` 한 파일에 들어있습니다.

### 방법 A — 채팅으로 요청
채팅창에 기사 링크나 텍스트를 붙여넣으시면 제가 `data/issues.json`에 새 이슈를 추가해 드립니다. 그 뒤:
- Netlify: 다시 폴더 드래그 or `netlify deploy` CLI
- GitHub Pages / Vercel / Cloudflare: 커밋·푸시하면 자동 재배포

### 방법 B — 직접 편집
`data/issues.json` 파일에 JSON 객체 하나를 추가합니다:
```json
{
  "id": "unique-id",
  "date": "2026-04-19",
  "countries": ["USA", "CHN"],
  "category": "economy",
  "severity": 3,
  "title_ko": "제목",
  "title_en": "Title",
  "summary_ko": "한 줄 요약",
  "summary_en": "One-line summary",
  "source_url": "https://...",
  "source_name": "Reuters"
}
```

카테고리: `conflict` / `diplomacy` / `economy` / `energy` / `cyber` / `other`
심각도: 1~5

---

## 3. 덧글 활성화 (Giscus)

Giscus는 GitHub Discussions를 덧글 백엔드로 사용합니다. 무료, 스팸 적음, 방문자는 GitHub 로그인 필요.

### 준비
1. **공개(Public) GitHub 레포**에 이 프로젝트를 올립니다
2. 레포 Settings → Features → **Discussions** 체크 ✅
3. https://github.com/apps/giscus 설치 → 해당 레포 선택
4. https://giscus.app 접속 후 폼 입력:
   - Repository: `OWNER/REPO` 입력
   - Mapping: **Specific term in the page `<title>`** 선택 (이미 코드에서 `issue:ID`로 매핑되어 있어 이 설정은 무시되고 코드 우선 사용)
   - Discussion Category: `General` 또는 새로 만든 `Comments` 카테고리
5. 페이지 하단에 생성된 스크립트에서 4개 값 복사:
   - `data-repo` → `repo`
   - `data-repo-id` → `repoId`
   - `data-category` → `category`
   - `data-category-id` → `categoryId`

### 설정
`Geopolitical Tracker.html` 의 `GISCUS_CONFIG` 를 채웁니다:
```html
<script>
  window.GISCUS_CONFIG = {
    repo: "myname/geo-tracker",
    repoId: "R_kgDO...",
    category: "General",
    categoryId: "DIC_kwDO..."
  };
</script>
```

재배포하면 이슈 상세뷰 하단에 덧글창이 뜹니다. 이슈별로 스레드가 자동 분리되고(term = `issue:ID`), 이모지 반응도 지원됩니다.

---

## 4. 로컬에서 테스트

파일 프로토콜로 열면 `fetch("data/issues.json")`이 CORS 때문에 안 됩니다. 간단한 서버로 띄우세요:
```bash
cd <project-folder>
python3 -m http.server 8000
# → http://localhost:8000/Geopolitical%20Tracker.html
```

또는 VS Code Live Server 확장.

---

## 5. 시범 운영 체크리스트
- [ ] Netlify 등에 배포, URL 확보
- [ ] GitHub 레포 공개 + Discussions 켬 + Giscus 앱 설치
- [ ] `GISCUS_CONFIG` 값 4개 채우고 재배포
- [ ] 지인 몇 명에게 URL 공유, 덧글 테스트
- [ ] 이슈는 채팅으로 저에게 요청하거나 `data/issues.json` 직접 편집

문의/추가 기능(실시간 방문자 수, 이슈별 조회수, 공유 카드 등)은 채팅으로 말씀해 주세요.
