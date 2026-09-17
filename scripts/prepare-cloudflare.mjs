import { copyFileSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const target = new URL('../artifacts/cloudflare/app/', import.meta.url);
const files = ['index.html', 'little-spoon.html'];
mkdirSync(target, { recursive: true });
if (readdirSync(target).some(name => !files.includes(name))) {
  throw new Error('Unexpected file in Cloudflare output. Review it before deploying.');
}
for (const name of files) {
  const source = new URL(`../dist/${name}`, import.meta.url);
  copyFileSync(source, new URL(name, target));
  console.log(`${name}: ${createHash('sha256').update(readFileSync(source)).digest('hex')}`);
}
