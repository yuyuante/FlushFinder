const fs = require('fs');
const path = require('path');

const LOCAL_DATA_PATH = path.join(__dirname, '../toilets_data.json');
const OUTPUT_DIR = path.join(__dirname, '../data');

// Load environment variables from .env.local if present
function loadEnv() {
    const envPaths = [
        path.join(__dirname, '../.env.local'),
        path.join(__dirname, '../.env')
    ];
    for (const envPath of envPaths) {
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            content.split(/\r?\n/).forEach(line => {
                const parts = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
                if (parts) {
                    const key = parts[1];
                    let val = parts[2] || '';
                    if (val.length > 0 && val.charAt(0) === '"' && val.charAt(val.length - 1) === '"') {
                        val = val.substring(1, val.length - 1);
                    }
                    if (val.length > 0 && val.charAt(0) === "'" && val.charAt(val.length - 1) === "'") {
                        val = val.substring(1, val.length - 1);
                    }
                    process.env[key] = val;
                }
            });
            break;
        }
    }
}

loadEnv();

const COUNTY_MAPPING = {
    "taipei": ["臺北市", "台北市"],
    "new_taipei": ["新北市"],
    "taoyuan": ["桃園市"],
    "taichung": ["臺中市", "台中市"],
    "tainan": ["臺南市", "台南市"],
    "kaohsiung": ["高雄市"],
    "keelung": ["基隆市"],
    "hsinchu_city": ["新竹市"],
    "hsinchu_county": ["新竹縣"],
    "miaoli": ["苗栗縣"],
    "changhua": ["彰化縣"],
    "nantou": ["南投縣"],
    "yunlin": ["雲林縣"],
    "chiayi_city": ["嘉義市"],
    "chiayi_county": ["嘉義縣"],
    "pingtung": ["屏東縣"],
    "yilan": ["宜蘭縣"],
    "hualien": ["花蓮縣"],
    "taitung": ["臺東縣", "台東縣"],
    "penghu": ["澎湖縣"],
    "kinmen": ["金門縣"],
    "lienchiang": ["連江縣"]
};

// Helper to determine county from address or name
function detectCounty(address = '', name = '') {
    const text = (address + name).toLowerCase();
    for (const [key, names] of Object.entries(COUNTY_MAPPING)) {
        for (const cn of names) {
            if (text.includes(cn.toLowerCase())) {
                return key;
            }
        }
    }
    return "taipei"; // Default fallback if not found
}

async function run() {
    console.log("Starting county compilation...");

    // Create output directory if it doesn't exist
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // 1. Load local toilets_data.json
    let localToilets = [];
    try {
        if (fs.existsSync(LOCAL_DATA_PATH)) {
            localToilets = JSON.parse(fs.readFileSync(LOCAL_DATA_PATH, 'utf8'));
            console.log(`Loaded ${localToilets.length} records from local toilets_data.json`);
        }
    } catch (err) {
        console.error("Failed to read local toilets_data.json:", err);
    }

    // 2. Fetch MOENV toilets with pagination (all 45,000+ records)
    const apiKey = process.env.MOENV_API_KEY;
    if (!apiKey) {
        console.error("ERROR: MOENV_API_KEY environment variable is not set. Cannot run full compilation.");
        process.exit(1);
    }

    let apiToilets = [];
    let offset = 0;
    const limit = 1000;
    let hasMore = true;

    while (hasMore) {
        const moenvUrl = `https://data.moenv.gov.tw/api/v2/FAC_P_07?format=json&limit=${limit}&offset=${offset}&api_key=${apiKey}`;
        try {
            console.log(`Fetching from MOENV API: offset ${offset}...`);
            const response = await fetch(moenvUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            const recordsList = Array.isArray(data) ? data : (data && data.records ? data.records : []);
            
            if (recordsList.length === 0) {
                console.log("No more records found.");
                hasMore = false;
                break;
            }

            console.log(`Successfully fetched ${recordsList.length} records from API (total collected: ${apiToilets.length + recordsList.length})`);
            
            const mapped = recordsList.map((item, idx) => {
                const lat = parseFloat(item.latitude);
                const lng = parseFloat(item.longitude);
                if (isNaN(lat) || isNaN(lng)) return null;

                const isAccessible = item.type === '無障礙廁所' || (item.name && item.name.includes('無障礙'));
                const isBaby = item.diaper === '1' || item.diaper === '是' || (item.name && item.name.includes('親子'));
                
                let mockRating = 4.2;
                if (item.grade === '特優' || item.grade === '特優級') mockRating = 4.8;
                else if (item.grade === '優等' || item.grade === '優等級') mockRating = 4.5;
                else if (item.grade === '普通' || item.grade === '普通級') mockRating = 3.9;
                else if (item.grade === '加強' || item.grade === '不合格') mockRating = 3.2;

                return {
                    id: 1000 + offset + idx,
                    name: item.name || `${item.exec || item.town || ''}公廁`,
                    coords: [lat, lng],
                    address: item.address || '',
                    type: item.type2 || "公廁",
                    rating: mockRating,
                    features: {
                        accessible: isAccessible,
                        baby: isBaby,
                        free: true
                    },
                    status: (offset + idx) % 8 === 0 ? "busy" : "open",
                    openingHours: (item.type2 && item.type2.includes('捷運')) ? "06:00 - 00:00" : "24 小時營業",
                    description: `管理單位: ${item.administration || item.exec || '無'}。公廁類別: ${item.type || '一般'}。公廁評級: ${item.grade || '普通'}。`
                };
            }).filter(item => item !== null);

            apiToilets = [...apiToilets, ...mapped];

            if (recordsList.length < limit) {
                console.log("Reached last page of database.");
                hasMore = false;
            } else {
                offset += limit;
                // Politeness delay
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        } catch (err) {
            console.error(`Failed to fetch from MOENV API at offset ${offset}:`, err);
            process.exit(1);
        }
    }

    // Combine local and API data
    const allToilets = [...localToilets, ...apiToilets];
    console.log(`Total toilets to group: ${allToilets.length}`);

    // Group toilets by county
    const countyGroups = {};
    for (const key of Object.keys(COUNTY_MAPPING)) {
        countyGroups[key] = [];
    }

    for (const toilet of allToilets) {
        const countyKey = detectCounty(toilet.address, toilet.name);
        countyGroups[countyKey].push(toilet);
    }

    // Write county JSON files
    for (const [key, list] of Object.entries(countyGroups)) {
        const filePath = path.join(OUTPUT_DIR, `${key}.json`);
        // Remove duplicates based on coords/name
        const uniqueList = [];
        const seen = new Set();
        for (const t of list) {
            const hash = `${t.coords[0].toFixed(5)},${t.coords[1].toFixed(5)}_${t.name}`;
            if (!seen.has(hash)) {
                seen.add(hash);
                uniqueList.push(t);
            }
        }

        fs.writeFileSync(filePath, JSON.stringify(uniqueList, null, 4), 'utf8');
        console.log(`Wrote ${uniqueList.length} records to data/${key}.json`);
    }

    console.log("County compilation complete!");
}

run().catch(console.error);
