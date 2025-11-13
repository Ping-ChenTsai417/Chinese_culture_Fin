// app.js

function getTodayIso() {
  const now = new Date();
  // 取得當地時間的 yyyy-mm-dd
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function loadTodayYiji() {
  const iso = getTodayIso();
  const url = `data/${iso}.json`;

  // 頂部日期相關
  const dateObj = new Date(iso);
  const monthTitle = document.getElementById("monthTitle");
  const weekdayText = document.getElementById("weekdayText");
  const gregDate = document.getElementById("gregDate");

  if (!isNaN(dateObj)) {
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const weekdayNames = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];

    monthTitle.textContent = `${year}年 ${month}月`;
    weekdayText.textContent = weekdayNames[dateObj.getDay()];
    gregDate.textContent = day;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`載入失敗：${res.status}`);
    }

    const data = await res.json();

    // 更新 lunar / header
    document.getElementById("lunarStrip").textContent = data.lunar_cn || "—";
    document.getElementById("lunarTitle").textContent =
      data.lunar_cn || "今日黃曆";

    const headerSub = document.getElementById("headerSub");
    headerSub.textContent = `${data.date_iso} · ${data.weekday_en} · ${data.zodiac_cn}年 · 節氣：${data.solar_term_cn}`;

    // 宜 / 忌列表
    const yiList = document.getElementById("yiList");
    const jiList = document.getElementById("jiList");
    yiList.innerHTML = "";
    jiList.innerHTML = "";

    (data.yi || []).forEach((item) => {
      const li = document.createElement("li");
      li.textContent = `${item.zh} · ${item.en} · ${item.fi}`;
      yiList.appendChild(li);
    });

    (data.ji || []).forEach((item) => {
      const li = document.createElement("li");
      li.textContent = `${item.zh} · ${item.en} · ${item.fi}`;
      jiList.appendChild(li);
    });

    // 備註
    const note = document.getElementById("noteText");
    note.textContent = `${data.note_en} / ${data.note_fi}`;
  } catch (err) {
    console.error(err);
    const note = document.getElementById("noteText");
    note.textContent = "今日內容載入失敗（可能還沒產生 JSON）。";
  }
}

document.addEventListener("DOMContentLoaded", loadTodayYiji);
