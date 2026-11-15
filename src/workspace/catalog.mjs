// Regional reference points retained from the user's design, not certified landing coordinates.
const source='docs/reference/user-workspace-design.html';
export const catalog=[
 {id:'shackleton',name:'Shackleton region',lat:-89.45,lon:129.2,polar:true},
 {id:'malapert',name:'Malapert region',lat:-86,lon:0,polar:true},
 {id:'gerlache',name:'de Gerlache region',lat:-88.5,lon:-87.2,polar:true},
 {id:'connector',name:'Connecting ridge region',lat:-89.4,lon:-137.3,polar:true},
 {id:'nobile',name:'Nobile region',lat:-85.4,lon:53.4,polar:true},
 {id:'apollo',name:'Taurus–Littrow reference',lat:20.19,lon:30.77,polar:false},
].map(s=>({...s,altKm:0,source,coordinateStatus:'User-supplied regional reference; exact mission coordinate unverified',frame:'Horizons lunar mean-Earth frame; altitude above 1737.4 km reference sphere'}));
export const defaultRequirements={duration:168,minSun:.4,minEarth:.3,minOverlap:.2,minElevation:2,maxDark:null,maxEarth:null};
export const extensions=[
 {id:'logistics',name:'Life-support budget exploration',status:'Implemented · explicit assumptions',text:'Four-crew, 730-day water-logistics subtotal with mass contributors, independent hypothetical A/B ice, editable architecture and budget, and tested concentration proposals. Engineering review remains pending; excluded from environmental verdicts.',source:'docs/LCSS_MODEL.md'},
 {id:'terrain',name:'Terrain screening',status:'Real DEM · six study points',text:'Scale-defined slope, detrended roughness, footprint coverage, and published height/slope RMS context from NASA PGDA grids. A compatible polar DEM extends horizons to 125 km; one-source-RMS sensitivity is available. Global horizon completeness and correlated uncertainty remain pending.',source:'https://pgda.gsfc.nasa.gov/products/78'},
 {id:'gaps',name:'Continuous operating gaps',status:'Implemented',text:'Timestamped darkness, solar-criterion shortfall, and Earth-invisibility intervals. Optional maximum-gap requirements remain separate from cumulative fractions.',source:'https://ssd.jpl.nasa.gov/horizons/manual.html'},
 {id:'thermal',name:'Surface-temperature context',status:'Historical Diviner observations',text:'Two southern-summer 240 m cumulative bolometric-brightness-temperature bins: 00:00–00:15 and 12:00–12:15 local time, observed 2009–2019. Matching bins only; no missing-bin fill or mission forecast.',source:'https://pds-geosciences.wustl.edu/missions/lro/diviner.htm'},
 {id:'paths',name:'Terrain connectivity',status:'Implemented: sampled graph',text:'Footprint-center to grid-direction paths filter cells and edges by slope, preserve gaps and prohibit diagonal corner cuts. Vehicle/energy/boulder and safe-return feasibility remain unassessed.',source:'https://pgda.gsfc.nasa.gov/products/78'},
 {id:'dust',name:'Dust / radiator sensitivity',status:'Implemented: optical balance exploration',text:'Clean-versus-dust-covered radiator temperatures and heat margins under independent A/B device assumptions. Three laboratory simulant property presets; rule-of-mixtures approximation is not conservative. Layer conduction, transients and hardware acceptance remain unassessed.',source:'docs/DUST_THERMAL_MODEL.md'},
 {id:'plume',name:'Conditional ejecta trajectories',status:'Implemented: post-acceleration ballistics',text:'Assumed single-grain spherical-vacuum trajectories and hypothetical asset-envelope crossings, times and kinetic energy. Engine-driven erosion, launch distributions, real terrain, deposition and damage remain unassessed.',source:'docs/PLUME_EJECTA_MODEL.md'},
 {id:'radiation',name:'Radiation observations and primary protons',status:'Implemented: orbital context / CSDA exploration',text:'Historical CRaTER silicon dose rates with original gaps/coverage, plus an independent NIST normal-slab primary-proton range/residual-energy and panel-mass comparison. Surface/human dose, spectra and secondary transport remain unassessed.',source:'docs/RADIATION_MODEL.md'},
 {id:'rescue',name:'Conditional rescue planning',status:'Implemented: hypothetical response timing',text:'Declare an asset for the selected point/start; compare mobilization, outbound/handling/return times with assumed endurance and completion limits. Uses bounded sampled terrain paths; energy, medical, communication and operational rescue feasibility remain unassessed.',source:'docs/RESCUE_PLANNING.md'},
];
