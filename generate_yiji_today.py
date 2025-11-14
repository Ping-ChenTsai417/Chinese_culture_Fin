#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import json
from datetime import datetime, timezone, timedelta

from dotenv import load_dotenv
import google.generativeai as genai

# 讀取同資料夾的 .env
load_dotenv()

"""
generate_yiji_today.py

用 Gemini 產生「今日宜／忌」JSON，並存成檔案：
  data/YYYY-MM-DD.json
"""

# ========= 1. 基本設定 =========

API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("請先在 .env 中設定 GEMINI_API_KEY")

MODEL_NAME = os.environ.get("GEMINI_MODEL_NAME", "gemini-1.5-flash")

OUTPUT_DIR = "data"

# ========= 2. 建立 Prompt =========

def build_prompt(today: datetime) -> str:
    """回傳丟給 Gemini 的文字 Prompt"""
    iso_date = today.strftime("%Y-%m-%d")
    weekday_en = today.strftime("%A")
    year = today.year
    month = today.month
    day = today.day

    prompt = f"""You are a creative content generator for a modern Chinese-style wellness calendar app.
Your task is to generate daily suggestions for {iso_date} ({weekday_en}).

CRITICAL: Output ONLY valid JSON with NO markdown, NO code blocks, NO explanations.

Required JSON structure:
{{
  "date_iso": "{iso_date}",
  "lunar_cn": "",
  "zodiac_cn": "",
  "solar_term_cn": "",
  "yi": [
    {{"zh": "", "en": "", "fi": ""}},
    {{"zh": "", "en": "", "fi": ""}},
    {{"zh": "", "en": "", "fi": ""}}
  ],
  "ji": [
    {{"zh": "", "en": "", "fi": ""}},
    {{"zh": "", "en": "", "fi": ""}},
    {{"zh": "", "en": "", "fi": ""}}
  ],
  "note_zh": "",
  "note_en": "",
  "note_fi": ""
}}

Field requirements:

1. "lunar_cn": Calculate the lunar date for {year}-{month:02d}-{day:02d}.
   - Use format like "十月十五" (月份 + 日期)
   - Common dates: 初一, 初二, ..., 十五, 十六, ..., 三十
   - Example: "十月十五", "八月初三", "十二月廿八"

2. "zodiac_cn": Chinese zodiac for year {year} (just the animal name)
   - 2025 is 蛇年 (Snake)
   - Use only: 鼠/牛/虎/兔/龍/蛇/馬/羊/猴/雞/狗/豬

3. "solar_term_cn": 24 solar terms (節氣) in Chinese
   - Use ONLY if today is actually a solar term date
   - Otherwise use "—"
   - Examples: 立春, 雨水, 驚蟄, 春分, 清明, 穀雨, 立夏, 小滿, 芒種, 夏至, 小暑, 大暑, 立秋, 處暑, 白露, 秋分, 寒露, 霜降, 立冬, 小雪, 大雪, 冬至, 小寒, 大寒

4. "yi" (宜 - auspicious activities): EXACTLY 3 items
   - Focus on: daily wellness, social connections, work-life balance, mindfulness, creativity
   - Examples: 與朋友聚會, 整理空間, 閱讀學習, 運動健身, 放鬆休息, 規劃未來, 品嚐美食
   - NO fortune-telling, NO medical advice, NO financial predictions
   - Keep phrases SHORT and natural

5. "ji" (忌 - things to avoid): EXACTLY 3 items
   - Focus on: behaviors that harm wellbeing, stress triggers, unhealthy habits
   - Examples: 熬夜, 過度工作, 負面思考, 拖延, 暴飲暴食, 久坐不動, 過度使用手機
   - NO superstitious taboos
   - Keep phrases SHORT and natural

6. Translation quality:
   - "zh": Natural Chinese (4-8 characters)
   - "en": Natural English phrase (3-6 words)
   - "fi": Simple Finnish phrase (2-5 words)
   - All three should convey the SAME meaning naturally

7. "note_zh", "note_en", "note_fi": Daily wisdom note
   - ONE sentence reflecting today's energy/vibe
   - Positive, encouraging, wellness-focused
   - Should feel like friendly life advice
   - Example themes: mindfulness, balance, joy, connection, growth, rest
   - Keep it SHORT (10-20 words)

IMPORTANT REMINDERS:
- Output ONLY the JSON object
- NO ```json``` markers
- NO explanations before or after
- Ensure all Chinese characters are traditional (繁體中文)
- Make suggestions feel relevant to {weekday_en}
- Keep the tone modern, warm, and encouraging

Begin JSON output now:"""
    
    return prompt.strip()


# ========= 3. 呼叫 Gemini 產生內容 =========

def generate_yiji(today: datetime) -> dict:
    """呼叫 Gemini 產生今日宜忌 JSON，並回傳 Python dict"""
    genai.configure(api_key=API_KEY)
    
    # 配置生成參數
    generation_config = {
        "temperature": 0.9,  # 增加創意性
        "top_p": 0.95,
        "top_k": 40,
        "max_output_tokens": 2048,
    }
    
    model = genai.GenerativeModel(
        MODEL_NAME,
        generation_config=generation_config
    )

    prompt = build_prompt(today)
    
    print("🤖 正在呼叫 Gemini API...")
    response = model.generate_content(prompt)

    # 取得純文字內容
    text = response.text.strip()
    
    print("📝 收到回應，處理中...")

    # 清理可能的 markdown code block 標記
    text = text.replace("```json", "").replace("```", "").strip()
    
    # 移除可能的前後說明文字
    if "{" in text and "}" in text:
        start = text.index("{")
        end = text.rindex("}") + 1
        text = text[start:end]

    # 嘗試解析 JSON
    try:
        data = json.loads(text)
    except json.JSONDecodeError as e:
        print(f"❌ JSON 解析失敗：{e}")
        print(f"原始輸出：\n{text}")
        raise ValueError(f"無法解析 Gemini 回傳的 JSON：{e}")

    # 驗證數據結構
    validate_json_structure(data)
    
    return data


# ========= 3.5 驗證 JSON 結構 =========

def validate_json_structure(data: dict):
    """驗證生成的 JSON 是否符合要求"""
    required_fields = [
        "date_iso", "lunar_cn", "zodiac_cn", "solar_term_cn",
        "yi", "ji", "note_zh", "note_en", "note_fi"
    ]
    
    for field in required_fields:
        if field not in data:
            raise ValueError(f"缺少必要欄位：{field}")
    
    # 檢查 yi 和 ji 的結構
    if not isinstance(data["yi"], list) or len(data["yi"]) != 3:
        raise ValueError(f"yi 必須是包含 3 個項目的列表，目前有 {len(data.get('yi', []))} 個")
    
    if not isinstance(data["ji"], list) or len(data["ji"]) != 3:
        raise ValueError(f"ji 必須是包含 3 個項目的列表，目前有 {len(data.get('ji', []))} 個")
    
    # 檢查每個 yi/ji 項目是否有 zh, en, fi
    for i, item in enumerate(data["yi"]):
        if not all(k in item for k in ["zh", "en", "fi"]):
            raise ValueError(f"yi[{i}] 缺少 zh/en/fi 欄位")
    
    for i, item in enumerate(data["ji"]):
        if not all(k in item for k in ["zh", "en", "fi"]):
            raise ValueError(f"ji[{i}] 缺少 zh/en/fi 欄位")
    
    print("✅ JSON 結構驗證通過")


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
    """主程式：可選擇生成今天或指定日期的黃曆"""
    import sys
    
    # 檢查是否有命令列參數指定日期
    if len(sys.argv) > 1:
        try:
            # 嘗試解析日期參數 (格式: YYYY-MM-DD)
            date_str = sys.argv[1]
            today = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            print(f"📅 生成指定日期：{date_str}")
        except ValueError:
            print("❌ 日期格式錯誤，請使用 YYYY-MM-DD 格式")
            print("範例：python generate_yiji_today.py 2025-11-15")
            return
    else:
        # 使用當前 UTC 時間
        today = datetime.now(timezone.utc)
        print(f"📅 生成今日黃曆：{today.strftime('%Y-%m-%d')}")

    print(f"⏰ 生成時間：{today.strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print("=" * 50)

    try:
        data = generate_yiji(today)
        
        path = save_json_for_today(data, today)

        print("=" * 50)
        print(f"✅ 成功儲存到：{path}")
        print("\n📄 內容預覽：")
        print(json.dumps(data, ensure_ascii=False, indent=2))
        
    except Exception as e:
        print(f"\n❌ 發生錯誤：{e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()