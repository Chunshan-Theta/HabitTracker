Project Specification: Habit Tracker MVP (HabitTrackerMVP.spec.md)
1. 專案概述 (Project Overview)本專案為一款「雙人互動習慣養成集點卡」行動端優先 (Mobile-first) Web App。核心痛點解決方案為：結合數位極簡開發與「雙人同屏長按 3 秒」的防偽互動機制，創造具備實體儀式感的打卡體驗。
2. 技術棧與環境設定 (Tech Stack & Environment)核心框架： Next.js 14 (App Router) + React + TypeScript。樣式與動畫： Tailwind CSS + Framer Motion + canvas-confetti (碎紙花特效)。多語系 (i18n)： next-intl。資料儲存： MVP 階段全數依賴瀏覽器 localStorage。開發模式： 行動端全螢幕視圖，必須透過 CSS 與 JS 事件徹底阻擋系統預設滾動、下拉更新與回彈效果 (touch-action: none, e.preventDefault())。
3. 資料結構定義 (Data Schema)// 紀錄各節點對應的獎勵，如 { 5: "專屬按摩", 10: "蔬食大餐", 30: "北海道之旅" }

4. 搜尋引擎最佳化與多語系 (SEO & i18n)語系支援： 預設 zh-TW（繁體中文），備用 en-US（英文）。所有靜態文字（設定欄位、按鈕、鼓勵語錄）皆須配置於 messages/*.json。SEO 實作：於 layout.tsx 配置全局 Metadata。於主頁面使用 generateMetadata，根據 cardName 動態生成 Open Graph (OG) 與 Twitter Cards 標籤。生成標準 robots.txt 與動態 sitemap.xml。確保 UI 使用 HTML5 語意化標籤 (<main>, <section>)。
5. UI/UX 與視覺規範 (UI/UX Guidelines)視覺風格： 療癒繪本風。背景色使用 #FAF9F6，組件採 rounded-2xl，無銳利邊框。集點卡視圖 (app/[locale]/page.tsx)：使用 Grid 排列 30 格以上的點數，外層套用 overflow-y-auto 支援上下捲動。常規格： 顯示空心圓或療癒底圖。獎勵格： 依據 RewardMap 設定，將該格數放大、附加粉色外發光特效與微小禮物圖示。
6. 使用者設定模組 (components/Settings.tsx)初始化檢查： 應用程式載入時檢查 localStorage。若無設定檔，強制渲染設定表單。設定表單功能：輸入卡片名稱。設定總格數（表單驗證：不可小於 30）。動態獎勵設定： 提供新增/移除按鈕，讓使用者自由綁定「第 N 格」及其對應的「獎勵文字」（建議每 5 或 10 格設定一次）。重置機制： 提供「重置卡片」按鈕，清空所有點數與設定。
7. 雙人認證畫布核心 (components/SignatureCanvas.tsx)這是系統的核心防偽與儀式感組件，需嚴格實作以下邏輯：事件攔截： 建立 HTML5 <canvas>，攔截 touchstart, touchmove, touchend。雙指軌跡渲染：精準偵測 e.touches.length === 2。若不等於 2，畫筆失效。Touch 1 筆刷套用粉彩藍 (#AEC6CF)；Touch 2 筆刷套用粉彩橘 (#FFB347)。筆刷樣式：lineCap = 'round', lineWidth = 6。3秒同步認證機制：雙指皆在畫布上移動時，啟動計時器與畫布頂部的 Progress Bar。移動期間 (touchmove) 觸發微震動 navigator.vibrate(10)。若任一手指離開螢幕，計時器與進度條瞬間歸零，畫布清空。持續塗鴉滿 3000ms 即判定達標。達標寫入：鎖定畫布，觸發成功震動 navigator.vibrate([100, 50, 100, 50, 400])。將 currentPoints + 1 寫入 localStorage。

8. 動態回饋機制 (Toast & Modal)點數增加後，依據當前點數與 RewardMap 觸發不同回饋：常規打卡 (無獎勵格)： 畫面下方滑出 Toast，從 i18n 語系檔中抽取隨機鼓勵語錄（如：「今天的汗水沒有白流！」），1.5 秒後自動關閉並重置畫布。獎勵解鎖 (符合 RewardMap 定義)： 畫面中央彈出全螢幕 Modal，呼叫 canvas-confetti 觸發碎紙花特效。大字顯示解鎖的獎勵內容。必須手動點擊「領取確認」按鈕，才關閉 Modal 並重置畫布。

9. AI 輸出指示 (Output Directives)請遵循以上所有規範，依序產出以下檔案之完整程式碼（包含嚴謹的 TypeScript 型別定義與 Tailwind class）：types.tsmessages/zh-TW.json & messages/en-US.jsonapp/[locale]/layout.tsx (包含 SEO Metadata)app/[locale]/page.tsxcomponents/Settings.tsxcomponents/SignatureCanvas.tsx直接輸出代碼，無須解釋實作細節。

10. 保留google adsence header與 footer的空間，確保在行動端不會被廣告覆蓋。script標籤應放置於適當位置，確保不干擾核心功能的運作。