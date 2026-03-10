
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function testSignal() {
    try {
        const response = await fetch('https://api.signal.bz/news/realtime', {
            headers: { 'User-Agent': USER_AGENT }
        });
        const data = await response.json();
        console.log('Keys:', Object.keys(data));
        console.log('Top10 Length:', data.top10?.length);
    } catch (error) {
        console.error('Error:', error);
    }
}

testSignal();
