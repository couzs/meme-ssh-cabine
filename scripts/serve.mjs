#!/usr/bin/env node
/* Aperçu local : node scripts/serve.mjs puis http://localhost:8080 (reconstruit à chaque modification de content/ ou src/). */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const build = () => { try { execFileSync(process.execPath, [path.join(ROOT, 'scripts/build.mjs')], { stdio: 'inherit' }); } catch (e) { console.error('Build en échec : la dernière version valide reste servie.'); } };
build();
let t;
for (const d of ['content', 'src', 'public']) fs.watch(path.join(ROOT, d), { recursive: true }, () => { clearTimeout(t); t = setTimeout(build, 200); });
const TYPES = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain' };
const PORT = Number(process.env.PORT) || 8080;
http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(DIST, path.normalize(p).replace(/^(\.\.[/\\])+/, ''));
  if (!f.startsWith(DIST) || !fs.existsSync(f)) { res.writeHead(404); res.end('Introuvable'); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT, () => console.log('Aperçu : http://localhost:' + PORT));
