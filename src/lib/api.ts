
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export async function fetchSignalData(): Promise<any> {
    const response = await fetch('https://api.signal.bz/news/realtime', {
        headers: { 'User-Agent': USER_AGENT },
    });
    return response.json();
}
