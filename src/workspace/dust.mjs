import materialData from '../../data/dust/materials.json' with {type:'json'};
import manifest from '../../data/dust-inputs.json' with {type:'json'};
import validation from '../../data/dust/reference-validation.json' with {type:'json'};

export const dustVersion='radiator-optical-balance-1';
export const STEFAN_BOLTZMANN=5.670374419e-8;
export const dustFields={
 coveragePercent:['Assumed dust area coverage','%',0,100,1],
 areaM2:['Active radiating area','m²',.01,1000,.01],
 internalHeatW:['Internal heat delivered to radiator','W',0,1000000,1],
 incidentSolarWm2:['Incident shortwave flux on radiator','W/m²',0,2000,1],
 cleanAlpha:['Clean coating solar absorptance','fraction',0,1,.01],
 cleanEpsilon:['Clean coating IR emittance','fraction',.01,1,.01],
 dustAlpha:['Custom dust solar absorptance','fraction',0,1,.01],
 dustEpsilon:['Custom dust IR emittance','fraction',.01,1,.01],
 skyViewFactor:['Radiative view factor to sky','fraction',0,1,.01],
 skyTemperatureK:['Assumed sky sink temperature','K',0,500,1],
 groundTemperatureK:['Assumed black ground temperature','K',0,800,1],
 limitK:['User temperature comparison limit','K',1,1500,1],
};
export const defaultDust={enabled:false,material:'jsc1a',coveragePercent:25,areaM2:1,internalHeatW:200,incidentSolarWm2:500,cleanAlpha:.2,cleanEpsilon:.9,dustAlpha:.8,dustEpsilon:.9,skyViewFactor:1,skyTemperatureK:3,groundTemperatureK:250,limitK:350};
const measurementSource=manifest.records.find(r=>r.name===materialData.sourceFile);
export const dustMaterials=Object.fromEntries(materialData.materials.map(m=>[m.id,{...m,category:materialData.category,referenceK:materialData.emittanceReferenceK,pdfPage:materialData.pdfPage,
 transcription:validation.checks.some(c=>c.material===m.id&&c.alpha===m.alpha&&c.epsilon===m.epsilon&&c.pdfPage===materialData.pdfPage&&c.sourceSha256===measurementSource.sha256&&c.status==='verified_transcription')?'verified_transcription':'unverified'}]));
export function validateDust(a){
 if(typeof a.enabled!=='boolean')throw Error('Dust exploration must be enabled or disabled.');
 if(typeof a.material!=='string'||a.material!=='custom'&&!Object.hasOwn(dustMaterials,a.material))throw Error('Choose a supported dust material or custom assumptions.');
 if(a.material!=='custom'&&dustMaterials[a.material].transcription!=='verified_transcription')throw Error('This material lacks matching pinned transcription evidence. Use verified data or explicit custom assumptions.');
 for(const [key,[label,,min,max]] of Object.entries(dustFields))if(!Number.isFinite(a[key])||a[key]<min||a[key]>max)throw Error(`${label}: use ${min}-${max}.`);
}
function balance(a,alpha,epsilon){
 const sinkFourth=a.skyViewFactor*a.skyTemperatureK**4+(1-a.skyViewFactor)*a.groundTemperatureK**4;
 const shortwaveW=a.areaM2*alpha*a.incidentSolarWm2,absorbedIrW=epsilon*STEFAN_BOLTZMANN*a.areaM2*sinkFourth;
 const temperatureK=(sinkFourth+(a.internalHeatW+shortwaveW)/(epsilon*STEFAN_BOLTZMANN*a.areaM2))**.25;
 const emittedIrW=epsilon*STEFAN_BOLTZMANN*a.areaM2*temperatureK**4;
 const capacityAtLimitW=epsilon*STEFAN_BOLTZMANN*a.areaM2*(a.limitK**4-sinkFourth)-shortwaveW,heatMarginW=capacityAtLimitW-a.internalHeatW;
 return {alpha,epsilon,temperatureK,temperatureC:temperatureK-273.15,limitK:a.limitK,temperatureMarginK:a.limitK-temperatureK,capacityAtLimitW,heatMarginW,
  limitStatus:heatMarginW>=-1e-8?'within_assumed_limit':'exceeds_assumed_limit',
  balance:{internalHeatW:a.internalHeatW,absorbedShortwaveW:shortwaveW,absorbedIrW,emittedIrW,residualW:emittedIrW-absorbedIrW-shortwaveW-a.internalHeatW}};
}
export function assessDust(a){
 validateDust(a);
 const endmember=a.material==='custom'?{id:'custom',name:'Custom assumed dust',alpha:a.dustAlpha,epsilon:a.dustEpsilon,category:'user-adjusted hypothetical properties',referenceK:null,transcription:'not_applicable'}:structuredClone(dustMaterials[a.material]);
 const base={model:dustVersion,acceptedForVerdict:false,status:'not_evaluated',assumptions:{...a},dustEndmember:endmember,
  constants:{stefanBoltzmannWm2K4:STEFAN_BOLTZMANN,source:'https://physics.nist.gov/cgi-bin/cuu/Value?sigma%7Csearch_for=stefan+boltzmann'},
  propertyEvidence:{cleanCoating:'planning assumption',dustCoverage:'hypothetical area fraction',endmember: endmember.category,siteMeasurementApplied:false,temperatureDependence:'Emittance held constant; laboratory reference is 300 K for presets, with no validated extrapolation range.'},
  sources:structuredClone(manifest.records),materialSpecificationSha256:validation.materialSpecSha256,
  method:'Steady-state, one-sided, opaque diffuse two-band surface with insulated back; area-weighted optical coefficients and black sky/ground reservoirs.',
  warning:'The rule-of-mixtures optical approximation is not conservative and is not a calibrated dust-on-coating response.',
  exclusions:['Dust thickness, grain contact/conduction, multilayer insulation, abrasion, cleaning and coating aging are not modeled.',
   'No transient temperature, thermal capacity, mount/back conduction, two-sided geometry or hardware-survival verdict.',
   'Incident shortwave flux, view factors and sink temperatures are user assumptions; no site/date forecast or automatic Diviner substitution.',
   'Radiative sky view factor is not the upward solid-angle fraction shown elsewhere. Lab simulant measurements are not local lunar material measurements.'],
  clean:null,dusty:null,deltaTemperatureK:null,deltaCapacityAtLimitW:null,curve:[]};
 if(!a.enabled)return base;
 const at=c=>balance(a,(1-c)*a.cleanAlpha+c*endmember.alpha,(1-c)*a.cleanEpsilon+c*endmember.epsilon),clean=at(0),dusty=at(a.coveragePercent/100);
 return {...base,status:'exploratory',clean,dusty,deltaTemperatureK:dusty.temperatureK-clean.temperatureK,deltaCapacityAtLimitW:dusty.capacityAtLimitW-clean.capacityAtLimitW,
  curve:Array.from({length:21},(_,i)=>{const r=at(i/20);return {coveragePercent:i*5,temperatureK:r.temperatureK,capacityAtLimitW:r.capacityAtLimitW,limitStatus:r.limitStatus};})};
}
