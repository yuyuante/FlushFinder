// FlushFinder Application Logic

// ==================== SAFE LOCAL STORAGE FALLBACK ====================
let safeLocalStorage;
try {
    localStorage.setItem("__test_storage__", "1");
    localStorage.removeItem("__test_storage__");
    safeLocalStorage = localStorage;
} catch (e) {
    console.warn("[LocalStorage] Blocked or throws SecurityError. Using memory-based fallback storage.");
    const memoryStore = {};
    safeLocalStorage = {
        getItem: (key) => (key in memoryStore ? memoryStore[key] : null),
        setItem: (key, value) => { memoryStore[key] = String(value); },
        removeItem: (key) => { delete memoryStore[key]; },
        clear: () => { for (let k in memoryStore) delete memoryStore[k]; }
    };
}
// Define a safe localStorage reference for the scope of this script
const safeLS = safeLocalStorage;


// ==================== CUSTOM ALERT MODAL ====================
function showCustomAlert(msg) {
    const modal = document.getElementById("custom-alert-modal");
    const msgEl = document.getElementById("custom-alert-message");
    if (modal && msgEl) {
        msgEl.textContent = msg;
        modal.classList.add("active");
    } else {
        console.log("Custom Alert Fallback: " + msg);
    }
}

// Keep window.alert override as an extra safety measure to catch other native alert calls
window.alert = function(msg) {
    showCustomAlert(msg);
};

// ==================== CUSTOM CONFIRM MODAL ====================
let customConfirmCallback = null;

function showCustomConfirm(msg, callback) {
    const modal = document.getElementById("custom-confirm-modal");
    const msgEl = document.getElementById("custom-confirm-message");
    if (modal && msgEl) {
        msgEl.textContent = msg;
        customConfirmCallback = callback;
        modal.classList.add("active");
    } else {
        // Fallback to native confirm if DOM is not ready
        if (confirm(msg)) {
            callback();
        }
    }
}

// ==================== PWA MULTI-LANGUAGE LOCALIZATION (i18n) ====================
let currentLang = "en"; // default fallback
let currentSourceLabelKey = "source_label_local"; // default fallback

const TRANSLATIONS = {
    "zh-TW": {
        "app_title": "FlushFinder - 附近廁所即時搜尋",
        "app_subtitle": "尋找身邊最舒適的方便之處",
        "locating": "正在定位您的位置...",
        "search_placeholder": "輸入地址或地標手動定位...",
        "locate": "定位",
        "location_tip": "提示：拖曳地圖上的藍色定位點，或在任一處按兩下地圖即可手動修正位置。",
        "filters_title": "設施與條件篩選",
        "filter_all": "全部",
        "filter_accessible": "無障礙",
        "filter_baby": "親子/母嬰",
        "filter_free": "免費使用",
        "filter_rating": "4星以上",
        "results_title": "附近廁所",
        "sort_by_distance": "依距離排序",
        "locating_and_loading": "正在定位並載入周邊廁所...",
        "settings_title": "資料來源設定",
        "settings_source_desc": "選擇要載入的廁所資料來源：",
        "source_osm": "OpenStreetMap (全球即時免金鑰)",
        "source_moenv": "環境部 Open Data (已配置雲端金鑰)",
        "source_local": "台灣環境部公廁與商家資料 (支援離線)",
        "settings_lang_desc": "選擇介面語言 (Language)：",
        "settings_font_desc": "設定介面與地圖字體大小：",
        "font_sm": "小 (Small)",
        "font_md": "中 (Medium - 預設)",
        "font_lg": "大 (Large)",
        "moenv_key_tip": "提示：已為您設定好雲端金鑰，直接選擇即可使用。若您有自訂金鑰，可在下方輸入並儲存以進行覆蓋：",
        "moenv_key_placeholder": "請輸入自訂 MOENV API Key",
        "save": "儲存",
        "current_source_label": "目前資料來源：",
        "force_clear_cache": "強制更新快取",
        "close_menu": "關閉選單",
        "open_menu": "開啟選單",
        "my_location": "我的位置",
        "toggle_theme": "切換深淺色地圖",
        "app_version": "App 版本: v47 (防止輸入框觸發行動端 iOS 自動縮放機制)",
        "confirm_ok": "確定",
        "confirm_cancel": "取消",
        "modal_title_notice": "系統提示",
        "radius_expand_confirm_1km": "附近 500 公尺內無公廁，是否嘗試擴大搜尋範圍至 1 公里？",
        "radius_expand_confirm_2km": "附近 1 公里內無公廁，是否嘗試擴大搜尋範圍至 2 公里？",
        "radius_max_reached": "已達到最大搜尋範圍（2公里），在此區域找不到任何公廁資訊。",
        
        "gps_locating": "正在取得 GPS 精確定位...",
        "gps_failed": "無法取得 GPS 精確定位，系統已為您使用預設或先前的位置。您可以透過搜尋欄、拖曳藍色定位點或在地圖上按兩下，手動修正位置。",
        "my_location_tooltip": "我現在的位置 (可拖曳修正)",
        "locating_places": "正在讀取附近地標...",
        "input_empty_error": "請輸入要搜尋的地址或地標名稱！",
        "searching": "搜尋中...",
        "search_failed_no_results": "找不到關於「{query}」的地點。請嘗試輸入更具體的路名、大樓或地標名稱。",
        "search_error": "搜尋地點失敗，請檢查網路連線或稍後再試。",
        "no_results": "沒有符合篩選條件的公廁",
        "distance_straight": "直線 {dist} 公尺",
        "distance_km": "直線 {dist} 公里",
        "walk_time": "步行約 {mins} 分鐘",
        "status_available": "尚有空位",
        "status_busy": "使用中",
        "status_closed": "已關閉",
        "drawer_planning_route": "正在規劃步行路徑...",
        "drawer_accessible": "無障礙洗手間",
        "drawer_baby": "親子/母嬰設備",
        "drawer_free": "免費使用",
        "drawer_start_nav": "開始導航",
        "drawer_report_error": "錯誤回報",
        "drawer_address_loading": "詳細地址載入中...",
        "report_success_toast": "感謝回報！我們將盡快查證關於「{name}」的狀況。",
        "save_key_success": "成功儲存 API Key！將為您載入即時環境部開放資料。",
        "clear_key_success": "已清除 API Key，為您恢復本地離線資料。",
        "loading_new_data": "正在載入最新資料...",
        "switching_source": "正在切換資料來源...",
        "clear_cache_confirm": "是否要強制清除快取並重新載入應用程式？",
        "data_fallback_msg": "無法自環境部 API 讀取資料，嘗試切換為本地離線資料：",
        "data_fallback_alert": "載入環境部資料失敗！\n\n原因：{reason}\n\n系統已為您自動切換為「本地離線資料」。",
        "osm_failed_alert": "載入 OpenStreetMap 資料失敗，系統已自動切換至「台灣環境部公廁與商家資料」。\n\n詳細原因：{reason}",
        "osm_fallback_local_alert": "載入 OpenStreetMap 與環境部資料皆失敗，已為您自動切換為本地離線資料。\n\n詳細原因：{reason}",
        "osm_planning_route": "正在規劃路徑...",
        "osm_actual_route": "實際路程 <strong>{dist}</strong> ({time})",
        "osm_actual_walk_time": "實際步行約 {mins} 分鐘",
        "osm_route_fallback": "預估路程 {dist} (步行約 {mins} 分鐘)",
        "address_resolved_failed": "請參考地圖標記定位",
        "address_resolved_user": "已定位到您的位置",
        "source_label_osm": "OpenStreetMap (即時)",
        "source_label_moenv_custom": "環境部 Open Data (自訂金鑰)",
        "source_label_moenv_cloud": "環境部 Open Data (雲端金鑰)",
        "source_label_local_fallback": "本地離線資料 (備援)",
        "source_label_local": "台灣環境部公廁與商家資料",
        
        "tag_accessible": "無障礙",
        "tag_baby": "親子",
        "tag_free": "免費",
        "tag_paid": "需低消/付費",
        
        "moenv_desc": "管理單位: {admin}。公廁類別: {type2}。公廁評級: {grade}。",
        "osm_desc": "OSM ID: {id}。營運管理: {operator}。是否有無障礙: {wheelchair}。",
        "source_switched_to_osm_alert": "偵測到您的位置在台灣境外，已自動將資料來源切換為 OpenStreetMap 以支援全球搜尋。"
    },
    "en": {
        "app_title": "FlushFinder - Nearby Toilet Instant Finder",
        "app_subtitle": "Find the most comfortable place near you",
        "locating": "Locating your position...",
        "search_placeholder": "Enter address or landmark...",
        "locate": "Locate",
        "location_tip": "Tip: Drag the blue marker or double click the map to manually set your location.",
        "filters_title": "Filters",
        "filter_all": "All",
        "filter_accessible": "Accessible",
        "filter_baby": "Baby Friendly",
        "filter_free": "Free Use",
        "filter_rating": "4+ Stars",
        "results_title": "Nearby Toilets",
        "sort_by_distance": "Sorted by distance",
        "locating_and_loading": "Locating and loading nearby toilets...",
        "settings_title": "Data Source Settings",
        "settings_source_desc": "Select database source:",
        "source_osm": "OpenStreetMap (Global, Live, Free)",
        "source_moenv": "MOENV Open Data (Cloud Key Configured)",
        "source_local": "MOENV Toilets & Local Stores (Offline Capable)",
        "settings_lang_desc": "Select Language:",
        "settings_font_desc": "Set UI & Map Font Size:",
        "font_sm": "Small",
        "font_md": "Medium (Default)",
        "font_lg": "Large",
        "moenv_key_tip": "Tip: Cloud Key is ready. To use your custom key, input below and save:",
        "moenv_key_placeholder": "Input custom MOENV API Key",
        "save": "Save",
        "current_source_label": "Active Data Source:",
        "force_clear_cache": "Force Clear Cache",
        "close_menu": "Close Menu",
        "open_menu": "Open Menu",
        "my_location": "My Location",
        "toggle_theme": "Toggle Dark Mode",
        "app_version": "App Version: v47 (Prevent layout zoom-in on iOS focus)",
        "confirm_ok": "OK",
        "confirm_cancel": "Cancel",
        "modal_title_notice": "Notice",
        "radius_expand_confirm_1km": "No toilets found within 500m. Expand search radius to 1km?",
        "radius_expand_confirm_2km": "No toilets found within 1km. Expand search radius to 2km?",
        "radius_max_reached": "Maximum search radius (2km) reached. No toilets found in this area.",
        
        "gps_locating": "Getting accurate GPS coordinates...",
        "gps_failed": "Could not get GPS precision location. Loaded default or previous location. You can search, drag the blue marker, or double-click to modify.",
        "my_location_tooltip": "My Position (Draggable)",
        "locating_places": "Fetching nearby locations...",
        "input_empty_error": "Please enter an address or landmark!",
        "searching": "Searching...",
        "search_failed_no_results": "Could not find any location for '{query}'. Try more specific keywords.",
        "search_error": "Search failed. Check your network connection.",
        "no_results": "No toilets match the filter",
        "distance_straight": "Straight line {dist} m",
        "distance_km": "Straight line {dist} km",
        "walk_time": "Walk approx. {mins} mins",
        "status_available": "Available",
        "status_busy": "Busy",
        "status_closed": "Closed",
        "drawer_planning_route": "Planning route...",
        "drawer_accessible": "Accessible Toilet",
        "drawer_baby": "Baby Changing Station",
        "drawer_free": "Free to Use",
        "drawer_start_nav": "Navigate",
        "drawer_report_error": "Report Error",
        "drawer_address_loading": "Loading address...",
        "report_success_toast": "Thank you for the report! We will verify '{name}' soon.",
        "save_key_success": "API Key saved! Loading MOENV Live Data.",
        "clear_key_success": "API Key cleared. Switching back to local offline data.",
        "loading_new_data": "Loading latest data...",
        "switching_source": "Switching data source...",
        "clear_cache_confirm": "Force clear cache and reload application?",
        "data_fallback_msg": "Failed to read MOENV API data, falling back to local database:",
        "data_fallback_alert": "Failed to load MOENV data!\n\nReason: {reason}\n\nAutomatically switched to offline local data.",
        "osm_failed_alert": "Failed to load OpenStreetMap data. Switched to 'MOENV Toilets & Local Stores' automatically.\n\nDetail: {reason}",
        "osm_fallback_local_alert": "Failed to load OSM and MOENV data. Automatically switched to offline local data.\n\nDetail: {reason}",
        "osm_planning_route": "Planning route...",
        "osm_actual_route": "Route: <strong>{dist}</strong> ({time})",
        "osm_actual_walk_time": "Walk approx. {mins} min",
        "osm_route_fallback": "Est. Route {dist} (Walk {mins} min)",
        "address_resolved_failed": "Refer to Map Pin location",
        "address_resolved_user": "Located your position",
        "source_label_osm": "OpenStreetMap (Live)",
        "source_label_moenv_custom": "MOENV Open Data (Custom Key)",
        "source_label_moenv_cloud": "MOENV Open Data (Cloud Key)",
        "source_label_local_fallback": "Local Offline Data (Fallback)",
        "source_label_local": "MOENV Toilets & Local Stores",
        
        "tag_accessible": "Accessible",
        "tag_baby": "Baby",
        "tag_free": "Free",
        "tag_paid": "Paid/Low Consume",
        
        "moenv_desc": "Admin: {admin}. Category: {type2}. Rating: {grade}.",
        "osm_desc": "OSM ID: {id}. Operator: {operator}. Wheelchair: {wheelchair}."
    },
    "ja": {
        "app_title": "FlushFinder - 周辺トイレリアルタイム検索",
        "app_subtitle": "あなたの近くで最も快適な場所を探す",
        "locating": "現在地を特定中...",
        "search_placeholder": "住所やランドマークを入力してください...",
        "locate": "検索",
        "location_tip": "ヒント: 青いピンをドラッグするか、地図をダブルクリックして位置を調整できます。",
        "filters_title": "施設と条件の絞り込み",
        "filter_all": "すべて",
        "filter_accessible": "多目的",
        "filter_baby": "ベビー/キッズ",
        "filter_free": "無料利用",
        "filter_rating": "星4以上",
        "results_title": "近くのトイレ",
        "sort_by_distance": "距離順で並べ替え",
        "locating_and_loading": "位置情報を取得し、周辺のトイレを読み込み中...",
        "settings_title": "データソース設定",
        "settings_source_desc": "ロードするデータソースを選択：",
        "source_osm": "OpenStreetMap (グローバル/リアルタイム)",
        "source_moenv": "環境部 Open Data (クラウドキー設定済)",
        "source_local": "環境部公衆トイレ＆店舗データ (オフライン対応)",
        "settings_lang_desc": "言語を選択 (Language)：",
        "settings_font_desc": "文字サイズの設定 (UI & 地図)：",
        "font_sm": "小",
        "font_md": "中 (デフォルト)",
        "font_lg": "大",
        "moenv_key_tip": "ヒント: クラウドキーが設定されています。カスタムキーを使用する場合は以下に入力して保存してください：",
        "moenv_key_placeholder": "カスタム MOENV API キーを入力",
        "save": "保存",
        "current_source_label": "現在のデータソース：",
        "force_clear_cache": "キャッシュの強制クリア",
        "close_menu": "メニューを閉じる",
        "open_menu": "メニューを開く",
        "my_location": "現在地",
        "toggle_theme": "テーマ切り替え",
        "app_version": "アプリバージョン: v47 (iOS入力フォーカス時のズーム防止の修正)",
        "confirm_ok": "確定",
        "confirm_cancel": "キャンセル",
        "modal_title_notice": "システム通知",
        "radius_expand_confirm_1km": "500m以内にトイレが見つかりません。検索範囲を1kmに拡大しますか？",
        "radius_expand_confirm_2km": "1km以内にトイレが見つかりません。検索範囲を2kmに拡大しますか？",
        "radius_max_reached": "最大検索範囲（2km）に達しました。この地域にトイレが見つかりませんでした。",
        
        "gps_locating": "高精度のGPS位置情報を取得中...",
        "gps_failed": "GPS位置情報を取得できませんでした。デフォルトまたは前回の位置を使用します。検索、ピンのドラッグ、または地図のダブルクリックで位置を調整できます。",
        "my_location_tooltip": "現在地 (ドラッグして移動)",
        "locating_places": "近くの場所を取得中...",
        "input_empty_error": "検索する住所またはランドマークを入力してください！",
        "searching": "検索中...",
        "search_failed_no_results": "「{query}」に一致する場所が見つかりませんでした。より具体的な言葉で試してください。",
        "search_error": "場所の検索に失敗しました。接続を確認してください。",
        "no_results": "フィルター条件に一致するトイレがありません",
        "distance_straight": "直線 {dist} m",
        "distance_km": "直線 {dist} km",
        "walk_time": "徒歩約 {mins} 分",
        "status_available": "空きあり",
        "status_busy": "使用中",
        "status_closed": "閉鎖",
        "drawer_planning_route": "ルートを検索中...",
        "drawer_accessible": "バリアフリー対応",
        "drawer_baby": "おむつ交換台あり",
        "drawer_free": "無料",
        "drawer_start_nav": "ナビ開始",
        "drawer_report_error": "エラー報告",
        "drawer_address_loading": "詳細住所を読み込み中...",
        "report_success_toast": "ご報告ありがとうございます！「{name}」の状況を調査いたします。",
        "save_key_success": "API キーを保存しました！環境部ライブデータを読み込みます。",
        "clear_key_success": "API キーをクリアしました。ローカルデータに戻ります。",
        "loading_new_data": "最新データを読み込み中...",
        "switching_source": "データソースを切り替え中...",
        "clear_cache_confirm": "キャッシュを強制クリアしてアプリを再起動しますか？",
        "data_fallback_msg": "環境部APIデータの読み込みに失敗しました。ローカルデータに切り替えます:",
        "data_fallback_alert": "環境部データの取得に失敗しました！\n\n理由: {reason}\n\nオフラインローカルデータに自動的に切り替えました。",
        "osm_failed_alert": "OpenStreetMapデータの取得に失敗しました。「環境部公衆トイレ＆店舗データ」に自動的に切り替えました。\n\n詳細: {reason}",
        "osm_fallback_local_alert": "OSMおよび環境部データの取得に失敗しました。オフラインローカルデータに自動的に切り替えました。\n\n詳細: {reason}",
        "osm_planning_route": "経路を計算中...",
        "osm_actual_route": "実際ルート: <strong>{dist}</strong> ({time})",
        "osm_actual_walk_time": "徒歩約 {mins} 分",
        "osm_route_fallback": "予想ルート {dist} (徒歩約 {mins} 分)",
        "address_resolved_failed": "地図のピン位置を参照してください",
        "address_resolved_user": "現在地を特定しました",
        "source_label_osm": "OpenStreetMap (ライブ)",
        "source_label_moenv_custom": "環境部 Open Data (カスタムキー)",
        "source_label_moenv_cloud": "環境部 Open Data (クラウドキー)",
        "source_label_local_fallback": "ローカルオフラインデータ (代替)",
        "source_label_local": "環境部公衆トイレ＆店舗データ",
        
        "tag_accessible": "多目的",
        "tag_baby": "ベビー",
        "tag_free": "無料",
        "tag_paid": "有料/要消費",
        
        "moenv_desc": "管理単位: {admin}。トイレの種類: {type2}。グレード: {grade}。",
        "osm_desc": "OSM ID: {id}。事業者: {operator}。バリアフリー: {wheelchair}。"
    },
    "sv": {
        "app_title": "FlushFinder - Hitta toaletter i närheten",
        "app_subtitle": "Hitta den mest bekväma platsen nära dig",
        "locating": "Lokaliserar din position...",
        "search_placeholder": "Ange adress eller landmärke...",
        "locate": "Sök",
        "location_tip": "Tips: Dra den blå markeringen eller dubbelklicka på kartan för att justera din position.",
        "filters_title": "Filter",
        "filter_all": "Alla",
        "filter_accessible": "Tillgänglig",
        "filter_baby": "Barnvänlig",
        "filter_free": "Gratis",
        "filter_rating": "4+ Stjärnor",
        "results_title": "Toaletter i närheten",
        "sort_by_distance": "Sorterad efter avstånd",
        "locating_and_loading": "Söker och laddar toaletter i närheten...",
        "settings_title": "Inställningar för datakälla",
        "settings_source_desc": "Välj datakälla som ska laddas:",
        "source_osm": "OpenStreetMap (Global, Live, Gratis)",
        "source_moenv": "MOENV Open Data (Molnnyckel konfigurerad)",
        "source_local": "MOENV-toaletter & butiker (offline-kapabel)",
        "settings_lang_desc": "Välj språk (Language):",
        "settings_font_desc": "Teckenstorlek för gränssnitt & karta:",
        "font_sm": "Liten",
        "font_md": "Mellan (Standard)",
        "font_lg": "Stor",
        "moenv_key_tip": "Tips: Molnnyckeln är redo. För att använda egen nyckel, ange nedan och spara:",
        "moenv_key_placeholder": "Ange anpassad MOENV API-nyckel",
        "save": "Spara",
        "current_source_label": "Aktiv datakälla:",
        "force_clear_cache": "Rensa cache",
        "close_menu": "Stäng meny",
        "open_menu": "Öppna meny",
        "my_location": "Min position",
        "toggle_theme": "Byt tema",
        "app_version": "App-version: v47 (Förhindra zoomning vid fokus på iOS)",
        "confirm_ok": "OK",
        "confirm_cancel": "Avbryt",
        "modal_title_notice": "Meddelande",
        "radius_expand_confirm_1km": "Inga toaletter hittades inom 500m. Expandera sökradien till 1km?",
        "radius_expand_confirm_2km": "Inga toaletter hittades inom 1km. Expandera sökradien till 2km?",
        "radius_max_reached": "Maximal sökradie (2km) uppnådd. Inga toaletter hittades i detta område.",
        
        "gps_locating": "Hämtar exakt GPS-position...",
        "gps_failed": "Kunde inte hämta exakt GPS-position. Laddade standard eller tidigare position. Du kan söka, dra den blå markeringen eller dubbelklicka för att ändra.",
        "my_location_tooltip": "Min position (Dra för att flytta)",
        "locating_places": "Hämtar platser i närheten...",
        "input_empty_error": "Ange en adress eller ett landmärke!",
        "searching": "Söker...",
        "search_failed_no_results": "Hittade inga platser för '{query}'. Försök med mer specifika sökord.",
        "search_error": "Sökningen misslyckades. Kontrollera din anslutning.",
        "no_results": "Inga toaletter matchar filtret",
        "distance_straight": "Rak linje {dist} m",
        "distance_km": "Rak linje {dist} km",
        "walk_time": "Gå ca {mins} min",
        "status_available": "Ledig",
        "status_busy": "Upptagen",
        "status_closed": "Stängd",
        "drawer_planning_route": "Beräknar rutt...",
        "drawer_accessible": "Tillgänglig toalett",
        "drawer_baby": "Skötbord tillgängligt",
        "drawer_free": "Gratis att använda",
        "drawer_start_nav": "Navigera",
        "drawer_report_error": "Rapportera fel",
        "drawer_address_loading": "Laddar adress...",
        "report_success_toast": "Tack för din rapport! Vi kommer att verifiera '{name}' inom kort.",
        "save_key_success": "API-nyckel sparad! Laddar MOENV live-data.",
        "clear_key_success": "API-nyckel rensad. Återgår till offline-data.",
        "loading_new_data": "Laddar senaste data...",
        "switching_source": "Byter datakälla...",
        "clear_cache_confirm": "Vill du rensa cacheminnet och starta om appen?",
        "data_fallback_msg": "Misslyckades att hämta MOENV-data, återgår till offline-databasen:",
        "data_fallback_alert": "Misslyckades att hämta MOENV-data!\n\nOrsak: {reason}\n\nÄndrade automatiskt till offline-data.",
        "osm_failed_alert": "Misslyckades att hämta OpenStreetMap-data. Ändrade automatiskt till 'MOENV-toaletter & butiker'.\n\nDetaljer: {reason}",
        "osm_fallback_local_alert": "Misslyckades att hämta OSM- och MOENV-data. Ändrade automatiskt till offline-data.\n\nDetaljer: {reason}",
        "osm_planning_route": "Planerar rutt...",
        "osm_actual_route": "Rutt: <strong>{dist}</strong> ({time})",
        "osm_actual_walk_time": "Gå ca {mins} min",
        "osm_route_fallback": "Beräknad rutt {dist} (Gå ca {mins} min)",
        "address_resolved_failed": "Hänvisa till kartnålsposition",
        "address_resolved_user": "Lokaliserat din position",
        "source_label_osm": "OpenStreetMap (Live)",
        "source_label_moenv_custom": "MOENV Open Data (Egen nyckel)",
        "source_label_moenv_cloud": "MOENV Open Data (Molnnyckel)",
        "source_label_local_fallback": "Lokal offline-data (Reserv)",
        "source_label_local": "MOENV-toaletter & butiker",
        
        "tag_accessible": "Tillgänglig",
        "tag_baby": "Barn",
        "tag_free": "Gratis",
        "tag_paid": "Betal/Låg konsumtion",
        
        "moenv_desc": "Admin: {admin}. Kategori: {type2}. Betyg: {grade}.",
        "osm_desc": "OSM ID: {id}. Operatör: {operator}. Rullstol: {wheelchair}."
    },
    "ne": {
        "app_title": "FlushFinder - नजिकैको शौचालय खोज्नुहोस्",
        "app_subtitle": "तपाईंको नजिकैको सबैभन्दा सुविधाजनक ठाउँ पत्ता लगाउनुहोस्",
        "locating": "तपाईंको स्थान पहिचान गर्दै...",
        "search_placeholder": "ठेगाना वा ल्यान्डमार्क प्रविष्ट गर्नुहोस्...",
        "locate": "खोज्नुहोस्",
        "location_tip": "सुझाव: नीलो मार्कर तान्नुहोस् वा म्यानुअल रूपमा आफ्नो स्थान सेट गर्न नक्सामा डबल क्लिक गर्नुहोस्।",
        "filters_title": "सुविधाहरू र फिल्टरहरू",
        "filter_all": "सबै",
        "filter_accessible": "पहुँचयोग्य",
        "filter_baby": "शिशु अनुकूल",
        "filter_free": "निःशुल्क प्रयोग",
        "filter_rating": "४+ तारा",
        "results_title": "नजिकैका शौचालयहरू",
        "sort_by_distance": "दूरी अनुसार क्रमबद्ध",
        "locating_and_loading": "स्थान खोज्दै र नजिकैका शौचालयहरू लोड गर्दै...",
        "settings_title": "डाटा स्रोत सेटिङहरू",
        "settings_source_desc": "लोड गर्न डाटा स्रोत चयन गर्नुहोस्:",
        "source_osm": "OpenStreetMap (विश्वव्यापी, प्रत्यक्ष, निःशुल्क)",
        "source_moenv": "MOENV खुला डाटा (क्लाउड कुञ्जी कन्फिगर गरिएको)",
        "source_local": "MOENV शौचालय र पसलहरू (अफलाइन सक्षम)",
        "settings_lang_desc": "भाषा चयन गर्नुहोस् (Language):",
        "settings_font_desc": "इन्टरफेस र नक्सा फन्ट साइज:",
        "font_sm": "सानो",
        "font_md": "मध्यम (पूर्वनिर्धारित)",
        "font_lg": "ठूलो",
        "moenv_key_tip": "सुझाव: क्लाउड कुञ्जी तयार छ। आफू अनुकूल कुञ्जी प्रयोग गर्न, तल प्रविष्ट गर्नुहोस् र बचत गर्नुहोस्:",
        "moenv_key_placeholder": "MOENV API कुञ्जी प्रविष्ट गर्नुहोस्",
        "save": "बचत गर्नुहोस्",
        "current_source_label": "सक्रिय डाटा स्रोत:",
        "force_clear_cache": "क्यास खाली गर्नुहोस्",
        "close_menu": "मेनु बन्द गर्नुहोस्",
        "open_menu": "मेनु खोल्नुहोस्",
        "my_location": "मेरो स्थान",
        "toggle_theme": "थिम स्विच गर्नुहोस्",
        "app_version": "एप संस्करण: v47 (iOS फोकसमा जुम हुनबाट रोक्ने सुधार)",
        "confirm_ok": "ठीक छ",
        "confirm_cancel": "रद्द गर्नुहोस्",
        "modal_title_notice": "सूचना",
        "radius_expand_confirm_1km": "५०० मिटर भित्र कुनै शौचालय भेटिएन। खोज दायरा १ किलोमिटरमा विस्तार गर्ने हो?",
        "radius_expand_confirm_2km": "१ किलोमिटर भित्र कुनै शौचालय भेटिएन। खोज दायरा २ किलोमिटरमा विस्तार गर्ने हो?",
        "radius_max_reached": "अधिकतम खोज दायरा (२ किमी) पुग्यो। यस क्षेत्रमा कुनै शौचालय भेटिएन।",
        
        "gps_locating": "सही GPS स्थान प्राप्त गर्दै...",
        "gps_failed": "सही GPS स्थान प्राप्त गर्न सकिएन। पूर्वनिर्धारित वा अघिल्लो स्थान लोड भयो। तपाईं खोज्न सक्नुहुन्छ, मार्कर तान्न सक्नुहुन्छ वा स्थान सेट गर्न डबल-क्लिक गर्न सक्नुहुन्छ।",
        "my_location_tooltip": "मेरो स्थान (तानुनुहोस्)",
        "locating_places": "नजिकैका ठाउँहरू खोज्दै...",
        "input_empty_error": "कृपया ठेगाना वा ल्यान्डमार्क प्रविष्ट गर्नुहोस्!",
        "searching": "खोज्दै...",
        "search_failed_no_results": "'{query}' को लागि कुनै स्थान फेला परेन। अझ स्पष्ट खोज्नुहोस्।",
        "search_error": "खोज असफल भयो। जडान जाँच गर्नुहोस्।",
        "no_results": "फिल्टरसँग मेल खाने कुनै शौचालय छैन",
        "distance_straight": "सीधा रेखा {dist} मिटर",
        "distance_km": "सीधा रेखा {dist} किमी",
        "walk_time": "हिंड्न लगभग {mins} मिनेट",
        "status_available": "उपलब्ध",
        "status_busy": "व्यस्त",
        "status_closed": "बन्द",
        "drawer_planning_route": "मार्ग योजना गर्दै...",
        "drawer_accessible": "पहुँचयोग्य शौचालय",
        "drawer_baby": "शिशु परिवर्तन स्टेशन",
        "drawer_free": "निःशुल्क प्रयोग",
        "drawer_start_nav": "नेभिगेसन सुरु गर्नुहोस्",
        "drawer_report_error": "त्रुटि रिपोर्ट",
        "drawer_address_loading": "ठेगाना लोड हुँदै...",
        "report_success_toast": "रिपोर्टको लागि धन्यवाद! हामी छिट्टै '{name}' जाँच गर्नेछौं।",
        "save_key_success": "API कुञ्जी बचत भयो! MOENV प्रत्यक्ष डाटा लोड हुँदैछ।",
        "clear_key_success": "API कुञ्जी खाली भयो। स्थानीय अफलाइन डाटामा फर्कदैछ।",
        "loading_new_data": "नयाँ डाटा लोड हुँदैछ...",
        "switching_source": "डाटा स्रोत परिवर्तन गर्दै...",
        "clear_cache_confirm": "क्यास खाली गर्न र एप पुन: लोड गर्न चाहनुहुन्छ?",
        "data_fallback_msg": "MOENV API डाटा लोड गर्न असफल भयो, स्थानीय डाटाबेसमा फर्कदैछ:",
        "data_fallback_alert": "MOENV डाटा लोड गर्न असफल भयो!\n\nकारण: {reason}\n\nस्थानीय अफलाइन डाटामा स्वचालित रूपमा स्विच भयो।",
        "osm_failed_alert": "OpenStreetMap डाटा लोड गर्न असफल भयो। 'MOENV शौचालय र पसलहरू' मा स्वचालित रूपमा स्विच गरियो।\n\nविवरण: {reason}",
        "osm_fallback_local_alert": "OSM र MOENV डाटा लोड गर्न असफल भयो। स्थानीय अफलाइन डाटामा स्वचालित रूपमा स्विच भयो।\n\nविवरण: {reason}",
        "osm_planning_route": "मार्ग योजना गर्दै...",
        "osm_actual_route": "वास्तविक मार्ग: <strong>{dist}</strong> ({time})",
        "osm_actual_walk_time": "वास्तविक पैदल यात्रा लगभग {mins} मिनेट",
        "osm_route_fallback": "अनुमानित मार्ग {dist} (पैदल यात्रा लगभग {mins} मिनेट)",
        "address_resolved_failed": "नक्सा पिन स्थान सन्दर्भ गर्नुहोस्",
        "address_resolved_user": "मेरो स्थान पहिचान गरियो",
        "source_label_osm": "OpenStreetMap (प्रत्यक्ष)",
        "source_label_moenv_custom": "MOENV खुला डाटा (अनुकूल कुञ्जी)",
        "source_label_moenv_cloud": "MOENV खुला डाटा (क्लाउड कुञ्जी)",
        "source_label_local_fallback": "स्थानीय अफलाइन डाटा (ब्याकअप)",
        "source_label_local": "MOENV शौचालय र पसलहरू",
        
        "tag_accessible": "पहुँचयोग्य",
        "tag_baby": "शिशु",
        "tag_free": "निःशुल्क",
        "tag_paid": "भुक्तानी आवश्यक",
        
        "moenv_desc": "व्यवस्थापन: {admin}। प्रकार: {type2}। ग्रेड: {grade}।",
        "osm_desc": "OSM ID: {id}। संचालक: {operator}। ह्वीलचेयर: {wheelchair}।"
    }
};

function t(key, variables = {}) {
    const langDict = TRANSLATIONS[currentLang] || TRANSLATIONS["en"];
    let text = langDict[key] || key;
    Object.keys(variables).forEach(varName => {
        text = text.replace(new RegExp(`{${varName}}`, 'g'), variables[varName]);
    });
    return text;
}

function getInitialLanguage() {
    const isManual = safeLS.getItem("flush_finder_lang_manual") === "true";
    const savedLang = safeLS.getItem("flush_finder_lang");
    if (isManual && savedLang && TRANSLATIONS[savedLang]) {
        return savedLang;
    }

    // Gather all candidate language codes from system preferences
    let candidates = [];
    
    // Prioritize primary system language
    const primaryLang = navigator.language || navigator.userLanguage;
    if (primaryLang) {
        candidates.push(primaryLang);
    }
    
    if (navigator.languages && navigator.languages.length > 0) {
        navigator.languages.forEach(lang => {
            if (lang && !candidates.includes(lang)) {
                candidates.push(lang);
            }
        });
    }

    // Find the first system language that starts with our supported language codes
    for (let systemLang of candidates) {
        if (!systemLang) continue;
        const normalized = systemLang.toLowerCase();
        
        if (normalized.startsWith("zh")) {
            return "zh-TW";
        }
        if (normalized.startsWith("ja")) {
            return "ja";
        }
        if (normalized.startsWith("sv")) {
            return "sv";
        }
        if (normalized.startsWith("ne")) {
            return "ne";
        }
        if (normalized.startsWith("en")) {
            return "en";
        }
    }

    return "en"; // Default fallback
}

function applyLanguage(lang, isManual = false) {
    if (!TRANSLATIONS[lang]) lang = "en";
    currentLang = lang;
    
    if (isManual) {
        safeLS.setItem("flush_finder_lang", lang);
        safeLS.setItem("flush_finder_lang_manual", "true");
    }
    
    // Update HTML page title and lang attribute
    document.title = t("app_title");
    document.documentElement.setAttribute("lang", lang);
    
    // Translate static elements with data-i18n
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        el.textContent = t(key);
    });
    
    // Translate data source label
    const sourceLabel = document.getElementById("data-source-label");
    if (sourceLabel) {
        sourceLabel.textContent = t(currentSourceLabelKey);
    }
    
    // Update local source option and label with active counties
    updateLocalSourceLabels();
    
    // Translate input placeholders
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.getAttribute("data-i18n-placeholder");
        el.placeholder = t(key);
    });

    // Translate attributes like title (tooltips)
    document.querySelectorAll("[data-i18n-title]").forEach(el => {
        const key = el.getAttribute("data-i18n-title");
        el.title = t(key);
    });
    
    // Sync lang selector value
    const langSelect = document.getElementById("lang-select");
    if (langSelect) langSelect.value = lang;

    // Dynamically re-render list items & map markers if toiletsData is loaded
    if (typeof toiletsData !== 'undefined' && toiletsData && toiletsData.length > 0) {
        renderToiletMarkers();
        calculateAndDisplayToilets();
        if (typeof updateUserMarker === 'function') updateUserMarker();
        
        // Re-open detail drawer if a toilet is selected
        if (selectedToiletId) {
            const selectedToilet = toiletsData.find(t => t.id === selectedToiletId);
            if (selectedToilet) {
                showDetailDrawer(selectedToilet);
                fetchActualWalkingRoute(selectedToilet);
            }
        }
    }
}

function getCurrentSourceLabelKey() {
    const source = safeLS.getItem("flush_finder_source") || "local";
    if (source === 'moenv') {
        const apiKey = safeLS.getItem("moenv_api_key") || "";
        return apiKey ? "source_label_moenv_custom" : "source_label_moenv_cloud";
    }
    if (source === 'osm') {
        return "source_label_osm";
    }
    return "source_label_local";
}

function initLanguage() {
    const lang = getInitialLanguage();
    currentSourceLabelKey = getCurrentSourceLabelKey();
    applyLanguage(lang, false);
}
// ================================================================================

// County geographic bounding boxes for Taiwan (min/max latitude and longitude)
const COUNTY_BOUNDS = {
    "taipei":       { name: "臺北市", minLat: 24.960, maxLat: 25.210, minLng: 121.450, maxLng: 121.670 },
    "new_taipei":   { name: "新北市", minLat: 24.670, maxLat: 25.300, minLng: 121.280, maxLng: 122.020 },
    "taoyuan":      { name: "桃園市", minLat: 24.600, maxLat: 25.130, minLng: 120.970, maxLng: 121.490 },
    "taichung":     { name: "臺中市", minLat: 24.000, maxLat: 24.440, minLng: 120.430, maxLng: 121.450 },
    "tainan":       { name: "臺南市", minLat: 22.880, maxLat: 23.410, minLng: 120.020, maxLng: 120.650 },
    "kaohsiung":    { name: "高雄市", minLat: 22.450, maxLat: 23.470, minLng: 120.150, maxLng: 121.110 },
    "keelung":      { name: "基隆市", minLat: 25.090, maxLat: 25.190, minLng: 121.610, maxLng: 121.810 },
    "hsinchu_city": { name: "新竹市", minLat: 24.730, maxLat: 24.860, minLng: 120.890, maxLng: 121.020 },
    "hsinchu_county": { name: "新竹縣", minLat: 24.580, maxLat: 24.990, minLng: 120.960, maxLng: 121.400 },
    "miaoli":       { name: "苗栗縣", minLat: 24.280, maxLat: 24.710, minLng: 120.630, maxLng: 121.280 },
    "changhua":     { name: "彰化縣", minLat: 23.800, maxLat: 24.210, minLng: 120.300, maxLng: 120.650 },
    "nantou":       { name: "南投縣", minLat: 23.430, maxLat: 24.210, minLng: 120.650, maxLng: 121.440 },
    "yunlin":       { name: "雲林縣", minLat: 23.500, maxLat: 23.850, minLng: 120.120, maxLng: 120.730 },
    "chiayi_city":  { name: "嘉義市", minLat: 23.430, maxLat: 23.520, minLng: 120.400, maxLng: 120.490 },
    "chiayi_county": { name: "嘉義縣", minLat: 23.190, maxLat: 23.630, minLng: 120.130, maxLng: 120.820 },
    "pingtung":     { name: "屏東縣", minLat: 21.890, maxLat: 22.880, minLng: 120.340, maxLng: 120.930 },
    "yilan":        { name: "宜蘭縣", minLat: 24.300, maxLat: 24.990, minLng: 121.310, maxLng: 121.980 },
    "hualien":      { name: "花蓮縣", minLat: 23.090, maxLat: 24.450, minLng: 121.280, maxLng: 121.780 },
    "taitung":      { name: "臺東縣", minLat: 22.000, maxLat: 23.450, minLng: 120.730, maxLng: 121.610 },
    "penghu":       { name: "澎湖縣", minLat: 23.180, maxLat: 23.790, minLng: 119.420, maxLng: 119.730 },
    "kinmen":       { name: "金門縣", minLat: 24.380, maxLat: 24.540, minLng: 118.210, maxLng: 118.500 },
    "lienchiang":   { name: "連江縣", minLat: 25.920, maxLat: 26.390, minLng: 119.910, maxLng: 120.500 }
};

let countyCache = {}; // Cache for loaded counties JSON data
let lastQueryCoords = null; // Last center coordinates used to evaluate county bounds

// Configuration & Default Location (Daan District, Taipei)
const DEFAULT_COORDS = [25.033964, 121.543413]; 
let userCoords = [...DEFAULT_COORDS];
const MAX_DISPLAY_TOILETS = 50; // 限制地圖標記與側邊卡片最大顯示數量，防止瀏覽器崩潰
let map = null;
let toiletMarkers = [];
let userMarker = null;
let currentTheme = 'light';
let activeFilter = 'all';
let selectedToiletId = null;
let toiletsData = [];
let currentRouteLine = null;
let currentSearchRadius = 500; // Default search radius in meters for OSM

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
    // Initialize Language first
    initLanguage();

    // Initialize Font Size
    initFontSize();

    // Initialize Icons
    lucide.createIcons();

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
                .then(reg => {
                    console.log('Service Worker registered successfully!', reg.scope);
                    
                    // Listen for updates to trigger automatic reload
                    reg.addEventListener('updatefound', () => {
                        const newWorker = reg.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'activated') {
                                    console.log('[SW] New service worker activated, reloading...');
                                    window.location.reload();
                                }
                            });
                        }
                    });
                })
                .catch(err => console.warn('Service Worker registration failed:', err));
        });
        
        // Auto reload when the controller changes (e.g. claim() called on new service worker activation)
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
                refreshing = true;
                console.log('[SW] Controller changed, auto-reloading page...');
                window.location.reload();
            }
        });
    }

    // Load toilets data asynchronously (non-blocking)
    loadToiletsData().then(() => {
        renderToiletMarkers();
        calculateAndDisplayToilets();
        selectNearestToilet();
    }).catch(err => {
        console.error("無法載入廁所資料:", err);
    });
}

// Font Size Settings Management
function initFontSize() {
    const savedSize = safeLS.getItem("flush_finder_font_size") || "md";
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
    const savedFontSize = safeLS.getItem("flush_finder_font_size") || "md";
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
        await setUserLocation(lat, lng, true);
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
            locTextEl.textContent = t("gps_locating");
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                await setUserLocation(lat, lng, true);
                map.setView(userCoords, 15);
                selectNearestToilet();
            },
            async (error) => {
                console.warn("無法取得精確定位，使用預設或先前位置:", error.message);
                showCustomAlert(t("gps_failed"));
                await setUserLocation(userCoords[0], userCoords[1], true);
                map.setView(userCoords, 15);
                selectNearestToilet();
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    } else {
        setUserLocation(userCoords[0], userCoords[1], true);
        selectNearestToilet();
    }
}

// Auto-select nearest toilet based on current data source
function selectNearestToilet(panMap = true) {
    const displayed = getSortedAndFilteredToilets();
    if (displayed.length > 0) {
        selectToilet(displayed[0], panMap);
    } else {
        clearSelectedToilet();
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
    
    userMarker.bindTooltip(t("my_location_tooltip"), { 
        permanent: true, 
        direction: 'top', 
        className: 'user-location-tooltip',
        offset: [0, -5] 
    });

    // Handle marker dragging
    userMarker.on('dragend', async function(e) {
        const position = e.target.getLatLng();
        await setUserLocation(position.lat, position.lng, true);
    });
}

// Set User Location (teleport and reload data/calculations)
async function setUserLocation(lat, lng, isManualReload = false) {
    userCoords = [lat, lng];
    
    // Update user marker position and tooltip
    updateUserMarker();
    
    // Resolve user's actual location address in header
    resolveUserCurrentAddress(lat, lng);
    
    // Check if within Taiwan bounds
    const isWithinTaiwan = lat >= 21.8 && lat <= 25.4 && lng >= 119.3 && lng <= 122.1;
    let source = safeLS.getItem("flush_finder_source") || "local";
    
    if (!isWithinTaiwan && source === 'local') {
        console.log(`[Source Auto Switch] Position [${lat}, ${lng}] is outside Taiwan. Switching source to 'osm'...`);
        source = 'osm';
        safeLS.setItem("flush_finder_source", "osm");
        showCustomAlert(t("source_switched_to_osm_alert"));
    }
    
    // If OpenStreetMap is the source, refetch to load new regional data
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
        await loadToiletsData();
    } else if (source === 'local') {
        let shouldReload = isManualReload;
        if (!shouldReload) {
            if (!lastQueryCoords) {
                shouldReload = true;
            } else {
                const dist = getDistance(userCoords, lastQueryCoords);
                if (dist > 1000) { // 1 km threshold
                    shouldReload = true;
                }
            }
        }
        
        if (shouldReload) {
            await loadToiletsData();
        }
    }
    
    // Re-render markers and side panel list once
    renderToiletMarkers();
    calculateAndDisplayToilets();
    
    // If it is a manual user action (search, drag, double-click, my location button),
    // automatically select the new nearest toilet.
    if (isManualReload) {
        // Close sidebar so the map is visible after location change
        const sidebarEl = document.getElementById("sidebar");
        const overlayEl = document.getElementById("sidebar-overlay");
        if (sidebarEl) sidebarEl.classList.remove("active");
        if (overlayEl) overlayEl.classList.remove("active");
        currentSearchRadius = 500; // Reset search radius on manual interaction
        selectNearestToilet(false);
    } else if (selectedToiletId) {
        // If it is a periodic/background reload, keep the current selection and update path
        const selectedToilet = toiletsData.find(t => t.id === selectedToiletId);
        if (selectedToilet) {
            fetchActualWalkingRoute(selectedToilet);
        }
    }
}

// Helper to simplify Taiwan address search queries to street level by stripping house numbers
function simplifyAddress(addr) {
    if (!/[\u4e00-\u9fa5]/.test(addr)) {
        return addr;
    }
    
    // Strip leading postal code if any (e.g. 3 or 5 digits at the start)
    let cleaned = addr.replace(/^\s*\d{3,5}\s+/, '');
    
    // Find the first index of an arabic digit
    const match = cleaned.match(/\d/);
    if (match) {
        let simplified = cleaned.substring(0, match.index).trim();
        simplified = simplified.replace(/[,，\s\-#之號]+$/, '');
        if (simplified.length >= 3) {
            return simplified;
        }
    }
    return addr;
}

// Search location using Nominatim API and teleport userCoords
async function searchAndSetLocation() {
    const inputEl = document.getElementById("search-location-input");
    if (!inputEl) return;
    
    const query = inputEl.value.trim();
    if (!query) {
        showCustomAlert(t("input_empty_error"));
        return;
    }
    
    const btnEl = document.getElementById("search-location-btn");
    let originalBtnHtml = "";
    if (btnEl) {
        originalBtnHtml = btnEl.innerHTML;
        btnEl.disabled = true;
        btnEl.textContent = t("searching");
    }
    
    try {
        // Check if the query is a coordinate pair (lat, lng)
        const latLngPattern = /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)\s*,\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;
        if (latLngPattern.test(query)) {
            const parts = query.split(',').map(p => parseFloat(p.trim()));
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                const lat = parts[0];
                const lng = parts[1];
                await setUserLocation(lat, lng, true);
                map.setView([lat, lng], 15);
                return;
            }
        }

        // Query OpenStreetMap Nominatim Search API
        let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&accept-language=${currentLang}`;
        let res = await fetchWithTimeout(url);
        if (!res.ok) throw new Error("Nominatim API response failed");
        
        let data = await res.json();
        
        // Fallback: If no results found, simplify the address and try again
        if ((!data || data.length === 0) && query) {
            const simplifiedQuery = simplifyAddress(query);
            if (simplifiedQuery && simplifiedQuery !== query) {
                console.log(`Original query [${query}] returned no results. Trying simplified query [${simplifiedQuery}]...`);
                url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(simplifiedQuery)}&limit=1&accept-language=${currentLang}`;
                res = await fetchWithTimeout(url);
                if (res.ok) {
                    data = await res.json();
                }
            }
        }
        
        if (data && data.length > 0) {
            const firstResult = data[0];
            const lat = parseFloat(firstResult.lat);
            const lng = parseFloat(firstResult.lon);
            
            // Set User location
            await setUserLocation(lat, lng, true);
            
            // Center map smoothly on the searched location
            map.setView([lat, lng], 15);
        } else {
            showCustomAlert(t("search_failed_no_results", { query }));
        }
    } catch (err) {
        console.error("Nominatim Search API failed:", err);
        showCustomAlert(t("search_error"));
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

// Render toilet markers on the map
function renderToiletMarkers() {
    // Clear old markers
    toiletMarkers.forEach(item => map.removeLayer(item.markerObject));
    toiletMarkers = [];

    // 修改：改用 getSortedAndFilteredToilets() 限制前 50 筆
    const displayedToilets = getSortedAndFilteredToilets();

    displayedToilets.forEach(toilet => {
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
            selectToilet(toilet, true, true);
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
    // 修改：改用 getSortedAndFilteredToilets() 限制前 50 筆
    const displayedToilets = getSortedAndFilteredToilets();
    
    // 側邊欄上方標頭顯示篩選後的周邊 5 公里內數量（不受 50 筆限制，提供直觀統計）
    const nearbyToilets = toiletsData.map(t => {
        const dist = getDistance(userCoords, t.coords);
        return { ...t, distance: dist };
    }).filter(t => t.distance <= 5000); // 5000 公尺 (5公里)
    
    const totalCount = filterToiletData(nearbyToilets, activeFilter).length;
    document.getElementById("results-count").textContent = totalCount;

    // Render list
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
            
        // Calculate estimated walking time (average 80m/min, accounting for 1.3x road winding factor)
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
            selectToilet(toilet, true, true);
        });

        listContainer.appendChild(card);
    });

    lucide.createIcons();
}

// Clear selected toilet and close detail drawer
function clearSelectedToilet() {
    selectedToiletId = null;
    
    const drawer = document.getElementById("detail-drawer");
    if (drawer) {
        drawer.classList.remove("active");
    }
    
    if (currentRouteLine) {
        map.removeLayer(currentRouteLine);
        currentRouteLine = null;
    }
    
    document.querySelectorAll(".toilet-card").forEach(card => {
        card.classList.remove("active");
    });

    document.querySelectorAll(".custom-marker-pin").forEach(pin => {
        pin.classList.remove("active");
    });
}

// Select a toilet: pan map, highlight card & marker, display bottom sheet
function selectToilet(toilet, panMap = true, closeSidebarMobile = false) {
    selectedToiletId = toilet.id;

    // Close sidebar on mobile when a toilet is selected explicitly by the user
    if (closeSidebarMobile) {
        const sidebar = document.getElementById("sidebar");
        const overlay = document.getElementById("sidebar-overlay");
        if (sidebar) sidebar.classList.remove("active");
        if (overlay) overlay.classList.remove("active");
    }

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
    if (panMap) {
        map.setView(toilet.coords, 16);
    }

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
                <span id="drawer-route-text" style="color: var(--text-secondary);">${t("drawer_planning_route")}</span>
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
                <span>${t("drawer_accessible")}</span>
            </div>
            <div class="feature-item ${babyActive}">
                <i data-lucide="baby"></i>
                <span>${t("drawer_baby")}</span>
            </div>
            <div class="feature-item ${freeActive}">
                <i data-lucide="circle-dollar-sign"></i>
                <span>${t("drawer_free")}</span>
            </div>
            <div class="feature-item active">
                <i data-lucide="clock"></i>
                <span style="font-size: 11px;">${toilet.openingHours}</span>
            </div>
        </div>

        <div class="drawer-actions">
            <button class="btn btn-primary" id="nav-btn">
                <i data-lucide="navigation"></i> ${t("drawer_start_nav")}
            </button>
            <button class="btn btn-secondary" id="report-btn">
                <i data-lucide="alert-triangle"></i> ${t("drawer_report_error")}
            </button>
        </div>
    `;

    drawer.classList.add("active");
    lucide.createIcons();

    // If the address is not resolved yet, trigger dynamic reverse geocoding
    if (toilet.address === t("drawer_address_loading")) {
        resolveAddress(toilet);
    }

    // Navigation and report events
    document.getElementById("nav-btn").addEventListener("click", () => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${toilet.coords[0]},${toilet.coords[1]}`;
        window.open(url, "_blank");
    });

    document.getElementById("report-btn").addEventListener("click", () => {
        showCustomAlert(t("report_success_toast", { name: toilet.name }));
    });
}

// Event Listeners Configuration
function setupEventListeners() {
    // Custom Alert Modal Close Event
    const customAlertModal = document.getElementById("custom-alert-modal");
    const customAlertCloseBtn = document.getElementById("custom-alert-close-btn");
    if (customAlertModal && customAlertCloseBtn) {
        customAlertCloseBtn.addEventListener("click", () => {
            customAlertModal.classList.remove("active");
        });
    }

    // Custom Confirm Modal Events
    const customConfirmModal = document.getElementById("custom-confirm-modal");
    const customConfirmOkBtn = document.getElementById("custom-confirm-ok-btn");
    const customConfirmCancelBtn = document.getElementById("custom-confirm-cancel-btn");
    
    if (customConfirmModal && customConfirmOkBtn && customConfirmCancelBtn) {
        customConfirmOkBtn.addEventListener("click", () => {
            customConfirmModal.classList.remove("active");
            if (customConfirmCallback) {
                customConfirmCallback();
                customConfirmCallback = null;
            }
        });
        
        customConfirmCancelBtn.addEventListener("click", () => {
            customConfirmModal.classList.remove("active");
            customConfirmCallback = null;
        });
    }

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
        const savedFontSize = safeLS.getItem("flush_finder_font_size") || "md";
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
    
    // Initial UI state setup based on saved source
    let savedSource = safeLS.getItem("flush_finder_source") || "local";
    if (savedSource === "moenv") {
        savedSource = "local";
        safeLS.setItem("flush_finder_source", "local");
    }
    if (sourceSelect) sourceSelect.value = savedSource;

    // Language Selection Setup
    const langSelect = document.getElementById("lang-select");
    if (langSelect) {
        langSelect.value = currentLang;
        langSelect.addEventListener("change", (e) => {
            applyLanguage(e.target.value, true);
        });
    }

    // Font Size Selection Setup
    const fontSizeSelect = document.getElementById("font-size-select");
    const savedFontSize = safeLS.getItem("flush_finder_font_size") || "md";
    if (fontSizeSelect) {
        fontSizeSelect.value = savedFontSize;
        fontSizeSelect.addEventListener("change", (e) => {
            const selectedSize = e.target.value;
            safeLS.setItem("flush_finder_font_size", selectedSize);
            applyFontSize(selectedSize);
        });
    }

    if (sourceSelect) {
        sourceSelect.addEventListener("change", async (e) => {
            let selectedValue = e.target.value;
            if (selectedValue === "moenv") {
                selectedValue = "local";
                safeLS.setItem("flush_finder_source", "local");
                if (sourceSelect) sourceSelect.value = "local";
            } else {
                safeLS.setItem("flush_finder_source", selectedValue);
            }
            
            // Reload toilets data and refresh map / list
            const resultsList = document.getElementById("results-list");
            const resultsCount = document.getElementById("results-count");
            if (resultsCount) resultsCount.textContent = "..."; // Clear stale counts
            
            resultsList.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p data-i18n="switching_source">${t("switching_source")}</p>
                </div>
            `;
            
            currentSearchRadius = 500; // Reset search radius to default 500m on manual source change
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
        clearCacheBtn.addEventListener("click", () => {
            showCustomConfirm(t("clear_cache_confirm"), async () => {
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
            });
        });
    }
}

// Fetch request with abort timeout
async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 8000 } = options;
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
    safeLS.setItem("flush_finder_source", "local");
    await loadToiletsData();
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
            throw new Error("地圖伺服器回傳格式不正確");
        } else {
            // Read error text from response
            const contentType = res.headers.get("content-type") || "";
            if (contentType.includes("application/json")) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `HTTP 錯誤碼: ${res.status}`);
            } else {
                const errText = await res.text().catch(() => "");
                // If it is Vercel's timeout/error HTML page, extract a clean description
                if (errText.includes("504") || errText.includes("GATEWAY_TIMEOUT") || errText.includes("Gateway Timeout")) {
                    throw new Error("伺服器連線超時 (504 Gateway Timeout)");
                } else if (errText.includes("502") || errText.includes("BAD_GATEWAY") || errText.includes("Bad Gateway")) {
                    throw new Error("伺服器連線錯誤 (502 Bad Gateway)");
                }
                throw new Error(`伺服器連線失敗 (HTTP ${res.status})`);
            }
        }
    } catch (err) {
        console.warn("OSM Backend Proxy failed:", err);
        throw err;
    }
}

let activeLoadPromise = null;
let activeLoadCounties = null;
let activeLoadSource = null;

// Load toilets data helper (API Proxy or local static json)
async function loadToiletsData() {
    let source = safeLS.getItem("flush_finder_source") || "local";
    if (source === "moenv") {
        source = "local";
        safeLS.setItem("flush_finder_source", "local");
    }
    
    // Evaluate target counties to fetch for local source
    const countiesToLoad = source === 'local' ? getOverlapCounties(userCoords[0], userCoords[1]).sort().join(",") : "";

    // Reuse the active loading Promise if details match exactly
    if (activeLoadPromise && activeLoadSource === source && activeLoadCounties === countiesToLoad) {
        console.log(`[Load Lock] Sharing existing active loading Promise for source: ${source}, counties: ${countiesToLoad}`);
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

// Perform the actual toilets data loading (wrapped from original loadToiletsData)
async function performLoadToiletsData(source) {
    const sourceLabel = document.getElementById("data-source-label");
    const sourceSelect = document.getElementById("source-select");
    
    if (sourceSelect) sourceSelect.value = source;
    
    // Clear stale toilets data and selection immediately when loading starts
    toiletsData = [];
    clearSelectedToilet();
    
    if (source === 'osm') {
        currentSourceLabelKey = "source_label_osm";
        if (sourceLabel) {
            sourceLabel.textContent = t(currentSourceLabelKey);
            sourceLabel.style.color = "var(--primary)";
        }
        
        try {
            console.log(`[OSM] Fetching toilets and fuel stations at ${currentSearchRadius}m...`);
            const query = `[out:json][timeout:15];
(
  node["amenity"="toilets"](around:${currentSearchRadius}, ${userCoords[0]}, ${userCoords[1]});
  way["amenity"="toilets"](around:${currentSearchRadius}, ${userCoords[0]}, ${userCoords[1]});
  relation["amenity"="toilets"](around:${currentSearchRadius}, ${userCoords[0]}, ${userCoords[1]});
  node["amenity"="fuel"](around:${currentSearchRadius}, ${userCoords[0]}, ${userCoords[1]});
  way["amenity"="fuel"](around:${currentSearchRadius}, ${userCoords[0]}, ${userCoords[1]});
  relation["amenity"="fuel"](around:${currentSearchRadius}, ${userCoords[0]}, ${userCoords[1]});
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
                            return full.trim() ? full : t("drawer_address_loading");
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
                        description: t("osm_desc", { id: item.id, operator: tags.operator || 'N/A', wheelchair: tags.wheelchair || 'N/A' })
                    };
                }).filter(t => t !== null);
                console.log(`Loaded ${toiletsData.length} records from OpenStreetMap Overpass API`);
                if (toiletsData.length === 0) {
                    const isUserWithinTaiwan = userCoords[0] >= 21.8 && userCoords[0] <= 25.4 && userCoords[1] >= 119.3 && userCoords[1] <= 122.1;
                    if (isUserWithinTaiwan) {
                        console.warn("OSM 找不到資料，將無縫切換為台灣環境部離線資料...");
                        safeLS.setItem("flush_finder_source", "local");
                        await loadToiletsData();
                    } else {
                        console.warn("OSM 找不到資料，但使用者在境外，不切換為本地離線資料");
                        handleOsmNoResultsExpansion();
                    }
                    return;
                }
                return;
            } else {
                throw new Error("Invalid OSM API response format");
            }
        } catch (error) {
            console.error("無法自 OSM 讀取資料，嘗試切換為台灣環境部離線資料:", error);
            showCustomAlert(t("osm_failed_alert", { reason: error.message }));
            
            const isUserWithinTaiwan = userCoords[0] >= 21.8 && userCoords[0] <= 25.4 && userCoords[1] >= 119.3 && userCoords[1] <= 122.1;
            if (isUserWithinTaiwan) {
                safeLS.setItem("flush_finder_source", "local");
                await loadToiletsData();
            } else {
                console.warn("載入 OSM 資料失敗，但使用者在境外，不切換為本地離線資料");
                toiletsData = []; // Clear current toilets
            }
            return;
        }
    }
    
    // Fallback/Default: Load county segmented local JSON files
    if (sourceSelect) sourceSelect.value = "local";
    currentSourceLabelKey = "source_label_local";
    if (sourceLabel) {
        sourceLabel.textContent = t(currentSourceLabelKey);
        sourceLabel.style.color = "var(--text-secondary)";
    }
    
    try {
        const countiesToLoad = getOverlapCounties(userCoords[0], userCoords[1]);
        console.log(`[Local Fallback] User coordinates: ${userCoords[0]}, ${userCoords[1]}. Loading counties:`, countiesToLoad);
        
        // Fetch missing counties in parallel
        const fetchPromises = countiesToLoad.map(async (county) => {
            if (countyCache[county]) {
                return countyCache[county];
            }
            try {
                const response = await fetch(`data/${county}.json`);
                if (!response.ok) {
                    throw new Error("HTTP error " + response.status);
                }
                const data = await response.json();
                countyCache[county] = data;
                return data;
            } catch (err) {
                console.warn(`[Local Fallback] Failed to fetch data for county: ${county}`, err);
                return [];
            }
        });
        
        const results = await Promise.all(fetchPromises);
        
        // Merge and deduplicate
        let mergedToilets = [];
        const seen = new Set();
        for (const list of results) {
            if (!list || !Array.isArray(list)) continue;
            for (const t of list) {
                // Deduplicate by coords and name
                const hash = `${t.coords[0].toFixed(5)},${t.coords[1].toFixed(5)}_${t.name}`;
                if (!seen.has(hash)) {
                    seen.add(hash);
                    mergedToilets.push(t);
                }
            }
        }
        
        toiletsData = mergedToilets;
        lastQueryCoords = [...userCoords];
        console.log(`[Local Fallback] Loaded ${toiletsData.length} unique toilets across ${countiesToLoad.length} counties`);
        
        if (toiletsData.length === 0) {
            console.warn("[Local Fallback] No toilets found in county databases, falling back to mock data");
            toiletsData = MOCK_TOILETS;
        }
    } catch (e) {
        console.error("無法載入本地分區 JSON 資料，改用 app.js 內建模擬資料:", e);
        toiletsData = MOCK_TOILETS;
    }
    
    // Update local source dropdown option and active status label
    updateLocalSourceLabels();
}

// Update the options list and active label for regional fallback to list loaded counties
function updateLocalSourceLabels() {
    const countiesToLoad = getOverlapCounties(userCoords[0], userCoords[1]);
    const countyNames = countiesToLoad.map(c => COUNTY_BOUNDS[c] ? COUNTY_BOUNDS[c].name : c).join("、");
    
    // Suffix format based on current language
    let suffix = "";
    if (currentLang === "zh-TW") {
        suffix = ` (已載入：${countyNames})`;
    } else if (currentLang === "ja") {
        suffix = ` (ロード済み: ${countyNames})`;
    } else if (currentLang === "sv") {
        suffix = ` (laddad: ${countyNames})`;
    } else if (currentLang === "ne") {
        suffix = ` (लोड गरिएको: ${countyNames})`;
    } else {
        suffix = ` (Loaded: ${countyNames})`;
    }
    
    // 1. Update the option in the dropdown select
    const localOption = document.querySelector('option[value="local"]');
    if (localOption) {
        localOption.textContent = t("source_local") + suffix;
    }
    
    // 2. Update the status label if currently active
    const sourceLabel = document.getElementById("data-source-label");
    if (sourceLabel && (currentSourceLabelKey === "source_label_local" || currentSourceLabelKey === "source_label_local_fallback")) {
        sourceLabel.textContent = t(currentSourceLabelKey) + suffix;
    }
}

// Bounding box overlap algorithm for local county fallback
function getOverlapCounties(lat, lng) {
    // Check if within Taiwan bounds
    if (lat < 21.8 || lat > 25.4 || lng < 119.3 || lng > 122.1) {
        return ["taipei"]; // Out of Taiwan, fallback to taipei
    }
    
    // User query box (approx. 5.5km radius)
    const qBox = {
        minLat: lat - 0.05,
        maxLat: lat + 0.05,
        minLng: lng - 0.05,
        maxLng: lng + 0.05
    };
    
    const matchedCounties = [];
    for (const [key, cBox] of Object.entries(COUNTY_BOUNDS)) {
        const overlap = qBox.minLat <= cBox.maxLat && qBox.maxLat >= cBox.minLat &&
                        qBox.minLng <= cBox.maxLng && qBox.maxLng >= cBox.minLng;
        if (overlap) {
            matchedCounties.push(key);
        }
    }
    
    return matchedCounties.length > 0 ? matchedCounties : ["taipei"];
}

// Fetch actual walking path and duration from OSRM API
async function fetchActualWalkingRoute(toilet) {
    const routeTextEl = document.getElementById("drawer-route-text");
    if (routeTextEl) {
        routeTextEl.textContent = t("osm_planning_route");
    }
    
    try {
        // Start and end coordinates in [longitude, latitude] for OSRM
        const start = `${userCoords[1]},${userCoords[0]}`;
        const end = `${toilet.coords[1]},${toilet.coords[0]}`;
        const url = `https://router.project-osrm.org/route/v1/foot/${start};${end}?geometries=geojson&overview=full`;
        
        const res = await fetchWithTimeout(url);
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
                routeTextEl.innerHTML = t("osm_actual_route", { dist: distStr, time: timeStr });
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
            routeTextEl.innerHTML = t("osm_route_fallback", { dist: (toilet.distance < 1000 ? `${Math.round(toilet.distance)}m` : `${(toilet.distance/1000).toFixed(1)}km`), mins: estWalkingTime });
            routeTextEl.style.color = "var(--text-secondary)";
        }
    }
}

// Reverse geocode coordinate using Nominatim API to fetch clean address dynamically
async function resolveAddress(toilet) {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${toilet.coords[0]}&lon=${toilet.coords[1]}&zoom=18&accept-language=${currentLang}`;
        const res = await fetchWithTimeout(url);
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
        toilet.address = t("address_resolved_failed");
        const drawerAddrEl = document.getElementById("drawer-address-text");
        if (drawerAddrEl && selectedToiletId === toilet.id) {
            drawerAddrEl.textContent = toilet.address;
        }
    }
}

// Reverse geocode coordinate using Nominatim API to fetch user's current address dynamically
async function resolveUserCurrentAddress(lat, lng) {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&accept-language=${currentLang}`;
        const res = await fetchWithTimeout(url);
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
            locTextEl.textContent = t("address_resolved_user");
        }
    }
}

// Dynamic Search Radius Expansion for OSM Queries when 0 results found outside Taiwan
async function handleOsmNoResultsExpansion() {
    toiletsData = []; // Clear current toilets list on screen
    renderToiletMarkers();
    calculateAndDisplayToilets();

    if (currentSearchRadius === 500) {
        showCustomConfirm(t("radius_expand_confirm_1km"), async () => {
            currentSearchRadius = 1000;
            const resultsList = document.getElementById("results-list");
            if (resultsList) {
                resultsList.innerHTML = `
                    <div class="loading-state">
                        <div class="spinner"></div>
                        <p>${t("searching")}</p>
                    </div>
                `;
            }
            await loadToiletsData();
            renderToiletMarkers();
            calculateAndDisplayToilets();
            selectNearestToilet(false);
        });
    } else if (currentSearchRadius === 1000) {
        showCustomConfirm(t("radius_expand_confirm_2km"), async () => {
            currentSearchRadius = 2000;
            const resultsList = document.getElementById("results-list");
            if (resultsList) {
                resultsList.innerHTML = `
                    <div class="loading-state">
                        <div class="spinner"></div>
                        <p>${t("searching")}</p>
                    </div>
                `;
            }
            await loadToiletsData();
            renderToiletMarkers();
            calculateAndDisplayToilets();
            selectNearestToilet(false);
        });
    } else if (currentSearchRadius === 2000) {
        showCustomAlert(t("radius_max_reached"));
    }
}
