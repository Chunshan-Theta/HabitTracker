Project Specification: Habit Tracker MVP (HabitTrackerMVP.spec.md)

1. 專案概述 (Project Overview)
本專案為「雙人互動習慣養成集點卡」行動端優先 (Mobile-first) Web App，升級為具備使用者管理的 SaaS 平台。核心價值在於「雙人同屏長按 3 秒」的防偽互動儀式感，結合極簡 UI，建立穩定的打卡體驗。每位使用者可同時擁有多張集點卡，且每張卡以 30 天為一輪循環可重新啟動。

2. 技術棧與環境設定 (Tech Stack & Environment)
- Framework: Next.js 14 (App Router) + React + TypeScript
- Styling/Animation: Tailwind CSS + Framer Motion + canvas-confetti
- i18n: next-intl
- Storage: PostgreSQL (取代 localStorage)
- Auth/User: 需具備註冊、登入、登出、忘記密碼流程
- 互動限制: 行動端全螢幕視圖，必須透過 CSS 與 JS 事件阻擋系統預設滾動、下拉更新與回彈 (touch-action: none, e.preventDefault())
- 支援裝置: 以手機直向瀏覽為優先，桌機為可用但非主要優化範圍

3. 資料結構定義 (Data Schema)
- User
	- id: uuid
	- email: string (unique)
	- passwordHash: string
	- createdAt: timestamp
	- updatedAt: timestamp
- HabitCard
	- id: uuid
	- userId: uuid (FK User)
	- cardName: string
	- totalSlots: number (>= 30)
	- rewardMap: jsonb (Record<number, string>)
	- currentPoints: number
	- cycleStartAt: timestamp
	- cycleEndAt: timestamp (cycleStartAt + 30 days)
	- status: "active" | "archived"
	- createdAt: timestamp
	- updatedAt: timestamp
- CheckinEvent
	- id: uuid
	- userId: uuid (FK User)
	- cardId: uuid (FK HabitCard)
	- createdAt: timestamp
	- pointsAfter: number
	- isRewardHit: boolean
- RewardMap: 記錄格數對應獎勵，如 { 5: "專屬按摩", 10: "蔬食大餐", 30: "北海道之旅" }

4. i18n 與 SEO (SEO & i18n)
- 語系支援: 預設 zh-TW，備用 en-US
- 所有靜態文字 (設定欄位、按鈕、鼓勵語錄、Toast/Modal 文案) 皆置於 messages/*.json
- SEO 需支援 i18n: 每個語系各自輸出 title/description/OG/Twitter Cards/robots/sitemap
- layout.tsx: 全局 Metadata、預設 title/description
- page.tsx: 以 generateMetadata 根據 cardName 與 locale 動態生成 OG/Twitter Cards
- 需生成 robots.txt 與動態 sitemap.xml (含多語系路徑)
- UI 結構需使用 HTML5 語意化標籤 (<main>, <section>)

5. UI/UX 視覺規範 (UI/UX Guidelines)
- 視覺風格: 療癒繪本風
- 背景色: #FAF9F6
- 組件: rounded-2xl，避免尖角與硬邊框
- 卡片網格 (app/[locale]/page.tsx):
	- 使用 Grid 排列 >= 30 格
	- 外層可捲動 (overflow-y-auto)
	- 每格顯示空心圓或療癒底圖
	- 獎勵格依 RewardMap 放大、加粉色外發光特效與小禮物圖示
- 已集點格: 顯示填滿樣式或貼紙感圖案
- 互動區: 需清楚提示「雙指同時長按塗鴉」
- 多卡導覽: 使用者可切換多張卡與建立新卡

6. 使用者設定模組 (components/Settings.tsx)
- 初始化檢查: 使用者登入後讀取其卡片清單；無卡片時強制渲染新卡設定表單
- 表單欄位:
	- 卡片名稱 (必填)
	- 總格數 (必填, >= 30)
	- 獎勵設定清單 (可新增/移除):
		- 第 N 格 (>= 1 且 <= totalSlots)
		- 獎勵文字 (必填)
- 驗證規則:
	- 總格數不可小於 30
	- 獎勵格不可重複
	- N 不可大於總格數
- 30 天週期:
	- 建立卡片時需設定 cycleStartAt = now, cycleEndAt = now + 30 days
	- 到期後使用者可「重新開啟新 30 天」並將 currentPoints 歸零
- 重置機制:
	- 「重置卡片」清空當前卡片點數與獎勵設定
- 設定完成後需立即寫入 PostgreSQL

6.1 使用者管理 (Auth)
- 註冊、登入、登出、忘記密碼
- 未登入者不可存取卡片資料

7. 雙人認證畫布核心 (components/SignatureCanvas.tsx)
- 需建立 HTML5 <canvas> 並攔截 touchstart/touchmove/touchend
- 僅當 e.touches.length === 2 時才繪製，否則畫筆無效
- Touch 1: 粉彩藍 (#AEC6CF)，Touch 2: 粉彩橘 (#FFB347)
- 筆刷: lineCap = 'round', lineWidth = 6
- 3 秒同步認證:
	- 雙指同時移動時啟動 3000ms 計時與 Progress Bar
	- 觸發微震動 navigator.vibrate(10)
	- 任一手指離開則計時歸零、進度歸零、畫布清空
	- 持續 3000ms 視為成功
- 成功時:
	- 鎖定畫布
	- 觸發震動 navigator.vibrate([100, 50, 100, 50, 400])
	- currentPoints + 1 寫入 PostgreSQL
	- 觸發 Toast 或 Modal (依 RewardMap)

8. 動態回饋機制 (Toast & Modal)
- 常規打卡 (非獎勵格):
	- 畫面下方滑出 Toast
	- 從 i18n 鼓勵語錄中隨機抽取 1 句
	- 1.5 秒後自動關閉並重置畫布
- 獎勵解鎖 (符合 RewardMap):
	- 畫面中央全螢幕 Modal
	- 觸發 canvas-confetti
	- 顯示解鎖的獎勵內容
	- 使用者點擊「領取確認」才關閉並重置畫布

9. Adsense 版位保留
- Header/Footer 需保留 Adsense 版位空間
- 行動端不可遮擋主互動區
- script 標籤需放置在不干擾核心互動流程的位置

10. AI 輸出指示 (Output Directives)
依序產出以下檔案之完整程式碼 (含嚴謹 TypeScript 型別與 Tailwind class):
- types.ts
- messages/zh-TW.json
- messages/en-US.json
- app/[locale]/layout.tsx (含 SEO Metadata)
- app/[locale]/page.tsx
- components/Settings.tsx
- components/SignatureCanvas.tsx
直接輸出代碼，無須解釋實作細節。