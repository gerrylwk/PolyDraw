# PolyDraw

A simple SVG polygon editor built with React, TypeScript, and Vite. PolyDraw allows you to create and edit polygon coordinates for image annotation, computer vision tasks, and SVG generation.
 
## 🚀 Features

### Drawing Tools
- **Polygon Tool**: Click to create polygon vertices, click the first point or `esc` button to complete
- **Select Tool**: Drag and move existing polygon points by hovering over the point
- **Point Selection**: Click on a point to select them
- **Delete Points**: Press Delete key to remove selected point

### Image Support
- **Image Upload**: Upload background images (JPG, PNG, GIF, etc.)
- **Auto-fit View**: Automatically scales and centers uploaded images
- **Snap to Edges**: Points snap to image boundaries for precise annotation
- **Adjustable Snap Distance**: Customize snap threshold (5-50px)

### View Controls
- **Zoom In/Out**: Mouse wheel or zoom buttons (10% - 1000%)
- **Pan Canvas**: Drag to move around the canvas
- **Reset View**: Fit image to canvas with one click
- **Grid Background**: Visual grid for better positioning

### Polygon Management
- **Multiple Polygons**: Create unlimited polygons
- **Custom Names**: Edit polygon names for organization
- **Opacity Control**: Adjust polygon transparency (0-100%)
- **Visual Feedback**: Selected points highlighted in red
- **Delete Polygons**: Remove individual polygons or clear all
- **Polygon Simplification**: Reduce point count using RDP algorithm with interactive preview
  - Adjustable tolerance slider (1-50px)
  - Live preview showing kept vs removed points
  - Undo support with reset to original
  - Maintains minimum 3 points for valid polygons
- **Crop to Image**: Extract polygon region with transparent background
  - One-click crop button beside delete button
  - Automatically clamps to image boundaries
  - Downloads as PNG with smart filename generation
  - Minimum 1x1px crop size validation

### Output Options
- **Python Format**: Generate Python coordinate arrays
- **SVG String Format**: Export as SVG polygon coordinates
- **Normalized Coordinates**: Option to export as 0-1 normalized values
- **Copy to Clipboard**: One-click copying of generated code
- **Direct Editing**: Edit SVG strings and apply changes

### Advanced Features
- **Keyboard Shortcuts**:
  - `Delete`: Remove selected point
  - `Escape`: Cancel current polygon creation
- **Real-time Preview**: See polygon changes as you draw
- **Responsive Design**: Works on desktop and tablet devices
- **TypeScript**: Full type safety and IntelliSense support

## 🛠️ Installation & Setup

### Prerequisites
- Docker
- Docker Compose

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd PolyDraw
   ```

2. **Start with Docker Compose**
   ```bash
   docker-compose up -d --build
   ```

3. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

### Stop the application
```bash
docker-compose down
```

## 📖 How to Use

### Creating Polygons
1. Select the **Polygon** tool from the left panel
2. Click on the canvas to place vertices
3. Click the first point again to complete the polygon
4. Press `Escape` to cancel polygon creation

### Editing Polygons
1. Select the **Select** tool
2. Click and drag points to move them
3. Click a point to select it (highlighted in red)
4. Press `Delete` to remove selected points
5. Use the coordinate inputs for precise positioning

### Working with Images
1. Click **Choose File** to upload an image
2. The image will automatically fit to the canvas
3. Enable **Snap to Image Edges** for precise boundary annotation
4. Adjust snap distance as needed

### Exporting Coordinates
1. Create your polygons
2. Choose export format (Python or SVG String)
3. Toggle **Normalize Coordinates** if needed
4. Click **Copy to Clipboard** to copy the code

### Cropping Polygon Regions
1. Create a polygon around the region you want to extract
2. Locate the polygon in the Edit Coordinates section
3. Click the blue **crop button** next to the delete button
4. The cropped image downloads automatically as PNG with transparent background
5. Filename format: `{originalname}_{polygonname}_cropped.png`

## 🎯 Use Cases

- **Computer Vision**: Create training data for object detection
- **Image Annotation**: Mark regions of interest in images
- **Image Extraction**: Crop specific regions from images with transparency
- **Asset Creation**: Extract game sprites, UI elements, or image components
- **SVG Generation**: Create vector graphics from coordinates
- **GIS Applications**: Define geographic regions

## 🛠️ Technical Details

### Tech Stack
- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Testing**: Vitest + React Testing Library
- **Development**: ESLint for code quality

### Project Structure
```
PolyDraw/
├── src/                 # Source code
│   ├── components/      # React components
│   │   ├── Canvas/      # Canvas component
│   │   ├── UI/          # UI components (Button, Input)
│   │   └── Widgets/     # Feature widgets
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── App.tsx          # Main application component
│   ├── main.tsx         # Application entry point
│   └── index.css        # Global styles
├── tests/               # Test files (mirrors src structure)
│   ├── components/      # Component tests
│   ├── utils/           # Utility tests
│   ├── hooks/           # Hook tests
│   └── setup/           # Test configuration
├── public/              # Static assets
├── package.json         # Dependencies and scripts
├── vite.config.ts       # Vite configuration
├── vitest.config.ts     # Vitest test configuration
├── tailwind.config.js   # Tailwind CSS configuration
└── tsconfig.json        # TypeScript configuration
```

### Testing

The project includes comprehensive unit tests:

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

See [TESTING.md](TESTING.md) for detailed testing documentation and [TEST_ORGANIZATION.md](TEST_ORGANIZATION.md) for information about the test structure.



## 🆘 Support

If you encounter any issues or have questions:
1. Check the browser console for error messages
2. Ensure you're using a modern browser (Chrome, Firefox, Safari, Edge)
3. Try refreshing the page if the canvas becomes unresponsive
4. Create an issue in the repository with details about the problem

---

**Happy Polygon Drawing! 🎨**