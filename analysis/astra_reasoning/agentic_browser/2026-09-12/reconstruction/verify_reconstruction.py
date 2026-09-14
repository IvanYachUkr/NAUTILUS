"""Verify exported pin transforms, original coordinates, and round coverage (stdlib only)."""
import argparse
import hashlib
import json
import math
import statistics
from pathlib import Path

HERE = Path(__file__).resolve().parent

def distance(a, b):
    la, lo, lb, lob = map(math.radians, (*a, *b))
    h = math.sin((lb-la)/2)**2 + math.cos(la)*math.cos(lb)*math.sin((lob-lo)/2)**2
    return 6371000 * 2 * math.atan2(math.sqrt(h), math.sqrt(max(0, 1-h)))

def project(lat, lon):
    return (lon+180)/360, (1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2

def unproject(x, y):
    return math.degrees(math.atan(math.sinh(math.pi*(1-2*y)))), x*360-180

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--repo-root', type=Path, help='Also verify all original screenshot hashes in a NAUTILUS checkout')
    args = parser.parse_args()
    rows = json.loads((HERE/'all_75_predictions.json').read_text(encoding='utf-8'))
    seq = json.loads((HERE/'call_sequences.json').read_text(encoding='utf-8'))
    validation = json.loads((HERE/'validation.json').read_text(encoding='utf-8'))
    originals = json.loads((HERE.parent/'coordinate_evidence.json').read_text(encoding='utf-8'))
    key = lambda r: (r['run'], r['tier'], r['round'])
    expected = {(run,tier,n) for run in (1,2,3) for tier,total in [('easy',8),('medium',9),('hard',8)] for n in range(1,total+1)}
    assert len(rows) == len(seq) == 75
    assert {key(r) for r in rows} == {key(r) for r in seq} == expected
    original_map = {key(r):r for r in originals}
    assert len(original_map) == 11
    for r in rows:
        p = r['predicted_latitude'], r['predicted_longitude']
        assert -90 <= p[0] <= 90 and -180 <= p[1] <= 180 and r['notes']
        if key(r) in original_map:
            original = original_map[key(r)]['prediction']
            assert p == (original['lat'], original['lng'])
            assert r['coordinate_status'] == 'original_recorded_coordinate'
        else:
            assert r['coordinate_status'] == 'reconstructed_from_submitted_pin_screenshot'
            q = r['reconstruction']; anchor = q['map_anchor']
            x, y = project(anchor['latitude'], anchor['longitude'])
            scale = 256 * 2 ** q['inferred_web_mercator_zoom']
            dx, dy = [q['red_template_top_left_xy'][i]-q['flag_template_top_left_xy'][i]+q['relative_anchor_correction_xy'][i] for i in (0,1)]
            derived = unproject(x+dx/scale, y+dy/scale)
            assert distance(derived, p) < 0.001
            error = distance((anchor['latitude'], anchor['longitude']), p)
            assert abs(error-r['reported_distance_m']) <= r['estimated_coordinate_uncertainty_m'] + q['reported_distance_rounding_halfwidth_m']
            assert min(q['red_template_score'],q['flag_template_score']) > .9
        source = r['result_screenshot']
        image = HERE.parent/source if source.startswith('reconstruction/') else args.repo_root/source if args.repo_root else None
        if image is not None:
            assert hashlib.sha256(image.read_bytes()).hexdigest() == r['screenshot_sha256'], source
    assert len(validation['controls']) == 10
    assert max(c['error_in_pixels'] for c in validation['controls']) < 1
    control_keys = {key(c) for c in validation['controls']}
    controls = [r for r in rows if key(r) in control_keys]
    offsets = {}
    for r in controls:
        q = r['reconstruction']; a = q['map_anchor']; scale = 256*2**q['inferred_web_mercator_zoom']
        ax, ay = project(a['latitude'], a['longitude']); px, py = project(r['predicted_latitude'], r['predicted_longitude'])
        offsets[key(r)] = [(v-u)*scale-q['red_template_top_left_xy'][i]+q['flag_template_top_left_xy'][i] for i,(u,v) in enumerate([(ax,px),(ay,py)])]
    for r in controls:
        q = r['reconstruction']; a = q['map_anchor']; scale = 256*2**q['inferred_web_mercator_zoom']
        off = [statistics.median(v[i] for k,v in offsets.items() if k != key(r)) for i in (0,1)]
        ax, ay = project(a['latitude'], a['longitude'])
        dx, dy = [q['red_template_top_left_xy'][i]-q['flag_template_top_left_xy'][i]+off[i] for i in (0,1)]
        held_out = unproject(ax+dx/scale, ay+dy/scale)
        error = distance(held_out, (r['predicted_latitude'],r['predicted_longitude']))
        reported_check = next(c for c in validation['controls'] if key(c) == key(r))
        assert abs(error-reported_check['held_out_coordinate_error_m']) < .001
        assert error/q['metres_per_pixel'] < 1
    assert all(s['calls'] and s['submission']['timestamp'] for s in seq)
    print('PASS: 75 unique scored rounds, 11 unchanged originals, 64 reproducible pin transforms, 75 call sequences, 10 held-out controls within one map pixel.')

if __name__ == '__main__':
    main()
