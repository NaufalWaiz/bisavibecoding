/**
 * Screenshot semua halaman untuk pemeriksaan desain.
 *
 * Dibuat karena dua putaran perbaikan desain sebelumnya dikerjakan tanpa
 * pernah melihat hasilnya, dan meleset. Jalankan:
 *
 *   npm run build && npx next start -p 3400
 *   node scripts/screenshot.mjs
 *
 * Hasil ada di .screenshots/ (di-gitignore). Butuh Chrome terpasang dan
 * kredensial di .env.local. Perkakas dev saja — aman dihapus bersama
 * devDependency `puppeteer-core` kalau tidak diperlukan.
 *
 * CATATAN: screenshot `fullPage` menangkap elemen `position: fixed` dan
 * konten ber-scroll-reveal di posisi awalnya, sehingga bisa memunculkan
 * "garis batas" atau area kosong yang TIDAK ADA di browser sungguhan.
 * Untuk menilai layout, pakai screenshot viewport (fullPage: false).
 */
import { config } from 'dotenv';
config({ path: '.env.local', quiet: true });
import puppeteer from 'puppeteer-core';
import { createClient } from '@supabase/supabase-js';

const BASE = process.env.SHOT_BASE || 'http://localhost:3400';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { data, error } = await anon.auth.signInWithPassword({
  email: 'naufalwaizz@gmail.com', password: 'probe-temp-12345',
});
if (error) { console.error('login gagal:', error.message); process.exit(1); }
const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
const cookieValue = 'base64-' + Buffer.from(JSON.stringify(data.session)).toString('base64');

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const PID = '185fc153-0957-4e43-adc2-f658f37afea8';
const pages = [
  ['home', '/'], ['login', '/login'], ['register', '/register'],
  ['projects', '/projects'], ['idea', `/projects/${PID}`],
  ['prd', `/projects/${PID}/prd`], ['tasks', `/projects/${PID}/tasks`],
  ['export', `/projects/${PID}/export`],
];
const viewports = [['desktop', 1440, 1000], ['mobile', 390, 844]];

// Default: screenshot viewport (bukan fullPage). SHOT_FULL=1 untuk fullPage —
// berguna melihat isi panjang, tapi elemen sticky-nya akan salah posisi.
const FULL = process.env.SHOT_FULL === '1';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

for (const [vname, width, height] of viewports) {
  for (const [name, path] of pages) {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.setCookie({ name: `sb-${ref}-auth-token`, value: cookieValue, domain: 'localhost', path: '/' });
    try {
      await page.goto(BASE + path, { waitUntil: 'networkidle0', timeout: 45000 });

      // Gulir sampai bawah lalu kembali ke atas: memicu IntersectionObserver
      // milik <Reveal>, supaya konten di bawah lipatan tidak terpotret kosong.
      await page.evaluate(async () => {
        const step = window.innerHeight;
        for (let y = 0; y < document.body.scrollHeight; y += step) {
          window.scrollTo(0, y);
          await new Promise(r => setTimeout(r, 120));
        }
        window.scrollTo(0, 0);
      });
      await sleep(1200);

      await page.screenshot({ path: `.screenshots/${vname}-${name}.png`, fullPage: FULL });

      // Satu bidikan tambahan setelah scroll, untuk halaman yang panjang.
      const tall = await page.evaluate(() => document.body.scrollHeight > window.innerHeight * 1.4);
      if (tall && !FULL) {
        await page.evaluate(() => window.scrollTo(0, Math.round(window.innerHeight * 0.85)));
        await sleep(600);
        await page.screenshot({ path: `.screenshots/${vname}-${name}-2.png` });
      }

      console.log(`ok  ${vname}-${name}${tall && !FULL ? ' (+2)' : ''}`);
    } catch (e) {
      console.log(`GAGAL ${vname}-${name}: ${e.message.slice(0, 70)}`);
    }
    await page.close();
  }
}
await browser.close();
