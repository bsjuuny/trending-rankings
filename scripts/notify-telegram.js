const https = require('https');

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
const type = process.argv[2]; // 'success' or 'failure'
const summary = process.env.TRENDING_SUMMARY || '';

if (!token || !chatId) {
  console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID');
  process.exit(1);
}

let text;
if (type === 'success') {
  text = `✅ <b>Trending Rankings</b> 배포 성공!\n\n${summary}\n\n🔗 웹사이트: <a href="https://bsjuuny2026.mycafe24.com/trendingrankings/">바로가기</a>\n🔗 리포지토리: <a href="https://github.com/bsjuuny/trending-rankings/actions">확인하기</a>`;
} else {
  text = `❌ <b>Trending Rankings</b> 배포 실패!\n\n빌드 또는 배포 과정에서 오류가 발생했습니다.\n🔗 리포지토리: <a href="https://github.com/bsjuuny/trending-rankings/actions">확인하기</a>`;
}

const body = JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' });

const req = https.request({
  hostname: 'api.telegram.org',
  path: `/bot${token}/sendMessage`,
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) },
}, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const result = JSON.parse(data);
    if (!result.ok) { console.error('Telegram error:', result); process.exit(1); }
    console.log('Telegram notification sent.');
  });
});

req.on('error', (e) => { console.error(e); process.exit(1); });
req.write(body);
req.end();
