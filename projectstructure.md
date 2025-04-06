
0406-project-v1/
├── .bolt/                      # Build cache directory
├── .gitignore                  # Git ignore file
├── 0406-improvement.md         # Project improvement documentation
├── dist/                       # Build output directory
│   └── ... (build artifacts)
├── eslint.config.js            # ESLint configuration
├── index.html                  # Main HTML entry point
├── node_modules/               # Dependencies directory
├── package-lock.json           # NPM dependency lock file
├── package.json                # Project configuration
├── postcss.config.js           # PostCSS configuration
├── src/                        # Source code
│   ├── App.tsx                 # Main application component
│   ├── components/             # UI components
│   │   └── scanner/            # Scanner related components
│   │       ├── CameraView.tsx  # Camera view component (lazy loaded)
│   │       ├── ScannerModes.tsx # Scanner mode switcher
│   │       └── ScannerOverlay.tsx # Visual overlay for scan area
│   ├── index.css               # Main CSS file
│   ├── main.tsx                # App entry point with lazy loading
│   ├── types/                  # TypeScript type definitions
│   │   ├── scanner.ts          # Scanner related types
│   │   ├── tesseract.d.ts      # Tesseract.js type declarations
│   │   └── vin.ts              # VIN (Vehicle Identification Number) types
│   ├── utils/                  # Utility functions
│   │   ├── debug.ts            # Debugging utilities
│   │   ├── scanners/           # Scanner implementations
│   │   │   ├── barcodeScanner.ts # Barcode scanner using ZXing
│   │   │   ├── textScanner.ts  # Text OCR scanner using Tesseract
│   │   │   └── textScanner/    # Text scanner sub-modules
│   │   │       ├── imageProcessor.ts
│   │   │       ├── imageProcessor.worker.ts
│   │   │       ├── patterns.ts
│   │   │       └── segmentation.ts
│   │   └── vinValidator.ts     # VIN validation utilities
│   └── vite-env.d.ts           # Vite environment type declarations
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.app.json           # TypeScript config for app
├── tsconfig.json               # Base TypeScript configuration
├── tsconfig.node.json          # TypeScript config for Node.js
└── vite.config.ts              # Vite bundler configuration (optimized)


This React application is built with:
Vite as the build tool (now optimized with chunk splitting)
TypeScript for type safety
Tailwind CSS for styling
React with lazy loading components
ZXing for barcode scanning
Tesseract.js for text recognition (OCR)
The code has been optimized with:
Lazy loading for App and CameraView components
Manual chunk splitting for vendor libraries (React, ZXing, Tesseract)
Increased chunk size warning threshold
The application is a VIN (Vehicle Identification Number) scanner that works through both barcode scanning and OCR text recognition, with a clean modern UI built using Tailwind CSS.












