//
// app.js — NEW VERSION
//

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

// 取得 yyyy-mm-dd
function getTodayIso() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`;
}

// 語言按鈕樣式更新
function updateLangButtons() {
  document.querySelectorAll(".lang-btn").forEach(b=>{
    b.classList.toggle("active", b.dataset.lang === currentLang);
  });
}

// 取得今日小語（多語 fallback）
function getNote(data) {
  if (currentLang === "zh") return data.note_zh || data.note_en || "";
  if (currentLang === "fi") return data.note_fi || data.note_en || "";
  return data.note_en || "";
}

// 畫面更新
function render(data) {
  currentData = data;

  const iso = data.date_iso || getTodayIso();
  const d = new Date(iso);

  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();
  const weekday = d.getDay();

  // 月份標題
  const monthTitle = document.getElementById("monthTitle");
  monthTitle.textContent =
    currentLang === "zh"
      ? `${year}年 ${month+1}月`
      : `${MONTH_LABELS[currentLang][month]} ${year}`;

  document.getElementById("headerYear").textContent =
    monthTitle.textContent;

  // 星期與日期
  document.getElementById("bigDay").textContent = day;
  document.getElementById("weekdayDisplay").textContent =
    WEEKDAY_LABELS[currentLang][weekday];
  document.getElementById("dateIsoDisplay").textContent = iso;

  // 農曆資訊
  const lunar = data.lunar_cn || "";
  const zodiac = data.zodiac_cn || "";
  const solar = data.solar_term_cn || "—";
  document.getElementById("headerLunar").textContent =
    `${lunar} · ${zodiac?zodiac+"年 · ":""}節氣：${solar}`;

  // 宜
  const yiList = document.getElementById("yiList");
  yiList.innerHTML = "";
  (data.yi||[]).forEach(item=>{
    const li = document.createElement("li");
    li.textContent = item[currentLang] || item.en || item.zh || item.fi;
    yiList.appendChild(li);
  });

  // 忌
  const jiList = document.getElementById("jiList");
  jiList.innerHTML = "";
  (data.ji||[]).forEach(item=>{
    const li = document.createElement("li");
    li.textContent = item[currentLang] || item.en || item.zh || item.fi;
    jiList.appendChild(li);
  });

  // note
  document.getElementById("noteText").textContent = getNote(data);
}

// 載入 JSON
async function loadToday() {
  const iso = getTodayIso();
  try {
    const res = await fetch(`data/${iso}.json`);
    if (!res.ok) throw new Error("no json");
    const data = await res.json();
    render(data);
  } catch (e) {
    render({
      date_iso: iso,
      lunar_cn: "",
      zodiac_cn: "",
      solar_term_cn: "—",
      yi: [],
      ji: [],
      note_en: "Failed to load today's JSON."
    });
  }
}

// 語言切換事件（不使用 onclick）
document.addEventListener("DOMContentLoaded", ()=>{
  document.querySelectorAll(".lang-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      currentLang = btn.dataset.lang;
      updateLangButtons();
      if (currentData) render(currentData);
    });
  });

  updateLangButtons();
  loadToday();
});
