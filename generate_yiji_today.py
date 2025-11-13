#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import json
from datetime import datetime, timezone

from dotenv import load_dotenv      # ⭐ 新增這行
import google.generativeai as genai

# 讀取同資料夾的 .env
load_dotenv()                       # ⭐ 新增這行


"""
generate_yiji_today.py

用 Gemini 產生「今日宜／忌」JSON，並存成檔案：
  data/YYYY-MM-DD.json
"""

# ========= 1. 基本設定 =========

API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("請先在 .env 中設定 GEMINI_API_KEY")

MODEL_NAME = os.environ.get("GEMINI_MODEL_NAME")
if not MODEL_NAME:
    raise RuntimeError("請先在 .env 中設定 GEMINI_MODEL_NAME，例如 gemini-1.5-flash")

OUTPUT_DIR = "data"

# ========= 2. 建立 Prompt =========

from datetime import datetime

def build_prompt(today: datetime) -> str:
    """回傳丟給 Gemini 的文字 Prompt"""
    iso_date = today.strftime("%Y-%m-%d")
    weekday_en = today.strftime("%A")

    prompt = f"""
You are a content generator for a Chinese-style online calendar
designed for users in Finland.

Today is {iso_date} ({weekday_en}).

Please output ONLY a single JSON object (no explanation, no markdown),
with the following exact structure and field names:

{{
  "date_iso": "YYYY-MM-DD",
  "weekday_en": "",
  "lunar_cn": "",
  "zodiac_cn": "",
  "solar_term_cn": "",
  "yi": [
    {{"zh": "", "en": "", "fi": ""}},
    {{"zh": "", "en": "", "fi": ""}}
  ],
  "ji": [
    {{"zh": "", "en": "", "fi": ""}},
    {{"zh": "", "en": "", "fi": ""}}
  ],
  "note_en": "",
  "note_fi": ""
}}

Requirements:
1. Fill "date_iso" with "{iso_date}" and "weekday_en" with "{weekday_en}".
2. "lunar_cn": brief Chinese lunar date, e.g. "十月十一".
3. "zodiac_cn": Chinese zodiac animal for this lunar year in Chinese, e.g. "兔".
4. "solar_term_cn": 24 solar terms in Chinese (e.g. "立春"), or "—" if none today.
5. "yi" (宜) and "ji" (忌) must each contain exactly TWO items.
6. All suggestions must be about everyday life, mental wellbeing,
   social interaction, or work rhythm. No medical, financial, or
   superstitious fortune-telling content.
7. "zh" is short Chinese phrase (4–10 characters),
   "en" is natural short English phrase,
   "fi" is simple Finnish phrase.
8. "note_en" and "note_fi" are 1 short sentence each, explaining
   today's general "vibe" as a soft wellbeing / reflection tip.

Output ONLY valid JSON. Do not add any extra text.
"""
    return prompt.strip()


# ========= 3. 呼叫 Gemini 產生內容 =========

def generate_yiji(today: datetime) -> dict:
    """呼叫 Gemini 產生今日宜忌 JSON，並回傳 Python dict"""
    genai.configure(api_key=API_KEY)
    model = genai.GenerativeModel(MODEL_NAME)

    prompt = build_prompt(today)
    response = model.generate_content(prompt)

    # 取得純文字內容
    text = response.text.strip()

    # 清理可能的 markdown code block 標記
    if text.startswith("```json"):
        text = text[7:]  # 移除開頭的 ```json
    if text.startswith("```"):
        text = text[3:]  # 移除開頭的 ```
    if text.endswith("```"):
        text = text[:-3]  # 移除結尾的 ```
    text = text.strip()

    # 嘗試解析 JSON
    try:
        data = json.loads(text)
    except json.JSONDecodeError as e:
        # 若模型輸出前後多了奇怪字元,可以在這裡再做清理
        raise ValueError(f"無法解析 Gemini 回傳的 JSON：{e}\n原始輸出：\n{text}")

    return data


# ========= 4. 儲存到檔案 =========

def save_json_for_today(data: dict, today: datetime) -> str:
    """把資料存成 data/YYYY-MM-DD.json，回傳檔案路徑"""
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR, exist_ok=True)

    filename = today.strftime("%Y-%m-%d") + ".json"
    path = os.path.join(OUTPUT_DIR, filename)

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    return path


# ========= 5. 主程式 =========

def main():
    # 你可以改成芬蘭當地時間；目前用 UTC
    today = datetime.now(timezone.utc)

    print(f"產生 {today.strftime('%Y-%m-%d')} 的黃曆內容……")

    data = generate_yiji(today)
    
    path = save_json_for_today(data, today)

    print(f"已儲存到：{path}")
    print("內容預覽：")
    print(json.dumps(data, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
