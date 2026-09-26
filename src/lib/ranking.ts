import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fetchDaumTrendKeywords } from './daum-trends';
import { parseLenientJson, collapseWhitespace } from './lenient-json';
export interface RankingItem {
    rank: number;
    keyword: string;
    link: string;
}

export interface RankingSource {
    title: string;
    items: RankingItem[];
}

interface SignalItem {
    rank: number;
    keyword: string;
}

interface GlobalBuzzItem {
    text: string;
    value?: number;
}

interface GlobalBuzzData {
    bbc?: GlobalBuzzItem[];
    reddit?: GlobalBuzzItem[];
    hn?: GlobalBuzzItem[];
}

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

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
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
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
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
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
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json() as { top10?: SignalItem[] };
        const items: RankingItem[] = (data.top10 ?? []).map((item) => ({
            rank: item.rank,
            keyword: item.keyword,
            link: `https://search.naver.com/search.naver?query=${encodeURIComponent(item.keyword)}`,
        }));

        return { title: 'Signal.bz', items };
    } catch (error) {
        console.error('Error fetching Signal rankings:', error);
        return { title: 'Signal.bz', items: [] };
    }
}

export async function getNateRankings(revalidate: number): Promise<RankingSource> {
    try {
        const response = await fetch('https://www.nate.com/js/data/jsonLiveKeywordDataV1.js', {
            headers: { 'User-Agent': USER_AGENT },
            next: { revalidate }
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const buffer = await response.arrayBuffer();
        const decoder = new TextDecoder('euc-kr');
        const text = decoder.decode(buffer);
        const data = parseLenientJson(text);

        const items: RankingItem[] = (Array.isArray(data) ? data : [])
            .filter((item: string[]) => Array.isArray(item) && item.length > 4 && item[4])
            .map((item: string[]) => ({
                rank: parseInt(item[0], 10),
                keyword: collapseWhitespace(item[4]),
                link: `https://search.daum.net/search?w=tot&q=${encodeURIComponent(collapseWhitespace(item[4]))}`,
            }));

        return { title: 'Nate 이슈', items };
    } catch (error) {
        console.error('Error fetching Nate rankings:', error);
        return { title: 'Nate 이슈', items: [] };
    }
}

export async function getGoogleTrends(revalidate: number): Promise<RankingSource> {
    try {
        const response = await fetch('https://trends.google.com/trending/rss?geo=KR', {
            headers: { 'User-Agent': USER_AGENT },
            next: { revalidate }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
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

async function fetchDaumRankings(): Promise<RankingSource> {
    try {
        const keywords = await fetchDaumTrendKeywords(10);
        console.log(`[Daum Scraper] Found ${keywords.length} items`);

        const items: RankingItem[] = keywords.map((keyword, index) => ({
            rank: index + 1,
            keyword,
            link: `https://search.daum.net/search?w=tot&q=${encodeURIComponent(keyword)}`,
        }));

        return { title: 'Daum 트렌드 (Beta)', items };
    } catch (error) {
        console.error('Error fetching Daum rankings:', error);
        return { title: 'Daum 트렌드 (Beta)', items: [] };
    }
}

export async function getDaumRankings(): Promise<RankingSource> {
    // 넥스트 빌드(Static Export) 환경에서는 캐시 없이 실시간 데이터를 가져오도록 합니다.
    return fetchDaumRankings();
}

export async function getGlobalBuzz(): Promise<RankingSource[]> {
    try {
        const filePath = path.join(process.cwd(), 'public', 'data', 'global-buzz.json');
        if (!fs.existsSync(filePath)) return [];
        
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8')) as GlobalBuzzData;
        const sources: RankingSource[] = [];

        // 1. BBC World News
        if (data.bbc && data.bbc.length > 0) {
            sources.push({
                title: 'BBC World News',
                items: data.bbc.slice(0, 10).map((item, idx) => ({
                    rank: idx + 1,
                    keyword: item.text,
                    link: `https://www.bbc.com/search?q=${encodeURIComponent(item.text)}`,
                }))
            });
        }

        // 2. Reddit
        if (data.reddit && data.reddit.length > 0) {
            sources.push({
                title: 'Reddit Hot (r/all)',
                items: data.reddit.slice(0, 10).map((item, idx) => ({
                    rank: idx + 1,
                    keyword: item.text,
                    link: `https://www.reddit.com/search?q=${encodeURIComponent(item.text)}`,
                }))
            });
        }

        // 3. Hacker News
        if (data.hn && data.hn.length > 0) {
            sources.push({
                title: 'Hacker News Top',
                items: data.hn.slice(0, 10).map((item, idx) => ({
                    rank: idx + 1,
                    keyword: item.text,
                    link: `https://www.google.com/search?q=${encodeURIComponent(item.text)}`,
                }))
            });
        }

        return sources;
    } catch (error) {
        console.error('Error reading global buzz:', error);
        return [];
    }
}

export async function getAllRankings(): Promise<{ domestic: RankingSource[], overseas: RankingSource[] }> {
    const revalidate = getRevalidateSeconds();
    const [nate, googleKR, signal, x, youtube, daum, globalBuzzSources] = await Promise.all([
        getNateRankings(revalidate),
        getGoogleTrends(revalidate),
        getSignalRankings(revalidate),
        getXRankings(revalidate),
        getYoutubeRankings(revalidate),
        getDaumRankings(),
        getGlobalBuzz(),
    ]);

    return {
        domestic: [nate, googleKR, signal, x, youtube, daum],
        overseas: globalBuzzSources
    };
}
