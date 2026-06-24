# FlushFinder (找公廁) 🚽

FlushFinder 是一款為行動端（特別是行動網路與離線環境）優化、具備極速載入能力且支援離線瀏覽的**漸進式網頁應用程式 (PWA)**。它能協助使用者在最短時間內尋找周邊最合適的公共與友善廁所。

*   **線上正式版本**：[https://flush-finder-sepia.vercel.app](https://flush-finder-sepia.vercel.app)
*   **專案架構**：極簡輕量 Vanilla HTML / CSS / JavaScript (無任何框架，確保最快開啟速度)

---

## 🚀 核心功能特色

1.  **雙資料來源與智慧備援 (Dynamic Fallback)**：
    *   **OpenStreetMap (OSM)**：預設首選，即時載入全球周邊 500 公尺至 2 公里的公廁地標。
    *   **台灣環境部 (MOENV) 本地庫**：當使用者身處台灣境內，且 OSM 載入失敗或無資料時，系統會自動無縫切換至本地資料庫，支援全台灣 **45,000+ 筆** 官方列管公廁與商家合作廁所。
2.  **雙向智慧定位切換**：
    *   系統會自動根據使用者的 GPS 位置判斷邊界。若定位點在台灣境外，自動切換至全球 OSM 來源；若精確定位回傳在台灣境內，自動無縫切回本地離線資料庫。
    *   具備「使用者手動選擇優先」標記（`flush_finder_source_is_manual`），一旦使用者手動改變來源後即停止自動判定，避免 GPS 漂移或冷啟動時造成來源錯亂。
3.  **PWA 離線瀏覽與安裝**：
    *   支援將 App 安裝至手機主畫面（Add to Home Screen），在無網路連線的離線狀態下，仍可順利開啟 App 並讀取快取中的台灣公廁離線資料。
    *   介面提供「**強制更新快取**」按鈕，徹底解決 iOS Standalone 模式下快取更新不易的痛點。
4.  **行動端體驗精細優化 (Mobile UX)**：
    *   **防 iOS 輸入框放大 Bug (iOS Zoom Prevention)**：行動端介面下，強制輸入框與下拉選單的 `font-size` 至少為 `16px`，阻止 iOS Safari / WebView 點選焦點時自動放大整個網頁且不回復的系統 Bug。
    *   **iOS 安全區域 (Safe Area)**：支援 `viewport-fit=cover`，排版自動避開 iPhone 瀏海與底部橫條。
    *   **字體動態縮放**：提供「小/中/大」三種字體大小選項，介面與 Leaflet 地圖上的所有標記（Tooltips, Popups）字型大小皆會同步連動。
    *   **自訂對話框**：全面取消原生 `alert()` 與 `confirm()`，改以精美的暗黑模式自訂彈出視窗呈現，防止 iOS/LINE Webview 劫持彈窗。

---

## 📂 專案目錄結構

```text
C:\Users\user\code\FlushFinder/
├── .agents/                 # 代理輔助設定與 Terminology 規範
├── api/
│   └── osm.js               # Vercel Serverless Function 代理 (用以繞過 OSM CORS 限制)
├── data/
│   └── *.json               # 台灣 22 縣市分割的公廁離線 JSON 資料庫
├── scripts/
│   └── compile_counties.js  # 自動從環境部 API 下載並分割 4.5 萬筆公廁資料的編譯腳本
├── index.html               # 核心 HTML 頁面
├── style.css                # 核心 CSS 樣式表 (含 Responsive 響應式佈局)
├── app.js                   # 地圖渲染、定位、多語系、篩選及交互主控邏輯
├── service-worker.js        # 離線快取控制 (Service Worker)
├── manifest.json            # PWA 安裝配置檔
├── server.js                # 本地 HTTPS 開發伺服器 (包含 SSL 自簽憑證產生邏輯)
├── vercel.json              # Vercel Serverless 與路由快取策略設定檔
└── SPECIFICATION.md         # 專案詳細系統規格說明書
```

---

## 🛠️ 開發與本地啟動

由於定位 API (`navigator.geolocation`) 在現代瀏覽器安全規範中，**必須在安全連線 (HTTPS) 底下才能正常啟動**，因此本地開發時必須使用 HTTPS 伺服器。

1.  **安裝相依套件**：
    ```bash
    npm install
    ```
2.  **啟動本地開發伺服器**：
    ```bash
    npm run dev
    ```
    *   執行後，`server.js` 會自動在專案目錄下產生自簽憑證 `key.pem` 與 `cert.pem`。
    *   伺服器將會啟動於：**`https://localhost:8080`**。
    *   *註：首次使用瀏覽器開啟時，由於自簽憑證非權威機構發行，請點選「進階設定 ➜ 繼續前往 localhost」即可順利測試。*

---

## 📦 部署與更新規範

*   **雲端平台**：部署於 Vercel Serverless。
*   **版本升級同步規範 (CRITICAL)**：
    每當升級 App 版本號時，必須**同步更新**以下三個檔案中的版號與說明字串，以避免快取失效或版號錯亂：
    1.  `service-worker.js`：更新 `CACHE_NAME` 版本號（如 `v48`）與 `ASSETS` 陣列中靜態資源的 `?v=XX` 版本參數。
    2.  `index.html`：更新 CSS/JS 引用路徑尾端的 `?v=XX` 版本參數，以及 `#app-version-label` 標籤的預設中文。
    3.  `app.js`：更新 `TRANSLATIONS` 字典中所有語系（`zh-TW`, `en`, `ja`, `sv`, `ne`）下的 `"app_version"` 對照字串。
    4.  `SPECIFICATION.md`：同步更新當前版本資訊與變更歷史。
