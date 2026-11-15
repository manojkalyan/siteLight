// Export selection is a projection of an assessment, never a change to its inputs.
export const defaultReportOptions=Object.freeze({comparison:true,sources:true,research:true});
const researchKeys=['logisticsExploration','rescueExploration','dustExploration','plumeExploration','radiationExploration'];
export function selectedReport(full,options=defaultReportOptions,active='A'){
 const choices={...defaultReportOptions,...options},report=structuredClone(full);
 if(!['A','B'].includes(active))throw Error('Unknown report scenario');
 if(!choices.comparison){
  const prune=value=>{if(!value||typeof value!=='object')return;for(const key of Object.keys(value)){if((key==='A'||key==='B')&&key!==active)delete value[key];else prune(value[key]);}};
  prune(report);
 }
 if(!choices.sources){
  for(const scenario of Object.values(report.scenarios))scenario.sourceRecords=(scenario.sourceRecords||[]).map(record=>Object.fromEntries(Object.entries(record).filter(([key])=>['name','kind','url','sha256','subsetSha256','cacheKey','version','scope','category'].includes(key))));
  const compact=value=>{if(!value||typeof value!=='object')return;if(typeof value.url==='string')for(const key of ['bytes','retrievedDate','retrievedAt','downloadedAt','localPath','subsetFile'])delete value[key];for(const child of Object.values(value))compact(child);};compact(report);
 }
 if(!choices.research)for(const key of researchKeys)delete report[key];
 report.exportSelections={includeComparison:choices.comparison,includeSourceMetadata:choices.sources,includeResearchAssumptions:choices.research,scenarioIds:Object.keys(report.scenarios),omitted:researchKeys.filter(key=>!choices.research&&key in full),meaning:'Report selections do not change the assessment. Source identities, classification and scientific limitations remain required. NASA reference-study assumptions retain their separate scope.'};
 return report;
}
// This stable field order is the existing evidence-report hash protocol.
export function canonicalReportInput(report){return JSON.stringify({model:report.model,mode:report.mode,requirements:report.requirements,convention:report.convention,preprocessing:report.preprocessing,stepMinutes:report.stepMinutes,scenarios:report.scenarios,terrain:report.terrain,logisticsExploration:report.logisticsExploration,nasaReferenceStudy:report.nasaReferenceStudy,terrainReferenceEvidence:report.terrainReferenceEvidence,terrainEnsembleStudy:report.terrainEnsembleStudy,monthlyRobustness:report.monthlyRobustness,landingStartWindows:report.landingStartWindows,rescueExploration:report.rescueExploration,dustExploration:report.dustExploration,plumeExploration:report.plumeExploration,radiationExploration:report.radiationExploration,seismicContext:report.seismicContext});}
export async function reportHash(report){return globalThis.crypto?.subtle?Array.from(new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonicalReportInput(report)))),b=>b.toString(16).padStart(2,'0')).join(''):null;}
const csv=value=>'"'+String(value??'').replaceAll('"','""')+'"';
export function timeSeriesCsv(results,ids=['A','B']){
 const rows=[['scenario','classification','utc','sample_duration_h','sun_azimuth_deg','sun_elevation_deg','sun_horizon_deg','earth_azimuth_deg','earth_elevation_deg','earth_horizon_deg','sun_above_horizon','solar_eligible','earth_visible','overlap']];
 for(const id of ids){const result=results[id];if(!result)throw Error('No result for scenario '+id);for(const r of result.records)rows.push([id,result.classification,new Date(r.time).toISOString(),r.weight,r.sunAzimuth,r.sunElevation,r.sunHorizon,r.earthAzimuth,r.earthElevation,r.earthHorizon,r.lit,r.eligible,r.earth,r.overlap]);}
 return rows.map(row=>row.map(csv).join(',')).join('\r\n');
}
