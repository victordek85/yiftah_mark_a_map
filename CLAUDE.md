# yiftah-map-events (מפת יפתח)

A single-page web tool for **Kibbutz Yiftah**. Someone, usually the operations manager, marks houses and road segments on a clean map of the kibbutz. They add a short message, such as "הפסקת מים מחר 8:00–12:00", and get two images to send to the kibbutz WhatsApp groups. The goal is to replace vague notices like "באזור הפתעותון / ממשפחה א עד משפחה ב" with a picture that shows exactly where.

The UI is Hebrew and RTL. End users are residents on phones, so the mobile experience comes first.

- Repo: https://github.com/victordek85/yiftah_mark_a_map
- Live site (GitHub Pages, branch `main`, root): https://victordek85.github.io/yiftah_mark_a_map/
- There is also an older copy as a claude.ai artifact (`claude.ai/artifact/Qy5zPQXP1KZW6ijtjBeMRu`). From now on the repo is the source of truth. The artifact is not kept in sync.

---

## Files

| File | What it is |
|---|---|
| `index.html` | The whole app: HTML, CSS and JS in one file. No build step, no framework, no libraries. The only external resource is the Google Font *Assistant*, and the page falls back to system fonts without it. |
| `data_embed.js` | Generated. Defines three globals: `YIFTAH_DATA` (parcels), `YIFTAH_ROADS`, `YIFTAH_PATHS`. Don't hand-edit it. Regenerate with the build script. |
| `tools/build_data.py` | Rebuilds `data_embed.js` from `data/`. Also holds the anchor (public building) list and the road clip box. |
| `data/parcels_raw.geojson` | Raw parcels scraped from MaromGIS (271 features). |
| `data/roads_osm.geojson` | Raw roads and paths from OpenStreetMap (74 ways). |
| `data/extra_parcels/*.geojson` | Optional. Later scrapes go here and the build merges them, deduplicated by `ORIG_ID`. |
| `CHANGELOG.md` | What changed in each version. Add every user-visible change under **Unreleased** in the same commit as the change. |
| `tools/release.py` | Cuts a release: bumps the version, dates the changelog section, commits and tags. |
| `robots.txt` + `<meta name="robots" content="noindex,nofollow">` | Keep search engines away. The data contains residents' names tied to house locations. |

Workflow: edit `index.html`, and if the data changes, run `python3 tools/build_data.py`. Add a line to `CHANGELOG.md` under **Unreleased**. Commit, push to `main`, and Pages redeploys in about a minute.

### Versions and releases

- The app is **yiftah-map-events**, versioned with semver. The single source of truth is `<meta name="app-version" content="x.y.z">` in `index.html`. The app shows it small at the bottom of the results sheet ("yiftah-map-events v1.0.0") and logs it to the console, so the user can check which version their phone loaded.
- **PATCH** = fixes, wording, data refreshes. **MINOR** = new or visibly changed features. **MAJOR** = changes that break how people already use the app.
- Day to day, keep pushing to `main` as before; every change gets a changelog line under **Unreleased**.
- When the user says to release (or "call this vX"), run `python3 tools/release.py patch|minor|major` (`--dry-run` previews it). It needs a clean working tree and a non-empty Unreleased section. It commits "Release vX.Y.Z" and creates an annotated tag, but doesn't push. Then run `git push --follow-tags` and `gh release create vX.Y.Z --title vX.Y.Z --notes-file <path it prints>`.
- Don't edit the version number by hand, and don't move or delete tags that have been pushed.

**Privacy:** the repo and the Pages site are public, so treat everything in them as public. The operations manager approved using the data for this tool. Before adding any new personal fields, ask the user.

Raw Marom scrapes also carry fields like `ARNONA` (municipal tax account), `MONE_HASHM`/`MONE_MAIM` (electricity/water meters), `MSHDR_HASH`, `HEAROT_*` and `PINUY`. The app doesn't use them. Before committing any file in `data/` (including new files in `data/extra_parcels/`), strip each feature's properties down to `ORIG_ID, NUM, DAYAR, BAALIM, MAKOR, GUSH, HELKA`.

---

## Data model

### `YIFTAH_DATA`: array of parcels

```js
{ id: 276,                 // ORIG_ID from Marom; unique; used for selection
  num: "14190-57",         // house/parcel number ("NUM"); may be "" or like "45A"
  name: "אקרפלד",          // resident family name(s) ("DAYAR"); may be "" or long ("לניר גרדה + קדוש טל")
  owner: "",               // "BAALIM" (e.g. "קיבוץ", "בית משותף"); unused by the UI
  kind: "מגרש",            // "מגרש" (lot/house) or "מבנה" (building)
  c: [35.549983, 33.129512],   // label point: centroid of the largest ring [lng, lat]
  geom: [[[[lng,lat],...]]],   // MultiPolygon coordinates (WGS84). poly[0]=outer ring, poly[1..]=holes
  anchor: "חדר אוכל" | null }  // set for the 9 public "landmark" buildings
```

These are the 9 anchors. They're defined in `tools/build_data.py` and were verified against the user's aerial screenshots:
`220 חדר אוכל`, `218 אולם ספורט`, `219 מגרשי ספורט`, `217 מועדון האסם`, `199 מזכירות`, `198 ספרייה`, `195 מועדון לחבר`, `131 בית אריזה`, and `בריכה`. The pool has no NUM, so it's matched by name.

**Do NOT label the grocery store (מכולת).** An early version wrongly put it on 199 (מזכירות), and the user corrected that. Its real location is still unknown. Ask the user before adding it.

### `YIFTAH_ROADS` / `YIFTAH_PATHS`

These are arrays of polylines, `[[lng,lat],…]`, clipped to the box lng 35.5420–35.5610, lat 33.1235–33.1340. That box includes the outer ring road around the orchards.
- Roads: OSM `primary`, `tertiary`, `unclassified`, `residential`, `service`, `track`. They're drawn as a light grey casing with a white fill.
- Paths: `footway`, `path`, `pedestrian`, `steps`, `cycleway`. They're drawn as thin dashed lines.
- OSM has **no street names** for Yiftah's internal roads, which is common for kibbutzim. Don't promise street-name labels.

### Hand-placed context in `index.html` (approximate, for orientation only)

- `KBOUND`: the kibbutz boundary ring, computed as the convex hull of all parcels pushed outward about 16%.
- `KGATE = [35.55499, 33.12983]`: the entrance gate, where the internal access road meets the outer road on the east side. The user confirmed this spot.
- `KORCHARDS`: one rough polygon for the orchards (מטע) north-west of the village, drawn with a diagonal hatch.
- `KLAWN`: the central lawn, between חדר אוכל/מועדון לחבר to the north and מזכירות/ספרייה to the south.

These are sketches, not survey data. If the user asks for more accuracy, adjust the coordinates by hand.

---

## Rendering

- Everything is drawn on **one `<canvas id="map">`** with the 2D API. No Leaflet and no map tiles. This was a deliberate choice: no copyright issues, it works offline, and image export is pixel-exact.
- Projection: an equirectangular projection, scaled by `kx = cos(midLat)`. World coordinates are `wx(lng)=lng*kx` and `wy(lat)=-lat`. Screen coordinates are `sx = wx*view.scale + view.ox`, `sy = wy*view.scale + view.oy`, and the inverse is `screenToGeo(x,y)`.
- HiDPI: the canvas backing store is `CW*DPR × CH*DPR`. `draw()` does `ctx.scale(DPR,DPR)` and then draws in CSS pixels.
- Draw order in `draw()`:
  1. ground
  2. `drawContext()`: lawn → orchards → roads (casing, then fill) → paths (dashed) → boundary → gate dot and label
  3. parcels (anchors in sage green, `מבנה` slightly darker, lots light)
  4. selected houses (red fill and stroke)
  5. road marks (thick red)
  6. labels
- `drawContext(g, C, scale)` is shared by the screen and by export. `g` provides `{c: ctx, X: lng→px, Y: lat→px, bbox}`.
- On-screen labels:
  - `labelMode` is `'none'` (default, "נקי"), `'name'` or `'num'`.
  - In `'none'` mode, only the anchors and the *selected* houses get labels.
  - House labels show only once zoomed in a little (`view.scale > fit*1.15`).
  - Long names are shortened by `shortLabel()`.
- Colors all come from CSS custom properties on `:root`. They're read through `cssvar()`, so light and dark themes both work. The palette is: sand/olive neutrals, sage-green landmarks, signal red (`--accent`/`--sel`) for anything marked, and a light-green lawn and orchards.

---

## Interaction model

There are three mode buttons at the top. In RTL, the right-most one comes first.

| Mode (`mode`) | Button | One-finger / left-mouse drag | Tap / click |
|---|---|---|---|
| `pan` (default) | הזזת מפה | pans the map | does nothing (never marks) |
| `multi` | סימון בתים | brush: adds every house it passes over. **Long-press first, then drag** removes instead | toggles one house; a long-press on a marked house unmarks it |
| `road` | סימון כבישים | free-draws a mark that **snaps onto the nearest road** (≤22 px). **Long-press first, then drag** removes every mark the finger passes over | tap or long-press removes the nearest drawn mark (≤24 px) |

Rules that hold in every mode:
- **Two fingers** pinch-zoom and pan the map in every mode, including the marking modes. If the second finger lands within 400 ms of the first, whatever the first finger just marked is undone (`selSnap`/`roadSnap`). On desktop, the **mouse wheel** zooms, and **right- or middle-button drag** pans, even in the marking modes. The context menu is suppressed for this.
- The zoom buttons +, − and ⌖ (re-fit) sit inside `#mapwrap`.
- **Long-press = erase**, in both marking modes, for touch and mouse: hold about 350 ms (`LONG_MS`) before moving. There is no separate erase button; the user asked to remove the old `➖ מחיקה` toggle.
- A finger may drift **10 px** (`tol`; 4 px for a mouse) and still count as held still. With the old 4 px, real finger wobble cancelled every long-press, which is why erasing "didn't work" on the phone.
- Search ("חיפוש שם או מספר…") matches by name or number. Choosing a result **marks the house** and zooms to it.
- `נקה בחירה` clears all marks.
- Houses (`selected`, a Set of ids) and road marks (`roadStrokes`, a list of snapped polylines) are kept separately, so one image can show both.

Implementation gotchas, each of which has been a real bug here:
- **Hit-testing is done in geo space.** `hitFeature` calls `screenToGeo` and then runs point-in-polygon on the raw rings, holes included. Don't go back to `ctx.isPointInPath`, because it caused DPR offset bugs on phones.
- **The brush defers its first paint.** On pointerdown in `multi` mode nothing is applied yet. The press point is applied only when the pointer moves (an add stroke) or when the long-press timer fires (a remove stroke). Otherwise a long-press would first add the house and then be blocked from removing it by `brushVisited`.
- A plain tap is detected on pointerup with `!moved && !longPress`.
- `btnPan` stops a right-click without movement from toggling a house.

---

## Layout

- **Desktop (wider than 640 px):** a full-screen canvas, with the top panel (`#top`) and bottom bar (`#bottom`) floating over it.
- **Mobile (640 px and narrower):** exactly one screen tall, no scrolling (the user wants the bottom bar visible on an iPhone 15 Pro). `#app` is a flex column of `100dvh` minus the safe areas; `#mapwrap` is `flex:1` and takes whatever height is left. Checked at 393×659 (Safari with toolbars) and 393×852.
- Because the map box can change size without a window resize, a `ResizeObserver` on the canvas calls `resize()`, which keeps the view centre after the first fit. The hint line reserves two lines on mobile so switching modes doesn't move the map.
- The top panel holds:
  1. mode buttons
  2. one row with the label toggle **נקי / שמות / מספרים** (in that order) and search. There is no marked-items counter; the user asked to remove it.
  3. a hint line
- The bottom bar holds only `נקה בחירה` and `יצירת הודעה`. The caption box was moved into the export flow on purpose.
- Page zoom is disabled: viewport meta `maximum-scale=1, user-scalable=no`, plus `touch-action:none` on the body and `pan-y` on mobile. Only the map zooms. If the whole page could zoom, panels would slide off-screen.
- `index.html` adds a small base reset (`[hidden]{display:none!important}`, body margin, safe-area padding) that the claude.ai viewer used to provide. Keep it, because many elements are toggled with the `hidden` attribute.

---

## Export flow

1. **יצירת הודעה** saves `nearBounds = viewBounds()`, the exact extent visible on screen, and opens the overlay at **step 1/2**.
2. **Step 1/2 "כיתוב להודעה":** a textarea with a ✕ to clear it. Buttons: `חזרה למפה` and `יצירת תמונות`. The caption is optional.
3. **Step 2/2 "התמונות מוכנות":** shows the two images, with no labels above them (the user asked to remove those). Each image has its own **העתק** button under it (copies that image, caption included). A sticky bottom row holds **עריכה** (back to step 1), **שיתוף/העתקה**, and **יציאה**, which calls `resetAll()`: back to the first screen with a clean slate (no marks, no caption, pan mode, נקי labels, map re-fitted).

`renderMap(bounds, {caption, kind, frame})` returns a 1200-px-wide canvas:
- **Caption band** (`captionBand()`): at the very top, in red. Row 1 is a small "🔔 הודעה" label at the right (y=96). The message itself, white 800-weight 56 px text wrapped by `wrapLines`, starts at y=200. That's so an iPhone's Dynamic Island doesn't cover it when the tall share image is opened full screen in WhatsApp (the image is scaled to about 0.3, so the island covers about the top 160 px). Don't move the message back up.
- **Brand strip:** "קיבוץ יפתח" on the right. On the left is either the selected names (up to 3), the counts, or "מבט על הקיבוץ" on the far image.
- **Aspect ratio:** clamped between 0.55 and 1.5 by widening the short side around the center.
- **`kind:'near'`:** the user's exact zoom. It always shows house names. Order: marked houses (32 px, red), then anchors (30 px), then as many neighbouring houses as fit (24 px). Labels never overlap, thanks to the `placed` box list.
- **`kind:'far'`:** the whole kibbutz with a 0.0006° margin, plus:
  - a **red ring** around everything that's marked
  - a **dashed frame** showing the near image's extent, drawn only when it is less than 45% of the area and fits inside the far view
  - labels for anchors, and for marked houses only when there are 4 or fewer
- **Sizes** were tuned for WhatsApp, which shows a 1200-px image at about ⅓ scale on a phone. Don't shrink the fonts back down.

### Share / copy (the user's preference: "option 3")

- **שיתוף** builds **one long image** (`longImage()`): the caption band once, then the near and far images rendered without their own caption, with a 24 px gap. The user wants a single image in WhatsApp.
- Inside an iframe (`window.top !== window.self`), and on browsers that can't share files, the button reads **"העתקה"** and copies the long image.
- On a top-level page that passes `navigator.canShare({files})` (the GitHub Pages site on a phone), the button reads **"שיתוף"**. It opens the system share sheet with the **one long image**. If sharing fails for any reason other than the user cancelling, it falls back to copying.
- The blob is passed to `ClipboardItem` **as a promise**, so the write happens inside the user's tap. Safari requires this.
- WhatsApp's own `wa.me` links can only send text, not images, so the share sheet is the right path.
- You can always long-press an image (phone) or right-click it (desktop) to save it.

---

## Where the data came from, and how to refresh it

### Parcels: MaromGIS (maps.marom.mobi, map 538, "יפתח - נכסים")

- The system is Leaflet over GeoServer through `/api/wms-proxy/wms`. The layers are `yiftah:yiftah_nehasim` (parcels, the one we use), `yiftah:yiftah_parcel`, `yiftah:yiftah_shemot_dayarim` and `yiftah:yiftah_reka` (the background drawing). The orthophoto tiles are on S3.
- **WFS is blocked (403).** The `parcel` and `shemot_dayarim` layers return 500 on GetFeatureInfo. `nehasim` already contains names (`DAYAR`) and numbers (`NUM`), so it's enough.
- **GetFeatureInfo returns only features near the *center* of the requested view, not the whole bbox.** A tiny bbox causes 500 errors, and a world bbox returns 0. The method that works is to keep the bbox at a normal map-view size (about 25–30 houses visible), move the center around, and accumulate results deduplicated by `ORIG_ID`.
- The user is logged in to Marom personally, and **the user runs the scripts in their own browser console** (F12). Never ask for or type their Marom password.
- **Be polite to their server.** Use a few large views, not hundreds of tiny requests, with roughly 600 ms between requests. The user explicitly worried about load.
- The Marom vendor, Pavel, offered to export the layers for a fee. We chose to scrape instead.

The working console script: run it once, then drag the map to each area and run `window.__grab()` again.

```js
window.__all = window.__all || new Map();
window.__grab = async () => {
  const typeName='yiftah:yiftah_nehasim', base='/api/wms-proxy/wms?';
  let before=window.__all.size;
  async function fetchView(){
    const b=map.getBounds();
    const p=new URLSearchParams({service:'WMS',version:'1.3.0',request:'GetFeatureInfo',
      layers:typeName,query_layers:typeName,crs:'EPSG:4326',
      bbox:[b.getSouth(),b.getWest(),b.getNorth(),b.getEast()].join(','),
      width:'101',height:'101',i:'50',j:'50',info_format:'application/json',
      feature_count:'100000',cql_filter:'1=1'});
    try{ const r=await fetch(base+p); if(!r.ok) return; const j=await r.json();
      for(const f of (j.features||[])){ const k=f.id ?? f.properties.ORIG_ID; if(!window.__all.has(k)) window.__all.set(k,f); }
    }catch(e){}
  }
  const s=map.getCenter(), b0=map.getBounds();
  const dLat=(b0.getNorth()-b0.getSouth())*0.4, dLng=(b0.getEast()-b0.getWest())*0.4;
  for(const [r,c] of [[0,0],[1,1],[1,-1],[-1,1],[-1,-1]]){
    map.setView([s.lat+r*dLat, s.lng+c*dLng], map.getZoom(), {animate:false});
    await new Promise(res=>setTimeout(res,600)); await fetchView();
  }
  map.setView(s, map.getZoom(), {animate:false});
  console.log('✔ +'+(window.__all.size-before)+' new | total '+window.__all.size);
};
window.__grab();
// download when done:
// (()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({type:'FeatureCollection',features:[...window.__all.values()]})],{type:'application/json'}));a.download='yiftah_parcels_extra.geojson';a.click();})();
```

To merge a new scrape, put the downloaded file in `data/extra_parcels/` and run `python3 tools/build_data.py`. The first scrape got 247 parcels. A second pass over the west side added 24 more (the 15780-30…39 block), for 271 in total.

**2026-11-04 round (283 parcels now), and a block.**
- `tools/marom_sweep.js` walks a grid over the whole kibbutz. It found 12 more (7 unnamed buildings, ids 96–112, and 15780-11/12/22/23/29). Each GetFeatureInfo returns **only the feature exactly under the centre pixel**, and **HTTP 500 when that spot is empty**, so 51 of its 110 requests were 500s, and a grid only finds houses that happen to sit under a grid point.
- `tools/marom_find_missing.js` (GetMap of only the missing ids, then one GetFeatureInfo per shape) was run right after. The user then **got blocked from Marom**, probably from this burst of requests and errors. It never produced a file, so it's untested.
- **Don't run more scraping scripts against Marom.** For the remaining parcels, prefer the vendor export (Pavel), or have the user point out the gaps and draw them by hand. Ids 1–322 exist in Marom; 39 of them are still unseen (some may not be houses).

### Roads: OpenStreetMap via Overpass

The cloud sandbox can't reach Overpass, and a cross-origin fetch from the Marom tab fails because of CORS. What works: open `https://overpass-api.de/` (or the mirror `https://overpass.kumi.systems/`) in a tab, then in that tab's console:

```js
(async()=>{const q='[out:json][timeout:60];(way["highway"](33.1250,35.5460,33.1325,35.5565););out geom;';
const r=await fetch('/api/interpreter',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'data='+encodeURIComponent(q)});
const d=await r.json();const feats=d.elements.filter(e=>e.type==='way'&&e.geometry).map(e=>({type:'Feature',
properties:{highway:e.tags.highway,name:e.tags.name||''},geometry:{type:'LineString',coordinates:e.geometry.map(p=>[+p.lon.toFixed(6),+p.lat.toFixed(6)])}}));
const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({type:'FeatureCollection',features:feats})]));a.download='yiftah_roads.geojson';a.click();})();
```

A 502 or 504 response means the server is overloaded. Retry later or use the mirror. Save the result as `data/roads_osm.geojson` and rebuild.

---

## Decisions log: what we chose, and why

- **Our own drawn map instead of Marom's background or orthophoto.** The user didn't want copyright issues. Marom's drawing carries their logo, and their tiles are their product. The map should still look familiar to residents, which is why we added landmarks, the lawn, roads, the gate and the orchards.
- **No Google Maps or similar tiles.** Their terms forbid using the tiles in another app.
- **OSM for roads.** The license is open, the data is vector, it can be embedded offline, and it lines up with the parcels because both use WGS84.
- **Default labels are "נקי"** (no names or numbers), with the public buildings always named in darker green so they stand out. The user asked for this.
- **Public buildings use a stronger sage color** but stay lighter than the red selection, so a marked house never gets confused with a landmark.
- **Single-house mode was removed.** The user asked for exactly three modes: pan, houses, roads. Tapping toggles a house in houses mode.
- **Road marking is free-draw snapped to the road**, not whole-segment selection. The user found whole segments too coarse.
- **The caption lives in the export flow**, not on the main screen, and the export always produces two images. All of this was the user's spec.
- **The "copy one combined image" fallback.** The user tested and preferred it inside Claude. The real share sheet is the reason for hosting the tool on GitHub Pages.

---

## Known limitations / open items

- The grocery store (מכולת) location is unknown. See the note under the data model.
- At the default zoom, some anchor labels overlap in the dense center, for example מגרשי ספורט and אולם ספורט. The export uses collision avoidance, but the live map doesn't. A possible fix is to shorten one label (for example "אולם").
- The orchards, lawn, boundary and gate are approximations.
- The data is a snapshot from 2026-11. Residents change, so refresh every few months using the scripts above.
- `navigator.share` with files depends on the browser. Expect it to work on iOS Safari and Android Chrome. On desktop, the copy fallback is normal.

---

## Testing

There are no automated tests. Check changes in a real browser at phone size (390×800) and on desktop:

```bash
python3 -m http.server 8765   # from the repo root; index.html loads data_embed.js relatively
```

Smoke-test checklist:
- Pan mode never marks anything.
- Brush-marking in houses mode adds; long-press then drag removes. Long-press then drag over road marks removes them.
- Two fingers pan and zoom in the marking modes without marking anything.
- The first screen at 393×659 doesn't scroll, and the bottom bar is visible.
- Road free-draw snaps onto roads, and tapping a mark removes it.
- `יצירת הודעה` → caption → `יצירת תמונות` produces two images, each with a working העתק, with no console errors. `יציאה` returns to a clean first screen.
- The page never scrolls sideways at 390 px width.
- The near image is readable at about ⅓ scale.

Playwright with headless Chromium is convenient for this. Desktop Chromium reports no file-share support, so the button shows "העתקה" there. That's expected.

## Conventions

- Keep the app a single `index.html` with no dependencies.
- Hebrew UI copy should be short and plain. Comments are in English.
- Use CSS variables for every color, and define both light and dark values.
- Use `gap` and flexbox for layout. At phone width, keep a 16 px side gutter and no sideways scroll.
- Commit messages should say what changed and why.
