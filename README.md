# VIN Scanner

A vehicle identification number (VIN) scanner application built with React, TypeScript, and Vite. This application supports both barcode scanning (using ZXing) and text recognition (using Tesseract.js OCR).

## Features

- Scan VINs using device camera
- Two scanning modes:
  - Barcode scanning
  - Text recognition with OCR
- Automatic VIN validation
- Responsive UI with loading and error states

## Security Note

This project uses Vite 4.x which has a known moderate security vulnerability ([GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99)) in its development server. The vulnerability allows websites to send requests to the Vite development server and read the responses.

**Security measures implemented:**
- Development server only listens on localhost
- CORS is disabled
- Strict port access is enforced
- Explicit HMR origin is set

**Important:** This vulnerability only affects the development environment. Production builds are not affected.

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/visiblepaths-scanner/test-working-scanner-v1.git
cd test-working-scanner-v1

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Technology Stack

- **Frontend Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Barcode Scanning**: ZXing
- **Text Recognition**: Tesseract.js 