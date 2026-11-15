import referenceData from '../../data/engineering/references.json' with {type:'json'};
import manifest from '../../data/engineering-inputs.json' with {type:'json'};
import validation from '../../data/engineering/reference-validation.json' with {type:'json'};

export const engineeringVersion='lcss-evidence-1';
const requiredEvidence={
 demandKgPerCrewDay:'Define potable, hygiene, food, EVA and other streams and their recovery boundaries.',
 recovery:'Demonstrate architecture-specific stream recovery, losses and degradation.',
 initialWaterKg:'Size startup inventory with a commissioning and water-loop balance.',
 reserveDays:'Define reserve policy and credible outage/replenishment cases.',
 extractionShare:'Define the imported/produced water allocation and startup schedule.',
 extractable:'Measure accessible local ice fraction, depth, distribution and excavation losses.',
 extractionRecovery:'Separate extraction, capture and purification yields using an applicable process.',
 throughputKgHour:'Validate excavation/feed throughput against material and operating conditions.',
 reactorPowerKw:'Size electrical and thermal loads, auxiliaries, startup and peak demand.',
 regolithEnergyKwhKg:'Validate full regolith process energy with temperature and heat recovery.',
 waterEnergyKwhKg:'Validate additional capture/purification energy without double counting.',
 duty:'Validate a 730-day operating/maintenance and energy-availability schedule.',
 unitMassKg:'Provide an installed equipment bill of materials and declared margins.',
 balanceMassKg:'Inventory shared plant, deployment, controls and thermal equipment.',
 powerMassKgKw:'Select a generator and include distribution, conversion and deployment.',
 storageHours:'Size autonomy against a declared load and accepted outage schedule.',
 storageEfficiency:'Separate usable depth of discharge, conversion losses and degradation.',
 storageMassKgKwh:'Validate installed storage mass per nameplate energy, thermal control and margins.',
 hardwareKg:'Provide an architecture-matched life-support equipment inventory.',
 spares:'Define reliability, maintenance, replacement inventory and allocation basis.',
};
const context={demandKgPerCrewDay:['bvad:potable'],extractionRecovery:['isru:extraction'],storageMassKgKwh:['isru:battery'],storageEfficiency:['isru:discharge'],duty:['isru:time'],unitMassKg:['isru:mass'],reactorPowerKw:['isru:power']};
const contextMeaning={
 demandKgPerCrewDay:'BVAD potable content is one stream, not gross circulating demand.',
 extractionRecovery:'Study extraction efficiency does not establish combined capture/purification recovery.',
 storageMassKgKwh:'Study battery energy density does not specify the complete installed storage boundary.',
 storageEfficiency:'Maximum discharge is distinct from conversion efficiency and degradation.',
 duty:'A 225-day production assumption does not establish a two-year duty cycle.',
 unitMassKg:'The published mass is a complete propellant architecture, not a water extraction unit.',
 reactorPowerKw:'The published power is an architecture-level requirement, not per-unit capacity.',
};
export const engineeringReferences=referenceData.references.map(reference=>{
 const source=manifest.records.find(r=>r.name===reference.file);
 return {...reference,source:{...source},observations:reference.observations.map(({pattern,...observation})=>({...observation,
  transcription:validation.checks.find(c=>c.reference===reference.id&&c.observation===observation.id&&c.value===observation.value&&c.pdfPage===observation.pdfPage&&c.sourceSha256===source.sha256)?.status??'unverified'}))};
});
export function engineeringEvidence(inputs,fields){
 const parameters=Object.entries(fields).map(([key,[label,unit]])=>{
  if(!requiredEvidence[key])throw Error('Missing engineering evidence definition: '+key);
  return {key,label,unit,value:inputs[key],status:'planning_assumption',accepted:false,contextReferences:[...(context[key]||[])],contextMeaning:contextMeaning[key]??null,requiredEvidence:requiredEvidence[key]};
 });
 return {version:engineeringVersion,status:'reference_review_started',acceptedForVerdict:false,
  coverage:{totalParameters:parameters.length,acceptedParameters:0,assumedParameters:parameters.length,contextLinkedParameters:parameters.filter(p=>p.contextReferences.length).length},
  parameters,references:structuredClone(engineeringReferences),
  referenceConversions:{batteryKgPerNameplateKwh:1000/engineeringReferences.find(r=>r.id==='isru').observations.find(o=>o.id==='battery').value,meaning:'Reciprocal of the study assumption, 140 Wh/kg. Installed system boundary is unconfirmed; not applied to storage sizing.'},
  gates:[
   {id:'sources',status:engineeringReferences.every(r=>r.observations.every(o=>o.transcription==='verified_transcription'))?'transcription_verified':'open',meaning:'Two pinned NASA PDFs; seven published values checked against their pages. Applicability is separate.'},
   {id:'architecture',status:'open',meaning:'Map all water streams, installed equipment, energy and accounting exclusions to one architecture.'},
   {id:'operations',status:'open',meaning:'Demonstrate startup, outages, degradation, maintenance and two-year power/storage scheduling.'},
   {id:'resource',status:'open',meaning:'Load applicable extractable ice/yield evidence, or explicitly accept a hypothetical study.'},
   {id:'independent-review',status:'open',meaning:'Record an independent engineering review and accepted reference cases before enabling logistics verdicts.'},
  ]};
}
