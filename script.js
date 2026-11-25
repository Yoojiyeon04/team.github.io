/**
 * 한라대학교 - 날씨 & 명언 스크립트
 * 원주, 서울, 제주 실시간 날씨 (온도, 상태, 습도, 풍속) + 오늘의 명언
 */

// 1. 도시 좌표 및 ID 정보 (원주 -> 서울 -> 제주 순서)
const CITIES = {
  wonju: {
    name: "원주",
    lat: 37.3422,
    lon: 127.9202,
    tempId: "wonju-temp",
    descId: "wonju-desc",
    humidityId: "wonju-humidity",
    windId: "wonju-wind",
    iconId: "wonju-icon",
    fallback: { temp: 0, desc: "맑음", humidity: 57, wind: 6.9, code: 0 }
  },
  seoul: {
    name: "서울",
    lat: 37.5665,
    lon: 126.9780,
    tempId: "seoul-temp",
    descId: "seoul-desc",
    humidityId: "seoul-humidity",
    windId: "seoul-wind",
    iconId: "seoul-icon",
    fallback: { temp: 1, desc: "맑음", humidity: 48, wind: 3.9, code: 0 }
  },
  jeju: {
    name: "제주",
    lat: 33.4996,
    lon: 126.5312,
    tempId: "jeju-temp",
    descId: "jeju-desc",
    humidityId: "jeju-humidity",
    windId: "jeju-wind",
    iconId: "jeju-icon",
    fallback: { temp: 10, desc: "구름 조금", humidity: 63, wind: 12.2, code: 2 }
  }
};

// 2. 날씨 SVG 아이콘 및 상태 매핑 (스크린샷과 일치하는 미니멀 일러스트)
function getWeatherVisual(code) {
  const icons = {
    // 맑음 (노란 태양과 원형 광선)
    sunny: `<svg class="weather-svg" viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="13" fill="#f59e0b" />
      <g stroke="#f59e0b" stroke-width="2.8" stroke-linecap="round">
        <line x1="32" y1="8" x2="32" y2="13" />
        <line x1="32" y1="51" x2="32" y2="56" />
        <line x1="8" y1="32" x2="13" y2="32" />
        <line x1="51" y1="32" x2="56" y2="32" />
        <line x1="15" y1="15" x2="18.5" y2="18.5" />
        <line x1="45.5" y1="45.5" x2="49" y2="49" />
        <line x1="15" y1="49" x2="18.5" y2="45.5" />
        <line x1="45.5" y1="18.5" x2="49" y2="15" />
      </g>
    </svg>`,

    // 구름 조금 (구름 뒤 태양)
    partlyCloudy: `<svg class="weather-svg" viewBox="0 0 64 64">
      <circle cx="26" cy="25" r="10" fill="#f59e0b" />
      <path d="M46 44H22a9 9 0 0 1-1.2-17.9 12.5 12.5 0 0 1 23.7-3.4A9 9 0 0 1 46 44z" fill="#93c5fd" opacity="0.3" />
      <path d="M44 45H23a8.5 8.5 0 0 1-1.1-16.9 11.5 11.5 0 0 1 21.8-3.2A8.5 8.5 0 0 1 44 45z" fill="#3b82f6" fill-opacity="0.15" stroke="#3b82f6" stroke-width="2.2" stroke-linejoin="round" />
    </svg>`,

    // 흐림 (구름)
    cloudy: `<svg class="weather-svg" viewBox="0 0 64 64">
      <path d="M46 42H20a10 10 0 0 1-1.3-19.9 14 14 0 0 1 26.6-3.8A10 10 0 0 1 46 42z" fill="#94a3b8" />
    </svg>`,

    // 비
    rain: `<svg class="weather-svg" viewBox="0 0 64 64">
      <path d="M46 36H20a10 10 0 0 1-1.3-19.9 14 14 0 0 1 26.6-3.8A10 10 0 0 1 46 36z" fill="#64748b" />
      <line x1="22" y1="43" x2="18" y2="52" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" />
      <line x1="32" y1="43" x2="28" y2="52" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" />
      <line x1="42" y1="43" x2="38" y2="52" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" />
    </svg>`,

    // 눈
    snow: `<svg class="weather-svg" viewBox="0 0 64 64">
      <path d="M46 36H20a10 10 0 0 1-1.3-19.9 14 14 0 0 1 26.6-3.8A10 10 0 0 1 46 36z" fill="#94a3b8" />
      <circle cx="21" cy="46" r="2" fill="#38bdf8" />
      <circle cx="32" cy="48" r="2" fill="#38bdf8" />
      <circle cx="43" cy="46" r="2" fill="#38bdf8" />
    </svg>`,

    // 뇌우
    thunder: `<svg class="weather-svg" viewBox="0 0 64 64">
      <path d="M46 34H20a10 10 0 0 1-1.3-19.9 14 14 0 0 1 26.6-3.8A10 10 0 0 1 46 34z" fill="#475569" />
      <polygon points="31 36 24 47 31 47 27 58 39 44 32 44" fill="#f59e0b" />
    </svg>`
  };

  switch (code) {
    case 0:
      return { desc: "맑음", icon: icons.sunny };
    case 1:
      return { desc: "대체로 맑음", icon: icons.sunny };
    case 2:
      return { desc: "구름 조금", icon: icons.partlyCloudy };
    case 3:
      return { desc: "흐림", icon: icons.cloudy };
    case 45:
    case 48:
      return { desc: "안개", icon: icons.cloudy };
    case 51:
    case 53:
    case 55:
    case 61:
    case 63:
    case 65:
    case 80:
    case 81:
    case 82:
      return { desc: "비", icon: icons.rain };
    case 71:
    case 73:
    case 75:
    case 85:
    case 86:
      return { desc: "눈", icon: icons.snow };
    case 95:
    case 96:
    case 99:
      return { desc: "뇌우", icon: icons.thunder };
    default:
      return { desc: "맑음", icon: icons.sunny };
  }
}

// 3. 날씨 API 호출 (Open-Meteo: 온도, 습도, 풍속 m/s)
async function fetchCityWeather(cityKey) {
  const city = CITIES[cityKey];
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&wind_speed_unit=ms&timezone=Asia%2FTokyo`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("API 응답 실패");
    const data = await res.json();

    const temp = Math.round(data.current.temperature_2m);
    const humidity = data.current.relative_humidity_2m;
    const windSpeed = Number(data.current.wind_speed_10m).toFixed(1);
    const code = data.current.weather_code;
    const visual = getWeatherVisual(code);

    updateCardUI(city, temp, visual.desc, visual.icon, humidity, windSpeed);
  } catch (err) {
    console.warn(`[${city.name}] 날씨 API 로드 실패, 대체 데이터를 사용합니다:`, err);
    const fb = city.fallback;
    const visual = getWeatherVisual(fb.code);
    updateCardUI(city, fb.temp, fb.desc, visual.icon, fb.humidity, fb.wind);
  }
}

function updateCardUI(city, temp, desc, iconSvg, humidity, wind) {
  const tempEl = document.getElementById(city.tempId);
  const descEl = document.getElementById(city.descId);
  const humidityEl = document.getElementById(city.humidityId);
  const windEl = document.getElementById(city.windId);
  const iconEl = document.getElementById(city.iconId);

  if (tempEl) tempEl.textContent = `${temp}°C`;
  if (descEl) descEl.textContent = desc;
  if (humidityEl) humidityEl.textContent = `습도: ${humidity}%`;
  if (windEl) windEl.textContent = `풍속: ${wind} m/s`;
  if (iconEl) iconEl.innerHTML = iconSvg;
}

async function loadAllWeather() {
  const refreshBtn = document.getElementById("refresh-icon");
  if (refreshBtn) refreshBtn.classList.add("rotating");

  const tasks = Object.keys(CITIES).map(key => fetchCityWeather(key));
  await Promise.allSettled(tasks);

  setTimeout(() => {
    if (refreshBtn) refreshBtn.classList.remove("rotating");
  }, 400);
}

// ==========================================================================
// 4. 명언 데이터베이스 & 동작 로직
// ==========================================================================
const QUOTES = [
  { text: "우리가 두려워해야 할 유일한 것은 두려움 그 자체다.", author: "프랭클린 D. 루스벨트" },
  { text: "당신이 할 수 있다고 믿든 할 수 없다고 믿든, 믿는 대로 될 것이다.", author: "헨리 포드" },
  { text: "위대한 일을 하는 유일한 방법은 당신이 하는 일을 사랑하는 것이다.", author: "스티브 잡스" },
  { text: "시작하는 방법은 그만 말하고 행동하는 것이다.", author: "월트 디즈니" },
  { text: "성공이란 열정을 잃지 않고 실패를 거듭할 수 있는 능력이다.", author: "윈스턴 처칠" },
  { text: "인생은 속도가 아니라 방향이다.", author: "괴테" },
  { text: "단순함이 궁극의 정교함이다.", author: "레오나르도 다 빈치" },
  { text: "산을 움직이려 하는 이는 작은 돌을 들어내는 일부터 시작한다.", author: "공자" },
  { text: "미래를 예측하는 가장 좋은 방법은 미래를 직접 창조하는 것이다.", author: "피터 드러커" },
  { text: "오늘 할 수 있는 일을 내일로 미루지 마라.", author: "벤자민 프랭클린" }
];

let quoteIdx = 0;

function displayQuote(index) {
  const textEl = document.getElementById("quote-text");
  const authorEl = document.getElementById("quote-author");

  if (!textEl || !authorEl) return;

  textEl.classList.add("quote-fading");
  authorEl.classList.add("quote-fading");

  setTimeout(() => {
    const q = QUOTES[index];
    textEl.textContent = `“${q.text}”`;
    authorEl.textContent = `— ${q.author}`;
    textEl.classList.remove("quote-fading");
    authorEl.classList.remove("quote-fading");
  }, 200);
}

function nextQuote() {
  const btnIcon = document.getElementById("quote-btn-icon");
  if (btnIcon) btnIcon.classList.add("rotating");

  quoteIdx = (quoteIdx + 1) % QUOTES.length;
  displayQuote(quoteIdx);

  setTimeout(() => {
    if (btnIcon) btnIcon.classList.remove("rotating");
  }, 350);
}

// ==========================================================================
// 5. 초기 실행
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  // 스크린샷과 동일하게 첫 번째 명언 설정
  displayQuote(0);

  // 이벤트 리스너 등록
  const nextBtn = document.getElementById("next-quote-btn");
  if (nextBtn) nextBtn.addEventListener("click", nextQuote);

  const refreshBtn = document.getElementById("refresh-weather-btn");
  if (refreshBtn) refreshBtn.addEventListener("click", loadAllWeather);

  // 날씨 데이터 로드
  loadAllWeather();
});
