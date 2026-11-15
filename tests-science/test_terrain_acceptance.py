import math,unittest
from pathlib import Path
from importlib.util import spec_from_file_location,module_from_spec
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
def load(name,file):
    spec=spec_from_file_location(name,ROOT/'scripts'/file);m=module_from_spec(spec);spec.loader.exec_module(m);return m
ensemble=load('terrain_ensemble','prepare-terrain-acceptance.py');far=load('farfield_extension','extend-farfield-audit.py')
stereo=load('stereo_comparison','compare-stereo-terrain.py')
class TerrainAcceptanceFixtures(unittest.TestCase):
    def test_source_confidence_policy_rejects_unsupported_bilinear_neighbors_and_slope_supports(self):
        from rasterio import Affine
        a=np.full((4,4),12.);affine=Affine(5,0,0,0,-5,20)
        self.assertTrue(stereo.confidence_supported(a,affine,7.5,12.5))
        for invalid in [0,1,2,3,4,15,np.nan]:
            b=a.copy();b[2,2]=invalid
            self.assertFalse(stereo.confidence_supported(b,affine,7.5,12.5))
        self.assertFalse(stereo.confidence_supported(a,affine,-100,0))
        points=[{'nacHeightM':3.,'pgdaHeightM':1.,'nacSlopeDeg':5.,'pgdaSlopeDeg':2.,'slopeConfidenceAccepted':False}]
        result=stereo.statistics(points);self.assertEqual(result['heightRmseM'],2);self.assertEqual(result['slopeSamples'],0);self.assertIsNone(result['slopeRmseDeg'])
    def test_source_clone_plane_and_uniform_correlated_height_shift_preserve_slopes_and_detrended_roughness(self):
        axis=np.arange(-74,75)*5;a=np.tile(axis,(149,1))*math.tan(math.radians(10));r=ensemble.footprint(a,1)
        self.assertEqual(r['samples'],317);self.assertAlmostEqual(r['meanSlopeDeg'],10,places=10);self.assertAlmostEqual(r['maxSlopeDeg'],10,places=10);self.assertLess(r['roughnessM'],1e-10);self.assertAlmostEqual(r['usableAreaM2'],math.pi*10000)
        shifted=ensemble.footprint(a+1234,1)
        for key in ['meanSlopeDeg','maxSlopeDeg','roughnessM','usableAreaM2']:self.assertAlmostEqual(r[key],shifted[key],places=9)
    def test_ensemble_invalid_or_missing_footprints_remain_rejected(self):
        a=np.zeros((149,149));a[74,74]=np.nan
        with self.assertRaisesRegex(ValueError,'Missing'):ensemble.footprint(a,1)
        for kwargs in [{'radius':301},{'baseline':101},{'limit':46}]:
            with self.assertRaisesRegex(ValueError,'Unsupported'):ensemble.footprint(np.zeros((149,149)),1,**kwargs)
    def test_spherical_exclusion_matches_closed_form_horizon_dip_and_bounds_more_distant_points(self):
        r=1737400.;observer=r+6000
        self.assertAlmostEqual(far.outside_elevation_bound(observer,r,100),-math.degrees(math.acos(r/observer)),places=10)
        cutoff=500000;cap=r+20000;bound=far.outside_elevation_bound(observer,cap,cutoff)
        for theta in np.linspace(cutoff/r,math.pi,1000):
            point=np.array([cap*math.sin(theta),cap*math.cos(theta)]);angle=math.degrees(math.atan2(point[1]-observer,point[0]));self.assertLessEqual(angle,bound+1e-10)
if __name__=='__main__':unittest.main()
