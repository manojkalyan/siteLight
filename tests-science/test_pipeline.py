import math
import unittest
import os
os.environ['OPENBLAS_NUM_THREADS']='1'
import numpy as np
from affine import Affine
from scripts.science_pipeline import basis,angles,bilinear,horizon_from_dem,combine_horizons,RADIUS

class GeometryTests(unittest.TestCase):
    def test_batched_half_degree_horizon_matches_integer_azimuths_and_preserves_sensitivity(self):
        a=np.zeros((400,400),dtype=np.float32);sigma=np.ones_like(a)
        affine=Affine(100,0,-20000,0,-100,32000)
        crs=f'+proj=stere +lat_0=-90 +lon_0=0 +a={RADIUS} +b={RADIUS} +units=m +no_defs'
        coarse=horizon_from_dem(a,affine,crs,-89.6,0,0,2,7000,25,height_rms=sigma,observer_rms=1)
        fine=horizon_from_dem(a,affine,crs,-89.6,0,0,2,7000,25,height_rms=sigma,observer_rms=1,azimuth_step=.5)
        self.assertEqual(len(fine['elevationDeg']),720);self.assertEqual(fine['azimuthStepDeg'],.5)
        self.assertEqual(fine['elevationDeg'][::2],coarse['elevationDeg'])
        self.assertEqual(len(fine['sensitivity']['lowerDeg']),720)
        with self.assertRaisesRegex(ValueError,'Mismatched'):combine_horizons(coarse,fine)
    def test_rms_sensitivity_encloses_nominal_without_asserting_statistical_confidence(self):
        a=np.zeros((400,400),dtype=np.float32);sigma=np.ones_like(a)
        affine=Affine(100,0,-20000,0,-100,32000)
        crs=f'+proj=stere +lat_0=-90 +lon_0=0 +a={RADIUS} +b={RADIUS} +units=m +no_defs'
        h=horizon_from_dem(a,affine,crs,-89.6,0,0,2,7000,100,height_rms=sigma,observer_rms=1)
        self.assertTrue(all(lo<=mid<=hi for lo,mid,hi in zip(h['sensitivity']['lowerDeg'],h['elevationDeg'],h['sensitivity']['upperDeg'])))
        self.assertIn('not statistical confidence',h['sensitivity']['interpretation'])

    def test_multiscale_horizon_keeps_distant_obstruction_and_missing_domain(self):
        near={'elevationDeg':[1.]*360,'rayCoverage':[1.]*360,'distanceAtMaxM':[100.]*360,'extentM':7000,'radialStepM':5}
        far={'elevationDeg':[-1.]*360,'rayCoverage':[1.]*360,'distanceAtMaxM':[20000.]*360,'extentM':125000,'radialStepM':80}
        far['elevationDeg'][0]=3;far['elevationDeg'][1]=None;far['rayCoverage'][1]=.9
        combined=combine_horizons(near,far)
        self.assertEqual(combined['elevationDeg'][0],3);self.assertEqual(combined['distanceAtMaxM'][0],20000)
        self.assertIsNone(combined['elevationDeg'][1]);self.assertEqual(combined['elevationDeg'][2],1)
        self.assertFalse(combined['farFieldComplete']);self.assertTrue(combined['farFieldAssessed'])
    def test_local_axes_are_orthonormal_and_correctly_oriented(self):
        for lat,lon in [(-89.4,129.2),(-88.5,-87.2),(20.19,30.77)]:
            enu=basis(lat,lon)
            np.testing.assert_allclose(enu@enu.T,np.eye(3),atol=1e-14)
            az,el=angles(enu[0],enu);self.assertAlmostEqual(float(az),90);self.assertAlmostEqual(float(el),0)
            az,el=angles(enu[1],enu);self.assertAlmostEqual(float(az)%360,0);self.assertAlmostEqual(float(el),0)
            _,el=angles(enu[2],enu);self.assertAlmostEqual(float(el),90)

    def test_bilinear_uses_pixel_centers_and_preserves_no_data(self):
        a=np.array([[0.,2.,4.],[3.,5.,7.],[6.,8.,10.]])
        affine=Affine(5,0,100,0,-5,200)
        self.assertAlmostEqual(float(bilinear(a,affine,102.5,197.5)),0)
        self.assertAlmostEqual(float(bilinear(a,affine,105,195)),2.5)
        self.assertTrue(math.isnan(float(bilinear(a,affine,90,195))))
        a[0,1]=np.nan
        self.assertTrue(math.isnan(float(bilinear(a,affine,105,195))))

    def test_curved_sphere_horizon_matches_analytic_dip_and_missing_rays_stay_unknown(self):
        a=np.zeros((3200,3200),dtype=np.float32)
        affine=Affine(5,0,-8000,0,-5,20000)
        crs=f'+proj=stere +lat_0=-90 +lon_0=0 +a={RADIUS} +b={RADIUS} +units=m +no_defs'
        h=horizon_from_dem(a,affine,crs,-89.6,0,0,2,7000,25)
        expected=-math.degrees(math.acos(RADIUS/(RADIUS+2)))
        self.assertTrue(all(v==1 for v in h['rayCoverage']))
        self.assertLess(max(abs(v-expected) for v in h['elevationDeg']),1e-5)
        # A broad no-data strip in the northward rays must not become a flat horizon.
        a[1100:1300,1500:1700]=np.nan
        missing=horizon_from_dem(a,affine,crs,-89.6,0,0,2,7000,25)
        self.assertTrue(any(v is None for v in missing['elevationDeg']))
        self.assertTrue(any(v is not None for v in missing['elevationDeg']))

if __name__=='__main__':unittest.main()
