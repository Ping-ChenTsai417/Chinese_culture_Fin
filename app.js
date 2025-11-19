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
  zh: { year: "年", solarTerm: "節氣：" },
  en: { year: "", solarTerm: "Solar Term: " },
  fi: { year: "", solarTerm: "Kausi: " }
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
  if (currentLang === "zh") return data.note_zh || data.note_en || "今日宜忌僅作為文化參考。";
  if (currentLang === "fi") return data.note_fi || data.note_en || "For cultural reference only.";
  return data.note_en || "For cultural reference only.";
}

// 畫面更新
function render(data) {
  currentData = data;

  const iso = data.date_iso || getTodayIso();
  const d = new Date(iso + "T00:00:00"); // 加上時間避免時區問題

  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();
  const weekday = d.getDay();

  // 月份標題
  const monthTitle = document.getElementById("monthTitle");
  if (monthTitle) {
    monthTitle.textContent =
      currentLang === "zh"
        ? `${year}年 ${month+1}月`
        : `${MONTH_LABELS[currentLang][month]} ${year}`;
  }

  // 年份標題
  const headerYear = document.getElementById("headerYear");
  if (headerYear) {
    headerYear.textContent =
      currentLang === "zh"
        ? `${year}年 ${month+1}月`
        : `${MONTH_LABELS[currentLang][month]} ${year}`;
  }

  // 大日期
  const bigDay = document.getElementById("bigDay");
  if (bigDay) {
    bigDay.textContent = day;
  }

  // 星期
  const weekdayDisplay = document.getElementById("weekdayDisplay");
  if (weekdayDisplay) {
    weekdayDisplay.textContent = WEEKDAY_LABELS[currentLang][weekday];
  }

  // ISO日期
  const dateIsoDisplay = document.getElementById("dateIsoDisplay");
  if (dateIsoDisplay) {
    dateIsoDisplay.textContent = iso;
  }

  // 農曆資訊（多語支持）
  const lunar = data.lunar_cn || "";
  const zodiac = data.zodiac_cn || "";
  const solar = data.solar_term_cn || "—";
  const headerLunar = document.getElementById("headerLunar");
  if (headerLunar) {
    const yearLabel = LUNAR_LABELS[currentLang].year;
    const solarLabel = LUNAR_LABELS[currentLang].solarTerm;
    headerLunar.textContent = `${lunar} · ${zodiac ? zodiac + yearLabel + " · " : ""}${solarLabel}${solar}`;
  }

  // 更新宜忌標題
  const yiTitle = document.getElementById("yiTitle");
  const jiTitle = document.getElementById("jiTitle");
  if (yiTitle) yiTitle.textContent = YIJI_LABELS[currentLang].yi;
  if (jiTitle) jiTitle.textContent = YIJI_LABELS[currentLang].ji;

  // 宜
  const yiList = document.getElementById("yiList");
  if (yiList) {
    yiList.innerHTML = "";
    if (data.yi && data.yi.length > 0) {
      data.yi.forEach(item => {
        const li = document.createElement("li");
        li.textContent = item[currentLang] || item.en || item.zh || item.fi || item;
        yiList.appendChild(li);
      });
    } else {
      const li = document.createElement("li");
      li.textContent = currentLang === "zh" ? "無特別事項" : "None";
      yiList.appendChild(li);
    }
  }

  // 忌
  const jiList = document.getElementById("jiList");
  if (jiList) {
    jiList.innerHTML = "";
    if (data.ji && data.ji.length > 0) {
      data.ji.forEach(item => {
        const li = document.createElement("li");
        li.textContent = item[currentLang] || item.en || item.zh || item.fi || item;
        jiList.appendChild(li);
      });
    } else {
      const li = document.createElement("li");
      li.textContent = currentLang === "zh" ? "無特別禁忌" : "None";
      jiList.appendChild(li);
    }
  }

  // note
  const noteText = document.getElementById("noteText");
  if (noteText) {
    noteText.textContent = getNote(data);
  }
}

// 載入 JSON
async function loadToday() {
  const iso = getTodayIso();
  console.log("Loading data for:", iso);
  
  try {
    const res = await fetch(`data/${iso}.json`);
    console.log("Fetch response:", res.status);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    console.log("Loaded data:", data);
    render(data);
  } catch (e) {
    console.error("Error loading data:", e);
    
    // 顯示錯誤訊息，但用預設數據
    render({
      date_iso: iso,
      lunar_cn: "農曆資訊未載入",
      zodiac_cn: "",
      solar_term_cn: "—",
      yi: [{zh: "無資料", en: "No data", fi: "Ei tietoja"}],
      ji: [{zh: "無資料", en: "No data", fi: "Ei tietoja"}],
      note_zh: "無法載入今日黃曆資料，請檢查 data 資料夾。",
      note_en: "Failed to load today's data. Please check the data folder.",
      note_fi: "Tietojen lataaminen epäonnistui. Tarkista data-kansio."
    });
  }
}

// 初始化
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, initializing...");
  
  // 語言切換按鈕事件
  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      currentLang = btn.dataset.lang;
      console.log("Language changed to:", currentLang);
      updateLangButtons();
      if (currentData) {
        render(currentData);
      }
    });
  });

  // 初始化語言按鈕狀態
  updateLangButtons();
  
  // 載入今日資料
  loadToday();
});