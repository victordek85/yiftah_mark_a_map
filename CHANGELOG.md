# Changelog

All notable changes to **yiftah-map-events** (מפת יפתח) are listed here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (2.0.0): a change that breaks how people already use the app, such as a redesigned flow or a removed feature.
- **MINOR** (1.1.0): a new feature, or a visible change to an existing one.
- **PATCH** (1.0.1): bug fixes, wording tweaks and data refreshes (new or corrected houses, roads, landmarks).

Add every change under **Unreleased** as you make it. `python3 tools/release.py patch|minor|major` turns that section into a numbered release.

## [Unreleased]

## [1.1.0] - 2026-11-05

### Changed
- At the full view, **גן דולב** is named instead of **ספרייה**. ספרייה shows once you zoom in, and on the close-up image.
- The **הזזת מפה** button is gone. The app opens in **סימון בתים**; move the map with two fingers (or right-drag / the wheel on a computer).
- **סימון כבישים** now also marks the dotted golf-cart paths, which stay dotted underneath the mark. A mark that follows one road or path stays on it instead of jumping to a line running right next to it.

### Fixed
- The landmark **חדר אוכל** is now called **מינימרקט**. Search finds it by that name.
- **מועדון האסם** is no longer shown as a landmark. It's an ordinary building, and its name still shows in שמות mode.
- Building 129 is now called **מאפייה** instead of "מבני משק", and it's a green landmark like the other public buildings. Search finds it by that name.
- Landmark names on the map no longer overlap. If two would collide, one moves a line up or down; if there's still no room, it waits until you zoom in. The original landmarks come first, so at the full view מאפייה and מגרשי ספורט appear only after a little zoom.

### Added
- Four education buildings are now green landmarks: **גן דולב**, **שקד**, **אגס** and **סביון**.
- **קופת חולים** is marked with a small green house, just south of house 128. It shows once you zoom in, and on the close-up image.
- The swimming pool is drawn as blue water next to the pool building, and the **בריכה** label now sits on it instead of below the building.
- **קפה גליקי**, the coffee cart near מבני משק, is marked on the map with a green dot and its name. It shows once you zoom in, and on the close-up image.
- **ציור חופשי**: a third mode for drawing freely on the map with a thin red pencil, for example a bar across a blocked road or a box around a spot. Tap or long-press a line to remove it; long-press then drag removes every line the finger passes over. The drawing appears in both images.

## [1.0.0] - 2026-11-04

The first public release, live at https://victordek85.github.io/yiftah_mark_a_map/.

### Map
- A clean, self-drawn map of Kibbutz Yiftah: 283 parcels from MaromGIS, roads and footpaths from OpenStreetMap, the boundary, the entrance gate, the orchards and the central lawn. No third-party map tiles.
- Nine public buildings are always labelled and shown in green: חדר אוכל, אולם ספורט, מגרשי ספורט, מועדון האסם, מזכירות, ספרייה, מועדון לחבר, בית אריזה and בריכה.
- Labels: נקי (default), שמות or מספרים.
- Search by family name or house number, which marks the house and zooms to it.

### Marking
- Three modes: הזזת מפה, סימון בתים and סימון כבישים.
- Houses: tap to toggle one; drag to mark several. Long-press to unmark one, or long-press then drag to unmark several.
- Roads: drag along a road to draw a mark that snaps onto it. Tap or long-press a mark to remove it, or long-press then drag to remove several.
- Two fingers pan and pinch-zoom in every mode, including while marking.

### Creating the message
- **יצירת הודעה** opens a caption step, then makes two images: a close-up of the current view and an overview of the whole kibbutz with the marked area circled.
- The caption band shows a "🔔 הודעה" header row, with the message below it, clear of the iPhone camera cutout.
- **העתק** under each image copies that image.
- **שיתוף** shares one long image (caption, close-up, overview) through the phone's share sheet, or copies it on desktop.
- **יציאה** returns to a clean first screen.

### Phone layout
- The first screen fits an iPhone 15 Pro without scrolling.

[Unreleased]: https://github.com/victordek85/yiftah_mark_a_map/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/victordek85/yiftah_mark_a_map/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/victordek85/yiftah_mark_a_map/releases/tag/v1.0.0
