# Changelog

All notable changes to **yiftah-map-events** (מפת יפתח) are listed here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (2.0.0): a change that breaks how people already use the app, such as a redesigned flow or a removed feature.
- **MINOR** (1.1.0): a new feature, or a visible change to an existing one.
- **PATCH** (1.0.1): bug fixes, wording tweaks and data refreshes (new or corrected houses, roads, landmarks).

Add every change under **Unreleased** as you make it. `python3 tools/release.py patch|minor|major` turns that section into a numbered release.

## [Unreleased]

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

[Unreleased]: https://github.com/victordek85/yiftah_mark_a_map/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/victordek85/yiftah_mark_a_map/releases/tag/v1.0.0
