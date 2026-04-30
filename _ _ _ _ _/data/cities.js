// cities.js — major world cities for city-level pin placement
// Each entry: key, name_ko, name_en, country (ISO3), lat, lng, pop (millions, approx)
window.CITY_META = {
  // Ukraine / Russia
  "kyiv":      { ko: "키이우",       en: "Kyiv",          country: "UKR", lat: 50.4501, lng: 30.5234 },
  "kharkiv":   { ko: "하르키우",     en: "Kharkiv",       country: "UKR", lat: 49.9935, lng: 36.2304 },
  "odesa":     { ko: "오데사",       en: "Odesa",         country: "UKR", lat: 46.4825, lng: 30.7233 },
  "donetsk":   { ko: "도네츠크",     en: "Donetsk",       country: "UKR", lat: 48.0159, lng: 37.8028 },
  "moscow":    { ko: "모스크바",     en: "Moscow",        country: "RUS", lat: 55.7558, lng: 37.6173 },
  "stpetersburg": { ko: "상트페테르부르크", en: "St. Petersburg", country: "RUS", lat: 59.9311, lng: 30.3609 },

  // Middle East
  "jerusalem": { ko: "예루살렘",     en: "Jerusalem",     country: "ISR", lat: 31.7683, lng: 35.2137 },
  "telaviv":   { ko: "텔아비브",     en: "Tel Aviv",      country: "ISR", lat: 32.0853, lng: 34.7818 },
  "gaza":      { ko: "가자",         en: "Gaza",          country: "ISR", lat: 31.5018, lng: 34.4669 },
  "tehran":    { ko: "테헤란",       en: "Tehran",        country: "IRN", lat: 35.6892, lng: 51.3890 },
  "beirut":    { ko: "베이루트",     en: "Beirut",        country: "LBN", lat: 33.8938, lng: 35.5018 },
  "damascus":  { ko: "다마스쿠스",   en: "Damascus",      country: "SYR", lat: 33.5138, lng: 36.2765 },
  "baghdad":   { ko: "바그다드",     en: "Baghdad",       country: "IRQ", lat: 33.3152, lng: 44.3661 },
  "riyadh":    { ko: "리야드",       en: "Riyadh",        country: "SAU", lat: 24.7136, lng: 46.6753 },
  "istanbul":  { ko: "이스탄불",     en: "Istanbul",      country: "TUR", lat: 41.0082, lng: 28.9784 },
  "ankara":    { ko: "앙카라",       en: "Ankara",        country: "TUR", lat: 39.9334, lng: 32.8597 },

  // East Asia
  "beijing":   { ko: "베이징",       en: "Beijing",       country: "CHN", lat: 39.9042, lng: 116.4074 },
  "shanghai":  { ko: "상하이",       en: "Shanghai",      country: "CHN", lat: 31.2304, lng: 121.4737 },
  "hongkong":  { ko: "홍콩",         en: "Hong Kong",     country: "CHN", lat: 22.3193, lng: 114.1694 },
  "taipei":    { ko: "타이베이",     en: "Taipei",        country: "TWN", lat: 25.0330, lng: 121.5654 },
  "kaohsiung": { ko: "가오슝",       en: "Kaohsiung",     country: "TWN", lat: 22.6273, lng: 120.3014 },
  "tokyo":     { ko: "도쿄",         en: "Tokyo",         country: "JPN", lat: 35.6762, lng: 139.6503 },
  "osaka":     { ko: "오사카",       en: "Osaka",         country: "JPN", lat: 34.6937, lng: 135.5023 },
  "seoul":     { ko: "서울",         en: "Seoul",         country: "KOR", lat: 37.5665, lng: 126.9780 },
  "busan":     { ko: "부산",         en: "Busan",         country: "KOR", lat: 35.1796, lng: 129.0756 },
  "pyongyang": { ko: "평양",         en: "Pyongyang",     country: "PRK", lat: 39.0392, lng: 125.7625 },

  // South / SE Asia
  "newdelhi":  { ko: "뉴델리",       en: "New Delhi",     country: "IND", lat: 28.6139, lng: 77.2090 },
  "mumbai":    { ko: "뭄바이",       en: "Mumbai",        country: "IND", lat: 19.0760, lng: 72.8777 },
  "srinagar":  { ko: "스리나가르",   en: "Srinagar",      country: "IND", lat: 34.0837, lng: 74.7973 },
  "islamabad": { ko: "이슬라마바드", en: "Islamabad",     country: "PAK", lat: 33.6844, lng: 73.0479 },
  "karachi":   { ko: "카라치",       en: "Karachi",       country: "PAK", lat: 24.8607, lng: 67.0011 },
  "dhaka":     { ko: "다카",         en: "Dhaka",         country: "BGD", lat: 23.8103, lng: 90.4125 },
  "bangkok":   { ko: "방콕",         en: "Bangkok",       country: "THA", lat: 13.7563, lng: 100.5018 },
  "jakarta":   { ko: "자카르타",     en: "Jakarta",       country: "IDN", lat: -6.2088, lng: 106.8456 },
  "manila":    { ko: "마닐라",       en: "Manila",        country: "PHL", lat: 14.5995, lng: 120.9842 },
  "hanoi":     { ko: "하노이",       en: "Hanoi",         country: "VNM", lat: 21.0285, lng: 105.8542 },
  "singapore": { ko: "싱가포르",     en: "Singapore",     country: "SGP", lat: 1.3521,  lng: 103.8198 },

  // Europe
  "london":    { ko: "런던",         en: "London",        country: "GBR", lat: 51.5074, lng: -0.1278 },
  "paris":     { ko: "파리",         en: "Paris",         country: "FRA", lat: 48.8566, lng: 2.3522 },
  "berlin":    { ko: "베를린",       en: "Berlin",        country: "DEU", lat: 52.5200, lng: 13.4050 },
  "brussels":  { ko: "브뤼셀",       en: "Brussels",      country: "BEL", lat: 50.8503, lng: 4.3517 },
  "warsaw":    { ko: "바르샤바",     en: "Warsaw",        country: "POL", lat: 52.2297, lng: 21.0122 },
  "rome":      { ko: "로마",         en: "Rome",          country: "ITA", lat: 41.9028, lng: 12.4964 },
  "madrid":    { ko: "마드리드",     en: "Madrid",        country: "ESP", lat: 40.4168, lng: -3.7038 },
  "athens":    { ko: "아테네",       en: "Athens",        country: "GRC", lat: 37.9838, lng: 23.7275 },
  "amsterdam": { ko: "암스테르담",   en: "Amsterdam",     country: "NLD", lat: 52.3676, lng: 4.9041 },

  // Americas
  "washington":{ ko: "워싱턴",       en: "Washington D.C.", country: "USA", lat: 38.9072, lng: -77.0369 },
  "newyork":   { ko: "뉴욕",         en: "New York",      country: "USA", lat: 40.7128, lng: -74.0060 },
  "losangeles":{ ko: "LA",           en: "Los Angeles",   country: "USA", lat: 34.0522, lng: -118.2437 },
  "mexicocity":{ ko: "멕시코시티",   en: "Mexico City",   country: "MEX", lat: 19.4326, lng: -99.1332 },
  "tijuana":   { ko: "티후아나",     en: "Tijuana",       country: "MEX", lat: 32.5149, lng: -117.0382 },
  "brasilia":  { ko: "브라질리아",   en: "Brasília",      country: "BRA", lat: -15.8267, lng: -47.9218 },
  "saopaulo":  { ko: "상파울루",     en: "São Paulo",     country: "BRA", lat: -23.5505, lng: -46.6333 },
  "caracas":   { ko: "카라카스",     en: "Caracas",       country: "VEN", lat: 10.4806, lng: -66.9036 },
  "georgetown":{ ko: "조지타운",     en: "Georgetown",    country: "GUY", lat: 6.8013,  lng: -58.1551 },
  "buenosaires":{ ko: "부에노스아이레스", en: "Buenos Aires", country: "ARG", lat: -34.6037, lng: -58.3816 },
  "ottawa":    { ko: "오타와",       en: "Ottawa",        country: "CAN", lat: 45.4215, lng: -75.6972 },

  // Africa
  "cairo":     { ko: "카이로",       en: "Cairo",         country: "EGY", lat: 30.0444, lng: 31.2357 },
  "khartoum":  { ko: "하르툼",       en: "Khartoum",      country: "SDN", lat: 15.5007, lng: 32.5599 },
  "addisababa":{ ko: "아디스아바바", en: "Addis Ababa",   country: "ETH", lat: 9.0320,  lng: 38.7469 },
  "nairobi":   { ko: "나이로비",     en: "Nairobi",       country: "KEN", lat: -1.2921, lng: 36.8219 },
  "lagos":     { ko: "라고스",       en: "Lagos",         country: "NGA", lat: 6.5244,  lng: 3.3792 },
  "capetown":  { ko: "케이프타운",   en: "Cape Town",     country: "ZAF", lat: -33.9249, lng: 18.4241 },
  "niamey":    { ko: "니아메",       en: "Niamey",        country: "NER", lat: 13.5127, lng: 2.1126 },
  "bamako":    { ko: "바마코",       en: "Bamako",        country: "MLI", lat: 12.6392, lng: -8.0029 },

  // Oceania
  "canberra":  { ko: "캔버라",       en: "Canberra",      country: "AUS", lat: -35.2809, lng: 149.1300 },
  "sydney":    { ko: "시드니",       en: "Sydney",        country: "AUS", lat: -33.8688, lng: 151.2093 },
};
