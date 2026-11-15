import {terrainEvidenceMarkup} from './terrain-evidence.mjs';
import {routeMarkup,radiationContextMarkup} from './route-view.mjs';
import {rescueMarkup} from './rescue-view.mjs';
import {dustMarkup} from './dust-view.mjs';
import {plumeMarkup} from './plume-view.mjs';
import {radiationMarkup} from './radiation-view.mjs';
import {plumeContext} from './plume.mjs';
import {assessRescue,rescueContext} from './rescue.mjs';
import {terrainRoute} from './routes.mjs';
import {thermalMarkup} from './thermal-view.mjs';
import {sensitivityMarkup} from './sensitivity-view.mjs';
import {terrainScreen} from './engine.mjs';
import {realTerrainScreen} from './real-data.mjs';
import {terrainMap,escapeHtml as esc} from './charts.mjs';
const fixed=(v,d=1)=>Number.isFinite(v)?v.toFixed(d):'—',pct=v=>Number.isFinite(v)?(v*100).toFixed(1)+'%':'—';
const cache=new Map();
export function assessedTerrain(state,site,provider){
 const key=JSON.stringify([state.mode,site.id,site.lat,site.lon,site.altKm,state.terrain]);
 if(cache.has(key))return cache.get(key);
 const result=state.mode==='real'?realTerrainScreen(provider.entry,state.terrain):state.mode==='sample'?terrainScreen(site,state.terrain):null;
 cache.set(key,result);if(cache.size>64)cache.delete(cache.keys().next().value);return result;
}
export function screeningContent({state,site,res,provider,gapsMarkup,scenarioButtons,section='all'}){
 const terrain=assessedTerrain(state,site,provider),real=state.mode==='real';
 const heading=(title,body)=>`<p class="eyebrow">Scenario ${state.active} · ${esc(site.name)}</p><h1>${title}</h1>${scenarioButtons()}<div class="cards section-gap">${body}</div>`;
 if(section==='thermal')return heading('Thermal context, visible assumptions',thermalMarkup(real?provider.entry:null)+dustMarkup(state.dust[state.active]));
 if(section==='plume')return heading('Explore prescribed ejecta trajectories',plumeMarkup(state.plume[state.active],plumeContext(state)));
 if(section==='radiation')return heading('Radiation evidence, with context',radiationMarkup(state.radiation[state.active])+radiationContextMarkup(real?provider.terrain?.horizon:null));
 if(section==='rescue')return heading('Plan a conditional response',routeMarkup(terrain,state.routeDirection)+rescueMarkup(state.rescue[state.active],assessRescue(terrainRoute(terrain,state.routeDirection),state.rescue[state.active],rescueContext(state))));
 return `<p class="eyebrow">Beyond total availability</p><h1>Terrain & operating gaps.</h1><p class="page-intro">Screen the selected scenario without merging unrelated evidence into a safety score.</p>${scenarioButtons()}<div class="cards"><section class="card"><h2>Terrain footprint</h2><span class="extension-status">${terrain?(real?'REAL NASA DEM':'SYNTHETIC')+' · '+terrain.status.replaceAll('_',' '):'Not evaluated'}</span>${terrain?terrainMap(terrain):'<div class="budget-placeholder">No real DEM coverage at this selected point</div>'}<p>${terrain?'Blue: within the chosen slope limit. Amber: exceeded. Gray: missing. '+(real?'Measurements use the pinned NASA PGDA 5 m elevation grid.':'A procedural footprint, not a measured lunar site.'):'Another point’s terrain is never substituted. Use a supported DEM study point in real mode.'}</p></section><section class="card"><h2>Scale and evidence</h2>${terrain?`<div class="readout"><span>Mean / max slope</span><strong>${fixed(terrain.mean)}° / ${fixed(terrain.max)}°</strong></div><div class="readout"><span>95th percentile slope</span><strong>${fixed(terrain.p95)}°</strong></div><div class="readout"><span>Detrended roughness · RMS</span><strong>${fixed(terrain.roughness,2)} m</strong></div><div class="readout"><span>Footprint coverage</span><strong>${pct(terrain.coverage)}</strong></div><div class="readout"><span>Area meeting slope limit</span><strong>${fixed(terrain.usableArea,0)} m²</strong></div><div class="readout"><span>Radius / baseline / limit</span><strong>${terrain.radius} m / ${terrain.baseline} m / ${terrain.limit}°</strong></div>${real?`<div class="readout"><span>Source / grid spacing</span><strong>${terrain.source} / 5 m</strong></div><div class="readout"><span>Height RMS · median / max</span><strong>${fixed(terrain.heightRmsM?.median,2)} / ${fixed(terrain.heightRmsM?.max,2)} m</strong></div><div class="readout"><span>Published slope RMS · median</span><strong>${fixed(terrain.publishedSlopeRmsDeg?.median,2)}°</strong></div><p class="field-note">${esc(terrain.uncertainty)}</p>`:''}`:'<p>Real terrain is unavailable in this selected mode or at this coordinate.</p>'}<div class="inline-actions"><button data-property="terrain">Edit footprint settings</button></div><p class="external-note">No unresolved boulder detection or safe-landing verdict. Slope is measured at the selected baseline; roughness is detrended over the selected footprint. ${real?'Map axes follow the source polar stereographic grid.':'The artistic crater mesh differs from this demonstration height field.'}</p></section>${terrainEvidenceMarkup(state,provider)}${routeMarkup(terrain,state.routeDirection)}${section==='all'?rescueMarkup(state.rescue[state.active],assessRescue(terrainRoute(terrain,state.routeDirection),state.rescue[state.active],rescueContext(state)))+radiationContextMarkup(real?provider.terrain?.horizon:null):''}${gapsMarkup(res)}${sensitivityMarkup(res)}${section==='all'?thermalMarkup(real?provider.entry:null)+dustMarkup(state.dust[state.active])+plumeMarkup(state.plume[state.active],plumeContext(state))+radiationMarkup(state.radiation[state.active]):''}</div><section class="card section-gap"><h2>Optional outage requirements</h2><p>Maximum darkness: ${state.requirements.maxDark===null?'disabled':state.requirements.maxDark+' h'}. Maximum Earth outage: ${state.requirements.maxEarth===null?'disabled':state.requirements.maxEarth+' h'}. Physical darkness and falling below the selected solar-elevation criterion remain separate.</p>${real?`<p class="section-gap">${esc(provider.horizonDescription)}. ${esc(provider.qualificationReason)} A nominal local fit is labeled uncertain.</p>`:''}<button data-property="constraints" class="section-gap">Edit enabled requirements</button></section>`;
}
