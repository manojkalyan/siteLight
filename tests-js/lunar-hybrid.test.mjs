import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

const html = readFileSync(new URL('../lunar-hybrid-prototype.html', import.meta.url), 'utf8');
const original = readFileSync(new URL('../lunar-prototype.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const embedded = Buffer.from(script.match(/const explorerDocumentB64 = '([^']+)';/)[1], 'base64').toString('utf8');

function workspace() {
  const nodes = new Map(), listeners = new Map(), sent = [];
  function node(id, tagName = 'DIV') {
    if (nodes.has(id)) return nodes.get(id);
    const classes = new Set();
    const value = {
      id, tagName, dataset: {}, style: {}, listeners: {}, attributes: {}, children: [],
      classList: { add: key => classes.add(key), remove: key => classes.delete(key), contains: key => classes.has(key), toggle(key, force) { const enabled = force ?? !classes.has(key); enabled ? classes.add(key) : classes.delete(key); return enabled; } },
      addEventListener(name, callback) { this.listeners[name] = callback; },
      setAttribute(name, content) { this.attributes[name] = String(content); },
      append(child) { this.children.push(child); }, focus() { this.focused = true; },
      contentWindow: { postMessage(message) { sent.push(message); } },
    };
    nodes.set(id, value);
    return value;
  }
  const tabs = ['compare', 'explore', 'logistics', 'data'].map(view => {
    const item = node('tab-' + view, 'BUTTON'); item.dataset.view = view; return item;
  });
  const doc = { body: node('body', 'BODY'), getElementById: node, querySelectorAll: selector => selector === '[data-view]' ? tabs : [], createElement: tag => node('created-' + nodes.size, tag.toUpperCase()) };
  const context = vm.createContext({
    window: { addEventListener(name, callback) { listeners.set(name, callback); } }, document: doc,
    matchMedia: () => ({ matches: false }),
    setTimeout, clearTimeout, TextDecoder, Uint8Array, atob,
  });
  vm.runInContext(script, context, { timeout: 10000 });
  return { api: context.window.SiteLightHybrid, engine: context.window.SiteLightPrototype, node, doc, tabs, listeners, sent };
}

test('hybrid is standalone and all parent/embedded scripts parse', () => {
  assert.doesNotThrow(() => new vm.Script(script));
  for (const match of embedded.matchAll(/<script>([\s\S]*?)<\/script>/g)) assert.doesNotThrow(() => new vm.Script(match[1]));
  assert.doesNotMatch(html, /<script[^>]+src=|<link[^>]+href=|\bfetch\s*\(|@import\b/);
  assert.match(embedded, /window\.hybridExploreActive/);
});

test('original prototype is preserved and the evaluator is exactly shared', () => {
  const expectedSHA = createHash('sha256').update(original).digest('hex');
  assert.equal(script.match(/const originalPrototypeSHA = '([^']+)';/)[1], expectedSHA);
  const originalScript = original.match(/<script>([\s\S]*?)<\/script>/)[1];
  const originalCore = originalScript.slice(0, originalScript.indexOf('let result=null')).trim();
  assert.equal(script.match(/\/\* BEGIN SHARED ENGINE \*\/([\s\S]*?)\/\* END SHARED ENGINE \*\//)[1].trim(), originalCore);
});

test('startup renders independent A/B scenarios in the light comparison view', () => {
  const w = workspace(), snapshot = w.api.snapshot();
  assert.equal(snapshot.selectedScenario, 'B');
  assert.equal(snapshot.scenarios.length, 2);
  assert.notEqual(snapshot.scenarios[0].site, snapshot.scenarios[1].site);
  assert.equal(snapshot.constraints.durationHours, 168);
  assert.match(w.node('a-sun').textContent, /^\d+%$/);
  assert.match(w.node('b-sun').textContent, /^\d+%$/);
  assert.match(w.node('hybrid-timeline').innerHTML, /Full 168-hour window/);
});

test('preview survives navigation without overwriting the baseline', () => {
  const w = workspace();
  assert.equal(w.api.setDraft(14), true);
  for (const view of ['logistics', 'explore', 'data', 'compare']) w.api.setView(view);
  const scenario = w.api.snapshot().scenarios[1];
  assert.equal(scenario.baselineLandingUtc, '2027-01-13T00:00:00Z');
  assert.equal(scenario.previewOffsetDays, 14);
  assert.equal(scenario.evaluatedLandingUtc, '2027-01-27T00:00:00.000Z');
  assert.match(w.node('explorer-frame').srcdoc, /SiteLight · Lunar Studio/);
  assert.equal(w.doc.body.dataset.view, 'compare');
});

test('apply and reset affect only the selected scenario preview', () => {
  const w = workspace();
  w.api.setDraft(14);
  w.api.selectScenario(0);
  w.api.setDraft(3);
  w.api.applyPreview();
  let snapshot = w.api.snapshot();
  assert.equal(snapshot.scenarios[0].baselineLandingUtc, '2027-01-16T00:00:00Z');
  assert.equal(snapshot.scenarios[0].previewOffsetDays, 0);
  assert.equal(snapshot.scenarios[1].previewOffsetDays, 14);
  w.api.selectScenario(1);
  w.api.resetPreview();
  snapshot = w.api.snapshot();
  assert.equal(snapshot.scenarios[1].baselineLandingUtc, '2027-01-13T00:00:00Z');
  assert.equal(snapshot.scenarios[1].previewOffsetDays, 0);
});

test('explorer changes synchronize settings, selected site, and time back to comparison', () => {
  const w = workspace();
  w.api.setView('explore');
  const payload = { site: 2, date: '2027-02-03', duration: 216, minSun: .6, minEarth: .4, minOverlap: .25, minElevation: 3, hour: 15, layer: 2 };
  w.listeners.get('message')({ source: w.node('explorer-frame').contentWindow, data: { type: 'sitelight-hybrid:change', payload } });
  w.api.setView('compare');
  const snapshot = w.api.snapshot();
  assert.equal(snapshot.scenarios[1].site, 'halo');
  assert.equal(snapshot.scenarios[1].baselineLandingUtc, '2027-02-03T00:00:00Z');
  assert.equal(snapshot.scenarios[1].displayHour, 15);
  assert.equal(snapshot.constraints.durationHours, 216);
  assert.equal(snapshot.constraints.minimumSunFraction, .6);
  assert.equal(w.node('hybrid-duration').value, 216);
});

test('unrelated windows and invalid explorer messages cannot overwrite settings', () => {
  const w = workspace(), before = JSON.stringify(w.api.snapshot());
  w.listeners.get('message')({ source: {}, data: { type: 'sitelight-hybrid:change', payload: { site: 2 } } });
  w.listeners.get('message')({ source: w.node('explorer-frame').contentWindow, data: { type: 'sitelight-hybrid:change', payload: { site: 2, date: '2027-02-03', duration: 216, minSun: 2 } } });
  assert.equal(JSON.stringify(w.api.snapshot()), before);
});

test('requirement edits preserve scenario baselines and recalculate both cards', () => {
  const w = workspace(), baseline = w.api.snapshot().scenarios.map(s => s.baselineLandingUtc);
  w.node('hybrid-sun').listeners.change({ target: { value: '100', checkValidity: () => true } });
  const after = w.api.snapshot();
  assert.equal(after.constraints.minimumSunFraction, 1);
  assert.deepEqual(Array.from(after.scenarios, s => s.baselineLandingUtc), Array.from(baseline));
  for (const scenario of after.scenarios) assert.equal(scenario.evaluation.rules[0].required, 168);
});

test('out-of-range previews do not mutate a scenario', () => {
  const w = workspace(), before = JSON.stringify(w.api.snapshot());
  assert.equal(w.api.setDraft(61), false);
  assert.equal(w.api.setDraft(-60), false); // Outside the supported 2027 start.
  assert.equal(JSON.stringify(w.api.snapshot()), before);
});

test('keyboard tab navigation follows the persistent view order', () => {
  const w = workspace();
  w.tabs[0].listeners.keydown({ key: 'ArrowRight', preventDefault() {} });
  assert.equal(w.api.snapshot().view, 'explore');
  assert.equal(w.node('tab-explore').focused, true);
  assert.equal(w.node('tab-explore').attributes['aria-selected'], 'true');
  w.tabs[1].listeners.keydown({ key: 'End', preventDefault() {} });
  assert.equal(w.api.snapshot().view, 'data');
});

test('logistics stays a layout fixture outside the environmental result', () => {
  const w = workspace();
  w.api.setView('logistics');
  const snapshot = w.api.snapshot();
  assert.match(snapshot.logistics, /Not evaluated/);
  for (const scenario of snapshot.scenarios) assert.equal(scenario.evaluation.rules.length, 3);
  assert.match(html, /not a calculated LCSS result/);
});
