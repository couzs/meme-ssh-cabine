/* Mémo SSH Cabine — application. Les données (DATA) sont injectées au build depuis content/.
   Aucune donnée de site n’est envoyée nulle part : les variables restent dans ce navigateur (coffre chiffré). */
const M = DATA.meta;
const VARS = DATA.variables;
const VAR = Object.fromEntries(VARS.map(v => [v.cle, v]));
const BLANK = Object.fromEntries(VARS.map(v => [v.cle, '']));
const MACH = DATA.machines, LEV = DATA.niveaux;
const CMDS = DATA.commandes, PROCS = DATA.procedures, PAGES = DATA.pages, CATS = DATA.categories;
const CMD = Object.fromEntries(CMDS.map(c => [c.id, c]));
const PROC = Object.fromEntries(PROCS.map(p => [p.id, p]));
const PAGE = Object.fromEntries(PAGES.map(p => [p.id, p]));
const CAT = Object.fromEntries(CATS.map(c => [c.id, c]));
const NEW_SITE = 'Nouveau site';
const EXAMPLE = 'Exemple (fictif)';
const PRESETS = { [EXAMPLE]: Object.fromEntries(VARS.map(v => [v.cle, v.exemple || ''])) };
const NEW_DAYS = 30;
const BUILD_T = Date.parse(M.build) || Date.now();
const isNew = d => d && (BUILD_T - Date.parse(d)) / 864e5 <= NEW_DAYS;
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const $ = id => document.getElementById(id);
const RESERVED = new Set(['__proto__', 'constructor', 'prototype', 'hasOwnProperty', 'toString', 'valueOf']);
const okName = n => typeof n === 'string' && /^[\p{L}\p{N} _.()'-]{1,40}$/u.test(n) && !RESERVED.has(n);
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const strip = h => String(h).replace(/<[^>]+>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const editUrl = f => M.depot && f ? 'https://github.com/' + M.depot + '/edit/' + (M.branche || 'main') + '/' + f : '';
const online = /^https?:$/.test(location.protocol);

/* ================= ÉTAT ================= */
function load(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
const S = { q: '', m: 'all', view: 'std', fav: false, route: { t: 'home' }, site: NEW_SITE, vals: { ...BLANK }, favs: new Set(), profiles: {}, open: new Set(), key: null, salt: null, dirty: false };
function cleanVals(o) { const v = { ...BLANK }; if (o && typeof o === 'object') VARS.forEach(({ cle }) => { if (has(o, cle) && typeof o[cle] === 'string') v[cle] = o[cle].slice(0, 200).trim(); }); return v; }
/* reprise des anciennes versions (profils en clair v2) : en mémoire seulement, puis effacées du stockage */
S.legacy = 0;
const sp = load('memo_profiles'); if (sp && typeof sp === 'object') Object.keys(sp).forEach(n => { if (okName(n)) { S.profiles[n] = cleanVals(sp[n]); S.legacy++; } });
const sv = load('memo_vars'); if (sv && typeof sv === 'object') { const v = cleanVals(sv); if (VARS.some(({ cle }) => v[cle])) { S.vals = v; S.legacy = S.legacy || 1; } }
['memo_profiles', 'memo_site', 'memo_vars'].forEach(k => { try { localStorage.removeItem(k); } catch (e) { } });
S.dirty = S.legacy > 0;
/* favoris : identifiants stables ; reprise des favoris v2 (« catégorie|titre ») */
const sf = load('memo_favs2') || load('memo_favs');
if (Array.isArray(sf)) sf.forEach(x => {
  if (typeof x !== 'string') return;
  if (CMD[x] || PROC[x]) { S.favs.add(x); return; }
  const [cat, t] = x.split('|');
  const c = cat === 'proc' ? PROCS.find(p => p.titre === t) : CMDS.find(c => c.cat === cat && c.titre === t);
  if (c) S.favs.add(c.id);
});
const saveFavs = () => save('memo_favs2', [...S.favs]);
const sm = load('memo_machine'); if (sm === 'all' || has(MACH, sm)) S.m = sm;
const svw = load('memo_view'); if (['guide', 'std', 'compact'].includes(svw)) S.view = svw; else if (load('memo_compact') === true) S.view = 'compact';
const seen = load('memo_news_seen') || '';

/* ================= VARIABLES ================= */
const vState = (k, v) => { if (v === undefined) v = S.vals[k]; return VAR[k] ? etatValeur(VAR[k].format, v) : 'bad'; };
function subst(cmd) { return cmd.replace(/\{([A-Z][A-Z0-9_]*)\}/g, (m, k) => VAR[k] && vState(k) === 'ok' ? S.vals[k] : m); }
function substHTML(cmd) {
  return esc(cmd).replace(/\{([A-Z][A-Z0-9_]*)\}/g, (m, k) => {
    if (!VAR[k]) return m;
    const st = vState(k), lab = esc(VAR[k].libelle);
    if (st === 'ok') return '<span class="v" title="{' + k + '} · ' + lab + '">' + esc(S.vals[k]) + '</span>';
    if (st === 'bad') return '<span class="bad" title="Valeur invalide pour {' + k + '} : copie bloquée">' + esc(S.vals[k]) + '</span>';
    return '<span class="miss" title="À remplir dans « Mon site » : ' + lab + '">{' + k + '}</span>';
  });
}
const usedVars = cmd => [...new Set([...cmd.matchAll(/\{([A-Z][A-Z0-9_]*)\}/g)].map(m => m[1]).filter(k => VAR[k]))];

/* ================= INDEX ================= */
const COPY = {};
CMDS.forEach(c => { COPY['c:' + c.id] = { cmd: c.commande, lv: c.niveau, m: c.machine };
  c.hay = norm([c.titre, c.commande, strip(c.but), strip(c.attendu), strip(c.attention), strip(c.lecture), strip(c.si_ko), c.detail.map(d => d[0] + ' ' + strip(d[1])).join(' '), c.mots.join(' '), CAT[c.cat].titre, LEV[c.niveau].label, MACH[c.machine].label].join(' '));
  c.tnorm = norm(c.titre + ' ' + c.mots.join(' ')); });
PROCS.forEach(p => {
  p.etapes.forEach((s, i) => { if (s.commande) COPY['p:' + p.id + ':' + i] = { cmd: s.commande, lv: s.niveau, m: s.machine }; });
  p.readOnly = p.etapes.every(s => s.niveau === 'info');
  const cmds = p.etapes.filter(s => s.commande);
  if (p.readOnly && p.copier_tout && cmds.length > 1 && cmds.every(s => s.machine === cmds[0].machine)) COPY['p:' + p.id + ':all'] = { cmd: cmds.map(s => s.commande).join('\n'), lv: 'info', m: cmds[0].machine };
  p.machines = [...new Set(p.etapes.map(s => s.machine).filter(m => m !== 'man'))];
  p.lvMax = p.etapes.some(s => s.niveau === 'danger') ? 'danger' : p.etapes.some(s => s.niveau === 'action') ? 'action' : 'info';
  p.hay = norm([p.titre, p.quand, strip(p.comprendre), p.theme, p.symptomes.join(' '), strip(p.attention), p.etapes.map(s => s.titre + ' ' + s.commande + ' ' + strip(s.attendu) + ' ' + strip(s.consigne)).join(' ')].join(' '));
  p.tnorm = norm(p.titre + ' ' + p.quand + ' ' + p.symptomes.join(' '));
});
PAGES.forEach(p => { p.hay = norm(p.titre + ' ' + p.intro + ' ' + strip(p.html)); p.tnorm = norm(p.titre); });

function mOk(m) {
  if (S.m === 'all' || m === 'man') return true;
  if (S.m === 'win' || S.m === 'jnr') return m === S.m;
  return m === S.m || m === 'lin';
}
const terms = () => norm(S.q).split(/\s+/).filter(Boolean);
function score(o) {
  const t = terms(); if (!t.length) return 1;
  if (!t.every(w => o.hay.includes(w))) return 0;
  return 1 + t.filter(w => o.tnorm.includes(w)).length * 3;
}
const cmdOk = c => (!S.fav || S.favs.has(c.id)) && mOk(c.machine);
const procOk = p => (!S.fav || S.favs.has(p.id)) && (S.m === 'all' || p.machines.some(mOk));

/* ================= ROUTAGE ================= */
function parseHash() {
  let h = ''; try { h = decodeURIComponent(location.hash.slice(1)); } catch (e) { }
  const [t, id] = h.split('/');
  if (t === 'c' && CMD[id]) return { t: 'cat', id: CMD[id].cat, focus: 'c-' + id };
  if (t === 'p' && PROC[id]) return { t: 'procs', focus: 'p-' + id, open: id };
  if ((t === 'cat' || t === 'page') && (CAT[id] || PAGE[id])) return { t: CAT[id] ? 'cat' : 'page', id };
  if (t === 'procedures') return { t: 'procs' };
  if (t === 'tout') return { t: 'all' };
  if (t === 'favoris') return { t: 'all', fav: true };
  if (CAT[t]) return { t: 'cat', id: t };   /* anciens liens #categorie */
  if (PAGE[t]) return { t: 'page', id: t };
  return { t: 'home' };
}
const hrefOf = r => r.t === 'home' ? '#accueil' : r.t === 'procs' ? '#procedures' : r.t === 'all' ? '#tout' : (r.t === 'page' ? '#page/' : '#cat/') + r.id;
function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }
function route() {
  S.route = parseHash();
  if (S.route.fav) S.fav = true;
  if (S.route.open) S.open.add(S.route.open);
  render();
  const f = S.route.focus;
  if (f) requestAnimationFrame(() => { const el = $(f); if (el) { if (el.tagName === 'DETAILS') el.open = true; el.scrollIntoView({ block: 'start' }); el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); } });
  else if (!S.q) window.scrollTo(0, 0);
}
window.addEventListener('hashchange', () => { if (S.q) { S.q = ''; $('q').value = ''; } route(); });

/* ================= RENDU : éléments ================= */
const tagM = m => '<span class="tag" title="' + esc(MACH[m].desc || '') + '">' + esc(MACH[m].label) + '</span>';
const tagL = (lv, label) => '<span class="tag ' + lv + '" title="' + esc(LEV[lv].desc || '') + '">' + esc(label || LEV[lv].label) + '</span>';
const star = id => { const f = S.favs.has(id); return '<button class="ibtn star" type="button" data-star="' + esc(id) + '" aria-pressed="' + f + '" title="' + (f ? 'Retirer des favoris' : 'Ajouter aux favoris') + '">' + (f ? '★' : '☆') + '</button>'; };
const linkBtn = h => '<button class="ibtn lnk" type="button" data-link="' + esc(h) + '" title="Copier le lien direct (à coller dans un ticket)">🔗</button>';
const copyBtn = (k, lv, label) => '<button class="ibtn copy" type="button" data-copy="' + esc(k) + '">' + (label || 'Copier') + '</button>';
const preCls = m => m === 'win' ? 'cmd ps' : m === 'jnr' ? 'cmd jn' : 'cmd';
const pre = (k, cmd, m) => '<pre class="' + preCls(m) + '" data-copy="' + esc(k) + '" title="Cliquer pour copier">' + substHTML(cmd) + '</pre>';
const box = (cls, label, html) => html ? '<div class="' + cls + '"><b>' + label + '</b><div>' + html + '</div></div>' : '';

function learnHTML(c, open) {
  let h = '';
  if (c.detail.length) h += '<div class="lsec"><h4>Décomposition</h4><table class="dt"><tbody>' + c.detail.map(([a, b]) => '<tr><td>' + esc(a) + '</td><td>' + b + '</td></tr>').join('') + '</tbody></table></div>';
  if (c.exemple) h += '<div class="lsec"><h4>Exemple de résultat</h4><pre class="out">' + esc(c.exemple) + '</pre></div>';
  if (c.lecture) h += '<div class="lsec"><h4>Comment lire le résultat</h4>' + c.lecture + '</div>';
  if (c.si_ko) h += '<div class="lsec ko"><h4>Si ça ne va pas</h4>' + c.si_ko + '</div>';
  const voir = c.voir.map(v => CMD[v] ? '<a class="linkbtn" href="#c/' + v + '">' + esc(CMD[v].titre) + '</a>' : PROC[v] ? '<a class="linkbtn" href="#p/' + v + '">▶ ' + esc(PROC[v].titre) + '</a>' : '').join('');
  if (voir) h += '<div class="lsec"><h4>Voir aussi</h4><div class="voir">' + voir + '</div></div>';
  if (!h) return '';
  return '<details class="learn"' + (open ? ' open' : '') + '><summary>Comprendre' + (c.exemple ? ' · exemple' : '') + (c.lecture ? ' · lire le résultat' : '') + '</summary>' + h + '</details>';
}
function cardHTML(c) {
  const ed = editUrl(c.fichier);
  return '<article class="card lv-' + c.niveau + '" id="c-' + c.id + '">' +
    '<div class="chead"><h3 class="ctitle">' + esc(c.titre) + '</h3>' + (isNew(c.maj) ? '<span class="tag new">nouveau</span>' : '') +
    tagM(c.machine) + tagL(c.niveau) + star(c.id) + linkBtn('#c/' + c.id) + copyBtn('c:' + c.id, c.niveau) + '</div>' +
    pre('c:' + c.id, c.commande, c.machine) +
    (c.but ? '<div class="desc">' + c.but + '</div>' : '') +
    box('exp', 'Attendu', c.attendu) + box('note', '⚠', c.attention) +
    learnHTML(c, S.view === 'guide') +
    (ed && S.view !== 'compact' ? '<div class="cfoot"><a href="' + ed + '" target="_blank" rel="noopener">Proposer une correction</a></div>' : '') +
    '</article>';
}
function stepHTML(p, s, i) {
  const k = 'p:' + p.id + ':' + i, ref = s.ref && CMD[s.ref];
  let more = '';
  if (s.lecture) more += '<div class="lsec"><h4>Comment lire</h4>' + s.lecture + '</div>';
  if (s.si_ko) more += '<div class="lsec ko"><h4>Si ça ne va pas</h4>' + s.si_ko + '</div>';
  const learn = ref ? learnHTML(ref, S.view === 'guide') : '';
  return '<li class="step lv-' + s.niveau + (mOk(s.machine) ? '' : ' dim') + '" id="p-' + p.id + '-' + i + '"><span class="num">' + (i + 1) + '</span><div class="sbody">' +
    '<div class="shead"><span class="slabel">' + esc(s.titre) + '</span>' + tagM(s.machine) + (s.niveau !== 'info' ? tagL(s.niveau) : '') +
    (s.commande ? copyBtn(k, s.niveau) : '') + '</div>' +
    (s.commande ? pre(k, s.commande, s.machine) : '') +
    (s.commande ? box('exp', 'Attendu', s.attendu) : '') +
    (s.consigne ? '<div class="manual">' + s.consigne + '</div>' : '') +
    more + learn + (ref ? '<div class="cfoot"><a href="#c/' + ref.id + '">Fiche « ' + esc(ref.titre) + ' »</a></div>' : '') +
    '</div></li>';
}
function procHTML(p) {
  const open = S.open.has(p.id) || !!S.q;
  const all = COPY['p:' + p.id + ':all'];
  const ed = editUrl(p.fichier);
  return '<details class="proc" id="p-' + p.id + '" data-pid="' + p.id + '"' + (open ? ' open' : '') + '>' +
    '<summary><span class="ptitle">' + esc(p.titre) + '</span><span class="psym">' + esc(p.quand) + '</span>' +
    '<span class="pside">' + (isNew(p.maj) ? '<span class="tag new">nouveau</span>' : '') + '<span class="tag">' + p.etapes.length + ' étapes</span><span class="tag">' + p.machines.map(m => esc(MACH[m].label)).join(' · ') + '</span>' + tagL(p.lvMax, p.lvMax === 'info' ? 'lecture seule' : '') +
    star(p.id) + linkBtn('#p/' + p.id) + '</span></summary>' +
    '<div class="pbody">' +
    (p.comprendre ? '<div class="pwhy"><b>Comprendre</b>' + p.comprendre + '</div>' : '') +
    (all ? '<div class="pact"><span>Toutes les étapes sont en lecture seule et sur la même machine : tu peux tout copier d’un coup.</span>' + copyBtn('p:' + p.id + ':all', 'info', 'Copier tout') + '</div>' : '') +
    '<ol class="steps">' + p.etapes.map((s, i) => stepHTML(p, s, i)).join('') + '</ol>' +
    (p.attention ? '<div class="pnote"><b>⚠ </b>' + p.attention + '</div>' : '') +
    (ed && S.view !== 'compact' ? '<div class="cfoot"><a href="' + ed + '" target="_blank" rel="noopener">Proposer une correction</a></div>' : '') +
    '</div></details>';
}
function pageHTML(p) {
  const ed = editUrl(p.fichier);
  return '<section class="grp" id="g-' + p.id + '"><div class="crumb"><a href="#accueil">Accueil</a> › ' + esc(p.groupe) + '</div><h2>' + esc(p.titre) + '</h2>' + (p.intro ? '<p class="intro">' + esc(p.intro) + '</p>' : '') +
    '<div class="page">' + p.html + '</div>' + (ed ? '<div class="cfoot"><a href="' + ed + '" target="_blank" rel="noopener">Proposer une correction</a></div>' : '') + '</section>';
}
function catSection(cat, cmds, crumb) {
  return '<section class="grp" id="g-' + cat.id + '">' + (crumb ? '<div class="crumb"><a href="#accueil">Accueil</a> › ' + esc(cat.groupe) + '</div>' : '') +
    '<h2>' + esc(cat.titre) + '</h2>' + (cat.intro ? '<p class="intro">' + esc(cat.intro) + '</p>' : '') + '<div class="list">' + cmds.map(cardHTML).join('') + '</div></section>';
}
function procsSection(ps, title) {
  let lt = '', body = '';
  ps.forEach(p => { if (p.theme !== lt) { body += '<h3 class="th-h">' + esc(p.theme) + '</h3>'; lt = p.theme; } body += procHTML(p); });
  return '<section class="grp" id="g-proc"><h2>' + esc(title || 'Procédures') + '</h2><p class="intro">Enchaînements à dérouler dans l’ordre. Chaque procédure commence par « Comprendre » : ce qui se passe et pourquoi on vérifie dans cet ordre. Sous chaque étape : le résultat attendu.</p><div class="list">' + body + '</div></section>';
}

/* ================= RENDU : vues ================= */
function homeHTML() {
  const procs = PROCS.filter(procOk);
  let tiles = '', lt = '';
  procs.forEach(p => {
    if (p.theme !== lt) { if (lt) tiles += '</div>'; tiles += '<h3 class="th-h">' + esc(p.theme) + '</h3><div class="tiles">'; lt = p.theme; }
    tiles += '<a class="tile" href="#p/' + p.id + '"><b>' + esc(p.titre) + '</b><span>' + esc(p.quand) + '</span><span class="tmeta">' + (isNew(p.maj) ? '<span class="tag new">nouveau</span>' : '') + '<span class="tag">' + p.etapes.length + ' étapes</span>' + tagL(p.lvMax, p.lvMax === 'info' ? 'lecture seule' : '') + '</span></a>';
  });
  if (lt) tiles += '</div>';
  const guides = PAGES.filter(p => p.type === 'guide');
  const favs = [...S.favs].map(id => CMD[id] ? '<li><a href="#c/' + id + '">' + esc(CMD[id].titre) + '</a></li>' : PROC[id] ? '<li><a href="#p/' + id + '">▶ ' + esc(PROC[id].titre) + '</a></li>' : '').join('');
  const news = DATA.nouveautes.slice(0, 3).map(n => '<li><b>' + esc(n.titre) + '</b> <span class="vs-count">' + esc(fmtDate(n.date)) + '</span></li>').join('');
  return '<div class="hero"><h1>Que se passe-t-il en cabine ?</h1><p>Choisis le symptôme ci-dessous pour suivre une procédure pas à pas, ou tape un mot dans la recherche (<kbd>/</kbd>) : « kdm », « disque plein », « lumière », « ingest »…</p>' +
    '<ol class="steps3"><li><b>Renseigne ton site</b>Ouvre « Mon site » et saisis les IP : elles s’insèrent dans les commandes.</li><li><b>Suis la procédure</b>Chaque étape dit quoi taper, sur quelle machine, et ce que tu dois voir.</li><li><b>Copie, colle, compare</b>Clique sur une commande pour la copier. Le résultat attendu est juste dessous.</li></ol></div>' +
    '<div class="home-grid"><div>' + (tiles || '<div class="empty">Aucune procédure pour ce filtre.</div>') + '</div><aside class="home-side">' +
    (guides.length ? '<div class="box"><h3>Débuter</h3><ul>' + guides.map(g => '<li><a href="#page/' + g.id + '">' + esc(g.titre) + '</a></li>').join('') + '</ul></div>' : '') +
    (favs ? '<div class="box"><h3>Mes favoris</h3><ul>' + favs + '</ul></div>' : '') +
    '<div class="box"><h3>Niveaux de risque</h3><div class="legend">' + Object.keys(LEV).map(k => '<div>' + tagL(k) + '<span>' + esc(LEV[k].desc) + '</span></div>').join('') + '</div></div>' +
    (news ? '<div class="box"><h3>Nouveautés</h3><ul>' + news + '</ul><p style="margin-top:8px"><a href="#" data-dlg="news">Tout voir</a></p></div>' : '') +
    '</aside></div>';
}
function searchHTML() {
  const ps = PROCS.filter(procOk).map(p => [score(p), p]).filter(x => x[0]).sort((a, b) => b[0] - a[0]).map(x => x[1]);
  const cs = CMDS.filter(cmdOk).map(c => [score(c), c]).filter(x => x[0]).sort((a, b) => b[0] - a[0]).map(x => x[1]);
  const pg = S.fav ? [] : PAGES.map(p => [score(p), p]).filter(x => x[0]).sort((a, b) => b[0] - a[0]).map(x => x[1]);
  let h = '';
  if (pg.length) h += '<section class="grp"><h2>Pages</h2><div class="hits">' + pg.map(p => '<a class="hit" href="#page/' + p.id + '"><b>' + esc(p.titre) + '</b><span>' + esc(p.groupe) + (p.intro ? ' · ' + esc(p.intro) : '') + '</span></a>').join('') + '</div></section>';
  if (ps.length) h += procsSection(ps, 'Procédures');
  if (cs.length) h += '<section class="grp"><h2>Commandes</h2><div class="list">' + cs.map(c => cardHTML(c)).join('') + '</div></section>';
  return [h, ps.length, cs.length, pg.length];
}
function render() {
  document.body.className = 'v-' + S.view;
  renderNav(); renderBars();
  const r = S.route; let h = '', meta = '';
  if (S.q) {
    const [hh, np, nc, ng] = searchHTML(); h = hh;
    meta = '« ' + S.q + ' » : ' + [np && np + ' procédure' + (np > 1 ? 's' : ''), nc + ' commande' + (nc > 1 ? 's' : ''), ng && ng + ' page' + (ng > 1 ? 's' : '')].filter(Boolean).join(' · ');
    if (!hh) h = emptyHTML();
  } else if (r.t === 'home' && !S.fav) {
    h = homeHTML(); meta = PROCS.length + ' procédures · ' + CMDS.length + ' commandes · ' + PAGES.length + ' pages';
  } else if (r.t === 'procs') {
    const ps = PROCS.filter(procOk); h = ps.length ? procsSection(ps) : emptyHTML(); meta = ps.length + ' procédure' + (ps.length > 1 ? 's' : '');
  } else if (r.t === 'page') {
    h = pageHTML(PAGE[r.id]); meta = PAGE[r.id].groupe;
  } else if (r.t === 'cat') {
    const cat = CAT[r.id], cs = CMDS.filter(c => c.cat === r.id && cmdOk(c));
    h = cs.length ? catSection(cat, cs, true) : emptyHTML(); meta = cs.length + ' commande' + (cs.length > 1 ? 's' : '') + ' sur ' + CMDS.filter(c => c.cat === r.id).length;
  } else {
    const ps = PROCS.filter(procOk); let n = 0;
    if (ps.length) h += procsSection(ps);
    CATS.forEach(cat => { const cs = CMDS.filter(c => c.cat === cat.id && cmdOk(c)); n += cs.length; if (cs.length) h += catSection(cat, cs); });
    if (!S.fav && S.m === 'all') PAGES.forEach(p => { h += pageHTML(p); });
    if (!h) h = emptyHTML();
    meta = (S.fav ? 'Favoris : ' : '') + ps.length + ' procédure' + (ps.length > 1 ? 's' : '') + ' · ' + n + ' commande' + (n > 1 ? 's' : '');
  }
  $('out').innerHTML = h;
  $('meta').textContent = meta;
}
function emptyHTML() {
  return '<div class="empty">Rien ne correspond' + (S.fav ? ' dans tes favoris' : '') + (S.m !== 'all' ? ' pour la machine ' + esc(MACH[S.m].label) : '') + '.<br>Essaie un autre mot, ou repasse le filtre sur « Tout ».</div>';
}
function renderNav() {
  const r = S.route, cur = x => (!S.q && x) ? ' aria-current="page"' : '';
  const nC = id => CMDS.filter(c => c.cat === id && cmdOk(c)).length;
  let h = '<a href="#accueil"' + cur(r.t === 'home' && !S.fav) + '><span>Accueil</span></a>' +
    '<a href="#procedures"' + cur(r.t === 'procs') + '><span>Procédures</span><span class="n">' + PROCS.filter(procOk).length + '</span></a>' +
    '<a href="#tout"' + cur(r.t === 'all') + '><span>Tout afficher</span><span class="n">' + CMDS.filter(cmdOk).length + '</span></a>';
  const groups = [...new Set([...DATA.groupes, ...CATS.map(c => c.groupe), ...PAGES.map(p => p.groupe)])];
  groups.forEach(g => {
    const cats = CATS.filter(c => c.groupe === g), pages = PAGES.filter(p => p.groupe === g);
    if (!cats.length && !pages.length) return;
    h += '<div class="navlabel">' + esc(g) + '</div>';
    pages.filter(p => p.type === 'guide').forEach(p => { h += '<a href="#page/' + p.id + '"' + cur(r.t === 'page' && r.id === p.id) + '><span>' + esc(p.titre) + '</span></a>'; });
    cats.forEach(c => { h += '<a href="#cat/' + c.id + '"' + cur(r.t === 'cat' && r.id === c.id) + '><span>' + esc(c.titre) + '</span><span class="n">' + nC(c.id) + '</span></a>'; });
    pages.filter(p => p.type !== 'guide').forEach(p => { h += '<a href="#page/' + p.id + '"' + cur(r.t === 'page' && r.id === p.id) + '><span>' + esc(p.titre) + '</span></a>'; });
  });
  $('cats').innerHTML = h;
}
function renderBars() {
  $('seg-m').innerHTML = '<button data-m="all" type="button" aria-pressed="' + (S.m === 'all') + '">Tout</button>' +
    Object.keys(MACH).filter(k => k !== 'lin' && k !== 'man').map(k => '<button data-m="' + k + '" type="button" title="' + esc(MACH[k].desc) + '" aria-pressed="' + (S.m === k) + '">' + esc(MACH[k].label) + '</button>').join('');
  document.querySelectorAll('#seg-v button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === S.view));
  $('favonly').setAttribute('aria-pressed', S.fav);
}
const fmtDate = d => { const t = Date.parse(d); return isNaN(t) ? d : new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); };

/* ================= MON SITE ================= */
const vgroups = $('vgroups');
vgroups.innerHTML = [...new Set(VARS.map(v => v.groupe))].map(g => '<fieldset class="vg"><legend>' + esc(g) + '</legend>' +
  VARS.filter(v => v.groupe === g).map(v => '<div class="vrow"><label class="k" for="v-' + v.cle + '" title="' + esc(v.libelle) + '">{' + v.cle + '}</label><input id="v-' + v.cle + '" data-k="' + v.cle + '" placeholder="' + esc(v.libelle) + '" maxlength="200" spellcheck="false" autocomplete="off" aria-describedby="e-' + v.cle + '">' +
    '<span class="verr" id="e-' + v.cle + '" hidden></span>' + (v.aide ? '<span class="vaide">' + esc(v.aide) + '</span>' : '') + '</div>').join('') + '</fieldset>').join('');
const siteSel = $('site');
const getProfile = n => has(S.profiles, n) ? S.profiles[n] : has(PRESETS, n) ? PRESETS[n] : null;
function renderSites() {
  const custom = Object.keys(S.profiles).filter(n => !has(PRESETS, n)).sort((a, b) => a.localeCompare(b, 'fr'));
  let h = '';
  if (custom.length) h += '<optgroup label="Mes sites">' + custom.map(n => '<option value="' + esc(n) + '">' + esc(n) + '</option>').join('') + '</optgroup>';
  h += '<optgroup label="Modèles">' + Object.keys(PRESETS).map(n => '<option value="' + esc(n) + '">' + esc(n) + (has(S.profiles, n) ? ' (modifié)' : '') + '</option>').join('') + '</optgroup>';
  if (!getProfile(S.site)) h = '<option value="' + esc(S.site) + '">' + esc(S.site) + ' (non enregistré)</option>' + h;
  siteSel.innerHTML = h; siteSel.value = S.site;
}
function markVar(k) {
  const inp = $('v-' + k), e = $('e-' + k), st = vState(k);
  inp.setAttribute('aria-invalid', st === 'bad');
  e.hidden = st !== 'bad'; e.textContent = st === 'bad' ? FORMATS[VAR[k].format].aide : '';
}
function fillVars() { VARS.forEach(({ cle }) => { $('v-' + cle).value = S.vals[cle] || ''; markVar(cle); }); }
const sameAsProfile = () => { const p = getProfile(S.site); return p && VARS.every(({ cle }) => (p[cle] || '') === (S.vals[cle] || '')); };
function summary() {
  $('vs-site').textContent = S.site;
  const n = VARS.filter(({ cle }) => vState(cle) === 'ok').length, bad = VARS.filter(({ cle }) => vState(cle) === 'bad').length;
  $('vs-count').textContent = n + ' / ' + VARS.length + ' variables remplies' + (bad ? ' · ' + bad + ' invalide' + (bad > 1 ? 's' : '') : '') + (getProfile(S.site) && !sameAsProfile() ? ' · modifications non enregistrées' : '');
}
/* ---------- coffre chiffré : AES-GCM 256, clé dérivée du mot de passe (PBKDF2-SHA256, 310 000 itérations) ---------- */
const VAULT_KEY = 'memo_vault', PBKDF2_IT = 310000, AUTOLOCK_MIN = 30;
const cryptoOk = !!(window.crypto && crypto.subtle && crypto.getRandomValues);
const b64 = u8 => btoa(String.fromCharCode(...u8));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
function vaultStored() { const v = load(VAULT_KEY); return v && v.v === 1 && typeof v.salt === 'string' && typeof v.iv === 'string' && typeof v.ct === 'string' ? v : null; }
async function deriveKey(pass, salt) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: PBKDF2_IT, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function sealVault() {
  if (!S.key) return false;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(JSON.stringify({ profiles: S.profiles, site: S.site }));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, S.key, data));
  try { localStorage.setItem(VAULT_KEY, JSON.stringify({ v: 1, kdf: 'PBKDF2-SHA256', it: PBKDF2_IT, salt: b64(S.salt), iv: b64(iv), ct: b64(ct) })); }
  catch (e) { toast('Enregistrement impossible : stockage du navigateur indisponible'); return false; }
  S.dirty = false; return true;
}
async function openVault(pass) {
  const st = vaultStored();
  if (!st) { S.salt = crypto.getRandomValues(new Uint8Array(16)); S.key = await deriveKey(pass, S.salt); await sealVault(); return 'created'; }
  const salt = unb64(st.salt), key = await deriveKey(pass, salt);
  let obj;
  try { obj = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(st.iv) }, key, unb64(st.ct)))); }
  catch (e) { return 'bad'; }
  const stored = {};
  if (obj && obj.profiles && typeof obj.profiles === 'object') Object.keys(obj.profiles).forEach(n => { if (okName(n)) stored[n] = cleanVals(obj.profiles[n]); });
  const before = Object.keys(stored).length;
  Object.keys(S.profiles).forEach(n => { if (!has(stored, n)) stored[n] = S.profiles[n]; });
  S.profiles = stored; S.key = key; S.salt = salt;
  if (S.site === NEW_SITE && !VARS.some(({ cle }) => S.vals[cle]) && okName(obj && obj.site) && has(stored, obj.site)) { S.site = obj.site; S.vals = cleanVals(stored[obj.site]); }
  if (Object.keys(stored).length !== before || S.dirty) await sealVault();
  return 'ok';
}
function lockVault(msg) { S.key = null; S.salt = null; S.profiles = {}; S.site = NEW_SITE; S.vals = { ...BLANK }; S.dirty = false; refreshSite(); if (msg) toast(msg); }
let lastAct = Date.now();
['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, () => { lastAct = Date.now(); }, true));
setInterval(() => { if (S.key && Date.now() - lastAct > AUTOLOCK_MIN * 60000) lockVault('Coffre verrouillé après ' + AUTOLOCK_MIN + ' min d’inactivité'); }, 30000);
function renderVault() {
  const st = vaultStored(), n = Object.keys(S.profiles).length, el = $('vault');
  el.classList.toggle('is-open', !!S.key); el.classList.toggle('is-warn', !S.key && S.dirty);
  $('vault-form').hidden = !cryptoOk || !!S.key; $('vault-open').hidden = !S.key;
  const pl = n + ' site' + (n > 1 ? 's' : '');
  let lock, msg;
  if (!cryptoOk) { msg = '<b>Coffre indisponible dans ce navigateur.</b> Les variables restent en mémoire le temps de la session.'; lock = 'non mémorisé'; }
  else if (S.key) { msg = '<b>Coffre ouvert</b> · ' + pl + ' · verrouillage automatique après ' + AUTOLOCK_MIN + ' min sans activité.'; lock = 'coffre ouvert'; }
  else if (st) { msg = (S.dirty ? '<b>' + pl + ' de l’ancienne version en mémoire seulement.</b> ' : '') + '<b>Coffre verrouillé.</b> Saisis ton mot de passe pour retrouver tes sites.'; $('vgo').textContent = 'Ouvrir'; lock = 'coffre verrouillé'; }
  else { msg = (S.dirty ? '<b>' + pl + ' de l’ancienne version en mémoire seulement</b> : crée le coffre pour les garder. ' : '') + '<b>Aucun coffre.</b> Choisis un mot de passe pour mémoriser tes sites, chiffrés dans ce navigateur. Sans coffre, les valeurs restent jusqu’à la fermeture de l’onglet.'; $('vgo').textContent = 'Créer le coffre'; lock = 'non mémorisé'; }
  $('vault-msg').innerHTML = msg;
  $('vs-lock').textContent = '· ' + lock;
  $('sitesave').disabled = !S.key; $('sitename').disabled = !S.key;
  $('sitesave').title = S.key ? '' : 'Ouvre ou crée le coffre pour enregistrer un site';
  const del = $('sitedel');
  del.disabled = !S.key || !has(S.profiles, S.site);
  del.textContent = has(PRESETS, S.site) ? 'Revenir au modèle' : 'Supprimer ce profil';
}
function refreshSite() { fillVars(); renderSites(); renderVault(); summary(); render(); }
$('vault-form').addEventListener('submit', async e => {
  e.preventDefault();
  const vp = $('vpass'), vgo = $('vgo'), pass = vp.value; vp.value = '';
  if (pass.length < 8) { toast('Mot de passe trop court : 8 caractères minimum'); vp.focus(); return; }
  vgo.disabled = true; const label = vgo.textContent; vgo.textContent = 'Calcul…';
  try { const r = await openVault(pass); if (r === 'bad') toast('Mot de passe incorrect'); else { refreshSite(); toast(r === 'created' ? 'Coffre créé et chiffré' : 'Coffre ouvert'); } }
  catch (err) { toast('Coffre illisible dans ce navigateur'); }
  vgo.disabled = false; vgo.textContent = label; renderVault();
});
$('vlock').addEventListener('click', () => lockVault('Coffre verrouillé'));
let forgetArmed = false, forgetT;
$('vforget').addEventListener('click', e => {
  const b = e.currentTarget;
  if (!forgetArmed) { forgetArmed = true; b.classList.add('danger', 'confirm'); b.textContent = 'Confirmer la suppression'; clearTimeout(forgetT); forgetT = setTimeout(() => { forgetArmed = false; b.classList.remove('danger', 'confirm'); b.textContent = 'Supprimer le coffre'; }, 4000); return; }
  forgetArmed = false; b.classList.remove('danger', 'confirm'); b.textContent = 'Supprimer le coffre';
  try { localStorage.removeItem(VAULT_KEY); } catch (err) { }
  lockVault('Coffre supprimé de ce navigateur');
});
siteSel.addEventListener('change', () => { const n = siteSel.value, p = getProfile(n); if (!p) return; S.site = n; S.vals = cleanVals(p); refreshSite(); toast('Profil ' + S.site + ' chargé'); });
let vt;
vgroups.addEventListener('input', e => { const k = e.target.dataset.k; if (!k || !VAR[k]) return; S.vals[k] = e.target.value.trim().slice(0, 200); markVar(k); summary(); clearTimeout(vt); vt = setTimeout(render, 120); });
$('sitesave').addEventListener('click', async () => {
  if (!S.key) { toast('Ouvre ou crée le coffre pour enregistrer un site'); return; }
  const inp = $('sitename'), name = (inp.value.trim() || (S.site === NEW_SITE ? '' : S.site)).slice(0, 40);
  if (!okName(name)) { inp.focus(); toast('Donne un nom : lettres, chiffres, espace, - _ . ( ) uniquement'); return; }
  S.profiles[name] = cleanVals(S.vals); S.site = name; inp.value = '';
  if (await sealVault()) { renderSites(); renderVault(); summary(); toast('Site ' + name + ' enregistré dans le coffre'); }
});
$('sitedel').addEventListener('click', async () => {
  if (!S.key || !has(S.profiles, S.site)) return;
  const wasPreset = has(PRESETS, S.site);
  delete S.profiles[S.site];
  if (wasPreset) S.vals = cleanVals(PRESETS[S.site]); else { S.site = NEW_SITE; S.vals = { ...BLANK }; }
  await sealVault(); refreshSite(); toast(wasPreset ? 'Valeurs du modèle rétablies' : 'Site supprimé du coffre');
});
$('vclear').addEventListener('click', () => { S.vals = { ...BLANK }; fillVars(); summary(); render(); });
const vbox = $('varsbox');
if (load('memo_vars_open') === true || S.dirty) vbox.open = true;
vbox.addEventListener('toggle', () => save('memo_vars_open', vbox.open));
function openVars(k) { vbox.open = true; const i = $('v-' + k); if (i) { i.scrollIntoView({ block: 'center' }); i.focus({ preventScroll: true }); } }

/* ================= COPIE ================= */
let tt;
function toast(t) { const el = $('toast'); el.textContent = t; el.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => el.classList.remove('on'), 1900); }
function selectEl(el) { const rg = document.createRange(); rg.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(rg); }
function writeClip(text, msg, el) {
  const fallback = () => {
    const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (e) { }
    document.body.removeChild(ta);
    if (ok) toast(msg); else { if (el) selectEl(el); toast('Texte sélectionné : Ctrl+C pour copier'); }
  };
  try { navigator.clipboard.writeText(text).then(() => toast(msg)).catch(fallback); } catch (e) { fallback(); }
}
let pending = null, pendTimer;
function resetPending() { if (pending) { pending.classList.remove('confirm'); pending.textContent = pending.dataset.label || 'Copier'; } pending = null; }
$('out').addEventListener('click', e => {
  const st = e.target.closest('[data-star]');
  if (st) { e.preventDefault(); e.stopPropagation(); const f = st.dataset.star; S.favs.has(f) ? S.favs.delete(f) : S.favs.add(f); saveFavs(); const on = S.favs.has(f); document.querySelectorAll('[data-star="' + CSS.escape(f) + '"]').forEach(b => { b.setAttribute('aria-pressed', on); b.textContent = on ? '★' : '☆'; }); toast(on ? 'Ajouté aux favoris' : 'Retiré des favoris'); if (S.fav) render(); return; }
  const ln = e.target.closest('[data-link]');
  if (ln) { e.preventDefault(); e.stopPropagation(); const url = online ? location.origin + location.pathname + ln.dataset.link : ln.dataset.link; writeClip(url, 'Lien copié : colle-le dans le ticket'); return; }
  const dl = e.target.closest('[data-dlg]');
  if (dl) { e.preventDefault(); openDlg(dl.dataset.dlg); return; }
  const c = e.target.closest('[data-copy]');
  if (!c) return;
  if (c.tagName === 'PRE' && String(getSelection())) return;   /* laisse sélectionner une partie */
  const entry = COPY[c.dataset.copy]; if (!entry) return;
  const scope = c.closest('.card,li.step,.pbody');
  const btn = c.tagName === 'BUTTON' ? c : scope && scope.querySelector('button.copy[data-copy="' + CSS.escape(c.dataset.copy) + '"]');
  const used = usedVars(entry.cmd), bad = used.filter(k => vState(k) === 'bad'), empty = used.filter(k => vState(k) === 'empty');
  if (bad.length) { resetPending(); toast('Copie bloquée : ' + bad.join(', ') + ' invalide' + (bad.length > 1 ? 's' : '') + '. Corrige dans « Mon site ».'); openVars(bad[0]); return; }
  if (entry.lv !== 'info' && empty.length) { resetPending(); toast('Cette commande modifie quelque chose : remplis d’abord ' + empty.join(', ')); openVars(empty[0]); return; }
  if (entry.lv === 'danger' && btn && pending !== btn) {
    resetPending(); pending = btn; btn.dataset.label = btn.textContent; btn.classList.add('confirm'); btn.textContent = 'Confirmer';
    clearTimeout(pendTimer); pendTimer = setTimeout(resetPending, 3500);
    toast('Commande à risque : relis-la, puis clique encore pour copier'); return;
  }
  resetPending();
  const p = c.tagName === 'PRE' ? c : scope && scope.querySelector('pre');
  writeClip(subst(entry.cmd), empty.length ? 'Copié, mais à remplir : ' + empty.join(', ') : 'Copié · à coller sur ' + MACH[entry.m].label, p);
});
$('out').addEventListener('toggle', e => { const d = e.target; if (d.matches && d.matches('details.proc')) d.open ? S.open.add(d.dataset.pid) : S.open.delete(d.dataset.pid); }, true);

/* ================= FILTRES ET RACCOURCIS ================= */
const q = $('q');
let qt;
q.addEventListener('input', () => { clearTimeout(qt); qt = setTimeout(() => { S.q = q.value.trim(); render(); window.scrollTo(0, 0); }, 90); });
$('seg-m').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.m = b.dataset.m; save('memo_machine', S.m); render(); });
$('seg-v').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.view = b.dataset.v; save('memo_view', S.view); render(); });
$('favonly').addEventListener('click', () => { S.fav = !S.fav; if (S.fav && S.route.t === 'home') S.route = { t: 'all' }; render(); });
document.addEventListener('keydown', e => {
  const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
  if (e.key === '/' && !typing) { e.preventDefault(); q.focus(); q.select(); }
  else if (e.key === 'Escape' && document.activeElement === q) { q.value = ''; S.q = ''; render(); q.blur(); }
  else if (e.key === '?' && !typing) { e.preventDefault(); openDlg('help'); }
});

/* ================= THÈME ================= */
const THEMES = ['auto', 'light', 'dark'], TICO = { auto: '◐', light: '☀', dark: '☾' }, TLAB = { auto: 'automatique', light: 'clair', dark: 'sombre' };
let theme = load('memo_theme'); if (!THEMES.includes(theme)) theme = 'auto';
function applyTheme() { if (theme === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.dataset.theme = theme; $('theme-ico').textContent = TICO[theme]; $('btn-theme').title = 'Thème : ' + TLAB[theme]; }
$('btn-theme').addEventListener('click', () => { theme = THEMES[(THEMES.indexOf(theme) + 1) % 3]; save('memo_theme', theme); applyTheme(); toast('Thème ' + TLAB[theme]); });
applyTheme();

/* ================= DIALOGUES ================= */
const dlg = $('dlg');
function openDlg(kind) {
  if (kind === 'news') {
    $('dlg-t').textContent = 'Nouveautés';
    $('dlg-b').innerHTML = DATA.nouveautes.map(n => '<div class="news-item"><time datetime="' + esc(n.date) + '">' + esc(fmtDate(n.date)) + '</time><b>' + esc(n.titre) + '</b>' + n.texte + '</div>').join('') || '<p>Rien pour l’instant.</p>';
    if (DATA.nouveautes[0]) { save('memo_news_seen', DATA.nouveautes[0].date); $('news-dot').hidden = true; }
  } else {
    $('dlg-t').textContent = 'Comment utiliser le mémo';
    $('dlg-b').innerHTML =
      '<h3>En trois gestes</h3><ul><li><b>Mon site</b> : saisis les IP du site. Elles remplacent les <span class="vchip">{VARIABLES}</span> dans les commandes.</li><li><b>Clique sur une commande</b> pour la copier, puis colle-la dans ton terminal (clic droit dans PuTTY, Ctrl+Maj+V ailleurs).</li><li><b>Compare</b> avec le bloc vert « Attendu » et, au besoin, ouvre « Comprendre ».</li></ul>' +
      '<h3>Niveaux</h3><div class="legend">' + Object.keys(LEV).map(k => '<div>' + tagL(k) + '<span>' + esc(LEV[k].desc) + '</span></div>').join('') + '</div>' +
      '<h3>Affichage</h3><ul><li><b>Guidé</b> : toutes les explications sont dépliées. Idéal pour apprendre.</li><li><b>Standard</b> : explications repliées sous « Comprendre ».</li><li><b>Compact</b> : les commandes seules.</li></ul>' +
      '<h3>Raccourcis</h3><div class="kbd-list"><kbd>/</kbd><span>Rechercher</span><kbd>Échap</kbd><span>Effacer la recherche</span><kbd>?</kbd><span>Cette aide</span></div>' +
      '<h3>Partager</h3><p>Le bouton 🔗 copie le lien direct d’une fiche ou d’une procédure, à coller dans un ticket ou une discussion.</p>' +
      (M.depot ? '<h3>Corriger ou ajouter</h3><p>Chaque fiche a un lien « Proposer une correction » : il ouvre le fichier sur GitHub. Une fois la modification enregistrée, le mémo se met à jour tout seul en une à deux minutes pour toute l’équipe.</p>' : '') +
      (M.contact ? '<h3>Contact</h3><p>' + esc(M.contact) + '</p>' : '') +
      '<h3>Confidentialité</h3><p>Le mémo ne contient aucune donnée de site. Tes IP restent dans ce navigateur, dans un coffre chiffré par ton mot de passe.</p>';
  }
  if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
}
$('dlg-x').addEventListener('click', () => dlg.close());
dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
$('btn-news').addEventListener('click', () => openDlg('news'));
$('btn-help').addEventListener('click', () => openDlg('help'));
if (DATA.nouveautes[0] && DATA.nouveautes[0].date > seen) $('news-dot').hidden = false;

/* ================= EN-TÊTE, PIED, MISES À JOUR ================= */
$('brand-t').textContent = M.titre || 'Mémo SSH Cabine';
$('brand-s').textContent = M.sous_titre || '';
$('foot').innerHTML = '<span>' + esc(M.titre) + ' · v' + esc(M.version) + ' · mis à jour le ' + esc(new Date(BUILD_T).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })) + (M.commit ? ' · ' + esc(M.commit) : '') + '</span>' +
  '<span>' + (online ? '<a href="memo-ssh-cabine.html" download>Télécharger la version hors ligne</a> · ' : '') + (M.depot ? '<a href="https://github.com/' + esc(M.depot) + '" target="_blank" rel="noopener">Contenu sur GitHub</a> · ' : '') + '<a href="#" id="foot-help">Aide</a></span>';
$('foot-help').addEventListener('click', e => { e.preventDefault(); openDlg('help'); });
$('reload').addEventListener('click', () => location.reload());
if (online) {
  const check = () => fetch('version.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(v => { if (v && v.build && v.build !== M.build) $('update').hidden = false; }).catch(() => { });
  setInterval(check, 5 * 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { });
}

renderSites(); fillVars(); renderVault(); summary(); route();
