import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Embed the built program, styles and fonts. The result runs directly from disk
// without a local server. All patient state is created in memory after opening.
const directory = resolve('dist');
let html = await readFile(resolve(directory, 'index.html'), 'utf8');
const policy = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; font-src data:; img-src data:; connect-src 'none'; base-uri 'none'; form-action 'none'";
html = html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`);
const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)];
if (scripts.length !== 1) throw new Error(`Expected one bundled script, found ${scripts.length}.`);
for (const [tag, path] of scripts) {
  const source = await readFile(resolve(directory, path.replace(/^\.\//, '')), 'utf8');
  html = html.replace(tag, () => `<script type="module">${source.replace(/<\/script/gi, '<\\/script')}</script>`);
}
const styles = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)];
if (styles.length !== 1) throw new Error(`Expected one stylesheet, found ${styles.length}.`);
for (const [tag, path] of styles) {
  const source = await readFile(resolve(directory, path.replace(/^\.\//, '')), 'utf8');
  html = html.replace(tag, () => `<style>${source}</style>`);
}
if (/<(?:script|link)\b[^>]*(?:src|href)="(?:https?:|\.\/assets\/)/i.test(html)) {
  throw new Error('Offline build still references external runtime assets.');
}
await writeFile(resolve(directory, 'index.html'), html);
await writeFile(resolve(directory, 'little-spoon.html'), html);
console.log(`Self-contained offline app: ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB. Both HTML files are ready.`);
