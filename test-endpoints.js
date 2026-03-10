
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function testEndpoints() {
    const endpoints = [
        'https://api.signal.bz/news/realtime',
        'https://api.signal.bz/keyword/realtime',
        'https://api.signal.bz/issue/realtime',
        'https://api.signal.bz/v1/news/realtime'
    ];

    for (const url of endpoints) {
        try {
            const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
            console.log(`URL: ${url} - Status: ${response.status}`);
            if (response.ok) {
                const data = await response.json();
                console.log(`Data (first 10 chars): ${JSON.stringify(data).substring(0, 100)}...`);
            }
        } catch (e) {
            console.log(`URL: ${url} - Error: ${e.message}`);
        }
    }
}

testEndpoints();
