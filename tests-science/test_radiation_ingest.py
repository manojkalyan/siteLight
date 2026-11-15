import importlib.util
from pathlib import Path
import unittest

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('radiation_prepare',ROOT/'scripts/prepare-radiation.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)

def table(values,coverage='100%',date='2012-12-31',doy='2012366'):
    cells=[date,doy]+values+[coverage,'']
    headers=['Date','Year-DOY']+[f'D{i} Dose Rate (mGy Si d-1)' for i in range(1,7)]+[f'D{i} Corrected Dose Rate (mGy Si d-1)' for i in range(1,7)]+['Day Coverage','']
    return 'mGy Lunar Shadowing<table><tr>'+''.join('<th>'+v+'</th>' for v in headers)+'</tr><tr>'+''.join('<td>'+v+'</td>' for v in cells)+'</tr></table>'

class RadiationIngestTests(unittest.TestCase):
    def test_real_zero_partial_coverage_and_source_flags_are_distinct(self):
        row=module.parse_observations(table(['0']+['1']*11,'18%'))[0]
        self.assertEqual(row['measuredMgySiDay'][0],0);self.assertEqual(row['coveragePercent'],18)
        row=module.parse_observations(table(['AB']*12,'AB'))[0]
        self.assertIsNone(row['coveragePercent']);self.assertEqual(row['coverageFlag'],'AB');self.assertEqual(row['sourceRateFlags'],['AB']*12);self.assertEqual(row['measuredMgySiDay'],[None]*6)
    def test_changed_headers_invalid_coverage_doy_and_numeric_values_reject(self):
        for text in [table(['1']*12).replace('mGy','mSv'),table(['1']*12,'101%'),table(['1']*12,doy='2012365'),table(['-1']+['1']*11),table(['1']*12,'unknown')]:
            with self.assertRaises(ValueError): module.parse_observations(text)

if __name__=='__main__': unittest.main()
