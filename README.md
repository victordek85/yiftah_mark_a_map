# Yiftah map marker (מפת יפתח)

A small web tool for Kibbutz Yiftah. You mark houses and road segments on a map of the kibbutz, add a short message, and get two images to share on WhatsApp: a close-up and an overview.

**Live:** https://victordek85.github.io/yiftah_mark_a_map/

## Folder layout

```
index.html               the app (single file, no build step)
data_embed.js            generated map data (parcels, roads, paths)
robots.txt               keeps search engines out (the data has residents' names)
CLAUDE.md                full project notes for Claude Code sessions
tools/build_data.py      regenerates data_embed.js from data/
data/parcels_raw.geojson parcels scraped from MaromGIS (271)
data/roads_osm.geojson   roads and paths from OpenStreetMap
data/extra_parcels/      drop later scrapes here; the build merges them
```

## Common tasks

- Run locally: `python3 -m http.server 8765`, then open http://localhost:8765
- Rebuild data after changing `data/` or the landmark list: `python3 tools/build_data.py`
- Publish: commit and push to `main`. GitHub Pages redeploys in about a minute.

How to refresh the data from Marom and OpenStreetMap is described in `CLAUDE.md`.
