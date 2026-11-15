import baseline from '../../docs/ACCEPTANCE_VERIFICATION_SUMMARY.json' with {type:'json'};
import nasaStudy from '../../data/engineering/nasa-reference-case.json' with {type:'json'};
import {escapeHtml as esc} from './charts.mjs';

const sections=[['sources','Sources'],['validation','Validation'],['limits','Limits']];
export {validationContent,limitsContent};
const shaPattern=/^[a-f0-9]{64}$/;
function safeUrl(value){try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)?url.href:null;}catch{return null;}}
function describe(record){
 const name=String(record.title||record.name||record.kind||safeUrl(record.url)?.split('/').at(-1)||'Selected-provider provenance');
 if(record===nasaStudy.source)return {name,role:'Published propellant reference architecture',category:'NASA reference',scope:'Study assumptions and results; not local ice measurements or legacy LCSS calibration.'};
 if(record.kind?.includes('horizon extension'))return {name,role:'Outer nominal horizon terrain',category:'Terrain',scope:'125-500 km nominal annulus; beyond-extent exclusion is conditional on the declared height ceiling.'};
 if(record.kind?.includes('date block'))return {name,role:'Locally generated geometric records',category:'Geometry',scope:'Derived time block; its cache key and kernel provenance identify the local calculation.'};
 if(record.name?.startsWith('kernels/'))return {name,role:'Ephemeris, orientation or UTC kernel',category:'Geometry',scope:'Pinned geometric calculation input; shared kernels do not independently certify physical terrain.'};
 if(record.name?.startsWith('terrain/'))return {name,role:/slperr|toterr|rms/i.test(name)?'Published terrain-error context':'Terrain elevation or slope source',category:'Terrain',scope:'Source grid and published error context; unresolved terrain and full global covariance remain unassessed.'};
 return {name,role:record.kind||'Scientific calculation input',category:'Other provenance',scope:'Retained source or selected-provider metadata. Inspect the original record for its applicable domain.'};
}

/** Original source identities stay intact; indices remain stable when the search is filtered. */
export function evidenceSourceRecords({science,provider}={}){
 const records=[],seen=new Set();
 for(const original of [...(science?.inputs||[]),...(provider?.metadata||[]),nasaStudy.source]){
  if(!original||typeof original!=='object')continue;
  const url=safeUrl(original.url),sha256=shaPattern.test(original.sha256||'')?original.sha256:null;
  const identity=JSON.stringify([url,sha256,original.cacheKey||null,url?null:original.name||original.kind||original]);
  if(seen.has(identity))continue;seen.add(identity);
  const description=describe(original);
  records.push({index:records.length,...description,url,sha256,bytes:Number.isFinite(original.bytes)?original.bytes:null,cacheKey:original.cacheKey||null,status:sha256?'Recorded SHA-256':original.cacheKey?'Derived record':'Metadata only',metadata:structuredClone(original)});
 }
 return records;
}

function sourceInspector(record){
 if(!record)return '<aside class="source-inspector card"><h2>Source details</h2><p>Select a source to inspect its recorded identity and scope.</p></aside>';
 const pairs=[['Layer',record.category],['Role',record.role],['Identity',record.status]];
 if(record.bytes!==null)pairs.push(['Retained source bytes',record.bytes.toLocaleString('en-US')]);
 if(record.metadata.retrievedDate)pairs.push(['Recorded retrieval',record.metadata.retrievedDate]);
 if(record.metadata.extentM)pairs.push(['Declared nominal extent',(record.metadata.extentM/1000)+' km']);
 return `<aside class="source-inspector card" aria-label="Selected source details"><p class="eyebrow">Selected source</p><h2>${esc(record.name)}</h2>${pairs.map(([label,value])=>`<div class="readout"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('')}<p class="section-gap">${esc(record.scope)}</p>${record.sha256?`<details class="section-gap"><summary>Recorded SHA-256</summary><code class="source-digest">${esc(record.sha256)}</code><p class="field-note">Recorded identity of this named source. Displaying a hash does not rerun the source audit.</p></details>`:''}${record.cacheKey?`<details class="section-gap"><summary>Derived-record cache key</summary><code class="source-digest">${esc(record.cacheKey)}</code></details>`:''}${record.url?`<a class="source-link" href="${esc(record.url)}" target="_blank" rel="noreferrer noopener">Open original source ↗</a>`:'<p class="field-note">This derived record has no single source URL; inspect its nested provenance.</p>'}<details class="section-gap"><summary>Acquisition and calculation metadata</summary><pre class="report-pre">${esc(JSON.stringify(record.metadata,null,2))}</pre></details><p class="external-note">Subset hashes, when present, identify retained subsets and do not claim hashes of whole remote files.</p></aside>`;
}

function sourcesContent(science,provider,query,selected){
 const records=evidenceSourceRecords({science,provider}),search=query.toLocaleLowerCase(),filtered=records.filter(r=>[r.name,r.role,r.category,r.url,r.sha256].some(v=>String(v||'').toLocaleLowerCase().includes(search)));
 const requested=typeof selected==='number'?selected:typeof selected==='string'&&/^\d+$/.test(selected)?Number(selected):null;
 const current=filtered.find(r=>r.index===requested)||filtered[0]||null;
 return `<div class="sources-layout"><section class="source-list card"><div class="source-list-heading"><div><h2>Source library</h2><p>${filtered.length} of ${records.length} application source/provenance records</p></div><label class="field" for="evidence-source-query"><span>Find a source</span><input id="evidence-source-query" data-evidence-query type="search" maxlength="200" value="${esc(query)}" placeholder="Dataset, layer or checksum" autocomplete="off"/></label></div><div class="scroll-table" tabindex="0" role="region" aria-label="Source records; scroll horizontally for all columns"><table class="evidence-table"><thead><tr><th>Dataset</th><th>Role / layer</th><th>Recorded identity</th></tr></thead><tbody>${filtered.length?filtered.map(record=>`<tr class="${record.index===current?.index?'selected':''}"><td><button type="button" class="source-select" data-evidence-source="${record.index}" aria-pressed="${record.index===current?.index}">${esc(record.name)}</button></td><td>${esc(record.role)}<br><small>${esc(record.category)}</small></td><td>${esc(record.status)}</td></tr>`).join(''):'<tr><td colspan="3">No matching source records. Clear the search to see the library.</td></tr>'}</tbody></table></div><p class="external-note">The library combines the scientific bundle inputs, selected-provider provenance and published NASA reference study. It is not a count of freshly audited files.</p></section>${sourceInspector(current)}</div>`;
}

function validationContent(science,provider){
 const rows=[['Retained source records',baseline.sourceRecordsPassed],['Artifact / linkage checks',`${baseline.artifactChecksPassed} / ${baseline.linkageChecksPassed}`],['Geometric / apparent reference comparisons',`${baseline.expandedGeometricCasesPassed} / ${baseline.expandedApparentCasesPassed}`],['JavaScript / Python checks',`${baseline.javascriptTestsPassed} / ${baseline.pythonTestsPassed}`],['Recorded browser checks',baseline.browserTestsPassed],['Catalog local terrain realizations',baseline.localCorrelatedTerrainRealizations]];
 return `<div class="cards"><section class="card wide"><p class="eyebrow">Recorded baseline verification</p><h2>Checks have a date and a scope.</h2><p>Recorded ${esc(baseline.reviewDateLocal)} under ${esc(baseline.applicationModel)}, PRD ${esc(baseline.prdVersion)}. ${esc(baseline.scope)}.</p><p class="notice section-gap">This is the retained baseline record. These counts do not establish that the new UI has passed its migration checks. Current sources and UI changes need their applicable verification run.</p>${rows.map(([label,value])=>`<div class="readout"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('')}</section><section class="card"><h2>Current selected model</h2><div class="readout"><span>Scientific bundle</span><strong>${esc(science?.version||'Unavailable')}</strong></div><div class="readout"><span>Provider classification</span><strong>${esc(provider?.classification||provider?.label||'Unavailable')}</strong></div><div class="readout"><span>Horizon extent</span><strong>${Number.isFinite(provider?.terrain?.horizon?.extentM)?esc(provider.terrain.horizon.extentM/1000)+' km':'Not assessed'}</strong></div><p class="section-gap">A declared nominal horizon extent and source-RMS sensitivity do not establish independent physical accuracy or full-domain confidence bounds.</p></section><section class="card"><h2>Acceptance remains distinct</h2><div class="readout"><span>Baseline physical scientific acceptance</span><strong>${baseline.fullScientificAcceptance?'Recorded accepted':'Open'}</strong></div><div class="readout"><span>Baseline engineering calibration</span><strong>${baseline.engineeringCalibration?'Recorded accepted':'Open'}</strong></div><p class="section-gap">Source integrity, numerical comparisons and a browser review support their declared scope. They do not replace physical terrain/resource measurements or architecture-specific engineering evidence.</p><button type="button" data-evidence-section="limits" class="section-gap">Review remaining limits</button></section></div>`;
}

function limitsContent(workspace){
 const report=workspace?.serialize?.(),limits=Array.isArray(report?.limitations)?report.limitations:[];
 return `<div class="cards"><section class="card wide"><p class="eyebrow">Model and data scope</p><h2>Keep the qualifications with the result.</h2><p>Nominal environmental fits remain uncertain. The application exposes applicable source evidence and declared models; it does not certify a landing, operational rescue or accepted logistics design.</p><ul class="subtle-list section-gap">${limits.map(limit=>`<li>${esc(limit)}</li>`).join('')}</ul>${!limits.length?'<p>No current workspace limitation record is available.</p>':''}</section><section class="card"><h2>Remaining physical acceptance gates</h2><p class="field-note">From the baseline record dated ${esc(baseline.reviewDateLocal)}.</p><ul class="subtle-list">${baseline.remainingGates.map(gate=>`<li>${esc(gate)}</li>`).join('')}</ul></section><section class="card"><h2>Reference studies and exploratory models</h2><p>The NASA propellant reference assumes its deposit concentration. It does not measure ice at the selected study points or calibrate the unrelated legacy LCSS architecture.</p><p class="section-gap">Historical thermal and orbital radiation observations are separate from future surface conditions. Dust, prescribed ejecta, primary-proton and hypothetical rescue studies retain their own assumptions and unassessed physical effects.</p><p class="section-gap">Only actual source coverage is used. Missing or unsupported data is not replaced with another point's measurements.</p></section></div>`;
}

export function evidenceUiContent({science,workspace,provider,section='sources',query='',selected=null}){
 const active=sections.some(([id])=>id===section)?section:'sources',search=typeof query==='string'?query.slice(0,200):'';
 return `<p class="eyebrow">Real inputs, declared limits</p><h1>Know what supports the result.</h1><p class="page-intro">Trace each layer to its source, recorded identity and applicable scope.</p><nav class="seg evidence-sections section-gap" role="tablist" aria-label="Evidence sections">${sections.map(([id,label])=>`<button type="button" role="tab" data-evidence-section="${id}" aria-selected="${active===id}" tabindex="${active===id?'0':'-1'}">${label}</button>`).join('')}</nav><div class="section-gap">${active==='sources'?sourcesContent(science,provider,search,selected):active==='validation'?validationContent(science,provider):limitsContent(workspace)}</div>`;
}
