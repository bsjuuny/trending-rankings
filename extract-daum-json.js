const fs = require('fs');
const js = fs.readFileSync('daum-main-script-5.js', 'utf8');

// The JS assigns to window.tillerInitData = {...}
// Let's parse it and find the trends.
const match = js.match(/window\.tillerInitData\s*=\s*((\{.*?\})\s*,?\s*"version"\s*:\s*\d+\s*\});/);
if (!match) {
    const match2 = js.match(/window\.tillerInitData\s*=\s*(\{.+?\})\s*;/);
    if (match2) {
       processJSON(match2[1]);
    } else {
       console.log("Could not match window.tillerInitData");
    }
} else {
    processJSON(match[1]);
}


function processJSON(jsonStr) {
    try {
        const data = JSON.parse(jsonStr);
        
        let results = [];
        // Let's do a recursive search for 'wbc' or '조병현' or '투데이 버블'
        function searchObj(obj, path = '') {
            if (!obj) return;
            if (typeof obj === 'string') {
                if (obj.includes('wbc') || obj.includes('조병현') || obj.includes('투데이') || obj.includes('트렌드') || obj.includes('DA=TRL')) {
                    console.log('Found match at path:', path);
                    const snippet = obj.length > 200 ? obj.substring(0, 200) + '...' : obj;
                    console.log('Value:', snippet);
                    results.push({path, value: snippet});
                }
            } else if (Array.isArray(obj)) {
                obj.forEach((item, index) => searchObj(item, `${path}[${index}]`));
            } else if (typeof obj === 'object') {
                for (const key in obj) {
                    searchObj(obj[key], `${path}.${key}`);
                }
            }
        }
        
        searchObj(data, 'root');
        
        // Also write the full parsed JSON to a file so we can inspect it easily
        fs.writeFileSync('daum-tiller-data.json', JSON.stringify(data, null, 2));
        console.log("Wrote full JSON to daum-tiller-data.json");
        
    } catch (e) {
         console.error('Failed to parse or search JSON:', e);
         // If it fails to parse, write the matched string to see why
         fs.writeFileSync('daum-tiller-data-failed.txt', jsonStr);
    }
}
