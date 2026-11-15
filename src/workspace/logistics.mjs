import {engineeringEvidence} from './engineering.mjs';
export const logisticsVersion='water-logistics-screen-2';
export const logisticsFields={
 demandKgPerCrewDay:['Gross loop water demand','kg / crew / day',.1,50],recovery:['Loop water recovery','fraction',0,.999],
 initialWaterKg:['Initial water inventory','kg',0,10000],reserveDays:['Makeup-water reserve','days',0,730],
 extractionShare:['Fraction of makeup supplied by ISRU','fraction',0,1],extractable:['Extractable fraction of ice','fraction',0,1],extractionRecovery:['Water capture / purification recovery','fraction',0,1],
 throughputKgHour:['Regolith throughput per unit','kg / h',.1,10000],reactorPowerKw:['Electrical capacity per unit','kW',.1,10000],
 regolithEnergyKwhKg:['Process energy per regolith mass','kWh / kg',.001,100],waterEnergyKwhKg:['Additional process energy per water mass','kWh / kg',0,100],
 duty:['Operating duty over 730 days','fraction',.01,1],unitMassKg:['Installed extraction unit mass','kg / unit',1,100000],balanceMassKg:['Shared ISRU balance of plant','kg',0,100000],
 powerMassKgKw:['Power generation specific mass','kg / kW',.1,10000],storageHours:['Independent storage autonomy','h',0,1000],storageEfficiency:['Usable storage efficiency','fraction',.1,1],storageMassKgKwh:['Storage specific mass','kg / kWh',.1,10000],
 hardwareKg:['Life-support hardware','kg',1,100000],spares:['Dry-system spares fraction','fraction',0,1],
};
export const defaultLogistics={demandKgPerCrewDay:4,recovery:.75,initialWaterKg:100,reserveDays:30,extractionShare:1,extractable:.5,extractionRecovery:.75,throughputKgHour:20,reactorPowerKw:2.5,regolithEnergyKwhKg:.1,waterEnergyKwhKg:.5,duty:.5,unitMassKg:150,balanceMassKg:500,powerMassKgKw:20,storageHours:72,storageEfficiency:.9,storageMassKgKwh:10,hardwareKg:8000,spares:.1};
export const logisticsSources=[
 {id:'brief',category:'inherited assumption',title:'User PRD example parameters',url:'docs/reference/user-supplied-lcss-prd.txt',meaning:'Four crew, 730 days, 75% loop recovery, 2.5 kW/unit, 20 kg/kW, 8000 kg hardware, 10% spares and 18000 kg budget; these are planning assumptions.'},
 {id:'iss',category:'context only',title:'NASA ISS water recovery milestone',url:'https://www.nasa.gov/missions/station/nasa-achieves-water-recovery-milestone-on-international-space-station/',meaning:'98% recovery demonstrated for the ISS water collection/recovery architecture; not a lunar-system recovery guarantee or default.'},
 {id:'isru',category:'context only',title:'NASA lunar polar water ISRU architecture study',url:'https://ntrs.nasa.gov/citations/20210016820',meaning:'Architecture-specific mass/power case study; its propellant-production hardware is not rescaled into this life-support calculator.'},
 {id:'lcross',category:'measured estimate at another location',title:'Colaprete et al. 2010, Detection of water in the LCROSS ejecta plume',url:'https://pubmed.ncbi.nlm.nih.gov/20966242/',meaning:'Cabeus ejecta-derived water-ice estimate 5.6 ± 2.9 wt%; applies to the impact sampling, not an extractable concentration at this app’s study points.'},
];
export function validateLogistics(inputs,iceWtPercent,budgetKg){
 for(const [key,[label,,min,max]] of Object.entries(logisticsFields))if(!Number.isFinite(inputs[key])||inputs[key]<min||inputs[key]>max)throw Error(`${label}: use ${min}–${max}.`);
 if(!Number.isFinite(iceWtPercent)||iceWtPercent<0||iceWtPercent>6)throw Error('Assumed ice concentration must be 0–6 wt%.');
 if(!Number.isFinite(budgetKg)||budgetKg<0||budgetKg>10000000)throw Error('Budget must be 0–10000000 kg.');
}
export function evaluateLogistics(inputs,iceWtPercent,budgetKg=18000){
 validateLogistics(inputs,iceWtPercent,budgetKg);const a=inputs,crew=4,days=730,hours=days*24*a.duty;
 const gross=crew*days*a.demandKgPerCrewDay,makeup=gross*(1-a.recovery),reserve=crew*a.demandKgPerCrewDay*(1-a.recovery)*a.reserveDays;
 const yieldFraction=iceWtPercent/100*a.extractable*a.extractionRecovery,target=makeup*a.extractionShare;
 const energyPerRegolith=a.regolithEnergyKwhKg+yieldFraction*a.waterEnergyKwhKg;
 const rate=Math.min(a.throughputKgHour,a.reactorPowerKw/energyPerRegolith),unitWater=rate*hours*yieldFraction;
 const units=target>0&&unitWater>0?Math.ceil(target/unitWater-1e-12):0;
 if(units>100000)throw Error('This assumption set requires more than 100000 extraction units; refine the architecture.');
 const produced=units?target:0,regolith=produced&&yieldFraction?produced/yieldFraction:0,processEnergy=regolith*energyPerRegolith;
 const installedPower=units*a.reactorPowerKw,storageKwh=installedPower*a.storageHours/a.storageEfficiency;
 const contributors={earthWater:a.initialWaterKg+reserve+makeup-produced,extractionEquipment:units?units*a.unitMassKg+a.balanceMassKg:0,powerGeneration:installedPower*a.powerMassKgKw,energyStorage:storageKwh*a.storageMassKgKwh,lifeSupportHardware:a.hardwareKg};
 const dry=contributors.extractionEquipment+contributors.powerGeneration+contributors.energyStorage+contributors.lifeSupportHardware;
 contributors.spares=dry*a.spares;const totalKg=Object.values(contributors).reduce((s,v)=>s+v,0),marginKg=budgetKg-totalKg;
 return {model:logisticsVersion,status:'exploratory',budgetStatus:marginKg>=-1e-8?'fits':'exceeds',totalKg,budgetKg,marginKg,contributors,crew,days,iceWtPercent,
  evidence:{category:'user-adjusted hypothetical assumption',siteMeasuredConcentration:null,sourceMeasurementApplied:false},assumptions:{...a},engineering:engineeringEvidence(a,logisticsFields),
  iceEvidence:{selectedSite:{category:'no applicable measurement loaded',valueWtPercent:null,extractableFractionMeasured:false},context:{category:'measured estimate',region:'Cabeus impact ejecta',waterIceWtPercent:5.6,reportedUncertaintyPercentagePoints:2.9,depthM:null,appliedToSelectedSite:false,source:'https://pubmed.ncbi.nlm.nih.gov/20966242/'}},
  water:{grossKg:gross,recoveredKg:gross-makeup,makeupKg:makeup,initialKg:a.initialWaterKg,reserveKg:reserve,producedKg:produced,importedMakeupKg:makeup-produced,balanceResidualKg:makeup-((makeup-produced)+produced)},
  plant:{units,unitWaterCapacityKg:unitWater,effectiveRegolithRateKgHour:rate,regolithProcessedKg:regolith,processEnergyKwh:processEnergy,installedPowerKw:installedPower,storageNameplateKwh:storageKwh,operatingHours:hours,unusedCapacityKg:units*unitWater-produced},
  interpretation:'Defined water-logistics subtotal under explicit assumptions; engineering calibration and independent review pending. Does not change environmental verdicts.',
  exclusions:['Food, oxygen supply unrelated to the water loop, habitat, lander, transport, launch packaging and deployment','Site-specific excavation accessibility, startup/ramp-up, maintenance outages, degradation and contamination','Validated power availability over 730 days; storage autonomy is independently assumed, not inferred from the short visibility window'],sources:logisticsSources};
}
export function logisticsExplanation(result){return `Under these assumptions, the 4-crew, 730-day water-logistics subtotal is ${result.totalKg.toFixed(0)} kg. It ${result.budgetStatus==='fits'?'fits the budget with '+result.marginKg.toFixed(0)+' kg remaining':'exceeds the budget by '+(-result.marginKg).toFixed(0)+' kg'}. ${result.plant.units} extraction units are sized to the makeup-water target. Ice concentration is hypothetical; this is an exploratory budget comparison.`;}
export function findLogisticsFlip(inputs,budgetKg,currentIce){
 validateLogistics(inputs,currentIce,budgetKg);
 const rows=[];let evaluated=0,unavailable=0;for(let i=0;i<=60;i++){const ice=i/10;try{const r=evaluateLogistics(inputs,ice,budgetKg);evaluated++;if(r.budgetStatus==='fits')rows.push({iceWtPercent:ice,result:r});}catch{unavailable++;}}
 rows.sort((a,b)=>Math.abs(a.iceWtPercent-currentIce)-Math.abs(b.iceWtPercent-currentIce)||a.iceWtPercent-b.iceWtPercent);
 return {match:rows[0]||null,evaluated,unavailable,grid:{minWtPercent:0,maxWtPercent:6,stepWtPercent:.1,samples:61},meaning:`Nearest supported tested hypothetical concentration; lower concentration wins ties. ${evaluated} evaluated, ${unavailable} unsupported samples. Zero concentration means all water is imported and no ISRU is installed. No monotonicity or local ice discovery is implied.`};
}
