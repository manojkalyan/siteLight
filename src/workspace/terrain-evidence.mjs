import {interpolateHorizon} from './real-data.mjs';
import {escapeHtml as esc} from './charts.mjs';
export function reviewedSite(site,science,evidence){
 const entry=evidence?.sites?.[site.id];
 if(evidence?.schema!=='sitelight-terrain-acceptance-evidence-1'||evidence.scienceVersion!==science?.version||evidence.sourceAlgorithmSha256!==science?.algorithm?.sha256||!Array.isArray(evidence.sourceInputs)||evidence.sourceInputs.length!==science?.inputs?.length||!evidence.sourceInputs.every(s=>science.inputs.some(t=>s.name===t.name&&s.sha256===t.sha256))||!entry||!['lat','lon','altKm'].every(k=>entry.coordinates[k]===site[k]))return null;
 return entry;
}
export function augmentRealProvider(provider,site,science,evidence){
 const review=reviewedSite(site,science,evidence);if(!review||!provider.terrain)return provider;
 const far=review.farfieldExtension,annulus=far.annulusHorizonDeg,old=provider.terrain.horizon;
 if(!Array.isArray(annulus)||annulus.length!==720||annulus.some(x=>!Number.isFinite(x)||Math.abs(x)>90)||old.elevationDeg.length!==720||far.samplingComparison?.withinDiagnosticThreshold!==true)throw Error('Extended horizon has not passed its declared data/sampling checks.');
 const maximum=a=>a.map((v,i)=>v===null?null:Math.max(v,annulus[i]));
 const combined=maximum(old.elevationDeg),sensitivity=old.sensitivity?{...old.sensitivity,lowerDeg:maximum(old.sensitivity.lowerDeg),upperDeg:maximum(old.sensitivity.upperDeg),domain:'Original 0-125 km source-RMS perturbations; 125-500 km annulus held at nominal heights',fullDomainCovariance:false}:null;
 const horizon={...old,elevationDeg:combined,extentM:500000,radialStepM:null,samplingBands:[...old.samplingBands,{startM:125000,endM:500000,stepM:120,pixelSpacingM:240}],
  distanceAtMaxM:combined.map((v,i)=>annulus[i]>old.elevationDeg[i]?(far.annulusDistanceAtMaxM?.[i]??null):old.distanceAtMaxM[i]),sensitivity,
  globalConditionalExclusion:{heightCeilingM:20000,ceilingIsCertifiedPhysicalMaximum:false,upperBeyond500kmDeg:far.outsideConditionalUpperDeg,sectorsExcluded:far.sectorsExcludedUnderHeightCeiling,totalSectors:720},
  farFieldComplete:false,uncertaintyPropagated:false,limitations:['Nominal extent extended to 500 km using 240 m outer terrain; finite sampling can miss unresolved peaks','Beyond-extent exclusion is conditional on the declared 20 km height ceiling, not a certified physical bound','Source-RMS perturbations cover 0-125 km only; outer terrain is held fixed. Correlated footprint evidence is separate from global/orientation uncertainty']};
 return {...provider,terrain:{...provider.terrain,horizon},terrainReview:review,terrainReviewVersion:evidence.schema,
  horizon:az=>interpolateHorizon(combined,az),horizonSensitivity:sensitivity?az=>({lower:interpolateHorizon(sensitivity.lowerDeg,az),upper:interpolateHorizon(sensitivity.upperDeg,az)}):null,
  horizonSensitivityMethod:'Componentwise one-source-RMS perturbations over 0-125 km with the 125-500 km nominal annulus held fixed',
  horizonSensitivityInterpretation:'Conditional partial-domain sensitivity only, not confidence bounds. Outer-domain height covariance, orientation errors and unresolved terrain are unassessed.',
  horizonDescription:`NASA ${site.tile} 5 m local / 80 m polar / 240 m outer terrain; 500 km nominal rays; ${site.observerHeightM} m observer`,
  qualificationReason:'The nominal horizon extends to 500 km. Beyond-extent exclusion depends on a declared 20 km height ceiling. Subpixel terrain, outer-domain/correlated orientation uncertainty and independent absolute accuracy remain unassessed; partial-domain source-RMS sensitivity is not a confidence bound.',
  classification:'REAL DEM + GEOMETRIC EPHEMERIS; BOUNDED 500 KM NOMINAL MODEL',acceptance:'bounded_500km_nominal; conditional_far_exclusion; partial_uncertainty; physical_acceptance_open',
  metadata:[...provider.metadata,{kind:'Sourced 125-500 km nominal horizon extension',...evidence.farfieldMethod.source,extentM:500000,sourcePixelM:240,preparerSha256:evidence.preparerSha256,cloneManifestSha256:evidence.cloneManifestSha256}]};
}
export function terrainEvidenceSummary(provider,config){
 const r=provider?.terrainReview;if(!r)return null;
 const settings=r.localCorrelatedTerrain.settings;
 return {...structuredClone(r),ensembleMatchesCurrentFootprint:!!settings&&config.radius===settings.radiusM&&config.baseline===settings.baselineM&&config.limit===settings.slopeLimitDeg,acceptedForVerdict:false};
}
const number=(n,d=2)=>Number.isFinite(n)?n.toFixed(d):'unassessed';
export function terrainEvidenceMarkup(state,provider){
 if(state.mode!=='real')return '';
 const r=terrainEvidenceSummary(provider,state.terrain);if(!r)return '<section class="card wide" id="terrain-reference-review"><h2>Additional terrain reference evidence</h2><p>This point has no matching prepared clone/stereo/outer-horizon review. Another point’s evidence is not transferred.</p></section>';
 const e=r.localCorrelatedTerrain,f=r.farfieldExtension;
 return `<section class="card wide" id="terrain-reference-review"><h2>Terrain evidence and correlated errors</h2><p>Reference checks retain their actual spatial coverage and assumptions.</p><h3>Published local terrain ensemble</h3><p>${e.members} NASA correlated terrain realizations. ${e.settings?`${e.settings.radiusM} m radius, ${e.settings.baselineM} m slope baseline, ${e.settings.slopeLimitDeg}° slope limit.`:''} ${r.ensembleMatchesCurrentFootprint?'Matches the selected footprint.':'Reference footprint only; the current settings differ or an ensemble is unavailable.'}</p>${e.metrics?Object.entries(e.metrics).map(([k,q])=>`<div class="readout"><span>${esc({meanSlopeDeg:'Mean slope · degrees',maxSlopeDeg:'Maximum slope · degrees',p95SlopeDeg:'95th percentile slope · degrees',roughnessM:'Detrended roughness · m',usableAreaM2:'Area within reference slope limit · m²'}[k])}</span><strong>${number(q.p2_5)} – ${number(q.p97_5)}</strong></div>`).join(''):''}<p class="field-note">${esc(e.interpretation||e.reason)} Ranges above are the ensemble’s 2.5th–97.5th percentiles, not guaranteed confidence bounds.</p><h3 class="section-gap">Image-stereo comparisons</h3>${r.stereoComparisons.length?r.stereoComparisons.map(s=>`<p>${esc(s.product)}: ${s.coveredSamples}/${s.expectedSamples} footprint samples; height RMSE ${number(s.heightRmseM)} m, mean difference ${number(s.meanHeightDifferenceM)} m; slope RMSE ${number(s.slopeRmseDeg)}°.</p>`).join(''):'<p>No matching stereo coverage in the compared products at this exact point.</p>'}<p class="field-note">Camera-derived terrain has shared LOLA geodetic control. Comparisons require source-confidence classes 10-14 at every interpolation support. This filter does not remove all artifacts; partial coverage and shared control prevent independent absolute certification.</p><h3 class="section-gap">Extended nominal horizon</h3><p>500 km rays; 240 m pixels beyond 125 km. The added annulus raises ${f.raisedSectors}/720 horizon sectors, by at most ${number(f.maxIncreaseDeg,3)}°. The nominal evaluator includes these obstructions.</p><p class="field-note">${f.sectorsExcludedUnderHeightCeiling}/720 directions exclude terrain beyond 500 km only under the declared 20 km height ceiling. That ceiling is not independently certified here. Partial source-RMS sensitivity holds the outer annulus fixed; full global/orientation covariance remains unassessed.</p></section>`;
}
