import {readFile,stat,writeFile} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {engineeringEvidence} from '../src/workspace/engineering.mjs';
import {defaultLogistics,logisticsFields} from '../src/workspace/logistics.mjs';
import {nasaReferenceAssessment} from '../src/workspace/nasa-reference.mjs';
const root=new URL('../',import.meta.url),read=async name=>JSON.parse(await readFile(new URL(name,root),'utf8'));
async function digest(path){const hash=createHash('sha256');for await(const chunk of createReadStream(path))hash.update(chunk);return hash.digest('hex');}
const checks=[];
async function sourceCheck(record,prefix,group){
 const name=prefix+record.name,path=new URL(name,root);
 try{const bytes=(await stat(path)).size,sha256=await digest(path);checks.push({group,path:name,sourceUrl:record.url,expectedBytes:record.bytes??null,bytes,expectedSha256:record.sha256,sha256,passed:sha256===record.sha256&&(record.bytes===undefined||bytes===record.bytes)});}catch(error){checks.push({group,path:name,passed:false,error:error.message});}
}
for(const [manifest,prefix,group] of [
 ['science-inputs.json','','terrain/kernels'],['thermal-inputs.json','thermal/','Diviner'],['engineering-inputs.json','engineering/','LCSS reference PDFs'],
 ['dust-inputs.json','dust/','dust reference PDFs'],['plume-inputs.json','plume/','plume references'],['radiation-inputs.json','radiation/','CRaTER/NIST']
]){const data=await read('data/'+manifest);for(const record of data.records)await sourceCheck(record,'data/raw/'+prefix,group);}
const vectors=await read('data/validation/reference-vectors.json'),orientation=await read('data/validation/orientation-references.json'),expanded=await read('data/validation/expanded/reference-vectors.json');
for(const record of [...vectors.sources,...Object.values(orientation.sites).flatMap(site=>site.sources)])await sourceCheck(record,'data/validation/','original external geometry/orientation');
for(const record of expanded.sources)await sourceCheck(record,'data/validation/expanded/','expanded external geometry');
const expandedAngles=await read('data/validation/expanded/orientation-references.json');
for(const record of Object.values(expandedAngles.sites).flatMap(s=>s.sources))await sourceCheck(record,'data/validation/expanded/orientation/','expanded external apparent angles');
const nasa=await read('data/engineering/nasa-reference-case.json'),nasaVerification=await read('data/engineering/nasa-reference-validation.json');
await sourceCheck(nasa.source,'data/raw/engineering/','NASA reference architecture PDF');
const terrain=await read('data/science/terrain-acceptance-evidence.json'),clones=await read('data/raw/terrain-evidence/clone-windows.json'),far=await read('docs/FARFIELD_EXTENSION.json'),stereo=await read('docs/STEREO_TERRAIN_COMPARISON.json');
await sourceCheck({name:'data/raw/terrain-evidence/LDEM_60S_240MPP_ADJ.TIF',...far.source},'','500 km outer terrain');
await sourceCheck({name:'data/raw/terrain-evidence/pgda78.html',url:clones.sourcePage,sha256:clones.sourcePageSha256},'','Published clone index');
for(const entry of Object.values(clones.sites))for(const record of entry.sources)await sourceCheck({name:record.subsetFile,url:record.url,sha256:record.subsetSha256},'','Retained clone windows (not whole remote TIFFs)');
for(const record of stereo.sources){
 await sourceCheck({name:record.subsetFile,url:record.url,sha256:record.subsetSha256},'','Retained stereo windows');
 await sourceCheck({name:record.confidence.subsetFile,url:record.confidence.url,sha256:record.confidence.subsetSha256},'','Retained raw-PDS confidence windows');
 await sourceCheck({name:record.readmeFile,url:record.url.replace(/\.TIF$/,'_README.TXT'),sha256:record.readmeSha256},'','Stereo source READMEs');
}
const science=await read('data/science/build-report.json'),radiation=await read('data/radiation/build-report.json');
const terrainBuild=await read('data/science/terrain-evidence-build.json');
const artifacts=[];
for(const [name,expected] of [['data/science/real-workspace.json',science.sha256],['data/radiation/radiation-evidence.json',radiation.bundleSha256]]){const actual=await digest(new URL(name,root));artifacts.push({path:name,expectedSha256:expected,sha256:actual,passed:actual===expected});}
for(const [name,expected] of [['data/engineering/nasa-reference-case.json',nasaVerification.specSha256],['data/raw/terrain-evidence/clone-windows.json',terrain.cloneManifestSha256],['data/science/terrain-acceptance-evidence.json',terrainBuild.bundleSha256],['docs/FARFIELD_EXTENSION.json',terrainBuild.farAuditSha256],['docs/STEREO_TERRAIN_COMPARISON.json',terrainBuild.stereoAuditSha256]]){const actual=await digest(new URL(name,root));artifacts.push({path:name,expectedSha256:expected,sha256:actual,passed:actual===expected});}
const geometry=await read('docs/EXPANDED_GEOMETRY_VALIDATION.json'),sampling=await read('docs/HORIZON_SAMPLING_VALIDATION.json'),angles=await read('data/validation/orientation-report.json');
const apparent=await read('docs/EXPANDED_ORIENTATION_VALIDATION.json');
const linkages=[
 {check:'expanded geometry uses the current scientific bundle',passed:geometry.scienceSha256===science.sha256&&geometry.passed},
 {check:'sampling audit uses the current scientific bundle',passed:sampling.scienceSha256===science.sha256&&Object.values(sampling.sites).every(s=>s.status==='within_diagnostic_threshold')},
 {check:'expanded geometry reference and validator identities',passed:geometry.referenceSha256===await digest(new URL('data/validation/expanded/reference-vectors.json',root))&&geometry.validatorSha256===await digest(new URL('scripts/validate-expanded-geometry.py',root))},
 {check:'sampling validator identity',passed:sampling.algorithmSha256===await digest(new URL('scripts/validate-horizon-sampling.py',root))},
 {check:'apparent orientation validator and case statuses',passed:angles.passed&&angles.algorithm.sha256===await digest(new URL('scripts/validate-orientation.py',root))},
 {check:'radiation preparer identity',passed:radiation.preparerSha256===await digest(new URL('scripts/prepare-radiation.py',root))},
 {check:'expanded apparent angles use the current scientific bundle',passed:apparent.scienceSha256===science.sha256&&apparent.passed&&apparent.caseCount===372},
 {check:'expanded apparent source/validator/projection identities',passed:apparent.referenceSha256===await digest(new URL('data/validation/expanded/orientation-references.json',root))&&apparent.validatorSha256===await digest(new URL('scripts/validate-expanded-orientation.py',root))&&apparent.projectionSha256===await digest(new URL('scripts/validate-expanded-geometry.py',root))},
 {check:'NASA reference source/spec/validator and 23 transcriptions',passed:nasaVerification.sourceSha256===nasa.source.sha256&&nasaVerification.validatorSha256===await digest(new URL('scripts/verify-nasa-reference.py',root))&&nasaVerification.status==='verified_transcription'&&nasaVerification.checks.length===23&&nasaReferenceAssessment().checks.every(c=>c.passed)},
 {check:'terrain evidence preparer and scientific bundle identities',passed:terrain.scienceSha256===science.sha256&&clones.scienceSha256===science.sha256&&far.scienceSha256===science.sha256&&stereo.scienceSha256===science.sha256&&terrain.preparerSha256===await digest(new URL('scripts/prepare-terrain-acceptance.py',root))},
 {check:'outer horizon validator, dense diagnostic and source linkage',passed:far.validatorSha256===await digest(new URL('scripts/extend-farfield-audit.py',root))&&terrain.farfieldMethod.validatorSha256===far.validatorSha256&&Object.values(far.sites).length===6&&Object.values(far.sites).every(s=>s.samplingComparison.withinDiagnosticThreshold&&s.totalSectors===720)},
 {check:'stereo validator and categorical confidence selection',passed:stereo.validatorSha256===await digest(new URL('scripts/compare-stereo-terrain.py',root))&&Object.values(stereo.sites).flat().every(s=>s.qualityMaskApplied&&!s.acceptedAbsoluteAccuracy)&&stereo.sources.every(s=>s.confidence.url.endsWith('_CONF.IMG'))},
 {check:'six complete 100-member ensembles and retained-window identities',passed:Object.keys(terrain.sites).length===6&&Object.entries(terrain.sites).every(([id,s])=>s.localCorrelatedTerrain.members===100&&s.localCorrelatedTerrain.retainedWindowHashes.every((h,i)=>h===clones.sites[id].sources[i]?.subsetSha256)&&new Set(s.localCorrelatedTerrain.sourceCloneNumbers).size===100)},
];
const engineering=engineeringEvidence(defaultLogistics,logisticsFields);
const report={schema:'sitelight-acceptance-source-audit-1',recordedUtc:new Date().toISOString(),localReviewDate:'2026-11-15',
 verifierSha256:await digest(fileURLToPath(import.meta.url)),sources:checks,artifactChecks:artifacts,linkages,
 summary:{sourceCount:checks.length,sourcesPassed:checks.filter(c=>c.passed).length,artifactChecksPassed:artifacts.filter(c=>c.passed).length,linkageChecksPassed:linkages.filter(c=>c.passed).length},
 expandedGeometry:{cases:geometry.caseCount,epochs:geometry.spec.epochsUtc.length,sites:Object.keys(geometry.sites).length,passed:geometry.passed,maxSunComponentErrorDeg:Math.max(...Object.values(geometry.sites).map(s=>s.checks.SUN.maxAngularComponentErrorDeg)),maxEarthComponentErrorDeg:Math.max(...Object.values(geometry.sites).map(s=>s.checks.EARTH.maxAngularComponentErrorDeg))},
 expandedApparentAngles:{cases:apparent.caseCount,epochs:apparent.spec.epochsUtc.length,sites:Object.keys(apparent.sites).length,passed:apparent.passed,maxComponentErrorDeg:Math.max(...Object.values(apparent.sites).flatMap(s=>Object.values(s.checks).map(c=>c.maxAngularComponentErrorDeg))),meaning:'Separate CN+S validation recipe, not production geometric NONE'},
 sampling:{sites:Object.keys(sampling.sites).length,maxDifferenceDeg:Math.max(...Object.values(sampling.sites).map(s=>s.maxDifferenceDeg)),diagnosticThresholdDeg:sampling.diagnosticThresholdDeg,globalHorizonValidated:false,correlatedUncertaintyValidated:false},
 engineering:{...engineering,selectedSiteIce:{status:'no applicable measurement loaded',defaultHypotheticalWtPercent:1,accepted:false}},
 terrainReference:{localCorrelatedSites:6,localCorrelatedMembers:Object.values(terrain.sites).reduce((n,s)=>n+s.localCorrelatedTerrain.members,0),stereoComparisons:Object.values(stereo.sites).flat().map(({product,coveredSamples,slopeSamples,heightRmseM})=>({product,coveredSamples,slopeSamples,heightRmseM})),outerExtentM:500000,maxDenseDifferenceDeg:Math.max(...Object.values(far.sites).map(s=>s.samplingComparison.maxDifferenceDeg)),beyondExtentExclusion:'Conditional on declared 20 km ceiling; not independent physical certification',globalOrientationCovarianceValidated:false},
 nasaReference:{status:nasaReferenceAssessment().status,verifiedPublishedValues:nasaVerification.checks.length,bookkeepingChecks:nasaReferenceAssessment().checks.length,calibratedLegacyLcssParameters:0,localIceIsMeasured:false,acceptedForVerdict:false},
 acceptance:{fullScientificAcceptance:false,engineeringCalibration:false,reason:'Published local correlated ensembles, wider nominal horizons, partial quality-filtered stereo comparisons and NASA architecture bookkeeping are implemented. Independent absolute terrain truth, full global/orientation covariance, physical hardware/process/operations calibration and selected-site extractable ice remain unavailable.'},
 sourceIntegrityPassed:[...checks,...artifacts,...linkages].every(c=>c.passed)};
await writeFile(new URL('docs/ACCEPTANCE_SOURCE_AUDIT.json',root),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({sourceIntegrityPassed:report.sourceIntegrityPassed,summary:report.summary,expandedGeometry:report.expandedGeometry,expandedApparentAngles:report.expandedApparentAngles,terrainReference:report.terrainReference,nasaReference:report.nasaReference,engineeringCoverage:engineering.coverage,acceptance:report.acceptance},null,2));
if(!report.sourceIntegrityPassed)process.exitCode=1;
