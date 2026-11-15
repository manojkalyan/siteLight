import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

const html = readFileSync(new URL('../lunar-validation-prototype.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const shared = script.match(/\/\* BEGIN SHARED ENGINE \*\/([\s\S]*?)\/\* END SHARED ENGINE \*\//)[1];
const screening = script.match(/\/\* BEGIN SCREENING ENGINE \*\/([\s\S]*?)\/\* END SCREENING ENGINE \*\//)[1];
const hour = 3600000, at = Date.UTC(2027, 0, 13);

function functions(geometry) {
  const context = vm.createContext({ window: {}, matchMedia: () => ({ matches: false }) });
  vm.runInContext(shared + '\n' + screening + '\nwindow.testing={terrainScreen,fitPlane,collectGapIntervals,visibilityGaps,gapAssessment,site:sites[0],settings:defaults};', context);
  if (geometry) vm.runInContext('horizon=()=>0;geometry=' + geometry, context);
  return context.window.testing;
}

function workspace() {
  const nodes = new Map(), windowListeners = new Map();
  function node(id, tagName = 'DIV') {
    if (nodes.has(id)) return nodes.get(id);
    const classes = new Set();
    const item = {
      id, tagName, dataset: {}, style: {}, attributes: {}, listeners: {}, children: [],
      classList: { add: key => classes.add(key), remove: key => classes.delete(key), contains: key => classes.has(key), toggle(key, force) { const enabled = force ?? !classes.has(key); enabled ? classes.add(key) : classes.delete(key); return enabled; } },
      addEventListener(name, handler) { this.listeners[name] = handler; },
      setAttribute(name, value) { this.attributes[name] = String(value); },
      append(item) { this.children.push(item); }, focus() { this.focused = true; }, scrollIntoView() {},
      contentWindow: { postMessage() {} },
    };
    nodes.set(id, item);
    return item;
  }
  const nav = ['compare', 'explore', 'screening', 'logistics', 'data'].map(view => { const n = node('tab-' + view, 'BUTTON'); n.dataset.view = view; return n; });
  const tabs = ['terrain', 'gaps', 'thermal', 'research'].map(tab => { const n = node('screen-tab-' + tab, 'BUTTON'); n.dataset.screenTab = tab; return n; });
  const shortcuts = ['environment', 'terrain', 'gaps', 'thermal'].map(target => { const n = node('shortcut-' + target, 'BUTTON'); n.dataset.openScreen = target; return n; });
  const doc = { body: node('body', 'BODY'), getElementById: node, querySelectorAll: selector => selector === '[data-view]' ? nav : selector === '[data-screen-tab]' ? tabs : selector === '[data-open-screen]' ? shortcuts : [], createElement: tag => node('created-' + nodes.size, tag.toUpperCase()) };
  const context = vm.createContext({ window: { addEventListener(name, handler) { windowListeners.set(name, handler); } }, document: doc, matchMedia: () => ({ matches: false }), setTimeout(handler, delay) { const timer = setTimeout(handler, delay); timer.unref(); return timer; }, clearTimeout, TextDecoder, Uint8Array, atob });
  vm.runInContext(script, context, { timeout: 20000 });
  return { hybrid: context.window.SiteLightHybrid, screening: context.window.SiteLightScreening, node, doc, nav, tabs, shortcuts };
}

test('validation file is standalone and its scripts parse', () => {
  assert.doesNotThrow(() => new vm.Script(script));
  assert.doesNotMatch(html, /<script[^>]+src=|<link[^>]+href=|\bfetch\s*\(|@import\b/);
  assert.match(html, /UI validation sample · PRD 3.3/);
  const embedded = Buffer.from(script.match(/const explorerDocumentB64 = '([^']+)';/)[1], 'base64').toString('utf8');
  for (const match of embedded.matchAll(/<script>([\s\S]*?)<\/script>/g)) assert.doesNotThrow(() => new vm.Script(match[1]));
});

test('both prior prototypes match the preserved source fingerprints', () => {
  const lineage = JSON.parse(script.match(/const validationLineage=(\{[^;]+\});/)[1]);
  for (const [filename, key] of [['lunar-hybrid-prototype.html', 'hybridSHA256'], ['lunar-prototype.html', 'immersiveSHA256']]) {
    const source = readFileSync(new URL('../' + filename, import.meta.url));
    assert.equal(createHash('sha256').update(source).digest('hex'), lineage[key]);
  }
});

const terrainSettings = { radiusM: 60, baselineM: 20, slopeLimitDeg: 12, missing: false };
test('a flat plane has zero slope and zero detrended roughness', () => {
  const f = functions(), result = f.terrainScreen(f.site, terrainSettings, () => 17);
  assert.equal(result.status, 'pass');
  assert.equal(result.coverage, 1);
  assert.equal(result.maxSlope, 0);
  assert.ok(result.roughness < 1e-8);
  assert.ok(result.cells.every(p => Math.hypot(p.x, p.z) <= 60 + 1e-8));
});

test('a known ten-degree plane respects degree units and threshold boundaries', () => {
  const f = functions(), height = x => Math.tan(10 * Math.PI / 180) * x + 3;
  const passing = f.terrainScreen(f.site, { ...terrainSettings, slopeLimitDeg: 10 }, height);
  const failing = f.terrainScreen(f.site, { ...terrainSettings, slopeLimitDeg: 9 }, height);
  assert.ok(Math.abs(passing.meanSlope - 10) < 1e-8);
  assert.ok(Math.abs(passing.maxSlope - 10) < 1e-8);
  assert.ok(passing.roughness < 1e-8);
  assert.equal(passing.status, 'pass');
  assert.equal(failing.status, 'fail');
});

test('roughness is detrended rather than treating a planar incline as rough', () => {
  const f = functions();
  const result = f.terrainScreen(f.site, terrainSettings, (x, z) => .15 * x + 2 * Math.cos(z / 9));
  assert.ok(result.roughness > .1);
  assert.ok(Number.isFinite(result.roughness));
});

test('missing footprint coverage cannot pass even when covered slopes are zero', () => {
  const f = functions(), result = f.terrainScreen(f.site, { ...terrainSettings, missing: true }, () => 0);
  assert.ok(result.coverage > 0 && result.coverage < 1);
  assert.equal(result.maxSlope, 0);
  assert.equal(result.status, 'insufficient_data');
  assert.equal(result.rocks, 'not_evaluated');
  assert.equal(result.uncertainty, 'not_quantified');
});

test('all-missing heights remain unknown and malformed settings are rejected', () => {
  const f = functions(), empty = f.terrainScreen(f.site, terrainSettings, () => null);
  assert.equal(empty.coverage, 0);
  assert.equal(empty.maxSlope, null);
  assert.equal(empty.roughness, null);
  assert.equal(empty.status, 'insufficient_data');
  for (const patch of [{ radiusM: 0 }, { baselineM: 0 }, { slopeLimitDeg: NaN }, { slopeLimitDeg: 90 }]) assert.throws(() => f.terrainScreen(f.site, { ...terrainSettings, ...patch }, () => 0));
});

test('interior and boundary gaps retain their actual interval meanings', () => {
  const f = functions();
  const interior = f.collectGapIntervals([{ start: at, end: at + hour, visible: true }, { start: at + hour, end: at + 3 * hour, visible: false }, { start: at + 3 * hour, end: at + 4 * hour, visible: true }], at, at + 4 * hour, 'visible');
  assert.equal(interior.longest.hours, 2);
  assert.equal(interior.longest.touchesStart, false);
  assert.equal(interior.longest.touchesEnd, false);
  const boundary = f.collectGapIntervals([{ start: at, end: at + 4 * hour, visible: false }], at, at + 4 * hour, 'visible');
  assert.equal(boundary.longest.hours, 4);
  assert.equal(boundary.longest.touchesStart, true);
  assert.equal(boundary.longest.touchesEnd, true);
});

test('unknown spans break gaps rather than inventing uninterrupted known loss', () => {
  const f = functions();
  const result = f.collectGapIntervals([{ start: at, end: at + hour, visible: false }, { start: at + hour, end: at + 2 * hour, visible: null }, { start: at + 2 * hour, end: at + 4 * hour, visible: false }], at, at + 4 * hour, 'visible');
  assert.equal(result.gaps.length, 2);
  assert.equal(result.unknownHours, 1);
  assert.equal(result.longest.hours, 2);
  assert.equal(result.longest.adjacentUnknown, true);
});

test('no geometric darkness is distinct from being below the solar criterion', () => {
  const f = functions('()=>({sunElevation:1,sunAzimuth:0,earthElevation:3,earthAzimuth:0})');
  const result = f.visibilityGaps(f.site, at, { ...f.settings, duration: 4, minElevation: 2 });
  assert.equal(result.dark.longest, null);
  assert.equal(result.solar.longest.hours, 4);
  assert.equal(result.earth.longest, null);
});

test('gap requirements are opt-in and enforce exact boundaries', () => {
  const f = functions(), record = { longest: { hours: 2 }, unknownHours: 0 };
  assert.equal(f.gapAssessment({ dark: record, earth: record }, { enabled: false, maxDark: 0, maxEarth: 0 }).status, 'informational');
  assert.equal(f.gapAssessment({ dark: record, earth: record }, { enabled: true, maxDark: 2, maxEarth: 2 }).status, 'pass');
  assert.equal(f.gapAssessment({ dark: record, earth: record }, { enabled: true, maxDark: 1, maxEarth: 2 }).status, 'fail');
  assert.equal(f.gapAssessment({ dark: { ...record, unknownHours: 1 }, earth: record }, { enabled: true, maxDark: 4, maxEarth: 4 }).status, 'insufficient_data');
});

test('full startup, screening navigation, and missing-data control run coherently', () => {
  const w = workspace();
  assert.equal(w.hybrid.snapshot().uiVersion, 'screening-validation-1');
  w.hybrid.setView('screening');
  assert.equal(w.node('view-screening').hidden, false);
  assert.match(w.node('screen-terrain-map').innerHTML, /SYNTHETIC ASSESSMENT GRID/);
  w.screening.setTerrainConfig({ missing: true });
  assert.equal(w.hybrid.snapshot().screening.terrain.status, 'insufficient_data');
  assert.match(w.node('summary-terrain').textContent, /Incomplete/);
  assert.equal(w.node('terrain-state').dataset.status, 'insufficient_data');
});

test('screening follows the selected scenario and preserves draft dates across views', () => {
  const w = workspace();
  w.hybrid.setDraft(14);
  w.hybrid.setView('screening');
  w.screening.selectScreeningTab('gaps');
  assert.match(w.node('screen-context-caption').textContent, /Scenario B.*preview date/);
  const preview = w.hybrid.snapshot().scenarios[1].evaluatedLandingUtc;
  w.hybrid.selectScenario(0);
  assert.match(w.node('screen-context-caption').textContent, /Scenario A/);
  w.hybrid.setView('logistics');
  w.hybrid.setView('compare');
  assert.equal(w.hybrid.snapshot().scenarios[1].evaluatedLandingUtc, preview);
});

test('gap-limit changes never overwrite environmental fraction verdicts', () => {
  const w = workspace(), before = JSON.stringify(w.hybrid.snapshot().scenarios.map(s => s.evaluation));
  w.screening.setGapConfig({ enabled: true, maxDark: 0, maxEarth: 0 });
  const result = w.hybrid.snapshot();
  assert.equal(JSON.stringify(result.scenarios.map(s => s.evaluation)), before);
  assert.equal(result.screening.gapAssessment.enabled, true);
  assert.equal(result.screening.gapAssessment.status, 'fail');
});

test('thermal and advanced models stay explicitly unevaluated', () => {
  const w = workspace();
  w.hybrid.setView('screening');
  w.screening.selectScreeningTab('thermal');
  assert.equal(w.node('screen-thermal').hidden, false);
  assert.equal(w.hybrid.snapshot().screening.thermal, 'not_evaluated');
  assert.match(html, /No Diviner temperature product is loaded/);
  w.screening.selectScreeningTab('research');
  assert.equal(w.hybrid.snapshot().screening.laterModels, 'research_gates_only');
});

test('the persistent navigation includes Screening in the keyboard order', () => {
  const w = workspace();
  w.hybrid.setView('explore');
  w.node('tab-explore').listeners.keydown({ key: 'ArrowRight', preventDefault() {} });
  assert.equal(w.hybrid.snapshot().view, 'screening');
  assert.equal(w.node('tab-screening').focused, true);
});
