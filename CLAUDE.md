# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Vite dev server (localhost only)
npm run dev:host         # Vite dev server bound to 0.0.0.0
npm run build            # Production build → dist/
npm run lint             # ESLint over the repo
npm test                 # Vitest watch mode
npm run test:run         # Vitest single run (CI)
npm run test:coverage    # Coverage report → coverage/
npx vitest run tests/utils/shapeUtils.test.ts   # Run a single test file
npx vitest run -t "name of test"                # Run a single test by name
```

Docker: `docker-compose up -d --build` serves the production build via nginx on port **3333** (mapped to container :80). The nginx config is `nginx.conf`.

## Architecture

PolyDraw is a single-page React + TypeScript + Vite app for drawing/editing SVG shapes (polygons, circles, rectangles, lines, ellipses) over an uploaded background image, exporting their coordinates for image annotation / CV pipelines.

### State model: composed hooks, not a store

`App.tsx` is the orchestrator. It does not hold most state itself — it composes a set of feature hooks from `src/hooks/`, each of which owns a slice of state and exposes actions:

- `useCanvas` — viewport: zoom, pan, image, canvas size, snap settings
- `useShapes` — the shape list, selection, in-progress drawing, hit-testing, point editing
- `useTools` — current tool (`select | polygon | circle | rectangle | line | path-tester`), modifier keys, dragged point
- `useZoneTypes` — categorization layers (region/exclusion/highlight, plus user-defined); each shape has a `zoneType` and visibility is per zone type
- `usePathTesting` — overlay tool that tests whether a list of points falls inside/outside/on existing polygons
- `useHistory` — undo/redo
- `useKeyboardShortcuts` — wires `Delete`, `Escape`, etc. to the above

Cross-hook coordination happens in `App.tsx` callbacks (mouse handlers, export, crop). When adding a feature, prefer extending the relevant hook over hoisting state into `App.tsx`.

### Shape model

`src/types/shapes.ts` defines a discriminated union `Shape = Polygon | Circle | Rectangle | Line | Ellipse` over `BaseShape`. Two important quirks:

1. `BaseShape` carries **live SVG element references** (`element`, `svg`, `nameElement`, `pointElements`) alongside the data. Rendering in `src/utils/shapeRenderer.ts` mutates these. Treat shapes as having an imperative DOM side — cloning a shape requires care, and serialization (export, history) must strip these references.
2. Each concrete shape type has type-specific geometry fields (e.g. `CircleShape.center/radius`, `LineShape.startPoint/endPoint`) **in addition to** the generic `points: Point[]`. Both must be kept in sync; helpers in `src/utils/shapeUtils.ts` and `circleUtils.ts` handle this.

### Rendering

`src/components/Canvas/Canvas.tsx` renders the SVG canvas and image; `PathOverlay.tsx` overlays the path-tester results. Most shape rendering is **imperative DOM manipulation** via `src/utils/shapeRenderer.ts` rather than declarative React — this is intentional for performance with many points and live drag.

### Utilities (`src/utils/`)

Logic is split by concern, not by component:
- `coordinateUtils` — screen ↔ canvas ↔ normalized [0,1] coordinates (the export `normalize` flag flows through here)
- `geometryUtils` — point-in-polygon, distance, RDP polygon simplification
- `shapeRenderer` — DOM creation/update for all shape types
- `parseUtils` / `pathParsingUtils` — parse user-entered SVG point strings and Python coordinate arrays
- `exportUtils` — Python array / SVG string output
- `cropPolygonToImage` (in `canvasUtils`) — extracts the polygon region of the background image as a PNG

When changing coordinate handling, remember three coordinate systems coexist: **screen pixels** (mouse events), **canvas pixels** (post-pan/zoom, what's stored on shapes), and **normalized 0–1** (for export when `canvasSettings.normalize` is on).

### Tests

Vitest + React Testing Library. Tests live in `tests/` mirroring `src/` (not co-located). `tests/setup/` configures jsdom and `@testing-library/jest-dom`. See `TESTING.md` for the testing conventions used in this repo.
