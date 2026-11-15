import {readFileSync,writeFileSync} from 'node:fs';
import {evaluate,defaultRequirements,makeScenario} from '../src/workspace/engine.mjs';
import {createRealProvider} from '../src/workspace/real-data.mjs';
const science=JSON.parse(readFileSync(new URL('../data/science/real-workspace.json',import.meta.url),'utf8'));
const sites=Object.values(science.sites).map(e=>{
 const h=e.terrain.horizon,r=evaluate(makeScenario(e.site),defaultRequirements,createRealProvider(e.site,science));
 return {id:e.site.id,farFieldRaisesSectors:h.farFieldRaisesSectors,crossProductCenterDeltaM:h.crossProductCenterDeltaM,minHorizonDeg:Math.min(...h.elevationDeg),maxHorizonDeg:Math.max(...h.elevationDeg),fractions:r.fractions,status:r.status,sensitivity:r.sensitivity,diagnosticIntervals:r.diagnostics.length,thermal:e.thermalContext.map(b=>({localTimeHours:b.localTimeHours,status:b.status,kelvin:b.match?.kelvin??null,distanceM:b.match?.distanceM??null}))};
});
const report={recordedUtc:new Date().toISOString(),version:science.version,scenarioUtc:'2027-01-13T00:00:00Z',requirements:defaultRequirements,sites,orientation:{passed:science.orientationValidation.passed,sites:Object.keys(science.orientationValidation.sites),maxAngularErrorDeg:Math.max(...Object.values(science.orientationValidation.sites).flatMap(s=>Object.values(s.checks).map(c=>c.maxAngularErrorDeg)))},limitations:['125 km is a bounded sampled horizon, not a global completeness proof','One-RMS sensitivity scenarios are not confidence bounds','Diviner bins are historical southern-summer observations, not mission forecasts']};
writeFileSync(new URL('../docs/SCIENCE_INCREMENT_3.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
