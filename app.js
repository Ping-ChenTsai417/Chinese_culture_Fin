// app.js 

let currentLang = "zh"; // zh | en | fi
let currentData = null;

// 多語星期
const WEEKDAY_LABELS = {
  zh: ["週日","週一","週二","週三","週四","週五","週六"],
  en: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
  fi: ["Sunnuntai","Maanantai","Tiistai","Keskiviikko","Torstai","Perjantai","Lauantai"]
};

// 多語月份（用在英文/芬蘭文日期）
const MONTH_LABELS = {
  zh: ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"],
  en: ["January","February","March","April","May","June","July","August","September","October","November","December"],
  fi: ["tammikuuta","helmikuuta","maaliskuuta","huhtikuuta","toukokuuta","kesäkuuta","heinäkuuta","elokuuta","syyskuuta","lokakuuta","marraskuuta","joulukuuta"]
};

// 宜忌標題
const YIJI_LABELS = {
  zh: { yi: "宜", ji: "忌" },
  en: { yi: "Do", ji: "Avoid" },
  fi: { yi: "Tee", ji: "Vältä" }
};

// 側邊標籤文字
const SIDEBADGE_TEXT = {
  zh: "今日·中國風黃曆",
  en: "Today · Chinese-style Almanac",
  fi: "Tänään · Kiinalainen almanakka"
};

// 十二生肖對應
const ZODIAC_MAP = {
  "鼠": { zh: "鼠", en: "Rat",      fi: "Rotta" },
  "牛": { zh: "牛", en: "Ox",       fi: "Härkä" },
  "虎": { zh: "虎", en: "Tiger",    fi: "Tiikeri" },
  "兔": { zh: "兔", en: "Rabbit",   fi: "Kani" },
  "龍": { zh: "龍", en: "Dragon",   fi: "Lohikäärme" },
  "蛇": { zh: "蛇", en: "Snake",    fi: "Käärme" },
  "馬": { zh: "馬", en: "Horse",    fi: "Hevonen" },
  "羊": { zh: "羊", en: "Goat",     fi: "Lammas" },
  "猴": { zh: "猴", en: "Monkey",   fi: "Apina" },
  "雞": { zh: "雞", en: "Rooster",  fi: "Kukko" },
  "狗": { zh: "狗", en: "Dog",      fi: "Koira" },
  "豬": { zh: "豬", en: "Pig",      fi: "Sika" }
};

// 24 節氣中 → EN / FI 對照
const SOLAR_TERM_MAP = {
  "立春": { zh: "立春", en: "Beginning of Spring", fi: "Kevään alku" },
  "雨水": { zh: "雨水", en: "Rain Water", fi: "Sadevesi" },
  "驚蟄": { zh: "驚蟄", en: "Awakening of Insects", fi: "Hyönteisten herääminen" },
  "春分": { zh: "春分", en: "Spring Equinox", fi: "Kevätpäiväntasaus" },
  "清明": { zh: "清明", en: "Qingming Festival", fi: "Qingming-juhla" },
  "穀雨": { zh: "穀雨", en: "Grain Rain", fi: "Viljasade" },
  "立夏": { zh: "立夏", en: "Beginning of Summer", fi: "Kesän alku" },
  "小滿": { zh: "小滿", en: "Grain Full", fi: "Viljan täyttyminen" },
  "芒種": { zh: "芒種", en: "Grain in Ear", fi: "Viljan tähkät" },
  "夏至": { zh: "夏至", en: "Summer Solstice", fi: "Kesäpäivänseisaus" },
  "小暑": { zh: "小暑", en: "Slight Heat", fi: "Lievä helle" },
  "大暑": { zh: "大暑", en: "Great Heat", fi: "Kova helle" },
  "立秋": { zh: "立秋", en: "Beginning of Autumn", fi: "Syksyn alku" },
  "處暑": { zh: "處暑", en: "Limit of Heat", fi: "Lämmön päättyminen" },
  "白露": { zh: "白露", en: "White Dew", fi: "Valkoinen kaste" },
  "秋分": { zh: "秋分", en: "Autumn Equinox", fi: "Syyspäiväntasaus" },
  "寒露": { zh: "寒露", en: "Cold Dew", fi: "Kylmä kaste" },
  "霜降": { zh: "霜降", en: "Frost's Descent", fi: "Huurteen laskeutuminen" },
  "立冬": { zh: "立冬", en: "Beginning of Winter", fi: "Talven alku" },
  "小雪": { zh: "小雪", en: "Light Snow", fi: "Heikko lumi" },
  "大雪": { zh: "大雪", en: "Heavy Snow", fi: "Voimakas lumi" },
  "冬至": { zh: "冬至", en: "Winter Solstice", fi: "Talvipäivänseisaus" },
  "小寒": { zh: "小寒", en: "Slight Cold", fi: "Lievä kylmyys" },
  "大寒": { zh: "大寒", en: "Great Cold", fi: "Kova kylmyys" }
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

// 將「九月廿九」轉成 "Lunar month: 9, Day: 29"（for EN / FI）
function translateLunarSimple(lunarCn, lang) {
  if (!lunarCn) return "";
  if (lang === "zh") return lunarCn;

  const monthStr = lunarCn.split("月")[0]; // 九
  const dayStr = lunarCn.split("月")[1] || ""; // 廿九

  const digit = { "一":1,"二":2,"三":3,"四":4,"五":5,"六":6,"七":7,"八":8,"九":9,"十":10 };

  // 月
  let month = 0;
  if (monthStr.length === 1) {
    month = digit[monthStr] || 0;
  } else if (monthStr.length === 2 && monthStr[0] === "十") {
    month = 10 + (digit[monthStr[1]] || 0);
  }

  // 日
  let day = 0;
  if (dayStr.startsWith("初")) {
    const c = dayStr[1];
    if (c === "十") day = 10;
    else day = digit[c] || 0;
  } else if (dayStr.startsWith("十")) {
    if (dayStr.length === 1) day = 10;
    else day = 10 + (digit[dayStr[1]] || 0);
  } else if (dayStr.startsWith("廿")) {
    if (dayStr.length === 1) day = 20;
    else day = 20 + (digit[dayStr[1]] || 0);
  } else if (dayStr.startsWith("卅")) {
    day = 30;
  } else {
    if (dayStr.length === 1) {
      day = digit[dayStr] || 0;
    } else if (dayStr.length === 2) {
      if (dayStr[1] === "十") {
        day = (digit[dayStr[0]] || 0) * 10;
      } else if (dayStr[0] === "十") {
        day = 10 + (digit[dayStr[1]] || 0);
      } else {
        day = (digit[dayStr[0]] || 0) + (digit[dayStr[1]] || 0);
      }
    }
  }

  return `Lunar month: ${month}, Day: ${day}`;
}

// 畫面更新
function render(data) {
  currentData = data;

  const iso = data.date_iso || getTodayIso();
  const d = new Date(iso + "T00:00:00");

  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();
  const weekday = d.getDay();

  // 頂部紅 bar：顯示「完整公曆日期」
  const monthTitle = document.getElementById("monthTitle");
  if (monthTitle) {
    if (currentLang === "zh") {
      monthTitle.textContent = `${year}年${month+1}月${day}日`;
    } else if (currentLang === "en") {
      monthTitle.textContent = `${day} ${MONTH_LABELS.en[month]} ${year}`;
    } else {
      monthTitle.textContent = `${day}. ${MONTH_LABELS.fi[month]} ${year}`;
    }
  }

  // 大日期區
  const bigDay = document.getElementById("bigDay");
  if (bigDay) bigDay.textContent = day;

  const weekdayDisplay = document.getElementById("weekdayDisplay");
  if (weekdayDisplay) {
    weekdayDisplay.textContent = WEEKDAY_LABELS[currentLang][weekday];
  }

  const dateIsoDisplay = document.getElementById("dateIsoDisplay");
  if (dateIsoDisplay) {
    dateIsoDisplay.textContent = iso;
  }

  // ======= 三排農曆 header =======
  const lunarCn = data.lunar_cn || "";
  const zodiacCode = data.zodiac_cn || "";
  const solarCn = data.solar_term_cn || "—";

  const headerLunarMain = document.getElementById("headerLunarMain");
  const headerZodiac = document.getElementById("headerZodiac");
  const headerSolar = document.getElementById("headerSolar");

  // 第 1 排：農曆年月日
  if (headerLunarMain) {
    if (currentLang === "zh") {
      headerLunarMain.textContent = `農曆 ${lunarCn}`;
    } else {
      headerLunarMain.textContent = translateLunarSimple(lunarCn, currentLang);
    }
  }

  // 第 2 排：生肖年（這裡修正 FI 版）
  if (headerZodiac) {
    const zodiacName = ZODIAC_MAP[zodiacCode]?.[currentLang] || zodiacCode || "";
    if (currentLang === "zh") {
      headerZodiac.textContent = `${zodiacName}年`;
    } else if (currentLang === "en") {
      headerZodiac.textContent = `Year of ${zodiacName}`;
    } else {
      // fi：Käärmeen vuosi
      headerZodiac.textContent = `${zodiacName}n vuosi`;
    }
  }

  // 第 3 排：節氣（中 → EN / FI 對照）
  if (headerSolar) {
    if (!solarCn || solarCn === "—") {
      headerSolar.textContent =
        currentLang === "zh" ? "節氣：—"
        : currentLang === "en" ? "Solar Term: —"
        : "Kausi: —";
    } else {
      const term = SOLAR_TERM_MAP[solarCn];
      const solarDisplay = term ? term[currentLang] : solarCn;
      if (currentLang === "zh") {
        headerSolar.textContent = `節氣：${solarDisplay}`;
      } else if (currentLang === "en") {
        headerSolar.textContent = `Solar Term: ${solarDisplay}`;
      } else {
        headerSolar.textContent = `Kausi: ${solarDisplay}`;
      }
    }
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

  // 側邊標籤
  const sideBadge = document.getElementById("sideBadge");
  if (sideBadge) {
    sideBadge.textContent = SIDEBADGE_TEXT[currentLang];
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
    
    // fallback
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
