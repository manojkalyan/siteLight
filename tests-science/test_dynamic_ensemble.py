import unittest,math,json
from pathlib import Path
from importlib.util import spec_from_file_location,module_from_spec
ROOT=Path(__file__).resolve().parents[1]
spec=spec_from_file_location('dynamic_ensemble',ROOT/'scripts/evaluate-terrain-ensemble.py');module=module_from_spec(spec);spec.loader.exec_module(module)
class DynamicEnsembleTests(unittest.TestCase):
    def test_supported_numeric_settings_and_invalid_values(self):
        self.assertEqual(module.validate_settings(20,100,0),{'radiusM':20,'baselineM':100,'slopeLimitDeg':0})
        for values in [(19,20,12),(301,20,12),(100,4,12),(100,101,12),(100,20,-1),(100,20,46),(True,20,12),(float('nan'),20,12),(100,'20',12)]:
            with self.assertRaises(ValueError):module.validate_settings(*values)
    def test_empirical_percentiles_match_known_sequence_and_reject_missing_members(self):
        rows=[{k:float(i) for k in module.METRICS} for i in range(100)]
        result=module.summarize(rows)
        self.assertAlmostEqual(result['meanSlopeDeg']['p2_5'],2.475);self.assertEqual(result['meanSlopeDeg']['median'],49.5);self.assertAlmostEqual(result['meanSlopeDeg']['p97_5'],96.525)
        with self.assertRaises(ValueError):module.summarize(rows[:-1])
        rows[0]['roughnessM']=float('nan')
        with self.assertRaises(ValueError):module.summarize(rows)
    def test_real_default_matches_retained_published_reference_and_new_radius_is_recomputed(self):
        reference=json.loads((ROOT/'data/science/terrain-acceptance-evidence.json').read_text())['sites']['real-nobile']['localCorrelatedTerrain']
        default=module.evaluate('real-nobile',100,20,12)
        self.assertEqual(default['members'],100);self.assertEqual(default['metrics'],reference['metrics']);self.assertFalse(default['acceptedForVerdict']);self.assertFalse(default['fullDomainCovariance'])
        changed=module.evaluate('real-nobile',150,30,10)
        self.assertNotEqual(changed['metrics'],default['metrics']);self.assertEqual(changed['settings'],{'radiusM':150,'baselineM':30,'slopeLimitDeg':10});self.assertLessEqual(changed['metrics']['usableAreaM2']['p97_5'],math.pi*150**2)
        self.assertEqual(changed['source']['retainedWindowHashes'],default['source']['retainedWindowHashes'])
    def test_unsupported_point_never_borrows_a_catalog_ensemble(self):
        with self.assertRaises(ValueError):module.evaluate('custom-point',100,20,12)
if __name__=='__main__':unittest.main()
