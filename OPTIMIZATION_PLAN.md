# FlushFinder 效能優化與崩潰修正計畫書

本文件記錄了解決 FlushFinder 在啟動與切換資料來源時，因載入過多 Leaflet 標記與側邊欄卡片而導致 iOS WebKit/Safari 瀏覽器崩潰（「重複發生問題」）的詳細優化方案與程式碼修改說明。

---

## 1. 問題診斷與原因

1. **大數據載入效能瓶頸**：
   在本地離線模式（`local`）下，縣市資料庫檔案（如 `taipei.json` 約 4.3MB，`new_taipei.json` 約 3.7MB）共計包含超過 12,000 筆公廁與超商資料。
2. **記憶體與 DOM 節點過載**：
   原程式會將搜尋範圍內（或載入縣市中）的**所有 12,000+ 筆資料**全部渲染至 Leaflet 地圖標記（Markers），並在側邊欄產生 12,000+ 個卡片。這在行動裝置（特別是 iOS Safari）上會瞬間耗盡記憶體，引發系統終止網頁進程。
3. **並行請求衝突**：
   App 啟動時會同時從 `initApp()` 與 `requestUserLocation()` 的異步回呼中並行觸發 `loadToiletsData()`，造成重複載入同一個檔案或向伺服器發送多次重複請求。

---

## 2. 優化修改方案

為了提升效能並徹底防止崩潰，建議進行以下三項核心修改：

### 修改一：設定最大顯示限制 `MAX_DISPLAY_TOILETS`
在 [app.js](file:///C:/Users/peteryu/code/FlushFinder/app.js) 的全域設定區（約第 618 行）定義顯示上限，限制地圖與卡片的渲染數量。

```javascript
// 尋找：
// Configuration & Default Location (Daan District, Taipei)
const DEFAULT_COORDS = [25.033964, 121.543413]; 
let userCoords = [...DEFAULT_COORDS];

// 修改為：
// Configuration & Default Location (Daan District, Taipei)
const DEFAULT_COORDS = [25.033964, 121.543413]; 
let userCoords = [...DEFAULT_COORDS];
const MAX_DISPLAY_TOILETS = 50; // 限制地圖標記與側邊卡片最大顯示數量，防止瀏覽器崩潰
```

---

### 修改二：新增距離排序、篩選與限制的輔助函式
在 [app.js](file:///C:/Users/peteryu/code/FlushFinder/app.js) 中新增 `getSortedAndFilteredToilets()` 函式，並修改 `renderToiletMarkers()`、`calculateAndDisplayToilets()` 與 `selectNearestToilet()` 來使用此限定列表。

```javascript
// ==================== 新增輔助函式 ====================
// 取得排序、篩選且限制數量（前 50 筆）的公廁列表
function getSortedAndFilteredToilets() {
    if (!toiletsData || toiletsData.length === 0) return [];

    // 1. 計算每座公廁與使用者目前的距離
    const toiletsWithDistance = toiletsData.map(t => {
        const dist = getDistance(userCoords, t.coords);
        return {
            ...t,
            distance: dist // 公尺
        };
    });

    // 2. 依距離由近到遠排序
    toiletsWithDistance.sort((a, b) => a.distance - b.distance);

    // 3. 套用目前的篩選條件（無障礙、親子、免費等）
    const filtered = filterToiletData(toiletsWithDistance, activeFilter);

    // 4. 僅回傳最近的前 50 筆
    return filtered.slice(0, MAX_DISPLAY_TOILETS);
}

// ==================== 修改地圖標記渲染 ====================
function renderToiletMarkers() {
    // 清除舊標記
    toiletMarkers.forEach(item => map.removeLayer(item.markerObject));
    toiletMarkers = [];

    // 🔴 修改：改用 getSortedAndFilteredToilets() 限制前 50 筆
    const displayedToilets = getSortedAndFilteredToilets();

    displayedToilets.forEach(toilet => {
        const iconName = getIconName(toilet.type);
        const iconHtml = `
            <div class="custom-marker-pin ${selectedToiletId === toilet.id ? 'active' : ''}" id="pin-${toilet.id}">
                <i data-lucide="${iconName}" class="custom-marker-icon"></i>
            </div>
        `;

        const customIcon = L.divIcon({
            className: 'custom-div-icon toilet-marker-icon',
            html: iconHtml,
            iconSize: [38, 38],
            iconAnchor: [19, 38]
        });

        const marker = L.marker(toilet.coords, { icon: customIcon }).addTo(map);
        
        marker.on('click', () => {
            selectToilet(toilet);
        });

        toiletMarkers.push({
            id: toilet.id,
            markerObject: marker
        });
    });

    lucide.createIcons();
}

// ==================== 修改側邊欄列表渲染 ====================
function calculateAndDisplayToilets() {
    // 🔴 修改：改用 getSortedAndFilteredToilets() 限制前 50 筆
    const displayedToilets = getSortedAndFilteredToilets();
    
    // 側邊欄上方標頭顯示篩選後的總數量（不受 50 筆限制，提供直觀統計）
    const totalCount = filterToiletData(toiletsData, activeFilter).length;
    document.getElementById("results-count").textContent = totalCount;

    const listContainer = document.getElementById("results-list");
    listContainer.innerHTML = "";

    if (displayedToilets.length === 0) {
        listContainer.innerHTML = `
            <div class="loading-state">
                <i data-lucide="map-pin-off" style="width: 32px; height: 32px;"></i>
                <p data-i18n="no_results">${t("no_results")}</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    displayedToilets.forEach(toilet => {
        const straightDist = Math.round(toilet.distance);
        const distStr = straightDist < 1000 
            ? `${t("distance_straight", { dist: straightDist })}` 
            : `${t("distance_km", { dist: (straightDist / 1000).toFixed(1) })}`;
            
        const estWalkingTime = Math.ceil((toilet.distance * 1.3) / 80);
        const timeStr = `${t("walk_time", { mins: estWalkingTime })}`;

        const isOpenedClass = toilet.status === 'open' ? 'status-open' : (toilet.status === 'busy' ? 'status-busy' : 'status-closed');
        const statusText = toilet.status === 'open' ? t("status_available") : (toilet.status === 'busy' ? t("status_busy") : t("status_closed"));

        const card = document.createElement("div");
        card.className = `toilet-card ${selectedToiletId === toilet.id ? 'active' : ''}`;
        card.setAttribute("data-id", toilet.id);

        card.innerHTML = `
            <div class="card-header">
                <div class="card-title">${toilet.name}</div>
                <div class="card-rating">
                    <i data-lucide="star"></i>
                    <span>${toilet.rating.toFixed(1)}</span>
                </div>
            </div>
            <div class="card-address">
                <i data-lucide="navigation"></i>
                <span>${toilet.address}</span>
            </div>
            <div class="card-tags">
                <span class="tag primary">${toilet.type}</span>
                ${toilet.features.accessible ? `<span class="tag"><i data-lucide="accessibility" style="width: 10px; height: 10px; display:inline-block; vertical-align:-1px;"></i> ${t("tag_accessible")}</span>` : ''}
                ${toilet.features.baby ? `<span class="tag"><i data-lucide="baby" style="width: 10px; height: 10px; display:inline-block; vertical-align:-1px;"></i> ${t("tag_baby")}</span>` : ''}
                ${toilet.features.free ? `<span class="tag">${t("tag_free")}</span>` : `<span class="tag">${t("tag_paid")}</span>`}
            </div>
            <div class="card-footer">
                <div class="card-distance">
                    <i data-lucide="footprints" style="width: 13px; height: 13px;"></i>
                    <span style="font-size: 11px;">${distStr} (${timeStr})</span>
                </div>
                <div class="card-status ${isOpenedClass}">${statusText}</div>
            </div>
        `;

        card.addEventListener('click', () => {
            selectToilet(toilet);
        });

        listContainer.appendChild(card);
    });

    lucide.createIcons();
}

// ==================== 修改預設選取最近公廁 ====================
function selectNearestToilet() {
    const displayed = getSortedAndFilteredToilets();
    if (displayed.length > 0) {
        selectToilet(displayed[0]);
    }
}
```

---

### 修改三：重構定位更新邏輯，確保地圖標記即時重新配置
修改 `setUserLocation()`，讓使用者定位移動時，地圖標記（最近 50 筆）能即時同步渲染，且移除多餘重複呼叫。

```javascript
async function setUserLocation(lat, lng, isManualReload = false) {
    userCoords = [lat, lng];
    updateUserMarker();
    resolveUserCurrentAddress(lat, lng);
    
    const source = localStorage.getItem("flush_finder_source") || "osm";
    if (source === 'osm') {
        const resultsList = document.getElementById("results-list");
        if (resultsList) {
            resultsList.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p data-i18n="locating_places">${t("locating_places")}</p>
                </div>
            `;
        }
        await loadToiletsData(); // 🔴 移除此處後方的 renderToiletMarkers()
    } else if (source === 'local') {
        let shouldReload = isManualReload;
        if (!shouldReload) {
            if (!lastQueryCoords) {
                shouldReload = true;
            } else {
                const dist = getDistance(userCoords, lastQueryCoords);
                if (dist > 1000) { 
                    shouldReload = true;
                }
            }
        }
        
        if (shouldReload) {
            await loadToiletsData(); // 🔴 移除此處後方的 renderToiletMarkers()
        }
    }
    
    // 🔴 移至最外層：每次座標移動，均重新渲染地圖標記與列表卡片
    renderToiletMarkers();
    calculateAndDisplayToilets();
    
    if (selectedToiletId) {
        const selectedToilet = toiletsData.find(t => t.id === selectedToiletId);
        if (selectedToilet) {
            fetchActualWalkingRoute(selectedToilet);
        }
    }
}
```

---

### 修改四：新增載入 Promise 共用鎖，防止並行請求衝突
重構 `loadToiletsData()` 函式，當偵測到相同的資料載入需求時，讓多個並行的非同步呼叫共用同一個載入 Promise。

```javascript
let activeLoadPromise = null;
let activeLoadCounties = null;
let activeLoadSource = null;

// 🔴 修改：作為防抖與去重入口
async function loadToiletsData() {
    let source = localStorage.getItem("flush_finder_source") || "osm";
    if (source === "moenv") {
        source = "local";
        localStorage.setItem("flush_finder_source", "local");
    }
    
    // 判斷此次加載的縣市群組標記
    const countiesToLoad = source === 'local' ? getOverlapCounties(userCoords[0], userCoords[1]).sort().join(",") : "";

    // 如果完全相同，直接共用目前正在進行的加載 Promise
    if (activeLoadPromise && activeLoadSource === source && activeLoadCounties === countiesToLoad) {
        return activeLoadPromise;
    }

    activeLoadSource = source;
    activeLoadCounties = countiesToLoad;

    activeLoadPromise = performLoadToiletsData(source);
    try {
        await activeLoadPromise;
    } finally {
        activeLoadPromise = null;
    }
}

// 🔴 原 loadToiletsData() 內容完整包裝於此
async function performLoadToiletsData(source) {
    const sourceLabel = document.getElementById("data-source-label");
    const sourceSelect = document.getElementById("source-select");
    
    if (sourceSelect) sourceSelect.value = source;
    
    if (source === 'osm') {
        // ... (保持原 OSM 下載與 fallback 邏輯不變) ...
    } else {
        // ... (保持原本地 JSON 下載與合併邏輯不變) ...
    }
}
```
