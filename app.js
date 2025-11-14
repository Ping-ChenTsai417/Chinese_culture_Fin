// app.js

let currentLang = "zh";       // 'zh' | 'en' | 'fi'
let currentData = null;       // 儲存當日 JSON，語言切換時重畫用

// 星期與月份多語字典
const WEEKDAY_LABELS = {
  zh: ["週日", "週一", "週二", "週三", "週四", "週五", "週六"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  fi: ["Sunnuntai", "Maanantai", "Tiistai", "Keskiviikko", "Torstai", "Perjantai", "Lauantai"],
};

const MONTH_LABELS = {
  zh: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  fi: ["Tammikuu", "Helmikuu", "Maaliskuu", "Huhtikuu", "Toukokuu", "Kesäkuu", "Heinäkuu", "Elokuu", "Syyskuu", "Lokakuu", "Marraskuu", "Joulukuu"],
};

// 取得今天 yyyy-mm-dd（用使用者當地時間）
function getTodayIso() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// 依照 currentLang 更新語言按鈕外觀
function updateLangButtons() {
  const buttons = document.querySelectorAll(".lang-btn");
  buttons.forEach((btn) => {
    const lang = btn.getAttribute("data-lang");
    btn.classList.toggle("active", lang === currentLang);
  });
}

// 取得 note 文案（如果沒有 note_zh，就 fallback 用英文）
function getNoteForCurrentLang(data) {
  if (currentLang === "zh") {
    return data.note_zh || data.note_en || data.note_fi || "";
  } else if (currentLang === "fi") {
    return data.note_fi || data.note_en || "";
  } else {
    return data.note_en || data.note_fi || "";
  }
}

// 把某一天的資料畫在畫面上
function renderFromData(data) {
  currentData = data;

  const iso = data.date_iso || getTodayIso();
  const dateObj = new Date(iso);

  // ---- 更新日期與月份顯示 ----
  if (!isNaN(dateObj)) {
    const year = dateObj.getFullYear();
    const monthIndex = dateObj.getMonth();
    const day = dateObj.getDate();
    const weekdayIndex = dateObj.getDay();

    const monthName = MONTH_LABELS[currentLang][monthIndex];
    const weekdayName = WEEKDAY_LABELS[currentLang][weekdayIndex];

    // 頂部月份標題
    const monthTitle = document.getElementById("monthTitle");
    if (currentLang === "zh") {
      monthTitle.textContent = `${year}年 ${monthIndex + 1}月`;
    } else {
      monthTitle.textContent = `${monthName} ${year}`;
    }

    // 卡片上方 headerYear
    const headerYear = document.getElementById("headerYear");
    if (currentLang === "zh") {
      headerYear.textContent = `${year}年 ${monthIndex + 1}月`;
    } else {
      headerYear.textContent = `${monthName} ${year}`;
    }

    // 星期與日期
    document.getElementById("weekdayDisplay").textContent = weekdayName;
    document.getElementById("bigDay").textContent = day;
    document.getElementById("dateIsoDisplay").textContent = iso;
  }

  // ---- 更新農曆／節氣／生肖 ----
  const headerLunar = document.getElementById("headerLunar");
  const lunar = data.lunar_cn || "";
  const zodiac = data.zodiac_cn || "";
  const solarTerm = data.solar_term_cn || "—";
  headerLunar.textContent = `${lunar} · ${zodiac ? zodiac + "年 · " : ""}節氣：${solarTerm}`;

  // ---- 更新宜 / 忌 ----
  const yiListEl = document.getElementById("yiList");
  const jiListEl = document.getElementById("jiList");
  yiListEl.innerHTML = "";
  jiListEl.innerHTML = "";

  const yiItems = Array.isArray(data.yi) ? data.yi : [];
  const jiItems = Array.isArray(data.ji) ? data.ji : [];

  if (yiItems.length === 0) {
    const li = document.createElement("li");
    li.textContent = currentLang === "zh"
      ? "尚無今日建議（可能 JSON 尚未產生）。"
      : currentLang === "fi"
      ? "Ei tämän päivän suosituksia (JSONia ei ehkä ole)."
      : "No suggestions for today (JSON may not be generated yet).";
    yiListEl.appendChild(li);
  } else {
    yiItems.forEach((item) => {
      const li = document.createElement("li");
      const text =
        item[currentLang] || item.en || item.zh || item.fi || "";
      li.textContent = text;
      yiListEl.appendChild(li);
    });
  }

  if (jiItems.length === 0) {
    const li = document.createElement("li");
    li.textContent = currentLang === "zh"
      ? "尚無今日需避免事項。"
      : currentLang === "fi"
      ? "Ei tänään vältettäviä asioita."
      : "No items to avoid today.";
    jiListEl.appendChild(li);
  } else {
    jiItems.forEach((item) => {
      const li = document.createElement("li");
      const text =
        item[currentLang] || item.en || item.zh || item.fi || "";
      li.textContent = text;
      jiListEl.appendChild(li);
    });
  }

  // ---- 今日小語 ----
  const noteEl = document.getElementById("noteText");
  const note = getNoteForCurrentLang(data);
  if (note) {
    noteEl.textContent = note;
  } else {
    noteEl.textContent =
      currentLang === "zh"
        ? "今日宜忌僅作為文化參考，請以自己的身心狀態為主。"
        : currentLang === "fi"
        ? "Päivän ohjeet ovat vain kulttuurista inspiraatiota – kuuntele aina omaa kehoasi ja mieltäsi."
        : "Today’s guidance is for cultural inspiration only. Please listen to your own body and mind.";
  }
}

// 載入今天的 JSON
async function loadToday() {
  const iso = getTodayIso();
  const url = `data/${iso}.json`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    renderFromData(data);
  } catch (err) {
    console.error("載入今日 JSON 失敗：", err);
    // 用最簡單的 fallback 資料
    const fallback = {
      date_iso: iso,
      lunar_cn: "",
      zodiac_cn: "",
      solar_term_cn: "—",
      yi: [],
      ji: [],
      note_en:
        "Failed to load today's data. The JSON file may not have been generated yet.",
      note_fi:
        "Päivän tietoja ei voitu ladata. JSON-tiedostoa ei ehkä ole vielä luotu.",
    };
    renderFromData(fallback);
  }
}

// 語言切換（給 HTML onclick 用）
function setLang(lang) {
  if (lang === currentLang) return;
  currentLang = lang;
  updateLangButtons();
  if (currentData) {
    renderFromData(currentData);
  } else {
    loadToday();
  }
}

// 初始化
document.addEventListener("DOMContentLoaded", () => {
  updateLangButtons();
  loadToday();
});
