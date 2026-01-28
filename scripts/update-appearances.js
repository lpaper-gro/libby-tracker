/**
 * Weekly Update Script
 * Searches for new Levi Bachmeier media appearances and sends email summary.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, '../src/data/appearances.json');

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const existingUrls = new Set(data.appearances.map(a => a.url).filter(Boolean));

async function searchForNewAppearances() {
  const SERPER_API_KEY = process.env.SERPER_API_KEY;
  if (!SERPER_API_KEY) {
    console.log('No SERPER_API_KEY found. Skipping search.');
    return [];
  }

  const searchQueries = [
    'Levi Bachmeier superintendent',
    'Levi Bachmeier North Dakota education',
    'Bachmeier DPI interview'
  ];

  const newAppearances = [];

  for (const query of searchQueries) {
    try {
      const response = await fetch('https://google.serper.dev/news', {
        method: 'POST',
        headers: {
          'X-API-KEY': SERPER_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ q: query, num: 10, tbs: 'qdr:w' })
      });

      const results = await response.json();

      if (results.news) {
        for (const item of results.news) {
          if (existingUrls.has(item.link)) continue;
          const title = item.title.toLowerCase();
          const snippet = (item.snippet || '').toLowerCase();

          if (title.includes('bachmeier') || snippet.includes('bachmeier')) {
            newAppearances.push({
              title: item.title,
              url: item.link,
              date: item.date || new Date().toISOString().split('T')[0],
              source: item.source,
              snippet: item.snippet
            });
            existingUrls.add(item.link);
          }
        }
      }
    } catch (error) {
      console.error(`Search error for "${query}":`, error.message);
    }
  }

  return newAppearances;
}

async function sendEmailNotification(newAppearances) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL;

  if (!RESEND_API_KEY || !NOTIFY_EMAIL) {
    console.log('Email not configured. Skipping notification.');
    return;
  }

  const { Resend } = await import('resend');
  const resend = new Resend(RESEND_API_KEY);

  const appearancesList = newAppearances.map(a =>
    `• <a href="${a.url}">${a.title}</a><br>  <small>${a.source} - ${a.date}</small>`
  ).join('<br><br>');

  const html = `
    <h2>Levi Bachmeier Media Tracker Update</h2>
    <p>Found ${newAppearances.length} new media appearance(s) this week:</p>
    <div style="margin: 20px 0;">${appearancesList}</div>
    <p style="color: #666; font-size: 12px;">These need to be reviewed and added to the tracker with quotes.</p>
  `;

  try {
    await resend.emails.send({
      from: 'Libby Tracker <onboarding@resend.dev>',
      to: NOTIFY_EMAIL,
      subject: `[Libby Tracker] ${newAppearances.length} new appearance(s) found`,
      html
    });
    console.log('Email notification sent!');
  } catch (error) {
    console.error('Failed to send email:', error.message);
  }
}

async function addPlaceholderAppearances(newAppearances) {
  const maxId = Math.max(...data.appearances.map(a => a.id));

  for (let i = 0; i < newAppearances.length; i++) {
    const appearance = newAppearances[i];
    const icon = appearance.source.toLowerCase().includes('tv') ? '📺' :
                 appearance.source.toLowerCase().includes('radio') ? '📻' : '📰';

    data.appearances.push({
      id: maxId + i + 1,
      date: appearance.date,
      outlet: appearance.source,
      type: 'Print',
      topic: 'TBD - Needs Review',
      quote: '[Quote to be added]',
      icon,
      url: appearance.url,
      needsReview: true
    });
  }

  data.lastUpdated = new Date().toISOString().split('T')[0];
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  console.log(`Added ${newAppearances.length} new appearances to data file.`);
}

async function main() {
  console.log('Starting weekly update...');
  console.log(`Current appearances: ${data.appearances.length}`);

  const newAppearances = await searchForNewAppearances();
  console.log(`Found ${newAppearances.length} new potential appearances.`);

  if (newAppearances.length > 0) {
    await addPlaceholderAppearances(newAppearances);
    await sendEmailNotification(newAppearances);
  } else {
    console.log('No new appearances found this week.');
  }

  console.log('Update complete!');
}

main().catch(console.error);
