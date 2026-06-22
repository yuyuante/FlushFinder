# FlushFinder (找公廁) - 專案規格說明書

FlushFinder 是一款為行動通訊（特別是行動網路）優化、具備極速載入能力且支援離線瀏覽的漸進式網頁應用程式 (PWA)。它旨在協助使用者在最短時間內尋找周邊的公共廁所，整合了台灣環境部 (MOENV) 的公廁開放資料與 OpenStreetMap 全球開放地圖資料。

---

## 1. 專案基本資訊
* **專案名稱**：FlushFinder (找公廁)
* **當前版本**：`v31 (支援全台離線資料自動更新)`
* **部署平台**：Vercel Serverless
* **線上版本**：[https://flush-finder-sepia.vercel.app](https://flush-finder-sepia.vercel.app)
* **開發架構**：Vanilla HTML / Vanilla CSS / Vanilla JavaScript (無框架，確保最輕量與最高載入效能)

---

## 2. 核心功能規格

### A. 雙資料來源與優先級載入 (Data Sources & Fallback Priority)
1. **資料來源優先順序**：
   - 系統預設首選為 **(1) OpenStreetMap**，提供全球最新的即時地標資料。
   - 當 OSM 載入失敗或傳回 0 筆資料時，系統將自動無縫地切換至 **(2) 台灣環境部公廁與商家資料 (支援離線)**，實現離線存取與自動備援。
2. **台灣環境部 (MOENV) 資料庫**：
   - 包含全台灣 4.5 萬座官方列管公廁，以及本地超商與百貨商家公廁。由伺服器端完整抓取並按縣市分割。
3. **OpenStreetMap (OSM) Overpass API**：
   - 即時載入周邊 `500公尺` 半徑內的公廁 (`amenity=toilets`) 與加油站公廁 (`amenity=fuel`)。

### B. 極速行動網路載入優化 (Latency & Speed Optimizations)
1. **排除超商搜尋**：
   - 由於超商（如 `shop=convenience`）在人口密集區密度極高，在 Overpass API 進行半徑查詢時極易引發超時（504 Gateway Timeout）或流量限制。本程式將超商移出 OSM 搜尋，僅由環境部 API 提供超商公廁，將查詢反應時間從 30 秒以上大幅縮短至 **3 秒內**。
2. **動態縮小搜尋半徑**：
   - 預設半徑從較大範圍優化為 `500m`，精準定位使用者身邊的即時需求，同時減少資料傳輸量與地圖渲染負擔。

### C. 伺服器代理伺服器 (Vercel Serverless API Proxy)
為了防範瀏覽器端直連 Overpass API 導致的 `406 Not Acceptable`（Referer 阻擋）以及跨域限制 (CORS)，專案建構了伺服器端 Proxy：
1. **`api/osm.js`**：
   - 代理並分流 Overpass API 查詢。
   - 使用多節點輪詢機制（`overpass-api.de`、`overpass.kumi.systems`），若第一節點超時則自動切換。
   - 限制單一節點連線超時為 **4.5秒**，確保在 Vercel 10 秒執行限制內完成回應。
   - 偽裝合規的 `User-Agent`，遵守 OSM Usage Policy。
2. **`api/toilets.js`**：
   - 代理台灣環境部 API 請求，防範前端金鑰外洩，並提供穩定的 CORS 標頭。

### D. 漸進式網頁應用 (PWA)
1. **Service Worker 快取**：
   - `service-worker.js` 會快取首頁 HTML、樣式表、地圖腳本及本地靜態圖檔。
   - 支援離線開啟應用程式。
2. **手動快取清除機制**：
   - 網頁介面上方設有「**強制更新快取**」按鈕，方便 iOS Standalone 模式 (無網址列) 或 Safari 瀏覽器使用者在不重裝 App 的情況下，一鍵清除 Service Worker 快取並重新載入最新版本程式碼（解決 iOS PWA 快取殘留頑疾）。

### E. 響應式介面設計 (Responsive UI)
1. **桌面版版面**：
   - 左側控制面板（`.sidebar`）常駐展開，寬度為 `420px`，右側為地圖展示區域，適合大螢幕操作。
2. **行動裝置版面 (手機/平板)**：
   - 地圖區域設為 **100vh 全螢幕**，隱藏傳統的分欄。
   - 選單控制面板改為隱藏的側邊抽屜式選單，可透過左上角懸浮漢堡按鈕 (`#menu-toggle`) 點擊滑出。
   - 背景設有半透明遮罩層 (`#sidebar-overlay`)，點擊任意空白處可快速收回選單。
   - 當使用者點選特定公廁時，選單會自動收合，主動展示規劃的步行路徑與地圖。

### F. 字體大小設定與持久化 (Font Size Adjustment & Persistence)
1. **動態字體調整**：
   - 提供「小 (sm)」、「中 (md - 預設)」、「大 (lg)」三種字體大小設定。
   - 字體放大比例使用 CSS 變數 `--font-scale` 動態控制，範圍為 0.85x 至 1.25x。
   - 所有重要的介面元素（包含公廁卡片、詳細說明抽屜）及**地圖上的文字**（包括 Leaflet 標記提示 Tooltips、地圖彈出視窗 Popups、GPS 位置標籤等）皆支援動態即時縮放。
2. **偏好設定持久化**：
   - 使用 `localStorage` 的 `flush_finder_font_size` 鍵值保存使用者的字體偏好。
   - 每次開啟 App 時自動偵測並套用對應的字體樣式類別（`.font-size-sm` / `.font-size-md` / `.font-size-lg`），提供一致的視覺體驗。

### G. 多國語言支援與偏好持久化 (Multi-language Support & Persistence)
1. **首批語系支援**：
   - 支援台灣正體中文 (`zh-TW`)、英文 (`en`)、日文 (`ja`)、瑞典文 (`sv`)、尼泊爾文 (`ne`) 五種語系。
2. **啟動自動偵測機制**：
   - App 啟動時，優先使用 `navigator.language` 偵測使用者手機或瀏覽器的系統語系。
   - 匹配規則：偵測到中文語系（`zh`）使用 `zh-TW`，日文使用 `ja`，瑞典文使用 `sv`，尼泊爾文使用 `ne`，若系統語言非上述支援語系，則一律 fallback 顯示「英文 (`en`)」介面。
3. **使用者設定與記憶**：
   - 提供下拉選單供使用者變更語系。變更後，設定會即時保存至 `localStorage` 的 `flush_finder_lang` 鍵值。
   - 下次啟動 App 時會優先讀取此偏好設定，跳過自動偵測，落實個人化語系記憶。
4. **與 API 語系一致性**：
   - 地理搜尋與逆向地理編碼（Nominatim 服務）會動態帶入目前語系引數 (`accept-language=${currentLang}`)，確保地圖地名與地址與使用者所選語系完全吻合。

### H. 縣市分區離線備援與邊界重疊載入 (County-Segmented Fallback & Boundary Loading)
1. **分區資料庫**：
   - 全台公廁及本地超商/商場資料在建置時，透過 `scripts/compile_counties.js` 腳本按全台 22 縣市的地理邊界切割，分別儲存為 `data/<county_key>.json` 小檔案（單檔大小在 200KB 以下），大幅減輕行動網路與手機記憶體負擔。
2. **智慧邊界偵測與合併**：
   - 系統定義了 22 縣市經緯度的地理包圍盒 (Bounding Boxes)。
   - 當處於離線備援狀態（或線上載入失敗/空資料）時，以使用者座標為中心計算 5.5km 半徑（約經緯度 ±0.05 度）的查詢包圍盒，並計算其與 22 縣市地理包圍盒的相交重疊。
   - 同時下載並合併所有相交縣市的離線 JSON 資料，在前端完成唯一性去重。這完美解決了使用者在台北/新北或台中/彰化等縣市邊界處搜尋時，跨縣市公廁的搜尋盲區。
3. **快取與重載機制**：
   - 下載過的縣市資料會快取於前端 `countyCache` 變數中，避免重複請求。
   - 只有當使用者移動距離超過 1 公里時，或是手動點擊「定位」、「搜尋」等強制重載操作時，系統才會重新計算包圍盒並載入新的縣市資料包。

---

## 3. 技術元件與依賴
* **地圖渲染**：[Leaflet.js](https://leafletjs.com/) (以 CDN 形式載入，搭配 OpenStreetMap 圖資網格)。
* **前端樣式**：精美現代暗色調 CSS，支援流暢的微動畫、圓角卡片與響應式行動版配置。
* **本地開發服務**：`server.js` (基於 Node.js 的簡易安全 HTTPS 伺服器，用以測試 Geolocation 本地定位功能)。

---

## 4. 檔案結構說明

```text
C:\Users\user\code\FlushFinder/
├── .gitignore               # 排除 .vercel, node_modules, 憑證 (*.pem) 與暫存檔
├── api/
│   ├── osm.js               # OSM 代理伺服器路由 (Vercel Serverless Function)
│   └── toilets.js           # MOENV 公廁資料代理路由
├── data/                    # 縣市分區離線公廁備援資料庫
│   ├── taipei.json
│   ├── new_taipei.json
│   └── ...
├── scripts/
│   └── compile_counties.js  # 全台公廁資料批次擷取與縣市分區拆分編譯腳本
├── app.js                   # 核心前端邏輯 (定位、API 呼叫、地圖渲染與快取清除)
├── index.html               # 應用程式主畫面與 PWA 註冊
├── style.css                # 現代暗黑風格 UI 與響應式佈局
├── manifest.json            # PWA 安裝配置清單
├── service-worker.js        # 離線快取控制腳本
├── server.js                # 本地開發用 HTTPS Node 伺服器
├── package.json             # 專案依賴管理
├── vercel.json              # Vercel 部署路由重定向配置
├── icon-192.jpg             # PWA 應用程式圖示 (192x192)
└── icon-512.jpg             # PWA 應用程式圖示 (512x512)
```

---

## 5. 本地開發與部署說明

### 本地開發啟動方式
由於多數瀏覽器的隱私安全限制，定位功能 (Geolocation API) 必須在 **HTTPS** 或 **localhost** 環境下才能運作。
1. 安裝套件：
   ```bash
   npm install
   ```
2. 啟動 HTTPS 本地測試伺服器：
   ```bash
   node server.js
   ```
3. 在瀏覽器中開啟 `https://localhost:8080` 並信任憑證即可測試定位。

### 部署到 Vercel
本專案與 Vercel 整合良好，每次提交程式碼至 GitHub `main` 分支後，Vercel 將自動觸發持續整合部署 (CI/CD)：
1. 確保 Vercel 的環境變數已設定 `MOENV_API_KEY`。
2. 透過 Vercel CLI 手動部署：
   ```bash
   vercel --prod
   ```

---

## 6. GitHub Actions 自動化資料更新機制

為確保離線資料庫（22 縣市 JSON 檔案）的準確性與最新狀態，專案配置了 `.github/workflows/update_data.yml` 排程自動化工作流：
1. **執行時間**：每週日 18:00 UTC（台灣時間每週一凌晨 02:00）自動執行一次，亦支援手動觸發。
2. **執行邏輯**：
   - 啟動 Ubuntu 容器並安裝 Node.js 環境。
   - 讀取 GitHub Repository Secret 中的 `MOENV_API_KEY`，執行 `node scripts/compile_counties.js` 腳本。
   - 腳本透過 `limit` 和 `offset` 參數，對環境部官方 API 進行分頁迭代，下載全台完整 **45,000+ 筆** 列管公廁資料，進行去重與地理分割後，覆寫至 `data/*.json` 中。
   - 工作流偵測檔案如有異動，將自動 commit 並 push 回 GitHub 倉庫，觸發 Vercel 的自動重新建置發佈。

---

## 7. 版本變更歷史 (Version History)

* **v31 (支援全台離線資料自動更新 - 雙資料源簡化版)**：
  - 重構資料來源邏輯：將原先「環境部線上 API (有 500 筆限額與金鑰隱憂)」與「本地離線資料」合併簡化為單一的「台灣環境部公廁與商家資料 (支援離線)」，介面簡潔且免除金鑰輸入。
  - 重寫編譯腳本：`compile_counties.js` 現支援分頁迭代下載全台 **4.5 萬座** 列管公廁資料，使 22 縣市離線資料庫 100% 完整，解決了新北中和等台北市以外地區的離線公廁盲區。
  - 新增 GitHub Actions 工作流：配置每週自動爬取環境部最新數據、重新分割並提交部署。

* **v30 (支援分區離線備援 - 動態載入縣市提示)**：
  - 新增動態分區載入提示：在「資料來源設定」下拉選單中「本地分區離線資料」選項以及下方「目前資料來源」狀態標記中，現會動態根據使用者定位計算出之當前加載縣市列表（如 `新北市`、`臺北市`）實時附加顯示於後方，例如 `本地分區離線資料 (已載入：新北市、臺北市)`。
  - 此變更使使用者能直接在選單中直觀確認當前的定位狀態與離線資料庫載入是否正確匹配（例如定位在新北市中和區時，能夠立即在選項中查看到 `新北市` 已載入）。

* **v29 (支援分區離線備援 - 修正版)**：
  - 修正本地離線資料選單標記：移除了所有語系 (zh-TW, en, ja, sv, ne) 字典檔中 `source_local` 對於「台北大安區」之硬編碼文字，統一修改為通用且直觀的「本地分區離線資料」或「Local Offline Data」等語系翻譯。
  - 此修正消除了當使用者於其他縣市（例如新北市中和區）點選「我的位置」載入該區離線公廁時，設定選單依然錯誤標示為台北大安區所引起的視覺混淆。
