import context from '../../data/seismic/context.json' with {type:'json'};
import constants from '../../data/plume/constants.json' with {type:'json'};
export const seismicVersion='historical-seismic-context-1';
function freezeCatalog(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){for(const child of Object.values(value))freezeCatalog(child);Object.freeze(value);}return value;}
export const seismicCatalog=freezeCatalog(context);
export const seismicRadiusKm=constants.meanRadiusKm;
export const seismicLimits=[
 'Historical seismic context — local shaking hazard not quantified. No quake-date, shaking-duration, event-probability or safe-distance prediction.',
 context.coverage.scarpCatalog,
 'Scarp distances refer to retained reference points, not fault traces, rupture edges or the nearest active fault. No mapped point does not mean no fault.',
 context.coverage.moonquakes,
 'Historical shallow epicenters assume 100 km depth and are not accurate to 1 degree. Numeric confidence bounds are unavailable; alternate and missing coordinates remain explicit.',
 'Source catalog magnitudes use an SPZ-envelope amplitude definition. They are not moment magnitudes (Mw) and are not converted to a modern magnitude scale.',
 'Apollo waveforms were recorded away from the selected south-polar targets. Their amplitudes and coda do not predict local site shaking.',
 'Waveform display is normalized archive amplitude; no independent instrument-response calibration, ground-acceleration conversion or coda-duration inference is applied.',
 'Terrain slope/roughness and sampled routes retain their existing source footprint; no regolith strength, shaking-triggered failure, structural response or operational rescue verdict is computed.'
];
function validPoint(p){return p&&Number.isFinite(p.lat)&&Number.isFinite(p.lon)&&p.lat>=-90&&p.lat<=90;}
export function seismicDistanceKm(a,b){
 if(!validPoint(a)||!validPoint(b))return null;
 const rad=Math.PI/180,dlat=(b.lat-a.lat)*rad,dlon=(b.lon-a.lon)*rad,h=Math.sin(dlat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dlon/2)**2;
 return seismicRadiusKm*2*Math.atan2(Math.sqrt(Math.max(0,Math.min(1,h))),Math.sqrt(Math.max(0,1-h)));
}
export function nearestSeismicReference(point,records){
 if(!validPoint(point))return null;
 const ranked=records.filter(validPoint).map(record=>({id:record.id,name:record.name,lat:record.lat,lon:record.lon,nominalPointDistanceKm:seismicDistanceKm(point,record),locationUncertaintyKm:record.locationUncertaintyKm??null,alternativeLocation:record.alternativeLocation||null,alternativeDistanceKm:record.alternativeLocation?seismicDistanceKm(point,record.alternativeLocation):null,source:record.source,sourceRow:record.sourceRow,comments:record.comments||null})).sort((a,b)=>a.nominalPointDistanceKm-b.nominalPointDistanceKm);
 return ranked[0]||null;
}
export function seismicAssessment(workspace,report=workspace.serialize()){
 return {model:seismicVersion,classification:'Historical evidence and nominal reference-point proximity; not a seismic hazard assessment',catalogVersion:context.catalogVersion,counts:{polarScarpPoints:context.scarps.length,shallowEvents:context.moonquakes.length,locatedShallowEvents:context.moonquakes.filter(validPoint).length,alternativeLocations:context.moonquakes.filter(q=>q.alternativeLocation).length,controlledImpacts:context.impacts.length,historicalStations:context.stations.length,archivedWaveforms:context.waveforms.length},distanceMethod:{kind:'Great-circle distance on a mean-radius sphere',radiusKm:seismicRadiusKm,sourceUrl:constants.sourceUrl,meaning:'Nominal source-coordinate distance, not physical fault distance, travel path, confidence bound or risk rank'},scenarios:Object.fromEntries(Object.entries(report.scenarios).map(([id,s])=>[id,{target:{id:s.site.id,name:s.site.name,lat:s.site.lat,lon:s.site.lon,coordinateMeaning:'User-selected study/reference coordinates; not certified landing coordinates'},nearestScarpReference:nearestSeismicReference(s.site,context.scarps),nearestHistoricalEpicenter:nearestSeismicReference(s.site,context.moonquakes),terrainContext:report.mode==='real'&&s.terrainSummary?{mode:'real',source:s.terrainSummary.source,meanSlopeDeg:s.terrainSummary.mean,p95SlopeDeg:s.terrainSummary.p95,roughnessM:s.terrainSummary.roughness,coverage:s.terrainSummary.coverage,radiusM:report.terrain.settings.radius,baselineM:report.terrain.settings.baseline,route:s.terrainSummary.route}:null,localGroundMotion:'not_quantified',slopeFailure:'not_evaluated'}])),catalogRecords:{scarps:context.scarps,moonquakes:context.moonquakes,impacts:context.impacts,stations:context.stations},coverage:context.coverage,sourceRecords:context.sourceRecords,citations:context.citations,waveformRecords:context.waveforms,localShakingHazard:'not_quantified',slopeStability:'not_evaluated',acceptedForVerdict:false,limitations:seismicLimits};
}
/** Returns normalized map coordinates; excluded points stay excluded, never clamped to an edge. */
export function seismicProjection(point,scope='south'){
 if(!validPoint(point))return null;
 const longitude=((point.lon+180)%360+360)%360-180;
 if(scope==='global')return {x:(longitude+180)/360,y:(90-point.lat)/180};
 if(!['south','north'].includes(scope))throw Error('Unknown seismic map projection');
 if(scope==='south'&&point.lat>-65||scope==='north'&&point.lat<65)return null;
 const radius=(90-Math.abs(point.lat))/25,angle=longitude*Math.PI/180;
 return {x:.5+.5*radius*Math.sin(angle),y:.5-.5*radius*Math.cos(angle)};
}
const loaders={'12-lm':()=>import('./waveform-12-lm.mjs'), '13-s-ivb':()=>import('./waveform-13-s-ivb.mjs')},waveformPromises=new Map();
export function loadSeismicWaveform(id){
 if(!loaders[id])return Promise.reject(Error('No retained waveform for this event'));
 if(!waveformPromises.has(id))waveformPromises.set(id,loaders[id]().then(module=>{
  const record=module.default,expected=context.waveforms.find(w=>w.id===id);
  if(record.metadata.id!==id||record.metadata.sourceSha256!==expected.sourceSha256||record.samples.length!==expected.sampleCount||!record.samples.every(Number.isFinite))throw Error('Waveform identity or sample payload mismatch');
  return record;
 }).catch(error=>{waveformPromises.delete(id);throw error;}));
 return waveformPromises.get(id);
}
export function seismicWaveformWindow(record,preset='impact'){
 const m=record.metadata,min=(m.beginSeconds-m.eventOffsetSeconds)/60,max=(m.beginSeconds+(m.sampleCount-1)*m.sampleIntervalSeconds-m.eventOffsetSeconds)/60;
 const presets={full:[min,max],impact:[Math.max(min,-10),Math.min(max,60)],late:[Math.max(min,60),Math.min(max,120)]},range=presets[preset];
 if(!range||range[0]>=range[1])throw Error('Unsupported waveform window');
 return {fromMinute:range[0],toMinute:range[1]};
}
export function seismicWaveformBins(record,{fromMinute,toMinute,maxBins=720}){
 if(!Number.isFinite(fromMinute)||!Number.isFinite(toMinute)||fromMinute>=toMinute||!Number.isInteger(maxBins)||maxBins<1||maxBins>2000)throw Error('Invalid waveform plot window');
 const {samples,metadata:m}=record,first=Math.max(0,Math.ceil((m.eventOffsetSeconds+fromMinute*60-m.beginSeconds)/m.sampleIntervalSeconds)),last=Math.min(samples.length-1,Math.floor((m.eventOffsetSeconds+toMinute*60-m.beginSeconds)/m.sampleIntervalSeconds));
 if(last<first)return [];
 const count=last-first+1,bins=Math.min(count,maxBins),out=[];
 for(let bin=0;bin<bins;bin++){
  const startIndex=first+Math.floor(bin*count/bins),endIndex=first+Math.floor((bin+1)*count/bins)-1;let min=Infinity,max=-Infinity;
  for(let i=startIndex;i<=endIndex;i++){const value=samples[i];if(!Number.isFinite(value))throw Error('Nonfinite waveform sample');min=Math.min(min,value);max=Math.max(max,value);}
  out.push({startIndex,endIndex,sampleCount:endIndex-startIndex+1,minute:(m.beginSeconds+(startIndex+endIndex)/2*m.sampleIntervalSeconds-m.eventOffsetSeconds)/60,min,max});
 }
 return out;
}
export function seismicWaveformSample(record,minute){
 const {metadata:m,samples}=record,index=Math.max(0,Math.min(samples.length-1,Math.round((m.eventOffsetSeconds+minute*60-m.beginSeconds)/m.sampleIntervalSeconds)));
 if(!Number.isFinite(minute))throw Error('Invalid archive cursor');
 return {index,value:samples[index],normalized:samples[index]/(m.absolutePeakArchiveAmplitude||1),minute:(m.beginSeconds+index*m.sampleIntervalSeconds-m.eventOffsetSeconds)/60,archiveUtc:new Date(Date.parse(m.archiveReferenceUtc)+(m.beginSeconds+index*m.sampleIntervalSeconds)*1000).toISOString()};
}
const displayScales=new WeakMap();
export function seismicDisplayScale(record,preset='impact'){
 if(!displayScales.has(record))displayScales.set(record,new Map());
 const cache=displayScales.get(record);if(!cache.has(preset)){const bins=seismicWaveformBins(record,{...seismicWaveformWindow(record,preset),maxBins:1}),peak=bins.length?Math.max(Math.abs(bins[0].min),Math.abs(bins[0].max)):0;cache.set(preset,peak||1);}return cache.get(preset);
}
export function seismicWaveformCsv(record){
 const m=record.metadata,header='archive_utc,event_id,station,channel,minutes_from_archived_impact,sample_index,archive_amplitude,full_record_normalized_amplitude,compressed_source_sha256\r\n';
 return header+record.samples.map((value,index)=>{const seconds=m.beginSeconds+index*m.sampleIntervalSeconds;return [new Date(Date.parse(m.archiveReferenceUtc)+seconds*1000).toISOString(),m.id,m.station,m.channel,(seconds-m.eventOffsetSeconds)/60,index,value,value/(m.absolutePeakArchiveAmplitude||1),m.sourceSha256].join(',');}).join('\r\n');
}
