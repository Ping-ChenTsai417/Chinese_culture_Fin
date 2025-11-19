// app.js 

let currentLang = "zh"; // zh | en | fi
let currentData = null;

// 多語星期
const WEEKDAY_LABELS = {
  zh: ["週日","週一","週二","週三","週四","週五","週六"],
  en: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
  fi: ["Sunnuntai","Maanantai","Tiistai","Keskiviikko","Torstai","Perjantai","Lauantai"]
};

// 多語月份
const MONTH_LABELS = {
  zh: ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"],
  en: ["January","February","March","April","May","June","July","August","September","October","November","December"],
  fi: ["Tammikuu","Helmikuu","Maaliskuu","Huhtikuu","Toukokuu","Kesäkuu","Heinäkuu","Elokuu","Syyskuu","Lokakuu","Marraskuu","Joulukuu"]
};

// 多語宜忌標題
const YIJI_LABELS = {
  zh: { yi: "宜", ji: "忌" },
  en: { yi: "Do", ji: "Avoid" },
  fi: { yi: "Tee", ji: "Vältä" }
};

// 多語農曆標籤
const LUNAR_LABELS = {
  zh: { prefix: "", solarTerm: "節氣：" },
  en: { prefix: "Lunar: ", solarTerm: "Solar Term: " },
  fi: { prefix: "Lunar: ", solarTerm: "Kausi: " }  // 保持一致即可
};

//生肖英文/芬蘭語映射
const ZODIAC_MAP = {
  "鼠": { zh: "鼠", en: "Rat", fi: "Rotta" },
  "牛": { zh: "牛", en: "Ox", fi: "Härkä" },
  "虎": { zh: "虎", en: "Tiger", fi: "Tiikeri" },
  "兔": { zh: "兔", en: "Rabbit", fi: "Kani" },
  "龍": { zh: "龍", en: "Dragon", fi: "Lohikäärme" },
  "蛇": { zh: "蛇", en: "Snake", fi: "Käärme" },
  "馬": { zh: "馬", en: "Horse", fi: "Hevonen" },
  "羊": { zh: "羊", en: "Goat", fi: "Lammas" },
  "猴": { zh: "猴", en: "Monkey", fi: "Apina" },
  "雞": { zh: "雞", en: "Rooster", fi: "Kukko" },
  "狗": { zh: "狗", en: "Dog", fi: "Koira" },
  "豬": { zh: "豬", en: "Pig", fi: "Sika" }
};

// -------------------------------------------
// ⭐ 自動將中文農曆（九月廿九）轉成英文格式：
// Lunar Month: 9, Day: 29
// -------------------------------------------
function translateLunarSimple(lunarCn, lang) {
  if (!lunarCn || lang === "zh") return lunarCn;

  // 月份字 → 數字
  const monthMap = {
    "正": 1, "二": 2, "三": 3, "四": 4, "五": 5,
    "六": 6, "七": 7, "八": 8, "九": 9, "十": 10,
    "冬": 11, "臘": 12
  };

  // 日數中文 → 數字
  const numMap = {
    "初": 0, "十": 10, "廿": 20, "卅": 30,
    "一": 1, "二": 2, "三": 3, "四": 4, "五": 5,
    "六": 6, "七": 7, "八": 8, "九": 9
  };

  // 🔍 1. 月份
  const monthChar = lunarCn[0]; // 九
  const month = monthMap[monthChar] || 0;

  // 🔍 2. 日期部分（去掉 "九月" → 取後兩字）
  const dayPart = lunarCn.slice(2); // 廿九
  let day = 0;

  if (dayPart.length === 1) {
    day = numMap[dayPart];
  } else if (dayPart.length === 2) {
    day = numMap[dayPart[0]] + numMap[dayPart[1]];
  }

  // 最終輸出格式
  return `Lunar Month: ${month}, Day: ${day}`;
}

// NOTE fallback
function getNote(data) {
  if (currentLang === "zh") return data.note_zh || data.note_en || "今日宜忌僅作為文化參考。";
  if (currentLang === "fi") return data.note_fi || data.note_en || "For cultural reference only.";
  return data.note_en || "For cultural reference only.";
}

// -------------------------------------------
// ⭐ 主畫面更新
// -------------------------------------------
function render(data) {
  currentData = data;

  const iso = data.date_iso;
  const d = new Date(iso + "T00:00:00");

  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();
  const weekday = d.getDay();

  // 月份標題
  document.getElementById("monthTitle").textContent =
    currentLang === "zh"
      ? `${year}年 ${month + 1}月`
      : `${MONTH_LABELS[currentLang][month]} ${year}`;

  // 年份
  document.getElementById("headerYear").textContent =
    currentLang === "zh"
      ? `${year}年 ${month + 1}月`
      : `${MONTH_LABELS[currentLang][month]} ${year}`;

  // 大日期
  document.getElementById("bigDay").textContent = day;

  // 星期
  document.getElementById("weekdayDisplay").textContent =
    WEEKDAY_LABELS[currentLang][weekday];

  // ISO 日期
  document.getElementById("dateIsoDisplay").textContent = iso;

  // 🌙 農曆 + 蛇年 + 節氣
  const lunarZh = data.lunar_cn;
  const lunarTranslated = translateLunarSimple(lunarZh, currentLang);

  const zodiac = ZODIAC_MAP[data.zodiac_cn]?.[currentLang] || data.zodiac_cn;
  const solar = data.solar_term_cn;

  const headerLunar = document.getElementById("headerLunar");

  if (currentLang === "zh") {
    headerLunar.textContent = `${lunarZh} · ${zodiac}年 · 節氣：${solar}`;
  } else {
    headerLunar.textContent =
      `${LUNAR_LABELS[currentLang].prefix}${lunarTranslated} · ` +
      `Year of ${zodiac} · ${LUNAR_LABELS[currentLang].solarTerm}${solar}`;
  }

  // 宜
  const yiList = document.getElementById("yiList");
  yiList.innerHTML = "";
  data.yi.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item[currentLang] || item.en;
    yiList.appendChild(li);
  });

  // 忌
  const jiList = document.getElementById("jiList");
  jiList.innerHTML = "";
  data.ji.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item[currentLang] || item.en;
    jiList.appendChild(li);
  });

  // Note
  document.getElementById("noteText").textContent = getNote(data);
}

// -------------------------------------------
// ⭐ 今日資料載入
// -------------------------------------------
async function loadToday() {
  const iso = new Date().toISOString().split("T")[0];

  try {
    const res = await fetch(`data/${iso}.json`);
    const data = await res.json();
    render(data);
  } catch (e) {
    console.error("Load error:", e);
  }
}

// -------------------------------------------
// 初始化
// -------------------------------------------
document.addEventListener("DOMContentLoaded", () => {

  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      currentLang = btn.dataset.lang;
      updateLangButtons();
      if (currentData) render(currentData);
    });
  });

  updateLangButtons();
  loadToday();
});

// 更新語言按鈕樣式
function updateLangButtons() {
  document.querySelectorAll(".lang-btn").forEach(b=>{
    b.classList.toggle("active", b.dataset.lang === currentLang);
  });
}
