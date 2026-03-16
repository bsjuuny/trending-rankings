const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
const type = process.argv[2]; // 'success' or 'failure'
const summary = process.env.TRENDING_SUMMARY || '';

if (!token || !chatId) {
  console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID');
  process.exit(1);
}

const divider = '─────────────────────';

let text;
if (type === 'success') {
  text = [
    `✅ <b>Trending Rankings 배포 성공!</b>`,
    ``,
    `${divider}`,
    `${summary}`,
    `${divider}`,
    ``,
    `🔗 <a href="https://bsjuuny2026.mycafe24.com/trendingrankings/">웹사이트 바로가기</a>`,
    `📋 <a href="https://github.com/bsjuuny/trending-rankings/actions">Actions 로그 확인</a>`,
  ].join('\n');
} else {
  text = [
    `❌ <b>Trending Rankings 배포 실패!</b>`,
    ``,
    `빌드 또는 배포 과정에서 오류가 발생했습니다.`,
    ``,
    `📋 <a href="https://github.com/bsjuuny/trending-rankings/actions">Actions 로그 확인</a>`,
  ].join('\n');
}

(async () => {
  const res = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
  const result = await res.json();
  if (!result.ok) { console.error('Telegram error:', result); process.exit(1); }
  console.log('Telegram notification sent.');
})().catch((e) => { console.error(e); process.exit(1); });
