// FlushFinder Application Logic

// Configuration & Default Location (Daan District, Taipei)
const DEFAULT_COORDS = [25.033964, 121.543413]; 
let userCoords = [...DEFAULT_COORDS];
let map = null;
let toiletMarkers = [];
let userMarker = null;
let currentTheme = 'light';
let activeFilter = 'all';
let selectedToiletId = null;
let toiletsData = [];
let currentRouteLine = null;

// Tile Layers for Map
const LIGHT_TILE = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const DARK_TILE = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
let activeTileLayer = null;

// Mock Toilet Data
const MOCK_TOILETS = [
    {
        id: 1,
        name: "大安森林公園 1 號公廁",
        coords: [25.033500, 121.536000],
        address: "台北市大安區新生南路二段1號 (靠近信義路側)",
        type: "公廁",
        rating: 4.5,
        features: {
            accessible: true,
            baby: true,
            free: true
        },
        status: "open",
        openingHours: "24 小時營業",
        description: "由市政府定期維護，清潔度高，設有完善的無障礙空間及嬰兒尿布台。衛生紙充足且有洗手乳。"
    },
    {
        id: 2,
        name: "捷運大安站地下街公廁",
        coords: [25.032900, 121.543500],
        address: "台北市大安區信義路四段2號 (捷運站 B1 內)",
        type: "捷運",
        rating: 4.2,
        features: {
            accessible: true,
            baby: false,
            free: true
        },
        status: "busy",
        openingHours: "06:00 - 00:00",
        description: "捷運站內公廁，人流量大但清潔頻率高。需刷卡進站使用，或可向服務台索取臨時進站票券。"
    },
    {
        id: 3,
        name: "星巴克 信義大安門市廁所",
        coords: [25.033300, 121.545800],
        address: "台北市大安區信義路四段74號",
        type: "商家",
        rating: 4.8,
        features: {
            accessible: false,
            baby: false,
            free: false
        },
        status: "open",
        openingHours: "07:00 - 22:00",
        description: "環境非常乾淨清香，設有感應式密碼鎖。通常需要消費發票後方可向店員詢問密碼使用。"
    },
    {
        id: 4,
        name: "台北市立圖書館 總館公廁",
        coords: [25.029800, 121.537500],
        address: "台北市大安區建國南路二段125號 (1樓大廳旁)",
        type: "公廁",
        rating: 3.9,
        features: {
            accessible: true,
            baby: true,
            free: true
        },
        status: "open",
        openingHours: "08:30 - 21:00",
        description: "圖書館附設洗手間，環境安靜，洗手台有熱水。適合讀書或在建國高架旁活動的民眾。"
    },
    {
        id: 5,
        name: "遠東SOGO百貨 復興館 B3 廁所",
        coords: [25.041500, 121.543900],
        address: "台北市大安區忠孝東路三段300號 B3",
        type: "百貨",
        rating: 4.9,
        features: {
            accessible: true,
            baby: true,
            free: false,
            rating4Plus: true
        },
        status: "open",
        openingHours: "11:00 - 22:00",
        description: "頂級五星級飯店水準的百貨廁所，配有免治馬桶、洗手乳、烘手機以及高檔裝潢。無須消費即可進入。"
    },
    {
        id: 6,
        name: "大安區公所 2樓民眾公廁",
        coords: [25.026800, 121.543100],
        address: "台北市大安區和平東路三段186號 2樓",
        type: "公廁",
        rating: 4.1,
        features: {
            accessible: true,
            baby: false,
            free: true
        },
        status: "closed",
        openingHours: "08:30 - 17:30 (假日不開放)",
        description: "公家機關內部公廁，環境整潔。非上班時間及週末不對外開放。"
    },
    {
        id: 7,
        name: "7-ELEVEN 欣安和門市廁所",
        coords: [25.032600, 121.549200],
        address: "台北市大安區安和路一段127巷6號",
        type: "超商",
        rating: 4.0,
        features: {
            accessible: false,
            baby: false,
            free: true
        },
        status: "open",
        openingHours: "24 小時營業",
        description: "位於安和路巷內的 7-ELEVEN 門市內，設有顧客專用洗手間。空間較小但清潔度尚可，通常需向店員告知後使用。"
    },
    {
        id: 8,
        name: "全家便利商店 瑞安店廁所",
        coords: [25.029200, 121.541500],
        address: "台北市大安區瑞安街120巷2號",
        type: "超商",
        rating: 4.3,
        features: {
            accessible: false,
            baby: false,
            free: true
        },
        status: "open",
        openingHours: "24 小時營業",
        description: "全家門市內部附設廁所，提供給消費或需要的民眾使用。店內有座位區，廁所整理得挺乾淨。"
    }
];

// Document Ready
document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

// App Initialization
async function initApp() {
    // Initialize Font Size
    initFontSize();

    // Initialize Icons
    lucide.createIcons();

    // Load toilets data (from local JSON or MOENV API proxy)
    await loadToiletsData();

    // Setup Map
    initMap();

    // Resolve initial position address in header
    resolveUserCurrentAddress(userCoords[0], userCoords[1]);

    // Check Geolocatin API
    requestUserLocation();

    // Setup Event Listeners
    setupEventListeners();

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js')
                .then(reg => console.log('Service Worker registered successfully!', reg.scope))
                .catch(err => console.warn('Service Worker registration failed:', err));
        });
    }
}

// Font Size Settings Management
function initFontSize() {
    const savedSize = localStorage.getItem("flush_finder_font_size") || "md";
    applyFontSize(savedSize);
}

function applyFontSize(size) {
    document.body.classList.remove("font-size-sm", "font-size-md", "font-size-lg");
    document.body.classList.add(`font-size-${size}`);
    
    // Sync UI selector
    const fontSelect = document.getElementById("font-size-select");
    if (fontSelect) fontSelect.value = size;

    // Update map tile scale dynamically
    updateMapTileScale(size);
}

// Get Leaflet Tile options based on font size selection (Stretching tiles to scale map labels)
function getTileOptions(size) {
    const baseOptions = {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    };
    
    if (size === 'lg') {
        return {
            ...baseOptions,
            tileSize: 512,
            zoomOffset: -1
        };
    } else {
        return {
            ...baseOptions,
            tileSize: 256,
            zoomOffset: 0
        };
    }
}

// Dynamically scale/reload Leaflet map tile layer
function updateMapTileScale(size) {
    if (!map || !activeTileLayer) return;
    
    const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
    const tileUrl = currentTheme === 'dark' ? DARK_TILE : LIGHT_TILE;
    
    // Remove old layer
    map.removeLayer(activeTileLayer);
    
    // Create new layer with updated scale options
    const options = getTileOptions(size);
    activeTileLayer = L.tileLayer(tileUrl, options).addTo(map);
}

// Map Initialization
function initMap() {
    map = L.map('map', {
        zoomControl: false, // Disable default zoom controls to design custom layout
        doubleClickZoom: false // Disable double click zoom so we can double click to place marker
    }).setView(userCoords, 15);

    // Get initial font size and tile options
    const savedFontSize = localStorage.getItem("flush_finder_font_size") || "md";
    const tileOptions = getTileOptions(savedFontSize);

    // Add Tile Layer
    activeTileLayer = L.tileLayer(LIGHT_TILE, tileOptions).addTo(map);

    // Re-position Zoom control to bottom right (so it doesn't conflict with sidebar)
    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);

    // Map Double Click Event for positioning
    map.on('dblclick', async (e) => {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        await setUserLocation(lat, lng);
    });

    // Initial Marker rendering
    updateUserMarker();
    renderToiletMarkers();
    calculateAndDisplayToilets();
}

// User Location handling
function requestUserLocation() {
    if ("geolocation" in navigator) {
        const locTextEl = document.getElementById("current-location-text");
        if (locTextEl) {
            locTextEl.textContent = "正在取得 GPS 精確定位...";
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                await setUserLocation(lat, lng);
                map.setView(userCoords, 15);
                selectNearestToilet();
            },
            async (error) => {
                console.warn("無法取得精確定位，使用預設或先前位置:", error.message);
                alert("無法取得 GPS 精確定位，系統已為您使用預設或先前的位置。您可以透過搜尋欄、拖曳藍色定位點或在地圖上按兩下，手動修正位置。");
                await setUserLocation(userCoords[0], userCoords[1]);
                map.setView(userCoords, 15);
                selectNearestToilet();
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    } else {
        setUserLocation(userCoords[0], userCoords[1]);
        selectNearestToilet();
    }
}

// Auto-select nearest toilet based on current data source
function selectNearestToilet() {
    if (!toiletsData || toiletsData.length === 0) return;
    
    // Calculate distance and sort
    const toiletsWithDistance = toiletsData.map(t => {
        const dist = getDistance(userCoords, t.coords);
        return {
            ...t,
            distance: dist
        };
    });
    
    toiletsWithDistance.sort((a, b) => a.distance - b.distance);
    const filtered = filterToiletData(toiletsWithDistance, activeFilter);
    
    if (filtered.length > 0) {
        selectToilet(filtered[0]);
    }
}

// Update User's Position Indicator on Map
function updateUserMarker() {
    if (userMarker) {
        map.removeLayer(userMarker);
    }

    const userIcon = L.divIcon({
        className: 'custom-div-icon user-marker-icon',
        html: `<div class="user-marker-pin" style="cursor: grab;"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });

    userMarker = L.marker(userCoords, { 
        icon: userIcon,
        draggable: true
    }).addTo(map);
    
    userMarker.bindTooltip("我現在的位置 (可拖曳修正)", { 
        permanent: true, 
        direction: 'top', 
        className: 'user-location-tooltip',
        offset: [0, -5] 
    });

    // Handle marker dragging
    userMarker.on('dragend', async function(e) {
        const position = e.target.getLatLng();
        await setUserLocation(position.lat, position.lng);
    });
}

// Set User Location (teleport and reload data/calculations)
async function setUserLocation(lat, lng) {
    userCoords = [lat, lng];
    
    // Update user marker position and tooltip
    updateUserMarker();
    
    // Resolve user's actual location address in header
    resolveUserCurrentAddress(lat, lng);
    
    // If OpenStreetMap is the source, refetch to load new regional data
    const source = localStorage.getItem("flush_finder_source") || "osm";
    if (source === 'osm') {
        const resultsList = document.getElementById("results-list");
        if (resultsList) {
            resultsList.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>正在讀取附近地標...</p>
                </div>
            `;
        }
        await loadToiletsData();
        renderToiletMarkers();
    }
    
    // Recalculate distances and update results list
    calculateAndDisplayToilets();
    
    // If there is a currently selected toilet, update route and drawer details
    if (selectedToiletId) {
        const selectedToilet = toiletsData.find(t => t.id === selectedToiletId);
        if (selectedToilet) {
            fetchActualWalkingRoute(selectedToilet);
        }
    }
}

// Search location using Nominatim API and teleport userCoords
async function searchAndSetLocation() {
    const inputEl = document.getElementById("search-location-input");
    if (!inputEl) return;
    
    const query = inputEl.value.trim();
    if (!query) {
        alert("請輸入要搜尋的地址或地標名稱！");
        return;
    }
    
    const btnEl = document.getElementById("search-location-btn");
    let originalBtnHtml = "";
    if (btnEl) {
        originalBtnHtml = btnEl.innerHTML;
        btnEl.disabled = true;
        btnEl.textContent = "搜尋中...";
    }
    
    try {
        // Check if the query is a coordinate pair (lat, lng)
        const latLngPattern = /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)\s*,\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;
        if (latLngPattern.test(query)) {
            const parts = query.split(',').map(p => parseFloat(p.trim()));
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                const lat = parts[0];
                const lng = parts[1];
                await setUserLocation(lat, lng);
                map.setView([lat, lng], 15);
                return;
            }
        }

        // Query OpenStreetMap Nominatim Search API
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&accept-language=zh-TW`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Nominatim API response failed");
        
        const data = await res.json();
        if (data && data.length > 0) {
            const firstResult = data[0];
            const lat = parseFloat(firstResult.lat);
            const lng = parseFloat(firstResult.lon);
            
            // Set User location
            await setUserLocation(lat, lng);
            
            // Center map smoothly on the searched location
            map.setView([lat, lng], 15);
        } else {
            alert(`找不到關於「${query}」的地點。請嘗試輸入更具體的路名、大樓或地標名稱。`);
        }
    } catch (err) {
        console.error("Nominatim Search API failed:", err);
        alert("搜尋地點失敗，請檢查網路連線或稍後再試。");
    } finally {
        if (btnEl) {
            btnEl.disabled = false;
            btnEl.innerHTML = originalBtnHtml;
        }
    }
}

// Helper to get Lucide icon name by toilet type
function getIconName(type) {
    switch(type) {
        case '超商': return 'shopping-bag';
        case '捷運': return 'train-front';
        case '百貨': return 'shopping-cart';
        case '商家': return 'store';
        default: return 'droplet';
    }
}

// Render toilet markers on the map
function renderToiletMarkers() {
    // Clear old markers
    toiletMarkers.forEach(item => map.removeLayer(item.markerObject));
    toiletMarkers = [];

    const filtered = filterToiletData(toiletsData, activeFilter);

    filtered.forEach(toilet => {
        const iconName = getIconName(toilet.type);
        // Create custom Leaflet Marker HTML
        const iconHtml = `
            <div class="custom-marker-pin ${selectedToiletId === toilet.id ? 'active' : ''}" id="pin-${toilet.id}">
                <i data-lucide="${iconName}" class="custom-marker-icon"></i>
            </div>
        `;

        const customIcon = L.divIcon({
            className: 'custom-div-icon toilet-marker-icon',
            html: iconHtml,
            iconSize: [38, 38],
            iconAnchor: [19, 38] // Bottom center of pin
        });

        const marker = L.marker(toilet.coords, { icon: customIcon }).addTo(map);
        
        // Marker Click Action
        marker.on('click', () => {
            selectToilet(toilet);
        });

        toiletMarkers.push({
            id: toilet.id,
            markerObject: marker
        });
    });

    // Re-create icons inside leaflet markers
    lucide.createIcons();
}

// Filter mock data helper
function filterToiletData(data, filter) {
    return data.filter(item => {
        if (filter === 'all') return true;
        if (filter === 'accessible') return item.features.accessible;
        if (filter === 'baby') return item.features.baby;
        if (filter === 'free') return item.features.free;
        if (filter === 'rating') return item.rating >= 4.0;
        return true;
    });
}

// Distance Calculation (Haversine Formula)
function getDistance(coords1, coords2) {
    const lat1 = coords1[0];
    const lon1 = coords1[1];
    const lat2 = coords2[0];
    const lon2 = coords2[1];

    const R = 6371e3; // Earth radius in meters
    const phi1 = lat1 * Math.PI/180;
    const phi2 = lat2 * Math.PI/180;
    const deltaPhi = (lat2-lat1) * Math.PI/180;
    const deltaLambda = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // In meters
}

// Main logic to compute distances, sorting, and display
function calculateAndDisplayToilets() {
    // Add dynamic distance to toilets
    const toiletsWithDistance = toiletsData.map(t => {
        const dist = getDistance(userCoords, t.coords);
        return {
            ...t,
            distance: dist // meters
        };
    });

    // Sort by distance ascending
    toiletsWithDistance.sort((a, b) => a.distance - b.distance);

    // Apply active filter
    const filtered = filterToiletData(toiletsWithDistance, activeFilter);

    // Render count
    document.getElementById("results-count").textContent = filtered.length;

    // Render list
    const listContainer = document.getElementById("results-list");
    listContainer.innerHTML = "";

    if (filtered.length === 0) {
        listContainer.innerHTML = `
            <div class="loading-state">
                <i data-lucide="map-pin-off" style="width: 32px; height: 32px;"></i>
                <p>沒有符合篩選條件的公廁</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    filtered.forEach(toilet => {
        const straightDist = Math.round(toilet.distance);
        const distStr = straightDist < 1000 
            ? `直線 ${straightDist} 公尺` 
            : `直線 ${(straightDist / 1000).toFixed(1)} 公里`;
            
        // Calculate estimated walking time (average 80m/min, accounting for 1.3x road winding factor)
        const estWalkingTime = Math.ceil((toilet.distance * 1.3) / 80);
        const timeStr = `步行約 ${estWalkingTime} 分鐘`;

        const isOpenedClass = toilet.status === 'open' ? 'status-open' : (toilet.status === 'busy' ? 'status-busy' : 'status-closed');
        const statusText = toilet.status === 'open' ? '尚有空位' : (toilet.status === 'busy' ? '使用中' : '已關閉');

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
                ${toilet.features.accessible ? '<span class="tag"><i data-lucide="accessibility" style="width: 10px; height: 10px; display:inline-block; vertical-align:-1px;"></i> 無障礙</span>' : ''}
                ${toilet.features.baby ? '<span class="tag"><i data-lucide="baby" style="width: 10px; height: 10px; display:inline-block; vertical-align:-1px;"></i> 親子</span>' : ''}
                ${toilet.features.free ? '<span class="tag">免費</span>' : '<span class="tag">需低消/付費</span>'}
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

// Select a toilet: pan map, highlight card & marker, display bottom sheet
function selectToilet(toilet) {
    selectedToiletId = toilet.id;

    // Close sidebar on mobile when a toilet is selected
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    if (sidebar) sidebar.classList.remove("active");
    if (overlay) overlay.classList.remove("active");

    // Clear old route line from map
    if (currentRouteLine) {
        map.removeLayer(currentRouteLine);
        currentRouteLine = null;
    }

    // Highlight card list item
    document.querySelectorAll(".toilet-card").forEach(card => {
        if (parseInt(card.getAttribute("data-id")) === toilet.id) {
            card.classList.add("active");
            card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            card.classList.remove("active");
        }
    });

    // Update map markers classes
    document.querySelectorAll(".custom-marker-pin").forEach(pin => {
        pin.classList.remove("active");
    });
    const activePin = document.getElementById(`pin-${toilet.id}`);
    if (activePin) {
        activePin.classList.add("active");
    }

    // Pan map to toilet location
    map.setView(toilet.coords, 16);

    // Open detail drawer
    showDetailDrawer(toilet);
    
    // Fetch actual walking route from user to toilet
    fetchActualWalkingRoute(toilet);
}

// Display Detail Drawer Content
function showDetailDrawer(toilet) {
    const drawer = document.getElementById("detail-drawer");
    const content = document.getElementById("drawer-content");

    const accessibleActive = toilet.features.accessible ? 'active' : '';
    const babyActive = toilet.features.baby ? 'active' : '';
    const freeActive = toilet.features.free ? 'active' : '';

    content.innerHTML = `
        <h3 class="drawer-title">${toilet.name}</h3>
        <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px; display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
            <span style="display: flex; align-items: center; gap: 4px;">
                <i data-lucide="navigation" style="width: 12px; height: 12px;"></i>
                <span id="drawer-address-text">${toilet.address}</span>
            </span>
            <span style="display: flex; align-items: center; gap: 4px; font-weight: 500;" id="drawer-route-wrapper">
                <i data-lucide="footprints" style="width: 13px; height: 13px;"></i>
                <span id="drawer-route-text" style="color: var(--text-secondary);">正在規劃步行路徑...</span>
            </span>
        </div>
        <div class="drawer-meta">
            <span class="tag primary">${toilet.type}</span>
            <div class="card-rating">
                <i data-lucide="star"></i>
                <span>${toilet.rating.toFixed(1)}</span>
            </div>
        </div>
        
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px; line-height: 1.5;">
            ${toilet.description}
        </p>

        <div class="drawer-features">
            <div class="feature-item ${accessibleActive}">
                <i data-lucide="accessibility"></i>
                <span>無障礙洗手間</span>
            </div>
            <div class="feature-item ${babyActive}">
                <i data-lucide="baby"></i>
                <span>親子/母嬰設備</span>
            </div>
            <div class="feature-item ${freeActive}">
                <i data-lucide="circle-dollar-sign"></i>
                <span>免費使用</span>
            </div>
            <div class="feature-item active">
                <i data-lucide="clock"></i>
                <span style="font-size: 11px;">${toilet.openingHours}</span>
            </div>
        </div>

        <div class="drawer-actions">
            <button class="btn btn-primary" id="nav-btn">
                <i data-lucide="navigation"></i> 開始導航
            </button>
            <button class="btn btn-secondary" id="report-btn">
                <i data-lucide="alert-triangle"></i> 錯誤回報
            </button>
        </div>
    `;

    drawer.classList.add("active");
    lucide.createIcons();

    // If the address is not resolved yet, trigger dynamic reverse geocoding
    if (toilet.address === "詳細地址載入中...") {
        resolveAddress(toilet);
    }

    // Navigation and report events
    document.getElementById("nav-btn").addEventListener("click", () => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${toilet.coords[0]},${toilet.coords[1]}`;
        window.open(url, "_blank");
    });

    document.getElementById("report-btn").addEventListener("click", () => {
        alert(`感謝回報！我們將盡快查證關於「${toilet.name}」的狀況。`);
    });
}

// Event Listeners Configuration
function setupEventListeners() {
    // Mobile Sidebar Navigation Toggles
    const menuToggle = document.getElementById("menu-toggle");
    const closeSidebar = document.getElementById("close-sidebar");
    const sidebarOverlay = document.getElementById("sidebar-overlay");
    const sidebar = document.getElementById("sidebar");

    if (menuToggle && sidebar && sidebarOverlay) {
        menuToggle.addEventListener("click", () => {
            sidebar.classList.add("active");
            sidebarOverlay.classList.add("active");
        });
    }

    if (closeSidebar && sidebar && sidebarOverlay) {
        closeSidebar.addEventListener("click", () => {
            sidebar.classList.remove("active");
            sidebarOverlay.classList.remove("active");
        });
    }

    if (sidebarOverlay && sidebar) {
        sidebarOverlay.addEventListener("click", () => {
            sidebar.classList.remove("active");
            sidebarOverlay.classList.remove("active");
        });
    }

    // 1. Filter Chips
    const chips = document.querySelectorAll(".filter-chip");
    chips.forEach(chip => {
        chip.addEventListener("click", (e) => {
            chips.forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            activeFilter = chip.getAttribute("data-filter");
            
            // Re-render
            renderToiletMarkers();
            calculateAndDisplayToilets();

            // Close drawer when filter changes
            document.getElementById("detail-drawer").classList.remove("active");
            selectedToiletId = null;
        });
    });

    // 2. Locate Button
    document.getElementById("locate-btn").addEventListener("click", () => {
        requestUserLocation();
    });

    // 3. Close Drawer Button
    document.getElementById("close-drawer").addEventListener("click", () => {
        document.getElementById("detail-drawer").classList.remove("active");
        selectedToiletId = null;
        
        // Remove map active state pins
        document.querySelectorAll(".custom-marker-pin").forEach(pin => {
            pin.classList.remove("active");
        });
        // Remove active state cards
        document.querySelectorAll(".toilet-card").forEach(card => {
            card.classList.remove("active");
        });
        
        // Remove route line from map
        if (currentRouteLine) {
            map.removeLayer(currentRouteLine);
            currentRouteLine = null;
        }
    });

    // 4. Theme Button
    document.getElementById("theme-btn").addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute("data-theme");
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute("data-theme", nextTheme);

        // Switch Tile Layer
        map.removeLayer(activeTileLayer);
        const savedFontSize = localStorage.getItem("flush_finder_font_size") || "md";
        const options = getTileOptions(savedFontSize);
        activeTileLayer = L.tileLayer(nextTheme === 'dark' ? DARK_TILE : LIGHT_TILE, options).addTo(map);

        // Update Theme Button Icon
        const themeBtn = document.getElementById("theme-btn");
        themeBtn.innerHTML = nextTheme === 'dark' 
            ? `<i data-lucide="sun"></i>` 
            : `<i data-lucide="moon"></i>`;
        
        lucide.createIcons();
    });

    // 5. Settings Panel Toggle
    // 5. Settings Panel Toggle
    const settingsToggle = document.getElementById("settings-toggle");
    const settingsContent = document.getElementById("settings-content");
    settingsToggle.addEventListener("click", () => {
        settingsToggle.classList.toggle("active");
        settingsContent.classList.toggle("active");
    });

    // 6. Source Selection Change
    const sourceSelect = document.getElementById("source-select");
    const apiKeyContainer = document.getElementById("api-key-container");
    
    // Initial UI state setup based on saved source and API Key
    const savedSource = localStorage.getItem("flush_finder_source") || "osm";
    if (sourceSelect) sourceSelect.value = savedSource;
    if (apiKeyContainer) {
        apiKeyContainer.style.display = savedSource === "moenv" ? "block" : "none";
    }

    // Font Size Selection Setup
    const fontSizeSelect = document.getElementById("font-size-select");
    const savedFontSize = localStorage.getItem("flush_finder_font_size") || "md";
    if (fontSizeSelect) {
        fontSizeSelect.value = savedFontSize;
        fontSizeSelect.addEventListener("change", (e) => {
            const selectedSize = e.target.value;
            localStorage.setItem("flush_finder_font_size", selectedSize);
            applyFontSize(selectedSize);
        });
    }
    
    // Pre-populate the API Key input unconditionally on page load so it is never blank in settings
    const apiKeyInput = document.getElementById("api-key-input");
    const savedKey = localStorage.getItem("moenv_api_key");
    if (apiKeyInput && savedKey) {
        apiKeyInput.value = savedKey;
    }

    if (sourceSelect) {
        sourceSelect.addEventListener("change", async (e) => {
            const selectedValue = e.target.value;
            localStorage.setItem("flush_finder_source", selectedValue);
            
            if (apiKeyContainer) {
                apiKeyContainer.style.display = selectedValue === "moenv" ? "block" : "none";
            }
            
            // Reload toilets data and refresh map / list
            const resultsList = document.getElementById("results-list");
            const resultsCount = document.getElementById("results-count");
            if (resultsCount) resultsCount.textContent = "..."; // Clear stale counts
            
            resultsList.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>正在切換資料來源...</p>
                </div>
            `;
            
            await loadToiletsData();
            renderToiletMarkers();
            calculateAndDisplayToilets();
            selectNearestToilet();
        });
    }

    // 7. Save API Key Button
    const saveKeyBtn = document.getElementById("save-key-btn");
    if (saveKeyBtn) {
        saveKeyBtn.addEventListener("click", async () => {
            const keyInput = document.getElementById("api-key-input");
            const newKey = keyInput ? keyInput.value.trim() : "";
            
            if (newKey) {
                localStorage.setItem("moenv_api_key", newKey);
                alert("成功儲存 API Key！將為您載入即時環境部開放資料。");
            } else {
                localStorage.removeItem("moenv_api_key");
                alert("已清除 API Key，為您恢復本地離線資料。");
            }
            
            // Reload toilets data and refresh map / list
            const resultsList = document.getElementById("results-list");
            resultsList.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>正在載入最新資料...</p>
                </div>
            `;
            
            await loadToiletsData();
            renderToiletMarkers();
            calculateAndDisplayToilets();
            selectNearestToilet();
        });
    }

    // 8. Search location events
    const searchBtn = document.getElementById("search-location-btn");
    const searchInput = document.getElementById("search-location-input");
    
    if (searchBtn) {
        searchBtn.addEventListener("click", () => {
            searchAndSetLocation();
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener("keypress", (e) => {
            if (e.key === 'Enter') {
                searchAndSetLocation();
            }
        });
    }

    // Clear cache button click listener
    const clearCacheBtn = document.getElementById("clear-cache-btn");
    if (clearCacheBtn) {
        clearCacheBtn.addEventListener("click", async () => {
            if (confirm("是否要強制清除快取並重新載入應用程式？")) {
                if ('serviceWorker' in navigator) {
                    try {
                        const registrations = await navigator.serviceWorker.getRegistrations();
                        for (let registration of registrations) {
                            await registration.unregister();
                        }
                        console.log("Service workers unregistered successfully.");
                    } catch (err) {
                        console.warn("Failed to unregister service workers:", err);
                    }
                }
                if ('caches' in window) {
                    try {
                        const keys = await caches.keys();
                        for (let key of keys) {
                            await caches.delete(key);
                        }
                        console.log("Cache storage cleared successfully.");
                    } catch (err) {
                        console.warn("Failed to clear cache storage:", err);
                    }
                }
                window.location.href = window.location.pathname + '?t=' + Date.now();
            }
        });
    }
}

// Fetch request with abort timeout
async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 3000 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(resource, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

// Fallback load local data function
async function loadLocalDataFallback() {
    const sourceLabel = document.getElementById("data-source-label");
    if (sourceLabel) {
        sourceLabel.textContent = "本地離線資料 (備援)";
        sourceLabel.style.color = "var(--text-secondary)";
    }
    try {
        const response = await fetch('toilets_data.json');
        toiletsData = await response.json();
        console.log(`Fallback: Loaded ${toiletsData.length} records from local JSON`);
    } catch (e) {
        console.error("無法載入本地 json Fallback:", e);
        toiletsData = MOCK_TOILETS;
    }
}

// Fetch from Overpass API through secure Vercel Serverless backend proxy (to bypass CORS, DNS & browser block issues)
// Fetch from Overpass API through secure Vercel Serverless backend proxy
async function fetchOverpassData(query) {
    try {
        const url = `/api/osm?data=${encodeURIComponent(query)}`;
        const res = await fetchWithTimeout(url, { timeout: 12000 });
        if (res.ok) {
            const data = await res.json();
            if (data && data.elements) {
                return data;
            }
        }
        throw new Error("伺服器代理回傳無效的格式");
    } catch (err) {
        console.warn("OSM Backend Proxy failed:", err);
        throw err;
    }
}

// Load toilets data helper (API Proxy or local static json)
async function loadToiletsData() {
    const source = localStorage.getItem("flush_finder_source") || "osm";
    const sourceLabel = document.getElementById("data-source-label");
    const sourceSelect = document.getElementById("source-select");
    const apiKeyContainer = document.getElementById("api-key-container");
    
    // Sync UI elements
    if (sourceSelect) sourceSelect.value = source;
    if (apiKeyContainer) {
        apiKeyContainer.style.display = source === "moenv" ? "block" : "none";
    }
    
    if (source === 'moenv') {
        const apiKeyInput = document.getElementById("api-key-input");
        let apiKey = apiKeyInput ? apiKeyInput.value.trim() : "";
        
        // If the input is currently empty, try retrieving from localStorage
        if (!apiKey) {
            apiKey = localStorage.getItem("moenv_api_key") || "";
            if (apiKeyInput && apiKey) {
                apiKeyInput.value = apiKey;
            }
        } else {
            // Auto-save the key to localStorage in case the user typed it but forgot to click Save
            localStorage.setItem("moenv_api_key", apiKey);
        }
        
        sourceLabel.textContent = apiKey ? "環境部 Open Data (自訂金鑰)" : "環境部 Open Data (雲端金鑰)";
        sourceLabel.style.color = "var(--primary)";
        
        try {
            const url = apiKey ? `/api/toilets?api_key=${apiKey}` : `/api/toilets`;
            const response = await fetch(url);
            if (!response.ok) {
                const errText = await response.text();
                // Extract clean text if it contains HTML
                let cleanText = errText;
                if (errText.includes('<html') || errText.includes('<body')) {
                    if (errText.includes('該 API KEY 不存在或是已經到期。')) {
                        cleanText = '該 API KEY 不存在或是已經到期。';
                    } else {
                        cleanText = '伺服器端錯誤 (500)';
                    }
                }
                throw new Error(cleanText || `HTTP 錯誤代碼: ${response.status}`);
            }
            const data = await response.json();
            
            // Handle both flat array and wrapped records formats
            const recordsList = Array.isArray(data) ? data : (data && data.records ? data.records : null);
            
            if (recordsList && Array.isArray(recordsList)) {
                // Map real data structure to our app structure
                const apiToilets = recordsList.map((item, idx) => {
                    const lat = parseFloat(item.latitude);
                    const lng = parseFloat(item.longitude);
                    
                    // Determine features from real fields
                    const isAccessible = item.type === '無障礙廁所' || (item.name && item.name.includes('無障礙'));
                    const isBaby = item.diaper === '1' || item.diaper === '是' || (item.name && item.name.includes('親子'));
                    
                    // Mock a realistic rating based on toilet grade
                    let mockRating = 4.2;
                    if (item.grade === '特優' || item.grade === '特優級') mockRating = 4.8;
                    else if (item.grade === '優等' || item.grade === '優等級') mockRating = 4.5;
                    else if (item.grade === '普通' || item.grade === '普通級') mockRating = 3.9;
                    else if (item.grade === '加強' || item.grade === '不合格') mockRating = 3.2;

                    return {
                        id: 1000 + idx, // avoid duplicate IDs
                        name: item.name || `${item.exec || item.town || ''}公廁`,
                        coords: [lat, lng],
                        address: item.address || '',
                        type: item.type2 || "公廁",
                        rating: mockRating,
                        features: {
                            accessible: isAccessible,
                            baby: isBaby,
                            free: true // default free
                        },
                        status: idx % 8 === 0 ? "busy" : "open",
                        openingHours: (item.type2 && item.type2.includes('捷運')) ? "06:00 - 00:00" : "24 小時營業",
                        description: `管理單位: ${item.administration || item.exec || '無'}。公廁類別: ${item.type || '一般'}。公廁評級: ${item.grade || '普通'}。`
                    };
                });

                // Fetch local custom data to merge convenience stores, malls and shops
                let customToilets = [];
                try {
                    const localRes = await fetch('toilets_data.json');
                    const localData = await localRes.json();
                    // Merge local convenience stores, shops and department stores which are not in government open data
                    customToilets = localData.filter(t => t.type === '超商' || t.type === '商家' || t.type === '百貨');
                } catch (err) {
                    console.warn("無法讀取本地資料進行合併，改用 MOCK_TOILETS", err);
                    customToilets = MOCK_TOILETS.filter(t => t.type === '超商' || t.type === '商家' || t.type === '百貨');
                }

                // Combine both lists
                toiletsData = [...customToilets, ...apiToilets];
                console.log(`Loaded ${apiToilets.length} from API, merged ${customToilets.length} custom stores`);
                return;
            } else {
                throw new Error("Invalid API response format (missing records array)");
            }
        } catch (error) {
            console.error("無法自環境部 API 讀取資料，嘗試切換為本地離線資料:", error);
            alert(`載入環境部資料失敗！\n\n原因：${error.message}\n\n系統已為您自動切換為「本地離線資料」。`);
            localStorage.setItem("flush_finder_source", "local");
            await loadToiletsData();
        }
    } else if (source === 'osm') {
        sourceLabel.textContent = "OpenStreetMap (即時)";
        sourceLabel.style.color = "var(--primary)";
        
        try {
            console.log(`[OSM] Fetching toilets and fuel stations at 500m...`);
            const query = `[out:json][timeout:15];
(
  node["amenity"="toilets"](around:500, ${userCoords[0]}, ${userCoords[1]});
  way["amenity"="toilets"](around:500, ${userCoords[0]}, ${userCoords[1]});
  relation["amenity"="toilets"](around:500, ${userCoords[0]}, ${userCoords[1]});
  node["amenity"="fuel"](around:500, ${userCoords[0]}, ${userCoords[1]});
  way["amenity"="fuel"](around:500, ${userCoords[0]}, ${userCoords[1]});
  relation["amenity"="fuel"](around:500, ${userCoords[0]}, ${userCoords[1]});
);
out center;`;
            const data = await fetchOverpassData(query);
            
            if (data && data.elements) {
                toiletsData = data.elements.map((item, idx) => {
                    const lat = item.lat || (item.center && item.center.lat);
                    const lng = item.lon || (item.center && item.center.lng) || (item.center && item.center.lon);
                    if (!lat || !lng) return null;
                    const tags = item.tags || {};
                    
                    // Determine name
                    let name = tags.name;
                    if (!name) {
                        if (tags.brand) name = tags.brand;
                        else if (tags.shop === 'convenience') name = "便利商店";
                        else if (tags.amenity === 'fuel') name = tags.operator || "中油/台塑加油站";
                        else name = "公共廁所";
                    }
                    
                    if (tags.shop === 'convenience' && tags["branch"]) {
                        name += ` (${tags["branch"]})`;
                    }

                    // Determine type
                    let type = "公廁";
                    if (tags.shop === 'convenience') type = "超商";
                    else if (tags.amenity === 'fuel') type = "加油站";

                    // Features
                    const isAccessible = tags.wheelchair === 'yes' || tags.wheelchair === 'designated' || name.includes("無障礙");
                    const isBaby = tags.baby_feeding === 'yes' || tags.diaper === 'yes' || tags.changing_table === 'yes' || name.includes("親子");
                    const isFree = tags.fee === 'no' || type === '超商' || type === '加油站' || !tags.fee;

                    // Mock rating based on ID
                    const mockRating = parseFloat((3.9 + (item.id % 9) * 0.1).toFixed(1));

                    return {
                        id: item.id,
                        name: name,
                        coords: [lat, lng],
                        address: (() => {
                            const city = tags["addr:city"] || "";
                            const dist = tags["addr:district"] || tags["addr:town"] || tags["addr:suburb"] || "";
                            const street = tags["addr:street"] || tags["addr:road"] || "";
                            const house = tags["addr:housenumber"] || "";
                            const full = tags["addr:full"] || `${city}${dist}${street}${house}`;
                            return full.trim() ? full : "詳細地址載入中...";
                        })(),
                        type: type,
                        rating: mockRating,
                        features: {
                            accessible: isAccessible,
                            baby: isBaby,
                            free: isFree
                        },
                        status: idx % 9 === 0 ? "busy" : "open",
                        openingHours: tags.opening_hours || (type === '超商' ? "24 小時營業" : "24 小時營業"),
                        description: `OSM ID: ${item.id}。營運管理: ${tags.operator || '未知'}。是否有無障礙: ${tags.wheelchair || '無標記'}。`
                    };
                }).filter(t => t !== null);
                console.log(`Loaded ${toiletsData.length} records from OpenStreetMap Overpass API`);
                return;
            } else {
                throw new Error("Invalid OSM API response format");
            }
        } catch (error) {
            console.error("無法自 OSM 讀取資料，嘗試切換為環境部 Open Data:", error);
            alert("載入 OpenStreetMap 資料失敗，系統正自動切換為第二順位「環境部 Open Data」。\n\n詳細原因：" + error.message);
            localStorage.setItem("flush_finder_source", "moenv");
            await loadToiletsData();
        }
    }
    
    // Fallback/Default: Load from local toilets_data.json
    if (sourceSelect) sourceSelect.value = "local";
    sourceLabel.textContent = "本地離線資料";
    sourceLabel.style.color = "var(--text-secondary)";
    try {
        const response = await fetch('toilets_data.json');
        toiletsData = await response.json();
        console.log(`Loaded ${toiletsData.length} records from local JSON`);
    } catch (e) {
        console.error("無法載入本地 json，改用 app.js 內建模擬資料:", e);
        toiletsData = MOCK_TOILETS;
    }
}

// Fetch actual walking path and duration from OSRM API
async function fetchActualWalkingRoute(toilet) {
    const routeTextEl = document.getElementById("drawer-route-text");
    if (routeTextEl) {
        routeTextEl.textContent = "正在規劃路徑...";
    }
    
    try {
        // Start and end coordinates in [longitude, latitude] for OSRM
        const start = `${userCoords[1]},${userCoords[0]}`;
        const end = `${toilet.coords[1]},${toilet.coords[0]}`;
        const url = `https://router.project-osrm.org/route/v1/foot/${start};${end}?geometries=geojson&overview=full`;
        
        const res = await fetch(url);
        if (!res.ok) throw new Error("OSM router failed");
        const data = await res.json();
        
        if (data && data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const actualDist = route.distance; // meters
            const actualDuration = route.duration; // seconds
            const actualMins = Math.ceil(actualDuration / 60);
            
            const distStr = actualDist < 1000 
                ? `${Math.round(actualDist)}公尺` 
                : `${(actualDist / 1000).toFixed(1)}公里`;
            const timeStr = `實際步行約 ${actualMins} 分鐘`;
            
            // Update Drawer route info
            if (selectedToiletId === toilet.id && routeTextEl) {
                routeTextEl.innerHTML = `實際路程 <strong>${distStr}</strong> (${timeStr})`;
                routeTextEl.style.color = "var(--primary-hover)";
            }
            
            // Draw route on map
            if (selectedToiletId === toilet.id && route.geometry && route.geometry.coordinates) {
                // Convert [lon, lat] from GeoJSON to [lat, lon] for Leaflet
                const pathCoords = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
                
                if (currentRouteLine) {
                    map.removeLayer(currentRouteLine);
                }
                
                currentRouteLine = L.polyline(pathCoords, {
                    color: '#10b981',
                    weight: 5,
                    opacity: 0.85,
                    dashArray: '8, 8',
                    lineCap: 'round',
                    lineJoin: 'round'
                }).addTo(map);
                
                // Adjust map bounds to fit route nicely
                const bounds = L.latLngBounds([userCoords, toilet.coords]);
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        }
    } catch (err) {
        console.warn("OSRM routing failed, fallback to straight line estimate", err);
        if (selectedToiletId === toilet.id && routeTextEl) {
            const estWalkingTime = Math.ceil((toilet.distance * 1.3) / 80);
            routeTextEl.innerHTML = `預估路程 ${toilet.distance < 1000 ? `${Math.round(toilet.distance)}m` : `${(toilet.distance/1000).toFixed(1)}km`} (步行約 ${estWalkingTime} 分鐘)`;
            routeTextEl.style.color = "var(--text-secondary)";
        }
    }
}

// Reverse geocode coordinate using Nominatim API to fetch clean address dynamically
async function resolveAddress(toilet) {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${toilet.coords[0]}&lon=${toilet.coords[1]}&zoom=18&accept-language=zh-TW`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        
        if (data && data.display_name) {
            const addr = data.address;
            let cleanAddr = '';
            if (addr) {
                const city = addr.city || addr.town || addr.county || '';
                const dist = addr.suburb || addr.district || addr.village || '';
                const road = addr.road || '';
                const house = addr.house_number || '';
                cleanAddr = `${city}${dist}${road}${house}`;
            }
            
            if (!cleanAddr) {
                cleanAddr = data.display_name.replace(', 台灣', '').replace('Taiwan', '');
            }
            
            // Save to toiletsData
            toilet.address = cleanAddr;
            
            // Update Card list address if visible
            const cardAddrEl = document.querySelector(`.toilet-card[data-id="${toilet.id}"] .card-address span`);
            if (cardAddrEl) {
                cardAddrEl.textContent = cleanAddr;
            }
            
            // Update Drawer address if currently viewing this toilet
            if (selectedToiletId === toilet.id) {
                const drawerAddrEl = document.getElementById("drawer-address-text");
                if (drawerAddrEl) {
                    drawerAddrEl.textContent = cleanAddr;
                }
            }
        }
    } catch (err) {
        console.warn("Nominatim address resolution failed:", err);
        toilet.address = "請參考地圖標記定位";
        const drawerAddrEl = document.getElementById("drawer-address-text");
        if (drawerAddrEl && selectedToiletId === toilet.id) {
            drawerAddrEl.textContent = toilet.address;
        }
    }
}

// Reverse geocode coordinate using Nominatim API to fetch user's current address dynamically
async function resolveUserCurrentAddress(lat, lng) {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&accept-language=zh-TW`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        
        if (data && data.display_name) {
            const addr = data.address;
            let cleanAddr = '';
            if (addr) {
                const city = addr.city || addr.town || addr.county || '';
                const dist = addr.suburb || addr.district || '';
                const road = addr.road || '';
                const house = addr.house_number || '';
                cleanAddr = `${city}${dist}${road}${house}`;
            }
            
            if (!cleanAddr) {
                cleanAddr = data.display_name.replace(', 台灣', '').replace('Taiwan', '');
            }
            
            const locTextEl = document.getElementById("current-location-text");
            if (locTextEl) {
                locTextEl.textContent = cleanAddr;
            }
        }
    } catch (err) {
        console.warn("Failed to resolve user address:", err);
        const locTextEl = document.getElementById("current-location-text");
        if (locTextEl) {
            locTextEl.textContent = "已定位到您的位置";
        }
    }
}
