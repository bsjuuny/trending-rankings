const https = require('https');

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

const data = JSON.stringify({
  chat_id: chatId,
  text: text,
  parse_mode: 'HTML',
});

const options = {
  hostname: 'api.telegram.org',
  port: 443,
  path: `/bot${token}/sendMessage`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
  // If proxy is needed, additional configuration will be added here.
  timeout: 10000,
};

const req = https.request(options, (res) => {
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  res.on('end', () => {
    const result = JSON.parse(responseData);
    if (!result.ok) {
      console.error('Telegram API error:', result);
      process.exit(1);
    }
    console.log('Telegram notification sent successfully.');
  });
});

req.on('error', (e) => {
  console.error('Telegram request error:', e);
  process.exit(1);
});

req.write(data);
req.end();
