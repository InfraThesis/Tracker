// Minimal ISO-3 -> {ko, en, lat, lng} map for countries we care about in seed data
// Used for centroid-based operations (fit, flyto). Full country boundaries come from the TopoJSON.
window.COUNTRY_META = {
  UKR: { ko: "우크라이나", en: "Ukraine" },
  RUS: { ko: "러시아", en: "Russia" },
  ISR: { ko: "이스라엘", en: "Israel" },
  IRN: { ko: "이란", en: "Iran" },
  LBN: { ko: "레바논", en: "Lebanon" },
  CHN: { ko: "중국", en: "China" },
  TWN: { ko: "대만", en: "Taiwan" },
  USA: { ko: "미국", en: "United States" },
  PRK: { ko: "북한", en: "North Korea" },
  KOR: { ko: "한국", en: "South Korea" },
  JPN: { ko: "일본", en: "Japan" },
  DEU: { ko: "독일", en: "Germany" },
  FRA: { ko: "프랑스", en: "France" },
  POL: { ko: "폴란드", en: "Poland" },
  SAU: { ko: "사우디아라비아", en: "Saudi Arabia" },
  SDN: { ko: "수단", en: "Sudan" },
  VEN: { ko: "베네수엘라", en: "Venezuela" },
  GUY: { ko: "가이아나", en: "Guyana" },
  IND: { ko: "인도", en: "India" },
  PAK: { ko: "파키스탄", en: "Pakistan" },
  MEX: { ko: "멕시코", en: "Mexico" },
  AUS: { ko: "호주", en: "Australia" },
  NER: { ko: "니제르", en: "Niger" },
  MLI: { ko: "말리", en: "Mali" },
  TUR: { ko: "터키", en: "Türkiye" },
  GRC: { ko: "그리스", en: "Greece" },
  BRA: { ko: "브라질", en: "Brazil" },
  ARG: { ko: "아르헨티나", en: "Argentina" },
  ETH: { ko: "에티오피아", en: "Ethiopia" },
  EGY: { ko: "이집트", en: "Egypt" },
  GBR: { ko: "영국", en: "United Kingdom" },
  EU:  { ko: "유럽연합", en: "European Union" }
};

// Category palette — Google Maps style: muted, distinct, not too saturated
window.CATEGORY_META = {
  conflict:  { ko: "분쟁",   en: "Conflict",  color: "#d93025" }, // red
  diplomacy: { ko: "외교",   en: "Diplomacy", color: "#1a73e8" }, // blue
  economy:   { ko: "경제",   en: "Economy",   color: "#188038" }, // green
  energy:    { ko: "에너지", en: "Energy",    color: "#e8710a" }, // orange
  cyber:     { ko: "사이버", en: "Cyber",     color: "#8430ce" }, // purple
  other:     { ko: "기타",   en: "Other",     color: "#5f6368" }  // gray
};
