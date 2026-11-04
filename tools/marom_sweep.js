// Yiftah — sweep MaromGIS for parcels we don't have yet.
// HOW TO USE: open the Yiftah map in Marom (maps.marom.mobi, map 538), zoom so
// about 25–30 houses fill the screen, press F12 → Console, paste this whole
// file and press Enter. It takes a minute or two and downloads one file.
// Put that file in data/extra_parcels/ and run: python3 tools/build_data.py
//
// It walks a grid over the whole kibbutz (plus a margin) with the same request
// the old manual script used, ~0.7 s apart, so the load on Marom's server stays low.
// The map on screen doesn't move. Private fields (tax account, meters, notes)
// are dropped in the browser, before the file is saved.
(async () => {
  const KNOWN = new Set([1,2,3,5,6,7,9,10,11,12,13,14,15,16,17,18,19,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,43,44,45,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,83,84,85,86,87,88,89,104,105,106,113,114,115,116,117,118,119,120,121,122,123,124,126,127,128,129,130,131,132,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,192,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255,256,257,258,259,260,261,262,263,264,265,266,267,268,269,270,271,272,273,274,275,276,277,278,279,280,281,282,283,284,285,286,287,288,289,290,291,292,293,294,295,296,297,298,299,304,305,306,307,311,312,313,314,315,316,317,318,319,320,321,322]);
  const KEEP = ['ORIG_ID','NUM','DAYAR','BAALIM','MAKOR','GUSH','HELKA'];
  const EXT = {w:35.5467-0.0012, e:35.5549+0.0012, s:33.1260-0.0010, n:33.1315+0.0010};
  const typeName = 'yiftah:yiftah_nehasim', base = '/api/wms-proxy/wms?';
  if (typeof map === 'undefined' || !map.getBounds) { console.error('✖ Open the Yiftah map in Marom first.'); return; }

  const b0 = map.getBounds();
  const vw = b0.getEast() - b0.getWest(), vh = b0.getNorth() - b0.getSouth();
  if (vw > 0.006) { console.error('✖ Zoom in a bit more (about 25–30 houses on screen), then paste again.'); return; }
  const step = {x: vw * 0.4, y: vh * 0.4};
  const centres = [];
  for (let lat = EXT.s; lat <= EXT.n + 1e-9; lat += step.y)
    for (let lng = EXT.w; lng <= EXT.e + 1e-9; lng += step.x) centres.push([lat, lng]);
  if (centres.length > 300) { console.error(`✖ Zoomed in too far (${centres.length} spots). Zoom out a little, then paste again.`); return; }
  console.log(`Sweeping ${centres.length} spots (about ${Math.ceil(centres.length * 0.75)} s)…`);

  const found = new Map(); let seen = 0, errors = 0;
  for (let i = 0; i < centres.length; i++) {
    const [lat, lng] = centres[i];
    const p = new URLSearchParams({service:'WMS', version:'1.3.0', request:'GetFeatureInfo',
      layers:typeName, query_layers:typeName, crs:'EPSG:4326',
      bbox:[lat - vh/2, lng - vw/2, lat + vh/2, lng + vw/2].join(','),
      width:'101', height:'101', i:'50', j:'50', info_format:'application/json',
      feature_count:'100000', cql_filter:'1=1'});
    try {
      const r = await fetch(base + p);
      if (!r.ok) { errors++; } else {
        const j = await r.json();
        for (const f of (j.features || [])) {
          seen++;
          const id = f.properties && f.properties.ORIG_ID;
          if (id == null || KNOWN.has(id) || found.has(id)) continue;
          const props = {}; for (const k of KEEP) props[k] = f.properties[k] ?? '';
          found.set(id, {type:'Feature', id:f.id, properties:props, geometry:f.geometry});
          console.log(`  + ${id}  ${props.NUM || '(no number)'}  ${props.DAYAR || ''}`);
        }
      }
    } catch (e) { errors++; }
    if (i % 10 === 9) console.log(`  …${i + 1}/${centres.length} spots, ${found.size} new so far`);
    await new Promise(res => setTimeout(res, 700));
  }

  console.log(`✔ Done. ${found.size} new parcels (${seen} hits, ${errors} failed requests).`);
  if (!found.size) { console.log('Nothing new to download.'); return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify({type:'FeatureCollection', features:[...found.values()]})], {type:'application/json'}));
  a.download = 'yiftah_parcels_extra_' + new Date().toISOString().slice(0,10) + '.geojson';
  a.click();
  console.log('⬇ Downloaded ' + a.download);
})();
