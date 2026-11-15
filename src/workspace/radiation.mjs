import evidence from '../../data/radiation/radiation-evidence.json' with {type:'json'};
export const radiationVersion='orbital-context-proton-csda-1';
export const radiationMaterials=Object.fromEntries(Object.entries(evidence.pstar.materials).map(([key,m])=>[key,{name:m.name,densityGcm3:m.densityGcm3}]));
export const radiationEnergies=evidence.pstar.materials.aluminum.rows.filter(r=>r.energyMeV>=1&&r.energyMeV<=1000).map(r=>r.energyMeV);
export const radiationMonths=[...new Set(evidence.crater.records.map(r=>r.date.slice(0,7)))];
export const radiationFields={arealDensityGcm2:['Assumed normal shield areal density','g/cm²',0,1000,.01],areaM2:['Assumed shield panel area','m²',.01,1000,.01],minCoveragePercent:['Minimum archived daily coverage','%',0,100,1]};
export const defaultRadiation={enabled:false,material:'aluminum',energyMeV:100,arealDensityGcm2:5,areaM2:10,archiveMonth:'2012-12',detector:'D1',corrected:false,minCoveragePercent:95};
const archiveByDate=new Map(evidence.crater.records.map(r=>[r.date,r]));
export function validateRadiation(a){
 if(typeof a.enabled!=='boolean'||typeof a.corrected!=='boolean')throw Error('Radiation enable/correction choices must be true or false.');
 if(typeof a.material!=='string'||!Object.hasOwn(radiationMaterials,a.material))throw Error('Choose a supported NIST material.');
 if(!radiationEnergies.includes(a.energyMeV))throw Error('Choose a tabulated incident proton energy from 1 to 1000 MeV.');
 if(!radiationMonths.includes(a.archiveMonth)||typeof a.detector!=='string'||!/^D[1-6]$/.test(a.detector))throw Error('Choose an available archive month and detector D1-D6.');
 for(const [key,[label,,min,max]] of Object.entries(radiationFields))if(!Number.isFinite(a[key])||a[key]<min||a[key]>max)throw Error(`${label}: use ${min}-${max}.`);
}
export function primaryProtonResult(material,energyMeV,arealDensityGcm2,areaM2){
 const data=evidence.pstar.materials[material];
 if(!Object.hasOwn(evidence.pstar.materials,material)||!data||!radiationEnergies.includes(energyMeV)||!Number.isFinite(arealDensityGcm2)||arealDensityGcm2<0||arealDensityGcm2>1000||!Number.isFinite(areaM2)||areaM2<.01||areaM2>1000)throw Error('Unsupported proton comparison inputs.');
 const row=data.rows.find(r=>r.energyMeV===energyMeV),remaining=row.csdaRangeGcm2-arealDensityGcm2;
 const base={material,name:data.name,incidentEnergyMeV:energyMeV,incidentCsdaRangeGcm2:row.csdaRangeGcm2,incidentSourceLine:row.sourceLine,arealDensityGcm2,remainingRangeGcm2:Math.max(0,remaining),
  referenceDensityGcm3:data.densityGcm3,thicknessCm:arealDensityGcm2/data.densityGcm3,panelMassKg:arealDensityGcm2*10*areaM2,areaM2,
  source:structuredClone(evidence.sources.find(s=>s.name===data.sourceName)),compositionSource:structuredClone(evidence.sources.find(s=>s.name===data.compositionSourceName)),
  residualEnergyMeV:null,residualEnergyBracketMeV:null,interpolation:null,secondaryDose:'not_evaluated',humanDose:'not_evaluated'};
 if(arealDensityGcm2===0)return {...base,status:'primary_energy_estimated',residualEnergyMeV:energyMeV,residualEnergyBracketMeV:[energyMeV,energyMeV]};
 if(remaining<=0)return {...base,status:'csda_range_exhausted',residualEnergyMeV:0,residualEnergyBracketMeV:[0,0],meaning:'Primary-proton CSDA range exhausted in this approximation; secondary radiation and total dose are not evaluated.'};
 if(remaining<data.rows[0].csdaRangeGcm2)return {...base,status:'below_table_range',residualEnergyBracketMeV:[0,data.rows[0].energyMeV],meaning:'Remaining range below the first tabulated energy; no extrapolated estimate.'};
 const exact=data.rows.find(r=>Math.abs(r.csdaRangeGcm2-remaining)<=1e-12*Math.max(1,remaining));
 if(exact)return {...base,status:'primary_energy_estimated',residualEnergyMeV:exact.energyMeV,residualEnergyBracketMeV:[exact.energyMeV,exact.energyMeV],interpolation:{method:'tabulated endpoint',sourceLines:[exact.sourceLine]}};
 const upper=data.rows.findIndex(r=>r.csdaRangeGcm2>remaining),lo=data.rows[upper-1],hi=data.rows[upper];
 if(!lo||!hi)throw Error('Residual range is not bracketed by the source table.');
 const t=Math.log(remaining/lo.csdaRangeGcm2)/Math.log(hi.csdaRangeGcm2/lo.csdaRangeGcm2),energy=lo.energyMeV*Math.exp(t*Math.log(hi.energyMeV/lo.energyMeV));
 return {...base,status:'primary_energy_estimated',residualEnergyMeV:energy,residualEnergyBracketMeV:[lo.energyMeV,hi.energyMeV],interpolation:{method:'log-log inverse CSDA-range interpolation',sourceLines:[lo.sourceLine,hi.sourceLine],rangeBracketGcm2:[lo.csdaRangeGcm2,hi.csdaRangeGcm2]}};
}
export function craterMonth(a){
 validateRadiation(a);
 const [year,month]=a.archiveMonth.split('-').map(Number),days=new Date(Date.UTC(year,month,0)).getUTCDate(),index=Number(a.detector.slice(1))-1,key=a.corrected?'shadowCorrectedMgySiDay':'measuredMgySiDay';
 const records=Array.from({length:days},(_,i)=>{
  const date=a.archiveMonth+'-'+String(i+1).padStart(2,'0'),row=archiveByDate.get(date),value=row?.[key]?.[index]??null,rateFlag=row?.sourceRateFlags[index+(a.corrected?6:0)]??null;
  const reason=!row?'outside_loaded_archive':!Number.isFinite(value)?'source_value_flagged':!Number.isFinite(row.coveragePercent)?'source_coverage_flagged':row.coveragePercent<=0||row.coveragePercent<a.minCoveragePercent?'below_coverage_threshold':null;
  return {date,sourceValueMgySiDay:value,usedValueMgySiDay:reason?null:value,coveragePercent:row?.coveragePercent??null,sourceRateFlag:rateFlag,sourceCoverageFlag:row?.coverageFlag??null,sourceTableRow:row?.sourceTableRow??null,reason};
 });
 const values=records.map(r=>r.usedValueMgySiDay).filter(Number.isFinite);
 return {classification:evidence.crater.classification,quantity:evidence.crater.quantity,unit:evidence.crater.unit,month:a.archiveMonth,detector:a.detector,correction:a.corrected?'source lunar-shadow correction':'as measured',minimumCoveragePercent:a.minCoveragePercent,
  calendarDays:days,qualifyingDays:values.length,unavailableDays:days-values.length,arithmeticMeanMgySiDay:values.length?values.reduce((s,v)=>s+v,0)/values.length:null,minMgySiDay:values.length?Math.min(...values):null,maxMgySiDay:values.length?Math.max(...values):null,
  meaning:'Arithmetic mean of qualifying archived daily rates only. No missing-day fill, dose integration, surface conversion or mission-time forecast.',uncertainty:null,records,source:structuredClone(evidence.sources.find(s=>s.name===evidence.crater.sourceName))};
}
export function assessRadiation(a){
 validateRadiation(a);
 const base={model:radiationVersion,status:'not_evaluated',acceptedForVerdict:false,assumptions:{...a},environment:'Hypothetical monoenergetic protons at normal incidence on a uniform slab',
  sources:structuredClone(evidence.sources),dataVersion:evidence.preparationVersion,orbitalObservations:null,protonComparison:null,materialComparisons:[],curve:[],surfaceDose:'not_evaluated',effectiveDose:'not_evaluated',secondaryTransport:'not_evaluated',terrainApplied:false,
  meaning:'Historical silicon detector dose rates and a separate primary-proton CSDA comparison. Residual energy is not a dose-reduction percentage or a safety verdict.',
  exclusions:['No GCR/SEP spectrum, particle fluence, nuclear reactions/secondary neutron transport, range straggling, scattering or angular shielding geometry.',
   'The NIST CSDA path range is used as a straight normal-slab approximation; it is distinct from projected range. Bulk density is a NIST material reference.',
   'CRaTER is historical lunar-orbital silicon detector context. Gy in silicon is not Sv in tissue; lunar-shadow correction is not a surface/human-dose conversion.',
   'No terrain solid-angle dose multiplier, future-date prediction, exposure limit, health risk or validated shelter/hardware protection result. Source uncertainties are not propagated.']};
 if(!a.enabled)return base;
 const result=primaryProtonResult(a.material,a.energyMeV,a.arealDensityGcm2,a.areaM2),extent=Math.max(a.arealDensityGcm2,result.incidentCsdaRangeGcm2*1.2);
 return {...base,status:'exploratory',orbitalObservations:craterMonth(a),protonComparison:result,
  materialComparisons:Object.keys(radiationMaterials).map(m=>primaryProtonResult(m,a.energyMeV,a.arealDensityGcm2,a.areaM2)),
  curve:Array.from({length:31},(_,i)=>{const x=extent*i/30,r=primaryProtonResult(a.material,a.energyMeV,x,a.areaM2);return {arealDensityGcm2:x,residualEnergyMeV:r.residualEnergyMeV,status:r.status};})};
}
