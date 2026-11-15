import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../lunar-prototype.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const core = script.slice(0, script.indexOf('let result=null'));
const base = Date.UTC(2027, 0, 13);

function engine(geometryBody) {
  const context = vm.createContext({ window: {}, matchMedia: () => ({ matches: false }) });
  vm.runInContext(core, context);
  if (geometryBody) vm.runInContext('horizon=()=>0;geometry=' + geometryBody, context);
  const api = context.window.SiteLightPrototype;
  return { ...api, settings: { ...api.defaults }, site: api.sites[0] };
}

test('the deliverable is standalone and its complete script parses', () => {
  assert.doesNotThrow(() => new vm.Script(script));
  assert.equal((html.match(/<script\b/g) || []).length, 1);
  assert.doesNotMatch(html, /<script[^>]+src=|<link[^>]+href=|\bfetch\s*\(|\bXMLHttpRequest\b|@import\b/);
  assert.match(html, /PROCEDURAL TERRAIN & SYNTHETIC GEOMETRY/);
  assert.match(html, /prefers-reduced-motion/);
});

test('separate Sun and Earth windows do not imply simultaneous coverage', () => {
  const e = engine('(ms)=>({sunElevation:(ms-' + base + ')/3600000<2?5:-5,sunAzimuth:0,earthElevation:(ms-' + base + ')/3600000>=2?5:-5,earthAzimuth:0})');
  const result = e.evaluate(e.site, base, { ...e.settings, duration: 4, minSun: .5, minEarth: .5, minOverlap: .1 });
  assert.ok(Math.abs(result.sun - 2) < 1e-8);
  assert.ok(Math.abs(result.earth - 2) < 1e-8);
  assert.equal(result.overlap, 0);
  assert.equal(result.status, 'fail');
  assert.deepEqual(Array.from(result.rules.filter(r => !r.pass), r => r.id), ['overlap']);
});

test('exact fraction boundaries pass despite floating-point interval addition', () => {
  const e = engine('(ms)=>({sunElevation:(ms-' + base + ')/3600000<2?5:-5,sunAzimuth:0,earthElevation:5,earthAzimuth:0})');
  const result = e.evaluate(e.site, base, { ...e.settings, duration: 4, minSun: .5, minEarth: 1, minOverlap: .5 });
  assert.equal(result.status, 'pass');
});

test('partial final sample is weighted by its actual duration', () => {
  const e = engine('()=>({sunElevation:5,sunAzimuth:0,earthElevation:5,earthAzimuth:0})');
  const result = e.evaluate(e.site, base, { ...e.settings, duration: 2.25, minSun: 1, minEarth: 1, minOverlap: 1 });
  for (const key of ['sun', 'earth', 'overlap']) assert.ok(Math.abs(result[key] - 2.25) < 1e-8);
  assert.equal(result.status, 'pass');
});

test('the Sun must meet the elevation threshold even above an open horizon', () => {
  const e = engine('()=>({sunElevation:1,sunAzimuth:0,earthElevation:5,earthAzimuth:0})');
  const result = e.evaluate(e.site, base, { ...e.settings, duration: 1, minElevation: 2 });
  assert.equal(result.sun, 0);
  assert.equal(result.overlap, 0);
  assert.equal(result.status, 'fail');
});

test('changing requirements does not alter geometric positions', () => {
  const e = engine();
  const original = JSON.stringify(e.geometry(base, e.site));
  e.evaluate(e.site, base, { ...e.settings, minElevation: 8, minSun: 1 });
  assert.equal(JSON.stringify(e.geometry(base, e.site)), original);
});

test('contiguous interruption intervals have the expected boundaries', () => {
  const e = engine('(ms)=>({sunElevation:(ms-' + base + ')/3600000<2?-5:5,sunAzimuth:0,earthElevation:5,earthAzimuth:0})');
  const result = e.evaluate(e.site, base, { ...e.settings, duration: 4 });
  assert.equal(result.intervals.sun.length, 1);
  assert.equal(result.intervals.sun[0].start, 0);
  assert.equal(result.intervals.sun[0].end, 2);
});

test('explanations identify failed aggregate rules rather than any dark interval', () => {
  const e = engine('(ms)=>({sunElevation:(ms-' + base + ')/3600000<1?-5:5,sunAzimuth:0,earthElevation:5,earthAzimuth:0})');
  const result = e.evaluate(e.site, base, { ...e.settings, duration: 4, minSun: .5, minOverlap: .5 });
  assert.ok(result.intervals.sun.length > 0);
  assert.equal(result.status, 'pass');
  assert.match(e.explain(result), /meets all three/);
});

test('the nearest passing daily sample is actually evaluated with all rules', () => {
  const e = engine('(ms)=>({sunElevation:ms>=' + (base + 2 * 86400000) + '?5:-5,sunAzimuth:0,earthElevation:5,earthAzimuth:0})');
  const settings = { ...e.settings, duration: 1, minSun: 1, minEarth: 1, minOverlap: 1 };
  const snapshot = JSON.stringify(settings);
  const found = e.findPassing(e.site, base, settings);
  assert.equal(found.days, 2);
  assert.equal(found.result.status, 'pass');
  assert.equal(JSON.stringify(settings), snapshot);
});

test('no passing daily sample returns null rather than a relaxed result', () => {
  const e = engine('()=>({sunElevation:-5,sunAzimuth:0,earthElevation:-5,earthAzimuth:0})');
  assert.equal(e.findPassing(e.site, base, { ...e.settings, duration: 1 }), null);
});

test('invalid intervals, fractions, and elevation thresholds are rejected', () => {
  const e = engine();
  for (const patch of [{ duration: 0 }, { duration: NaN }, { minSun: 1.1 }, { minEarth: -.1 }, { minOverlap: NaN }, { minElevation: 9 }]) {
    assert.throws(() => e.evaluate(e.site, base, { ...e.settings, ...patch }));
  }
  assert.throws(() => e.evaluate(e.site, NaN, e.settings));
});

test('repeated versioned sample inputs give identical results', () => {
  const e = engine();
  const first = e.evaluate(e.site, base, e.settings);
  const second = e.evaluate(e.site, base, e.settings);
  assert.equal(JSON.stringify(first), JSON.stringify(second));
  for (const site of e.sites) {
    const g = e.geometry(Date.UTC(2033, 11, 31), site);
    for (const value of Object.values(g)) assert.ok(Number.isFinite(value));
    assert.ok(g.sunAzimuth >= 0 && g.sunAzimuth < 360);
    assert.ok(g.earthAzimuth >= 0 && g.earthAzimuth < 360);
  }
});

test('full offline startup, fallback frame, and key control wiring execute without errors', () => {
  // This is a DOM/canvas contract harness, not a substitute for browser/GPU QA.
  const elements = new Map();
  const drawing = new Proxy({}, { get: (_object, key) => key === 'createLinearGradient' ? () => ({ addColorStop() {} }) : () => {} });
  function element(id) {
    if (elements.has(id)) return elements.get(id);
    const classes = new Set();
    const node = {
      id, value: '', style: {}, dataset: {}, listeners: {}, children: [], attributes: {},
      classList: { add: key => classes.add(key), remove: key => classes.delete(key), toggle(key, force) { const enabled = force ?? !classes.has(key); enabled ? classes.add(key) : classes.delete(key); return enabled; } },
      addEventListener(name, callback) { this.listeners[name] = callback; },
      setAttribute(name, value) { this.attributes[name] = String(value); },
      replaceChildren() { this.children = []; }, append(child) { this.children.push(child); },
      getContext(name) { return name === 'webgl' ? null : drawing; },
      showModal() { this.open = true; }, close() { this.open = false; },
    };
    if (id.startsWith('marker-')) node.dataset.site = id.slice(-1);
    elements.set(id, node);
    return node;
  }
  const layers = [0, 1, 2].map(index => { const node = element('layer-' + index); node.dataset.layer = index; return node; });
  const markers = [0, 1, 2].map(index => element('marker-' + index));
  const doc = {
    getElementById: element,
    querySelectorAll: selector => selector === '[data-site]' ? markers : selector === '[data-layer]' ? layers : [],
    createElement: name => element('created-' + name + '-' + elements.size),
    addEventListener() {}, hidden: false,
  };
  const context = vm.createContext({
    window: { addEventListener() {} }, document: doc,
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    innerWidth: 1440, innerHeight: 900, devicePixelRatio: 1,
    performance: { now: () => 100 }, requestAnimationFrame() {}, console,
    setTimeout, clearTimeout,
  });
  assert.doesNotThrow(() => vm.runInContext(script, context, { timeout: 10000 }));
  assert.equal(element('fallback-notice').hidden, false);
  assert.match(element('sun-value').textContent, /^\d+%$/);
  assert.doesNotThrow(() => vm.runInContext('frame(116)', context));
  element('compare-tab').listeners.click();
  assert.equal(element('comparison').hidden, false);
  assert.equal(element('outlook').hidden, true);
  element('site-select').listeners.change({ target: { value: '1' } });
  assert.equal(element('marker-1').attributes['aria-pressed'], 'true');
  element('min-elevation').listeners.input({ target: { value: '8' } });
  assert.equal(layers[1].attributes['aria-pressed'], 'true');
  element('info-button').listeners.click();
  assert.equal(element('about').open, true);
  element('close-about').listeners.click();
  assert.equal(element('about').open, false);
  element('reset-scenario').listeners.click();
  assert.equal(element('site-select').value, 0);
  assert.equal(element('min-elevation').value, 2);
});
