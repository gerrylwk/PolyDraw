# SKILLS.md -- PolyDraw Developer Navigation Guide

PolyDraw is an SVG polygon annotation editor built with React 18, TypeScript, Vite, and Tailwind CSS. Users upload an image, draw polygons over it, and export the annotations in multiple formats. This document explains the architecture, features, and conventions so that any developer or agent can locate the right file for any change and understand the invariants to preserve.

---

## File Tree

```
src/
  App.tsx                          # Root component -- composes hooks, wires mouse/keyboard events, renders layout
  main.tsx                         # ReactDOM entry point
  index.css                        # Tailwind directives and global styles

  components/
    Canvas/
      Canvas.tsx                   # Main canvas container -- renders image, shapes, grid, cursor logic
      PathOverlay.tsx              # SVG overlay for path-testing visualization (color-coded dots, connecting lines)
      index.ts                     # Barrel export

    UI/
      Button.tsx                   # Reusable button (variants: primary/secondary/danger/ghost, sizes: sm/md/lg)
      Input.tsx                    # Multi-type input (text/number/range/checkbox/file)
      index.ts

    Widgets/
      ViewControlsWidget.tsx       # Undo/redo, zoom, opacity slider, clear-all
      ExportWidget.tsx             # Coordinate export (Python format + SVG string) with inline editing
      ExportDropdown.tsx           # Image export dropdown (PNG/JPEG/SVG) + copy-to-clipboard
      JsonSchemaWidget.tsx         # JSON zone schema display/edit with debounced serialization
      PathTestingPanel.tsx         # Path testing results panel (point list, manual text editing, export)
      PropertiesWidget.tsx         # Shape property editor
      ToolbarWidget.tsx            # Drawing tool buttons
      CoordinatesWidget.tsx        # Coordinate display widget
      ZoneTypeLayerPanel.tsx       # Zone type CRUD, visibility toggles, color management
      index.ts

  hooks/
    useCanvas.ts                   # Canvas state: zoom, pan, image upload, viewport transforms
    useShapes.ts                   # Shape CRUD, two-tier undo/redo, DOM lifecycle
    useHistory.ts                  # Snapshot undo/redo stack (max 50 entries)
    useTools.ts                    # Tool selection, shift key, point dragging state
    useKeyboardShortcuts.ts        # Global keyboard event handler
    useZoneTypes.ts                # Zone type categories with visibility
    usePathTesting.ts              # Freehand path drawing + containment testing
    index.ts

  types/
    shapes.ts                      # Point, ShapeStyle, BaseShape, PolygonShape, Shape union, DraggedPoint
    canvas.ts                      # CanvasState, CanvasSettings, ImageInfo, ViewType
    tools.ts                       # ToolType, ToolState, PathTestPoint, PathTestingState
    zones.ts                       # ZoneType, DEFAULT_ZONE_TYPES
    index.ts

  utils/
    coordinateUtils.ts             # Mouse-to-canvas transform, edge snapping, line straightening, normalize/denormalize
    shapeUtils.ts                  # Shape factories, hit detection, bounding box, ID generation
    shapeRenderer.ts               # SVG rendering factory (PolygonRenderer, CircleRenderer, ShapeRendererFactory)
    geometryUtils.ts               # Ray-casting point-in-polygon, point-to-segment distance, containment checks
    parseUtils.ts                  # Python/SVG coordinate string parsers and generators
    exportUtils.ts                 # Image export (PNG/JPEG/SVG), clipboard copy, offscreen canvas composition
    zoneUtils.ts                   # JSON zone schema serialization/deserialization, debounced serializer
    pathParsingUtils.ts            # Path text parsing and formatting for the path tester
    canvasUtils.ts                 # Canvas helper utilities
    circleUtils.ts                 # Circle-specific geometry helpers
    imageLoadUtils.ts              # Image loading benchmark (4 methods compared)
    nameGenerator.ts               # Auto-naming for new shapes
    index.ts

tests/
  setup/
    setup.ts                       # Global test setup, DOM mocks
    test-utils.tsx                 # Custom render helpers for React Testing Library
  components/Canvas/PathOverlay.test.tsx
  components/UI/Button.test.tsx
  components/UI/Input.test.tsx
  hooks/useCanvas.test.ts
  hooks/useKeyboardShortcuts.test.ts
  hooks/useTools.test.ts
  utils/canvasUtils.test.ts
  utils/circleUtils.test.ts
  utils/coordinateUtils.test.ts
  utils/exportUtils.test.ts
  utils/imageLoadUtils.test.ts
  utils/parseUtils.test.ts
  utils/shapeRenderer.test.ts
  utils/shapeUtils.test.ts
```

---

## Architecture

### Hook Composition

`App.tsx` composes six specialized hooks. Each hook owns a single domain and exposes a clean return interface:

```
App.tsx
  useCanvas()            -- zoom, pan, image upload, container refs
  useShapes()            -- shape array, current shape, undo/redo, CRUD
  useTools()             -- tool selection, shift key, dragging state
  useZoneTypes()         -- zone type CRUD, visibility toggles
  usePathTesting()       -- freehand path + containment results
  useKeyboardShortcuts() -- global keydown/keyup listener (receives callbacks from above hooks)
```

All canvas mouse events (down, move, up) are handled by a single event delegation handler in `App.tsx`, not on individual shapes. The handler branches on the current tool and delegates to the appropriate hook methods.

### Ref-Based Performance Pattern

Hooks use `useRef` to make current state available to callbacks without triggering re-renders:

```typescript
const shapesRef = useRef<Shape[]>([]);
shapesRef.current = shapes;
```

This is used in `useShapes` (for snapshot serialization) and `usePathTesting` (for last-point tracking). Callbacks read from the ref to get the latest value without adding the state to dependency arrays.

### DOM Strategy: SVG + HTML Divs

Shapes use a dual-DOM approach:

- **SVG elements** render the shape fill, stroke, and name label. Each shape gets its own `<svg>` container with a shape element and a `<text>` name element inside.
- **HTML `<div>` elements** render the draggable point handles. These are positioned absolutely over the canvas and use `data-point="true"` for identification.

Point handles are HTML divs (not SVG circles) because:
1. They need reliable z-index layering above all SVG content
2. CSS transitions (`hover:scale-150`) work more predictably
3. Hit detection for drag-start is simpler with native DOM events

### Styling: Inline SVG Attributes

Dynamic style properties (fill color, opacity, stroke color) are set via inline SVG attributes in `shapeRenderer.ts`, not via CSS classes. This prevents Tailwind CSS specificity conflicts from overriding dynamic values. The only CSS class used on shape elements is `stroke-2` as a fallback, with `vectorEffect: 'non-scaling-stroke'` applied inline to keep stroke width constant during zoom.

---

## Two-Tier Undo/Redo System

The undo/redo system has two tiers that operate independently depending on whether the user is currently drawing.

### Tier 1: Per-Point (During Drawing)

Active when `currentShape !== null` (a polygon is being drawn).

- **Undo** (`Ctrl+Z`): Removes the last point from `currentShape.points`, pushes it onto `drawingRedoStackRef`, removes the corresponding DOM point handle, and updates the SVG display.
- **Redo** (`Ctrl+Shift+Z`): Pops from `drawingRedoStackRef`, creates a new point handle, appends to `currentShape.points`, updates display.
- **Edge case -- undoing the first point**: If `points.length <= 1`, the entire shape is destroyed, removed from state, and `history.discardLast()` is called to remove the pre-creation snapshot from the main stack (prevents a no-op undo entry).

### Tier 2: Snapshot-Based (Between Shapes)

Active when `currentShape === null` (no polygon is being drawn).

- `useHistory` maintains two stacks (`pastRef` and `futureRef`) of serialized shape arrays, capped at 50 entries.
- **Undo**: Serializes current shapes, pushes onto `futureRef`, pops from `pastRef`, rebuilds all shapes from the popped snapshot.
- **Redo**: Serializes current shapes, pushes onto `pastRef`, pops from `futureRef`, rebuilds.
- Rebuilding destroys all current DOM elements and recreates them from snapshots via `rebuildShapeFromSnapshot()`.

### Key Invariants

- `saveSnapshot()` must be called **before** any destructive operation (delete shape, clear all, start new polygon, start point drag).
- `addPointToShape()` and `completeCurrentShape()` both clear `drawingRedoStackRef` (just like typing new text clears redo in a text editor).
- `completeCurrentShape()` calls `history.discardLast()` if the polygon has fewer than 3 points (incomplete polygon is not a valid undo target).
- Snapshots are deep copies -- `serializeShape()` copies all `Point` objects and the `color` object to prevent reference sharing.

### Where to Find the Code

| Concern | File | Key Functions |
|---|---|---|
| Tier 1 logic | `src/hooks/useShapes.ts` | `handleUndo()`, `handleRedo()` (the `if (currentShape)` branches) |
| Tier 2 stack | `src/hooks/useHistory.ts` | `pushState()`, `undo()`, `redo()`, `discardLast()` |
| Serialization | `src/hooks/useShapes.ts` | `serializeShape()`, `serializeCurrentShapes()` |
| Rebuild | `src/hooks/useShapes.ts` | `rebuildShapeFromSnapshot()`, `rebuildFromSnapshots()` |
| Snapshot triggers | `src/hooks/useShapes.ts` | `saveSnapshot()` -- called before `removeShape`, `clearAllShapes`, `startNewPolygon` |
| Keyboard wiring | `src/hooks/useKeyboardShortcuts.ts` | `onUndo`, `onRedo` callbacks |

---

## Shape Lifecycle

### 1. Creation

`startNewPolygon(point, canvasRef)` in `useShapes.ts`:

1. Calls `saveSnapshot()` to record pre-creation state.
2. Clears `drawingRedoStackRef`.
3. Creates shape object via `createPolygonShape()` from `shapeUtils.ts`.
4. Creates SVG via `createShapeSVG()` from `shapeRenderer.ts`.
5. Creates a dashed preview line (`<line>` element) and appends to the SVG.
6. Creates the first point handle (HTML div) and appends to canvas.
7. Adds shape to state and sets it as `currentShape`.

### 2. Point Addition

`addPointToShape(point, isShiftPressed)` in `useShapes.ts`:

1. Clears drawing redo stack.
2. Applies `straightenLine()` if Shift is held (snaps to 0/45/90/135/180/225/270/315 degrees).
3. Creates a new point handle div.
4. Updates shape state and calls `updateShapeDisplay()`.

### 3. Completion

`completeCurrentShape()` in `useShapes.ts`:

1. Clears drawing redo stack.
2. Validates minimum 3 points -- if fewer, destroys the shape and calls `history.discardLast()`.
3. Removes the preview line from the SVG.
4. Sets `currentShape` to `null`.

### 4. Editing

Point dragging is handled in `App.tsx`'s `handleCanvasMouseMove`:

1. On mouse-down with select tool, `findPointAt()` detects if a point handle is under the cursor (15px threshold, scaled by zoom).
2. `saveSnapshot()` is called, then `setDraggingPoint(true, point)`.
3. On mouse-move, the dragged point's coordinates are updated via `updateShapePoints()`, which calls `updateShapeDisplay()`.
4. On mouse-up, dragging stops.

### 5. Deletion

`removeShape(shape)` in `useShapes.ts`:

1. Calls `saveSnapshot()`.
2. Removes SVG and all point handles from DOM via `destroyShapeDOM()`.
3. Filters shape from state array.

---

## Canvas Interaction Model

### Mouse Event Flow

All events are handled by three callbacks in `App.tsx`: `handleCanvasMouseDown`, `handleCanvasMouseMove`, `handleCanvasMouseUp`. Each branches on the current tool:

**Polygon Tool:**
- Click creates/extends a polygon.
- Clicking near the first point (15px / scale threshold) completes it.
- Clicking near an existing point (detected by `findNearbyPointOnShape()`) is blocked.
- Mouse-move updates the dashed preview line and highlights points.

**Select Tool:**
- Click on a point handle starts dragging (calls `findPointAt()`).
- Click on empty space starts canvas panning.
- Mouse-move updates point position or canvas offset.

**Path Tester:**
- Mouse-down starts path recording.
- Mouse-move adds points (minimum 8px spacing, maximum 1000 points).
- Mouse-up completes the path and runs containment checks.

### Coordinate Transform

`getMousePosition()` in `coordinateUtils.ts` converts screen coordinates to canvas coordinates:

```
canvasX = (clientX - containerRect.left - offsetX) / scale
canvasY = (clientY - containerRect.top - offsetY) / scale
```

Optional edge snapping is applied if enabled (snaps to image boundaries within the configured threshold).

### Cursor-Centered Zoom

Mouse wheel zoom in `useCanvas.ts` keeps the point under the cursor fixed:

1. Calculate the canvas coordinate under the mouse.
2. Apply the zoom factor to the scale.
3. Recalculate the offset so the same canvas coordinate remains under the mouse.

### Visual Feedback

Point handle states are managed via inline styles in `App.tsx`'s mouse-move handler:

| State | Border Color | Box Shadow | Scale | Trigger |
|---|---|---|---|---|
| Normal | blue-500 (CSS) | none | 1x | Default |
| Hoverable first point | `#22c55e` (green) | green glow | 1.6x | Can close polygon (>= 3 points) |
| Blocking overlap | `#ef4444` (red) | red glow | 1.3x | Too close to existing point |
| Selected | CSS `border-red-500` ring | -- | -- | After click in select tool |

---

## Import/Export System

### Coordinate Formats

| Format | Generator | Parser | File |
|---|---|---|---|
| Python tuples | `generatePythonString()` (in `ExportWidget`) | `parsePythonString()` | `src/utils/parseUtils.ts` |
| SVG string | `generateSVGString()` | `parseSVGString()` | `src/utils/parseUtils.ts` |
| JSON zone schema | `serializeToZoneSchema()` | `parseZoneSchema()` | `src/utils/zoneUtils.ts` |
| Normalized (0-1) | Same functions with `normalize: true` | Same with denormalization | Same files |

**Python format example:**
```python
# Polygon 1
shape_1 = [(100, 200), (150, 250), (200, 200)]
```

**SVG string example:**
```
# Polygon 1
100 200 150 250 200 200
```

**JSON zone schema:**
```json
{
  "zones": [
    { "name": "Zone 1", "zone_type": "region", "points": "100 200 150 250 200 200" }
  ],
  "zone_types": [
    { "id": "region", "name": "region", "color": "#3b82f6" }
  ]
}
```

Parsing validates a minimum of 3 points per polygon. Both Python and SVG parsers use regex extraction and filter out comment lines starting with `#`.

### Image Export

| Format | Function | File |
|---|---|---|
| PNG | `exportAsImage(imageInfo, shapes, { format: 'png' })` | `src/utils/exportUtils.ts` |
| JPEG | `exportAsImage(imageInfo, shapes, { format: 'jpeg', quality: 0.92 })` | `src/utils/exportUtils.ts` |
| SVG | `exportAsSVG(imageInfo, shapes)` | `src/utils/exportUtils.ts` |
| Clipboard | `copyImageToClipboard(imageInfo, shapes)` | `src/utils/exportUtils.ts` |

All image exports use `renderImageWithShapes()` which creates an offscreen canvas, draws the base image, then draws all polygon fills and strokes on top. SVG export embeds the base image as a base64 `<image>` element.

### Path Test Export

The path testing panel (`PathTestingPanel.tsx`) exports test results in JSON, CSV, and plain text via buttons in its UI. The data includes each point's coordinates, containment status, and the names of containing polygons.

---

## Path Testing Tool

Activated by pressing `T` or clicking the Test button. Users draw a freehand path over the canvas and each point is tested against all polygons.

### Algorithm

1. **Bounding box rejection** -- `calculateShapeBounds()` skips polygons where the point is clearly outside.
2. **Edge detection** -- `isPointOnEdge()` checks if the point is within 3px of any polygon edge using `pointToSegmentDistance()`.
3. **Ray casting** -- `isPointInPolygon()` counts ray intersections. Odd = inside, even = outside.

### Constraints

- Minimum 8px spacing between recorded points (prevents oversampling during fast mouse movement).
- Maximum 1000 points per path.
- Manual text editing is supported via a textarea in the panel.

### Color Coding (in PathOverlay.tsx)

- Green circle: point is inside a polygon
- Red circle: point is outside all polygons
- Blue circle: point is on a polygon edge

### Where to Find the Code

| Concern | File |
|---|---|
| Hook state + drawing logic | `src/hooks/usePathTesting.ts` |
| Geometry algorithms | `src/utils/geometryUtils.ts` |
| Text parsing/formatting | `src/utils/pathParsingUtils.ts` |
| Visual overlay | `src/components/Canvas/PathOverlay.tsx` |
| Results panel UI | `src/components/Widgets/PathTestingPanel.tsx` |

---

## Zone Type System

Zone types categorize polygons (default types: `region`, `exclusion`, `highlight`). Each type has a name, color, and visibility toggle.

### State Management

`useZoneTypes.ts` manages the zone type array with CRUD operations:
- `addZoneType(name, color)` -- creates a new type with a generated ID.
- `updateZoneType(id, updates)` -- modifies name or color.
- `deleteZoneType(id)` -- removes the type (UI confirms if shapes reference it).
- `toggleVisibility(id)` -- flips `isVisible`, which hides/shows all shapes of that type.

### Visibility

`App.tsx` has a `useEffect` that calls `updateShapesVisibility()` whenever `zoneTypes` or `shapes` change. This function sets `display: none` on SVG elements and point handles of shapes whose zone type is hidden.

### JSON Schema Integration

The `JsonSchemaWidget` serializes all shapes and zone types into the JSON format shown above. On import, it replaces both shapes and zone types atomically. Serialization is debounced (250ms) using `requestIdleCallback` to avoid blocking the UI.

---

## Keyboard Shortcuts

All shortcuts are handled in `useKeyboardShortcuts.ts` via a global `keydown` listener. Shortcuts are **ignored when focus is in a text input or textarea**.

| Key | Action | Context |
|---|---|---|
| `Ctrl+Z` / `Cmd+Z` | Undo | Always (branches to Tier 1 or Tier 2) |
| `Ctrl+Shift+Z` / `Cmd+Y` | Redo | Always |
| `Ctrl+C` / `Cmd+C` | Copy image to clipboard | When not in text input |
| `Delete` | Remove selected point | Select tool with a selected point |
| `Escape` | Complete/cancel polygon, or exit path tester | Depends on current tool |
| `T` | Toggle path tester mode | Always (not in text input) |
| `C` | Clear path | Only when path tester is active |
| `Shift` (hold) | Straighten lines to 0/45/90/135/180/225/270/315 degrees | During polygon drawing |

---

## Double Panoramic View

For annotating 360-degree panoramic images split into top and bottom halves.

- A red dashed separator line is drawn at the vertical midpoint (`Canvas.tsx`).
- Edge snapping works per-half: top half snaps to y=0 and y=midpoint; bottom half snaps to y=midpoint+1 and y=height.
- Points cannot cross the midline boundary (constrained in `snapToImageEdges()` in `coordinateUtils.ts`).
- Selected via a dropdown in the sidebar (`canvasSettings.viewType`).

---

## How to Add a New Shape Type

The type system already defines `ShapeType = 'polygon' | 'circle' | 'rectangle' | 'line' | 'ellipse'`, but only `polygon` has full implementation. To add support for another type:

1. **Types** (`src/types/shapes.ts`): The interface already exists (e.g., `CircleShape`). Verify it has the fields you need.

2. **Renderer** (`src/utils/shapeRenderer.ts`): A `CircleRenderer` class already exists and is registered in `ShapeRendererFactory`. For other types, create a new class implementing `ShapeRenderer` with `createSVGElement()`, `updatePoints()`, and `applyStyle()`, then register it: `ShapeRendererFactory.registerRenderer('rectangle', new RectangleRenderer())`.

3. **Shape creation** (`src/hooks/useShapes.ts`): Add a method analogous to `startNewPolygon()` -- e.g., `startNewCircle(center, canvasRef)`. It should call `saveSnapshot()`, create the shape object, call `createShapeSVG()`, create point handles, and set `currentShape`.

4. **Tool wiring** (`src/hooks/useTools.ts` + `App.tsx`): Add the tool to `ToolType`, add a toolbar button in `App.tsx`, and add a branch in `handleCanvasMouseDown`/`handleCanvasMouseMove` for the new tool's interaction model.

5. **Serialization** (`src/hooks/useShapes.ts`): Ensure `serializeShape()` and `rebuildShapeFromSnapshot()` handle any new fields (e.g., `radius` for circles).

---

## How to Add a New Export Format

1. **Coordinate format**: Add parser and generator functions in `src/utils/parseUtils.ts` following the pattern of `parsePythonString()` / `generateSVGString()`. Ensure the parser validates a minimum of 3 points.

2. **Wire into UI**: Add a tab or section in `src/components/Widgets/ExportWidget.tsx` following the existing Python/SVG tab pattern. Both tabs use a code display with an edit mode (textarea + Apply/Cancel buttons).

3. **Image format**: Add a case in `src/utils/exportUtils.ts` following the `exportAsImage()` / `exportAsSVG()` pattern. Add a menu item in `src/components/Widgets/ExportDropdown.tsx`.

---

## How to Modify Undo/Redo Behavior

Any operation that destructively modifies shapes should call `saveSnapshot()` before the modification. This is already done in:
- `startNewPolygon()` -- before creating the new shape
- `removeShape()` -- before deleting
- `clearAllShapes()` -- before clearing
- `handleCanvasMouseDown` in `App.tsx` -- before starting a point drag

To add a new undoable operation, call `shapes.saveSnapshot()` before making changes.

For drawing-mode undo behavior (Tier 1), modify the `if (currentShape)` branches in `handleUndo()` and `handleRedo()` in `useShapes.ts`.

If canceling an operation that already pushed a snapshot (e.g., incomplete polygon), call `history.discardLast()` to clean up the stack.

---

## Testing

### Stack

- **Vitest 3.2.4** -- test runner
- **jsdom** -- browser environment simulation
- **React Testing Library** -- component rendering and assertions
- **`@testing-library/user-event`** -- user interaction simulation

### Running Tests

```bash
npm test              # Watch mode
npm run test:run      # Single run
npm run test:coverage # With V8 coverage report
```

### Conventions

- Test files live in `tests/` mirroring the `src/` structure: `tests/utils/parseUtils.test.ts` tests `src/utils/parseUtils.ts`.
- Pure utility functions are tested with direct imports and assertions.
- Hooks are tested with `renderHook()` from React Testing Library.
- Components are tested with `render()` + `screen` queries + `userEvent` interactions.
- Global setup is in `tests/setup/setup.ts` (DOM mocks for canvas, SVG, clipboard, etc.).

### Adding a Test

1. Create a file at `tests/<category>/<name>.test.ts(x)`.
2. Import the module under test.
3. Use `describe` / `it` blocks with `expect` assertions.
4. For hooks, wrap calls in `act()` from React Testing Library.
5. For components that need custom providers, use helpers from `tests/setup/test-utils.tsx`.

---

## Build and Deployment

```bash
npm run build         # Vite production build
npm run lint          # ESLint
```

### Configuration Files

| File | Purpose |
|---|---|
| `vite.config.ts` | React plugin, host 0.0.0.0, base `./`, excludes lucide-react from dep optimization |
| `vitest.config.ts` | jsdom environment, V8 coverage, global setup file |
| `tsconfig.json` | Composite config referencing `tsconfig.app.json` + `tsconfig.node.json` |
| `tailwind.config.js` | Content paths for all HTML and React files |
| `eslint.config.js` | TypeScript ESLint with React hooks and refresh plugins |

### Docker

- `Dockerfile` builds the app and serves via Nginx.
- `nginx.conf` configures SPA routing (all paths fall through to `index.html`).
- `docker-compose.yml` orchestrates the container.

### CI/CD

- `.github/workflows/ci.yml` -- runs tests on push/PR against Node 18, 20, 22.
- `.github/workflows/deploy.yml` -- production deployment pipeline.

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| Blob URL for image loading | 60-70% faster than base64 data URLs; lower memory; cleanup via `URL.revokeObjectURL()` |
| HTML divs for point handles | Reliable z-index over SVG; CSS transitions; simpler hit detection |
| Inline SVG attributes over CSS classes | Prevents Tailwind specificity from overriding dynamic colors |
| Two-tier undo/redo | Per-point undo during drawing feels instant; snapshot undo handles completed shapes without per-field granularity |
| Single event handler on canvas | Better performance than per-shape listeners; scales to many shapes |
| `vectorEffect: 'non-scaling-stroke'` | Stroke width stays constant regardless of zoom level |
| Debounced JSON serialization | Uses `requestIdleCallback` with 250ms delay to avoid blocking UI during typing |
| Deep-copy snapshots | Prevents reference sharing between history entries; each snapshot is independently mutable |
| Factory pattern for renderers | `ShapeRendererFactory` makes adding new shape types a single-class addition |
