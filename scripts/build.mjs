#!/usr/bin/env node
/* Build du Mémo SSH Cabine.
   Lit le contenu (content/), le valide, puis assemble une page unique dans dist/ (HTML + CSS + JS + données).
   node scripts/build.mjs           → valide et construit dist/
   node scripts/build.mjs --check   → valide seulement (utilisé par la CI)
   Si la validation échoue, le build s’arrête : sur Cloudflare Pages, la version en ligne reste alors la précédente. */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { marked } from 'marked';
import { FORMATS, etatValeur } from '../src/formats.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const C = p => path.join(ROOT, 'content', p);
const CHECK = process.argv.includes('--check');
const errors = [], warnings = [];
const err = (f, msg) => errors.push(rel(f) + ' : ' + msg);
const warn = (f, msg) => warnings.push(rel(f) + ' : ' + msg);
const rel = f => path.relative(ROOT, f);

/* Un bloc « | » dont la première ligne commence par des espaces (sortie de commande alignée) n’est pas lisible
   en YAML sans indicateur d’indentation : on l’ajoute ici pour que les rédacteurs n’aient pas à y penser. */
function fixBlocks(text) {
  const L = text.split('\n');
  for (let i = 0; i < L.length; i++) {
    const m = L[i].match(/^( *)(- )?([\w-]+): ([|>][+-]?)\s*$/);
    if (!m) continue;
    const k = m[1].length + (m[2] ? 2 : 0);
    let j = i + 1; while (j < L.length && !L[j].trim()) j++;
    if (j < L.length && /^ */.exec(L[j])[0].length > k + 2) L[i] = L[i].replace(/([|>][+-]?)\s*$/, '$12');
  }
  return L.join('\n');
}
function readYaml(file) {
  try { return yaml.load(fixBlocks(fs.readFileSync(file, 'utf8')), { filename: file }); }
  catch (e) { err(file, 'YAML illisible : ' + (e.reason || e.message) + (e.mark ? ' (ligne ' + (e.mark.line + 1) + ')' : '')); return null; }
}
const list = dir => fs.existsSync(C(dir)) ? fs.readdirSync(C(dir)).filter(f => !f.startsWith('.') && !f.startsWith('_')).sort().map(f => C(path.join(dir, f))) : [];
const isStr = v => typeof v === 'string' && v.trim() !== '';
const ID_RX = /^[a-z0-9][a-z0-9-]{1,60}$/;
const VAR_RX = /\{([A-Z][A-Z0-9_]*)\}/g;
const DATE_RX = /^\d{4}-\d{2}-\d{2}$/;
const toDate = v => v instanceof Date ? v.toISOString().slice(0, 10) : (v == null ? '' : String(v));

/* ---------- configuration ---------- */
const site = readYaml(C('site.yaml')) || {};
const MACHINES = site.machines || {};
const NIVEAUX = site.niveaux || {};
const THEMES = site.themes || [];
if (!Object.keys(MACHINES).length) err(C('site.yaml'), 'liste « machines » absente');
if (!Object.keys(NIVEAUX).length) err(C('site.yaml'), 'liste « niveaux » absente');

/* ---------- variables ---------- */
const varFile = C('variables.yaml');
const variables = (readYaml(varFile) || []).map((v, i) => {
  const where = 'variable n° ' + (i + 1) + (v && v.cle ? ' (' + v.cle + ')' : '');
  if (!v || !/^[A-Z][A-Z0-9_]*$/.test(v.cle || '')) err(varFile, where + ' : « cle » en MAJUSCULES attendue');
  if (!isStr(v.libelle)) err(varFile, where + ' : « libelle » manquant');
  if (!FORMATS[v.format]) err(varFile, where + ' : format « ' + v.format + ' » inconnu (' + Object.keys(FORMATS).join(', ') + ')');
  else if (v.exemple && etatValeur(v.format, String(v.exemple)) !== 'ok') err(varFile, where + ' : l’exemple « ' + v.exemple + ' » ne respecte pas le format ' + v.format);
  return { cle: v.cle, libelle: v.libelle, groupe: v.groupe || 'Divers', format: v.format, exemple: v.exemple == null ? '' : String(v.exemple), aide: v.aide || '' };
});
const VARKEYS = new Set(variables.map(v => v.cle));
if (VARKEYS.size !== variables.length) err(varFile, 'deux variables ont la même clé');

/* Aucune donnée réelle de site dans l’outil : toute IPv4 écrite en dur doit être une adresse de documentation,
   une adresse générique (masque, boucle locale, DNS public) ou une adresse d’exemple déclarée dans site.yaml. */
const IP_OK = [/^192\.0\.2\./, /^198\.51\.100\./, /^203\.0\.113\./, /^127\./, /^0\.0\.0\.0$/, /^255\./, /^8\.8\.8\.8$/, /^1\.1\.1\.1$/];
(site.ip_autorisees || []).forEach(p => IP_OK.push(new RegExp('^' + String(p).replace(/\./g, '\\.').replace(/\*/g, '.*') + '$')));
function checkIPs(file, where, text) {
  for (const m of String(text).matchAll(/(?<![\d.])(\d{1,3}(?:\.\d{1,3}){3})(?![\d.])/g)) {
    if (!IP_OK.some(rx => rx.test(m[1]))) err(file, where + ' : IP « ' + m[1] + ' » écrite en dur. Utilise une variable ({IP}, {LMS}…) ou une adresse de documentation (192.0.2.x).');
  }
}

/* ---------- textes ---------- */
const escHtml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/* Prose courte (but, lecture, si_ko…) : `code`, **gras**, listes « - », retours à la ligne. */
function prose(s) {
  if (!isStr(s)) return '';
  const inline = t => escHtml(t).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  const lines = String(s).trim().split('\n');
  let html = '', ul = false;
  for (const l of lines) {
    const m = l.match(/^\s*[-•]\s+(.*)$/);
    if (m) { if (!ul) { html += '<ul>'; ul = true; } html += '<li>' + inline(m[1]) + '</li>'; continue; }
    if (ul) { html += '</ul>'; ul = false; }
    if (l.trim()) html += '<p>' + inline(l.trim()) + '</p>';
  }
  return html + (ul ? '</ul>' : '');
}
/* « détail » : une ligne par morceau de commande, « morceau → explication ». */
function parseDetail(file, where, d) {
  if (d == null) return [];
  if (!isStr(d)) { err(file, where + ' : « detail » doit être un bloc de texte (detail: |)'); return []; }
  return d.split('\n').filter(l => l.trim()).map(l => {
    const i = l.indexOf(' → ');
    if (i < 0) { err(file, where + ' : ligne de détail sans « → » : ' + l.trim()); return null; }
    return [l.slice(0, i).trim(), prose(l.slice(i + 3).trim())];
  }).filter(Boolean);
}
function checkVars(file, where, cmd) {
  for (const m of cmd.matchAll(VAR_RX)) if (!VARKEYS.has(m[1])) err(file, where + ' : variable {' + m[1] + '} inconnue (à déclarer dans content/variables.yaml)');
}

/* ---------- commandes ---------- */
const ids = new Map();
const claim = (kind, id, file, where) => {
  const k = kind + ':' + id;
  if (ids.has(k)) err(file, where + ' : identifiant « ' + id + ' » déjà utilisé dans ' + ids.get(k));
  else ids.set(k, rel(file));
};
const categories = [], commandes = [];
for (const file of list('commandes')) {
  const doc = readYaml(file); if (!doc) continue;
  if (!ID_RX.test(doc.id || '')) { err(file, '« id » de catégorie manquant ou invalide'); continue; }
  claim('cat', doc.id, file, 'catégorie');
  if (!isStr(doc.titre)) err(file, '« titre » de catégorie manquant');
  categories.push({ id: doc.id, titre: doc.titre, groupe: doc.groupe || 'Divers', intro: doc.intro || '', type: 'cmd', fichier: rel(file) });
  if (!Array.isArray(doc.commandes) || !doc.commandes.length) { err(file, 'aucune commande (liste « commandes: »)'); continue; }
  doc.commandes.forEach((c, i) => {
    const where = 'commande n° ' + (i + 1) + (c && c.titre ? ' « ' + c.titre + ' »' : '');
    if (!c || typeof c !== 'object') { err(file, where + ' : entrée vide'); return; }
    if (!ID_RX.test(c.id || '')) err(file, where + ' : « id » manquant ou invalide (minuscules, chiffres et tirets)'); else claim('cmd', c.id, file, where);
    if (!isStr(c.titre)) err(file, where + ' : « titre » manquant');
    if (!MACHINES[c.machine]) err(file, where + ' : machine « ' + c.machine + ' » inconnue (' + Object.keys(MACHINES).join(', ') + ')');
    if (!NIVEAUX[c.niveau]) err(file, where + ' : niveau « ' + c.niveau + ' » inconnu (' + Object.keys(NIVEAUX).join(', ') + ')');
    if (!isStr(c.commande)) { err(file, where + ' : « commande » vide'); return; }
    const cmd = String(c.commande).replace(/\s+$/, '');
    checkVars(file, where, cmd); checkIPs(file, where, cmd + ' ' + (c.exemple || ''));
    if (c.maj && !DATE_RX.test(toDate(c.maj))) err(file, where + ' : « maj » doit être une date AAAA-MM-JJ');
    if (!isStr(c.but)) warn(file, where + ' : pas de « but » (à quoi sert la commande)');
    commandes.push({
      id: c.id, cat: doc.id, titre: c.titre, machine: c.machine, niveau: c.niveau, commande: cmd,
      but: prose(c.but), detail: parseDetail(file, where, c.detail), exemple: c.exemple ? String(c.exemple).replace(/\s+$/, '') : '',
      lecture: prose(c.lecture), attendu: prose(c.attendu), si_ko: prose(c.si_ko), attention: prose(c.attention),
      mots: Array.isArray(c.mots) ? c.mots.map(String) : [], voir: Array.isArray(c.voir) ? c.voir.map(String) : [],
      maj: toDate(c.maj), fichier: rel(file)
    });
  });
}
const CMD = new Map(commandes.map(c => [c.id, c]));

/* ---------- procédures ---------- */
const procedures = [];
for (const file of list('procedures')) {
  const p = readYaml(file); if (!p) continue;
  const where0 = 'procédure';
  if (!ID_RX.test(p.id || '')) { err(file, '« id » manquant ou invalide'); continue; }
  claim('proc', p.id, file, where0);
  if (!isStr(p.titre)) err(file, '« titre » manquant');
  if (!THEMES.includes(p.theme)) err(file, 'thème « ' + p.theme + ' » inconnu (' + THEMES.join(', ') + ')');
  if (!isStr(p.quand)) warn(file, 'pas de « quand » (symptôme qui mène à cette procédure)');
  if (!Array.isArray(p.etapes) || !p.etapes.length) { err(file, 'aucune étape'); continue; }
  const etapes = p.etapes.map((s, i) => {
    const where = 'étape ' + (i + 1) + (s && s.titre ? ' « ' + s.titre + ' »' : '');
    if (!s || typeof s !== 'object') { err(file, where + ' : étape vide'); return null; }
    let base = {};
    if (s.ref) { base = CMD.get(s.ref); if (!base) { err(file, where + ' : ref « ' + s.ref + ' » ne correspond à aucune commande'); base = {}; } }
    const st = {
      titre: s.titre || base.titre || '', machine: s.machine || base.machine || 'man', niveau: s.niveau || base.niveau || 'info',
      commande: s.commande != null ? String(s.commande).replace(/\s+$/, '') : (base.commande || ''),
      attendu: s.attendu != null ? prose(s.attendu) : (base.attendu || ''), lecture: prose(s.lecture), si_ko: prose(s.si_ko),
      consigne: prose(s.consigne), ref: s.ref || ''
    };
    if (!isStr(st.titre)) err(file, where + ' : « titre » manquant');
    if (!MACHINES[st.machine]) err(file, where + ' : machine « ' + st.machine + ' » inconnue');
    if (!NIVEAUX[st.niveau]) err(file, where + ' : niveau « ' + st.niveau + ' » inconnu');
    if (!st.commande && !st.consigne) err(file, where + ' : ni « commande » ni « consigne »');
    if (st.machine === 'man' && st.commande) err(file, where + ' : une étape manuelle (machine: man) n’a pas de commande');
    if (st.commande) { checkVars(file, where, st.commande); checkIPs(file, where, st.commande); }
    return st;
  }).filter(Boolean);
  if (p.maj && !DATE_RX.test(toDate(p.maj))) err(file, '« maj » doit être une date AAAA-MM-JJ');
  procedures.push({
    id: p.id, theme: p.theme, titre: p.titre, quand: p.quand || '', comprendre: prose(p.comprendre), symptomes: Array.isArray(p.symptomes) ? p.symptomes.map(String) : [],
    etapes, attention: prose(p.attention), copier_tout: p.copier_tout !== false, maj: toDate(p.maj), fichier: rel(file)
  });
}
procedures.sort((a, b) => THEMES.indexOf(a.theme) - THEMES.indexOf(b.theme));

/* ---------- pages (Apprendre, Repères) ---------- */
/* Titres de pages : identifiant stable pour le sommaire (le « # » du navigateur sert déjà au routage, d’où data-goto). */
let tocItems = [], tocSeen = new Set();
const slug = t => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/<[^>]+>/g, '').replace(/&[a-z#0-9]+;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
marked.use({
  gfm: true,
  renderer: {
    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens);
      let id = slug(text), n = 2; const base = id;
      while (tocSeen.has(id)) id = base + '-' + n++;
      tocSeen.add(id);
      if (depth === 2) tocItems.push({ id, text: text.replace(/<[^>]+>/g, '') });
      return '<h' + depth + ' id="s-' + id + '">' + text + '</h' + depth + '>\n';
    }
  }
});
const pages = [];
for (const [dir, type] of [['apprendre', 'guide'], ['reperes', 'ref']]) {
  for (const file of list(dir).filter(f => f.endsWith('.md'))) {
    const src = fs.readFileSync(file, 'utf8').replace(/\r\n?/g, '\n');
    const m = src.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!m) { err(file, 'en-tête « --- … --- » manquant'); continue; }
    let fm; try { fm = yaml.load(m[1]) || {}; } catch (e) { err(file, 'en-tête YAML illisible : ' + e.message); continue; }
    if (!ID_RX.test(fm.id || '')) { err(file, '« id » manquant ou invalide'); continue; }
    claim('page', fm.id, file, 'page');
    checkIPs(file, 'texte', m[2]);
    tocItems = []; tocSeen = new Set();
    let html = marked.parse(m[2]);
    const toc = tocItems.length >= 4 ? tocItems.map(t => ({ id: 's-' + t.id, titre: t.text })) : [];
    /* tableaux défilants sur mobile */
    html = html.replace(/<table>/g, '<div class="tscroll"><table>').replace(/<\/table>/g, '</table></div>');
    pages.push({ id: fm.id, titre: fm.titre || fm.id, groupe: fm.groupe || (type === 'guide' ? 'Apprendre' : 'Repères'), intro: fm.intro || '', type, html, toc, fichier: rel(file) });
  }
}

/* ---------- liens entre fiches ---------- */
for (const c of commandes) for (const v of c.voir) if (!CMD.has(v) && !procedures.some(p => p.id === v) && !pages.some(p => p.id === v)) err(C(c.fichier.replace(/^content\//, '')), 'commande « ' + c.id + ' » : voir « ' + v + ' » introuvable');

/* ---------- règles d’analyse (« Analyser une sortie ») ---------- */
const anFile = C('analyse.yaml');
const GRAVITES = ['crit', 'warn', 'info'];
const analyse = fs.existsSync(anFile) ? (readYaml(anFile) || []).map((r, i) => {
  const where = 'règle n° ' + (i + 1) + (r && r.id ? ' (' + r.id + ')' : '');
  if (!r || !ID_RX.test(r.id || '')) { err(anFile, where + ' : « id » manquant ou invalide'); return null; }
  if (!isStr(r.titre) || !isStr(r.explication)) err(anFile, where + ' : « titre » et « explication » attendus');
  if (!GRAVITES.includes(r.gravite)) err(anFile, where + ' : gravité « ' + r.gravite + ' » inconnue (' + GRAVITES.join(', ') + ')');
  try { new RegExp(r.motif, 'im'); } catch (e) { err(anFile, where + ' : motif illisible (' + e.message + ')'); }
  const voir = Array.isArray(r.voir) ? r.voir.map(String) : [];
  for (const v of voir) if (!CMD.has(v) && !procedures.some(p => p.id === v) && !pages.some(p => p.id === v)) err(anFile, where + ' : voir « ' + v + ' » introuvable');
  return { id: r.id, titre: r.titre, motif: String(r.motif), gravite: r.gravite, explication: prose(r.explication), voir };
}).filter(Boolean) : [];

/* ---------- nouveautés ---------- */
const nvFile = C('nouveautes.yaml');
const nouveautes = fs.existsSync(nvFile) ? (readYaml(nvFile) || []).map((n, i) => {
  if (!DATE_RX.test(toDate(n.date))) err(nvFile, 'entrée ' + (i + 1) + ' : « date » AAAA-MM-JJ attendue');
  return { date: toDate(n.date), titre: n.titre || '', texte: prose(n.texte) };
}).sort((a, b) => b.date.localeCompare(a.date)) : [];

/* ---------- bilan ---------- */
warnings.forEach(w => console.warn('⚠ ' + w));
if (errors.length) {
  console.error('\n✖ ' + errors.length + ' erreur' + (errors.length > 1 ? 's' : '') + ' dans le contenu :\n');
  errors.forEach(e => console.error('  • ' + e));
  console.error('\nRien n’a été publié. Corrige le ou les fichiers ci-dessus puis relance.');
  process.exit(1);
}
const stats = commandes.length + ' commandes, ' + procedures.length + ' procédures, ' + pages.length + ' pages, ' + variables.length + ' variables';
if (CHECK) { console.log('✔ Contenu valide : ' + stats + (warnings.length ? ' (' + warnings.length + ' avertissements)' : '')); process.exit(0); }

/* ---------- assemblage ---------- */
let commit = process.env.CF_PAGES_COMMIT_SHA || process.env.GITHUB_SHA || '';
if (!commit) { try { commit = execSync('git rev-parse HEAD', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch (e) { commit = ''; } }
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const build = new Date().toISOString();
const data = {
  meta: { titre: site.titre, sous_titre: site.sous_titre, version: pkg.version, build, commit: commit.slice(0, 7), depot: site.depot || '', branche: site.branche || 'main', contact: site.contact || '' },
  machines: MACHINES, niveaux: NIVEAUX, themes: THEMES, groupes: site.groupes || [], accueil: site.accueil || {},
  variables, categories, commandes, procedures, pages, nouveautes, analyse
};
const json = JSON.stringify(data).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const formatsJs = read('src/formats.js').replace(/^export /gm, '');
const html = read('src/index.html')
  .replace('/*__CSS__*/', () => read('src/styles.css'))
  .replace('/*__DATA__*/', () => 'const DATA = ' + json + ';')
  .replace('/*__FORMATS__*/', () => formatsJs)
  .replace('/*__APP__*/', () => read('src/app.js'))
  .replace(/__TITRE__/g, escHtml(site.titre || 'Mémo SSH Cabine'));

const DIST = path.join(ROOT, 'dist');
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
fs.writeFileSync(path.join(DIST, 'index.html'), html);
fs.writeFileSync(path.join(DIST, 'memo-ssh-cabine.html'), html);   /* version hors ligne à télécharger */
/* Variante pour une page Artifact de claude.ai : sans squelette HTML (ajouté à la publication), sans service worker. */
const head = html.match(/<head>([\s\S]*?)<\/head>/)[1], body = html.match(/<body>([\s\S]*?)<\/body>/)[1];
const artifact = '<title>' + escHtml(site.titre || 'Mémo SSH Cabine') + '</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<meta name="robots" content="noindex,nofollow">\n' +
  head.match(/<style>[\s\S]*?<\/style>/)[0] + '\n' + body.replace("const MODE = 'web';", "const MODE = 'artifact';");
fs.mkdirSync(path.join(ROOT, 'artifact'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'artifact', 'memo-ssh-cabine.html'), artifact);
fs.writeFileSync(path.join(DIST, 'version.json'), JSON.stringify({ build, commit: commit.slice(0, 7), version: pkg.version }));
for (const f of fs.readdirSync(path.join(ROOT, 'public'))) {
  let s = fs.readFileSync(path.join(ROOT, 'public', f));
  if (f === 'sw.js') s = Buffer.from(s.toString().replace('__BUILD__', build));
  fs.writeFileSync(path.join(DIST, f), s);
}
console.log('✔ dist/ construit : ' + stats + ' · ' + Math.round(Buffer.byteLength(html) / 1024) + ' Ko' + (warnings.length ? ' · ' + warnings.length + ' avertissements' : ''));
