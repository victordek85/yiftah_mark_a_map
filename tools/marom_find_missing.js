// Yiftah — find the parcels still missing from our map, directly.
// HOW TO USE: open the Yiftah map in Marom (maps.marom.mobi, map 538), zoom so about
// 25–30 houses fill the screen, press F12 → Console, paste this whole file, press Enter.
// It downloads one file. Put it in data/extra_parcels/ and run: python3 tools/build_data.py
//
// Why this works better than a grid sweep: Marom answers "what's here?" only for the
// single spot at the centre of the request (and with an error when that spot is empty).
// So this script first asks Marom for ONE picture of just the missing parcels
// (filtered by ID), finds the shapes in that picture, then asks "what's here?" only at
// those shapes. About one request per missing parcel, ~0.7 s apart.
// Private fields (tax account, meters, notes) are dropped before the file is saved.
(async () => {
  let MISSING = [4,8,20,42,46,47,48,82,90,91,92,93,94,95,97,98,101,107,108,109,110,125,133,153,154,170,189,190,191,193,194,195,196,213,214,215,231,308,309,323,324,325,326,327,328,329,330,331,332,333,334,335,336,337,338,339,340];
  const KEEP = ['ORIG_ID','NUM','DAYAR','BAALIM','MAKOR','GUSH','HELKA'];
  const EXT = {w:35.5440, e:35.5580, s:33.1245, n:33.1330};
  const layer = 'yiftah:yiftah_nehasim', base = '/api/wms-proxy/wms?';
  const wait = ms => new Promise(r => setTimeout(r, ms));
  if (typeof map === 'undefined' || !map.getBounds) { console.error('✖ Open the Yiftah map in Marom first.'); return; }
  const b0 = map.getBounds();
  const vw = b0.getEast() - b0.getWest(), vh = b0.getNorth() - b0.getSouth();
  const filt = ids => 'ORIG_ID IN (' + ids.join(',') + ')';

  // 1) one picture of only the missing parcels
  const W = 2000, H = Math.round(W * (EXT.n - EXT.s) / ((EXT.e - EXT.w) * Math.cos(33.13 * Math.PI / 180)));
  async function picture(ids) {
    const p = new URLSearchParams({service:'WMS', version:'1.3.0', request:'GetMap', layers:layer, styles:'',
      crs:'EPSG:4326', bbox:[EXT.s, EXT.w, EXT.n, EXT.e].join(','), width:String(W), height:String(H),
      format:'image/png', transparent:'true', cql_filter:filt(ids)});
    const r = await fetch(base + p);
    const type = r.headers.get('content-type') || '';
    if (!r.ok || !type.startsWith('image/')) throw new Error('GetMap ' + r.status + ' ' + type + ' ' + (await r.text()).slice(0, 200));
    const bmp = await createImageBitmap(await r.blob());
    const c = new OffscreenCanvas(W, H), g = c.getContext('2d'); g.drawImage(bmp, 0, 0);
    return g.getImageData(0, 0, W, H).data;
  }
  // 2) shapes in the picture -> one spot inside each
  function spots(px) {
    const seen = new Uint8Array(W * H), out = [];
    for (let i = 0; i < W * H; i++) {
      if (seen[i] || px[i * 4 + 3] < 40) continue;
      let q = [i], n = 0, sx = 0, sy = 0, x0 = W, x1 = 0, y0 = H, y1 = 0; seen[i] = 1;
      const pts = [];
      while (q.length) {
        const k = q.pop(), x = k % W, y = (k / W) | 0; n++; sx += x; sy += y; pts.push(k);
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        for (const nb of [k - 1, k + 1, k - W, k + W]) {
          if (nb < 0 || nb >= W * H || seen[nb]) continue;
          if (Math.abs((nb % W) - x) > 1) continue;
          if (px[nb * 4 + 3] >= 40) { seen[nb] = 1; q.push(nb); }
        }
      }
      if (n < 12) continue;
      // try the middle of the shape's box (inside an outlined shape), then a pixel of the shape itself
      const mid = [(x0 + x1) / 2, (y0 + y1) / 2];
      let best = pts[0], bd = Infinity;
      for (const k of pts) { const d = (k % W - sx / n) ** 2 + (((k / W) | 0) - sy / n) ** 2; if (d < bd) { bd = d; best = k; } }
      out.push([mid, [best % W, (best / W) | 0]]);
    }
    return out;
  }
  const toGeo = ([x, y]) => [EXT.n - (y + 0.5) / H * (EXT.n - EXT.s), EXT.w + (x + 0.5) / W * (EXT.e - EXT.w)];
  async function whatsHere(lat, lng, ids) {
    const p = new URLSearchParams({service:'WMS', version:'1.3.0', request:'GetFeatureInfo',
      layers:layer, query_layers:layer, crs:'EPSG:4326',
      bbox:[lat - vh/2, lng - vw/2, lat + vh/2, lng + vw/2].join(','),
      width:'101', height:'101', i:'50', j:'50', info_format:'application/json',
      feature_count:'50', cql_filter:filt(ids)});
    try { const r = await fetch(base + p); if (!r.ok) return []; return (await r.json()).features || []; }
    catch (e) { return []; }
  }

  const found = new Map();
  for (let round = 1; round <= 3 && MISSING.length; round++) {
    let px;
    try { px = await picture(MISSING); }
    catch (e) { console.error('✖ Marom refused the picture request, so this method won\'t work here:', e.message); break; }
    const sp = spots(px);
    console.log(`Round ${round}: ${sp.length} shapes for ${MISSING.length} missing IDs`);
    if (!sp.length) break;
    for (const cands of sp) {
      for (const c of cands) {
        const [lat, lng] = toGeo(c);
        const feats = await whatsHere(lat, lng, MISSING);
        await wait(700);
        let got = false;
        for (const f of feats) {
          const id = f.properties && f.properties.ORIG_ID;
          if (id == null || found.has(id)) continue;
          const props = {}; for (const k of KEEP) props[k] = f.properties[k] ?? '';
          found.set(id, {type:'Feature', id:f.id, properties:props, geometry:f.geometry});
          console.log(`  + ${id}  ${props.NUM || '(no number)'}  ${props.DAYAR || ''}`); got = true;
        }
        if (got) break;
      }
    }
    MISSING = MISSING.filter(id => !found.has(id));
  }

  console.log(`✔ Done. ${found.size} new parcels. Still not found: ${MISSING.length ? MISSING.join(', ') : 'none'}`);
  if (!found.size) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify({type:'FeatureCollection', features:[...found.values()]})], {type:'application/json'}));
  a.download = 'yiftah_parcels_extra_' + new Date().toISOString().slice(0,10) + '_b.geojson';
  a.click();
  console.log('⬇ Downloaded ' + a.download);
})();
