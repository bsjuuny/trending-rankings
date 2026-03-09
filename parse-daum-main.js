const fs = require('fs');
const html = fs.readFileSync('daum-main-dom.html', 'utf8');

// Find script tags containing "wbc d조" or "조병현"
const scripts = html.match(/<script[^>]*>.*?<\/script>/gis) || [];
scripts.forEach((script, i) => {
    if (script.includes('wbc') || script.includes('조병현') || script.includes('박용택') || script.includes('제니') || script.includes('왕사남') || script.includes('트렌드')) {
        console.log(`\n\n--- MATCH IN SCRIPT ${i} ---`);
        console.log(script.substring(0, 500) + '...');
        
        // Try to extract the whole script to a file for better view
        fs.writeFileSync(`daum-main-script-${i}.js`, script);
    }
});
