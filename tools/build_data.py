#!/usr/bin/env python3
"""Rebuild data_embed.js from the raw sources.

Inputs (repo-relative):
  data/parcels_raw.geojson  - parcels scraped from MaromGIS layer yiftah:yiftah_nehasim
                              (raw GeoServer GetFeatureInfo features, MultiPolygon, WGS84)
  data/roads_osm.geojson    - roads/paths exported from OpenStreetMap (LineString)
  data/extra_parcels/*.geojson (optional) - later scrapes to merge in (deduped by ORIG_ID)

Output:
  data_embed.js  - defines YIFTAH_DATA, YIFTAH_ROADS, YIFTAH_PATHS (loaded by index.html)

Usage:  python3 tools/build_data.py
"""
import json, glob, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)

# Public buildings shown as green "anchors" (always labelled). Keyed by parcel NUM.
# Verified against the user's aerial screenshots of the Marom system.
ANCHORS_BY_NUM = {
    '220': 'חדר אוכל',
    '218': 'אולם ספורט',
    '219': 'מגרשי ספורט',
    '217': 'מועדון האסם',
    '199': 'מזכירות',
    '198': 'ספרייה',
    '195': 'מועדון לחבר',
    '131': 'בית אריזה',
}
ANCHORS_BY_NAME = {'בריכה': 'בריכה'}   # the pool polygon has no NUM

# Names the user corrected by hand, keyed by parcel NUM. Applied after the Marom DAYAR value.
NAME_OVERRIDES_BY_NUM = {
    '129': 'מאפייה',     # Marom says "מבני משק"; it's the bakery (מאפיה אדו on the aerial)
}

# Roads: clip to this lng/lat box (includes the outer ring road around the orchards)
BX = (35.5420, 35.5610); BY = (33.1235, 33.1340)
PATH_KINDS = {'footway', 'path', 'pedestrian', 'steps', 'cycleway'}   # drawn dashed
# everything else (primary, tertiary, unclassified, residential, service, track) = road


def ring_centroid(coords):
    a = cx = cy = 0.0
    n = len(coords)
    for i in range(n):
        x0, y0 = coords[i]; x1, y1 = coords[(i + 1) % n]
        cr = x0 * y1 - x1 * y0
        a += cr; cx += (x0 + x1) * cr; cy += (y0 + y1) * cr
    if abs(a) < 1e-12:
        return [sum(c[0] for c in coords) / n, sum(c[1] for c in coords) / n]
    a *= 0.5
    return [cx / (6 * a), cy / (6 * a)]


def ring_area(ring):
    s = 0
    for i in range(len(ring)):
        x0, y0 = ring[i]; x1, y1 = ring[(i + 1) % len(ring)]
        s += x0 * y1 - x1 * y0
    return abs(s)


def load_parcels():
    files = [P('data', 'parcels_raw.geojson')] + sorted(glob.glob(P('data', 'extra_parcels', '*.geojson')))
    by_id = {}
    for fn in files:
        for f in json.load(open(fn, encoding='utf8'))['features']:
            oid = f['properties'].get('ORIG_ID')
            if oid is None:
                oid = f.get('id')
            by_id.setdefault(oid, f)          # first one wins
    return list(by_id.values())


def build_parcels():
    out = []
    for f in load_parcels():
        g = f['geometry']; p = f['properties']
        if not g:
            continue
        best = max((poly[0] for poly in g['coordinates']), key=ring_area)
        c = ring_centroid(best)
        num = (p.get('NUM') or '').strip()
        name = (p.get('DAYAR') or '').strip()
        name = NAME_OVERRIDES_BY_NUM.get(num, name)
        anchor = ANCHORS_BY_NUM.get(num) or ANCHORS_BY_NAME.get(name)
        out.append({
            'id': p.get('ORIG_ID') if p.get('ORIG_ID') is not None else f.get('id'),
            'num': num,
            'name': name,
            'owner': (p.get('BAALIM') or '').strip(),
            'kind': (p.get('MAKOR') or '').strip(),      # 'מגרש' (lot) or 'מבנה' (building)
            'c': [round(c[0], 6), round(c[1], 6)],
            'geom': g['coordinates'],
            'anchor': anchor,
        })
    return out


def build_roads():
    roads, paths = [], []
    for f in json.load(open(P('data', 'roads_osm.geojson'), encoding='utf8'))['features']:
        hw = f['properties']['highway']
        cur, runs = [], []
        for x, y in f['geometry']['coordinates']:
            if BX[0] <= x <= BX[1] and BY[0] <= y <= BY[1]:
                cur.append([x, y])
            else:
                if len(cur) >= 2: runs.append(cur)
                cur = []
        if len(cur) >= 2: runs.append(cur)
        for run in runs:
            line = [[round(x, 6), round(y, 6)] for x, y in run]
            (paths if hw in PATH_KINDS else roads).append(line)
    return roads, paths


def main():
    parcels = build_parcels()
    roads, paths = build_roads()
    js = 'const YIFTAH_DATA=' + json.dumps(parcels, ensure_ascii=False, separators=(',', ':')) + ';\n'
    js += 'const YIFTAH_ROADS=' + json.dumps(roads, separators=(',', ':')) + ';\n'
    js += 'const YIFTAH_PATHS=' + json.dumps(paths, separators=(',', ':')) + ';\n'
    open(P('data_embed.js'), 'w', encoding='utf8').write(js)
    print(f'parcels={len(parcels)} anchors={sum(1 for x in parcels if x["anchor"])} '
          f'roads={len(roads)} paths={len(paths)} -> data_embed.js ({len(js)//1024} KB)')


if __name__ == '__main__':
    main()
