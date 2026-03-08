import { getSignalRankings, getXRankings, getYoutubeRankings } from './src/lib/ranking';

async function test() {
    const signal = await getSignalRankings(0);
    console.log('Signal:', signal.items.slice(0, 3));

    const x = await getXRankings(0);
    console.log('X:', x.items.slice(0, 3));

    const youtube = await getYoutubeRankings(0);
    console.log('YouTube:', youtube.items.slice(0, 3));
}

test();
