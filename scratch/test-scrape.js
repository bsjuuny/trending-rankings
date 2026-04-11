
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function test() {
  const url = 'http://www.38.co.kr/html/fund/index.htm?o=k';
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  const buf = await res.arrayBuffer();
  const html = new TextDecoder('euc-kr').decode(buf);
  console.log('--- 38.co.kr Sample ---');
  console.log(html.slice(0, 500));
}

test();
