import unittest
import numpy as np
from importlib.util import spec_from_file_location,module_from_spec
from pathlib import Path
spec=spec_from_file_location('expanded_geometry_reference',Path(__file__).resolve().parents[1]/'scripts/validate-expanded-geometry.py')
reference=module_from_spec(spec)
spec.loader.exec_module(reference)
local_angles=reference.local_angles

class ExpandedReferenceProjectionTests(unittest.TestCase):
    def test_independent_enu_projection_at_equator_and_east_longitude(self):
        for vector,lat,lon,expected in [([0,1,0],0,0,(90,0)),([0,0,1],0,0,(0,0)),([1,0,1],0,0,(0,45)),([-1,0,0],0,90,(90,0)),([0,1,1],0,90,(0,45))]:
            actual=local_angles(np.array(vector,dtype=float),lat,lon)
            self.assertAlmostEqual(actual[0],expected[0],places=10)
            self.assertAlmostEqual(actual[1],expected[1],places=10)

    def test_south_polar_axes_with_a_known_negative_elevation_and_wrap(self):
        # At lat=-90, lon=0: east=+Y, north=+X and up=-Z.
        az,el=local_angles(np.array([1.,-1.,1.]),-90,0)
        self.assertAlmostEqual(az,315,places=10)
        self.assertAlmostEqual(el,-35.264389682754654,places=10)

if __name__=='__main__':unittest.main()
