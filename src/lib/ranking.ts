import * as cheerio from 'cheerio';

export interface RankingItem {
    rank: number;
    keyword: string;
    link: string;
}

export interface RankingSource {
    title: string;
    items: RankingItem[];
}

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Calculates the number of seconds remaining until the 59th minute of the current hour.
 */
function getRevalidateSeconds(): number {
    const now = new Date();
    const next59 = new Date(now);

    next59.setMinutes(59, 0, 0);

    if (now.getMinutes() >= 59) {
        next59.setHours(now.getHours() + 1);
    }

    const diffMs = next59.getTime() - now.getTime();
    const diffSec = Math.floor(diffMs / 1000);

    return Math.max(60, Math.min(3600, diffSec));
}

export async function getXRankings(revalidate: number): Promise<RankingSource> {
    try {
        const response = await fetch('https://trends24.in/korea/', {
            headers: { 'User-Agent': USER_AGENT },
            next: { revalidate }
        });
        const html = await response.text();
        const $ = cheerio.load(html);
        const items: RankingItem[] = [];

        $('.trend-link').each((i, el) => {
            const keyword = $(el).text().trim();
            if (keyword && items.length < 10) {
                items.push({
                    rank: items.length + 1,
                    keyword,
                    link: $(el).attr('href') || `https://twitter.com/search?q=${encodeURIComponent(keyword)}`,
                });
            }
        });

        return { title: 'X (Twitter) 트렌드', items };
    } catch (error) {
        console.error('Error fetching X rankings:', error);
        return { title: 'X (Twitter) 트렌드', items: [] };
    }
}

export async function getYoutubeRankings(revalidate: number): Promise<RankingSource> {
    try {
        const response = await fetch('https://kworb.net/youtube/trending/kr.html', {
            headers: { 'User-Agent': USER_AGENT },
            next: { revalidate }
        });
        const html = await response.text();
        const $ = cheerio.load(html);
        const items: RankingItem[] = [];

        $('.text div a').each((i, el) => {
            const keyword = $(el).text().trim();
            if (keyword && items.length < 10) {
                items.push({
                    rank: items.length + 1,
                    keyword,
                    link: $(el).attr('href') || `https://www.youtube.com/search?q=${encodeURIComponent(keyword)}`,
                });
            }
        });

        return { title: 'YouTube 인기 급상승', items };
    } catch (error) {
        console.error('Error fetching YouTube rankings:', error);
        return { title: 'YouTube 인기 급상승', items: [] };
    }
}

export async function getSignalRankings(revalidate: number): Promise<RankingSource> {
    try {
        const response = await fetch('https://api.signal.bz/news/realtime', {
            headers: { 'User-Agent': USER_AGENT },
            next: { revalidate }
        });
        const data = await response.json();
        const items: RankingItem[] = data.top10.map((item: any) => ({
            rank: item.rank,
            keyword: item.keyword,
            link: `https://search.naver.com/search.naver?query=${encodeURIComponent(item.keyword)}`,
        }));

        return { title: 'Signal.bz 실시간', items };
    } catch (error) {
        console.error('Error fetching Signal rankings:', error);
        return { title: 'Signal.bz 실시간', items: [] };
    }
}

export async function getNateRankings(revalidate: number): Promise<RankingSource> {
    try {
        const response = await fetch('https://www.nate.com', {
            headers: { 'User-Agent': USER_AGENT },
            next: { revalidate }
        });
        const html = await response.text();
        const $ = cheerio.load(html);
        const items: RankingItem[] = [];

        $('a.ik span').each((i, el) => {
            const keyword = $(el).text().trim();
            if (keyword && items.length < 10) {
                items.push({
                    rank: items.length + 1,
                    keyword,
                    link: `https://search.daum.net/search?w=tot&q=${encodeURIComponent(keyword)}`,
                });
            }
        });

        return { title: 'Nate 실시간 이슈', items };
    } catch (error) {
        console.error('Error fetching Nate rankings:', error);
        return { title: 'Nate 실시간 이슈', items: [] };
    }
}

export async function getGoogleTrends(revalidate: number): Promise<RankingSource> {
    try {
        const response = await fetch('https://trends.google.com/trending/rss?geo=KR', {
            headers: { 'User-Agent': USER_AGENT },
            next: { revalidate }
        });
        const xml = await response.text();

        const $ = cheerio.load(xml, { xmlMode: true });
        const items: RankingItem[] = [];

        $('item').each((i, el) => {
            const keyword = $(el).children('title').text().trim();
            if (keyword && items.length < 10) {
                items.push({
                    rank: items.length + 1,
                    keyword,
                    link: `https://www.google.com/search?q=${encodeURIComponent(keyword)}`,
                });
            }
        });

        return { title: 'Google Trends (KR)', items };
    } catch (error) {
        console.error('Error fetching Google Trends:', error);
        return { title: 'Google Trends (KR)', items: [] };
    }
}

export async function getAllRankings(): Promise<RankingSource[]> {
    const revalidate = getRevalidateSeconds();
    const [nate, google, signal, x, youtube] = await Promise.all([
        getNateRankings(revalidate),
        getGoogleTrends(revalidate),
        getSignalRankings(revalidate),
        getXRankings(revalidate),
        getYoutubeRankings(revalidate),
    ]);
    return [nate, google, signal, x, youtube];
}
