import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';

const url = process.argv[2] || 'http://127.0.0.1:4173';
const directory = `artifacts/lighthouse/${new Date().toISOString().replace(/[:.]/g, '-')}`;
await mkdir(directory, { recursive: true });
for (const mode of ['mobile', 'desktop']) {
  const chrome = await launch({ chromePath: chromium.executablePath(), chromeFlags: ['--headless', '--no-sandbox'] });
  try {
    const result = await lighthouse(url, { port: chrome.port, output: ['json', 'html'], onlyCategories: ['performance', 'accessibility', 'best-practices'], logLevel: 'error' }, mode === 'desktop' ? desktopConfig : undefined);
    if (!result || result.lhr.runtimeError) throw new Error(JSON.stringify(result?.lhr.runtimeError));
    await writeFile(`${directory}/${mode}.json`, result.report[0]);
    await writeFile(`${directory}/${mode}.html`, result.report[1]);
    console.log(JSON.stringify({ mode, scores: Object.fromEntries(Object.entries(result.lhr.categories).map(([key, item]) => [key, item.score * 100])), failedAudits: Object.values(result.lhr.audits).filter((item) => item.score !== null && item.score < 0.9).map(({ id, title, score, displayValue }) => ({ id, title, score, displayValue })), directory }));
  } finally { await chrome.kill(); }
}
