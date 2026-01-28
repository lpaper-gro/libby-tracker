import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, '../src/data/appearances.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const existingUrls = new Set(data.appearances.map(a => a.url).filter(Boolean));

async function searchForNew() {
  const key = process.env.SERPER_API_KEY;
  if (!key) { console.log('No SERPER_API_KEY'); return []; }

  const newItems = [];
  for (const q of ['Levi Bachmeier superintendent', 'Bachmeier DPI interview']) {
    try {
      const res = await fetch('https://google.serper.dev/news', {
        method: 'POST',
        headers: { 'X-API-KEY': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q, num: 10, tbs: 'qdr:w' })
      });
      const { news = [] } = await res.json();
      for (const item of news) {
        if (existingUrls.has(item.link)) continue;
        if (item.title.toLowerCase().includes('bachmeier') || (item.snippet || '').toLowerCase().includes('bachmeier')) {
          newItems.push({ title: item.title, url: item.link, date: item.date || new Date().toISOString().split('T')[0], source: item.source });
          existingUrls.add(item.link);
        }
      }
    } catch (e) { console.error(e.message); }
  }
  return newItems;
}

async function sendEmail(items) {
  const key = process.env.RESEND_API_KEY, email = process.env.NOTIFY_EMAIL;
  if (!key || !email) return;
  const { Resend } = await import('resend');
  const resend = new Resend(key);
  await resend.emails.send({
    from: 'Libby Tracker <onboarding@resend.dev>',
    to: email,
    subject: `[Libby Tracker] ${items.length} new appearance(s)`,
    html: `<h2>New appearances found:</h2>${items.map(i => `<p><a href="${i.url}">${i.title}</a> - ${i.source}</p>`).join('')}`
  });
}

async function main() {
  console.log('Searching for new appearances...');
  const newItems = await searchForNew();
  console.log(`Found ${newItems.length} new items`);
  if (newItems.length) {
    const maxId = Math.max(...data.appearances.map(a => a.id));
    newItems.forEach((item, i) => {
      data.appearances.push({
        id: maxId + i + 1, date: item.date, outlet: item.source, type: 'Print',
        topic: 'TBD', quote: '[Quote to be added]', icon: '📰', url: item.url
      });
    });
    data.lastUpdated = new Date().toISOString().split('T')[0];
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    await sendEmail(newItems);
  }
}

main().catch(console.error);
