import { useState, useCallback, useEffect, useRef, lazy, Suspense } from "react";
// Lazy load components
const CameraView = lazy(() => import("./components/scanner/CameraView"));
import { BarcodeScanner } from "./utils/scanners/barcodeScanner";
import { TextScanner } from "./utils/scanners/textScanner";
import { validateVin } from "./utils/vinValidator";
import { ScannerDebug } from "./utils/debug";
import type { CameraConfig, ScannerMode, ScanResult } from "./types/scanner";

function App() {
  const [config, setConfig] = useState<CameraConfig>({
    deviceId: "",
    facingMode: "environment",
    isFlashAvailable: false,
    isFlashOn: false,
  });

  const [isScanning, setIsScanning] = useState(true);
  const [mode, setMode] = useState<ScannerMode>("barcode");
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isProcessingRef = useRef(false);

  // Initialize scanners
  const barcodeScannerRef = useRef(BarcodeScanner.getInstance());
  const textScannerRef = useRef(TextScanner.getInstance());

  // Initialize camera devices
  useEffect(() => {
    const detectCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === 'videoinput');
        
        // Try to find a back-facing camera
        const backCamera = cameras.find(camera => 
          camera.label.toLowerCase().includes('back') || 
          camera.label.toLowerCase().includes('rear')
        );
        
        setConfig(prev => ({
          ...prev,
          deviceId: backCamera?.deviceId || cameras[0]?.deviceId || "",
          facingMode: backCamera ? "environment" : "user",
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to detect cameras';
        setError(message);
      }
    };

    detectCameras();
  }, []);

  useEffect(() => {
    const initializeScanners = async () => {
      try {
        setError(null);
        await Promise.all([
          textScannerRef.current.initialize(),
          barcodeScannerRef.current.initialize(),
        ]);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to initialize scanners';
        setError(message);
      }
    };

    initializeScanners();
    
    return () => {
      textScannerRef.current.terminate();
      barcodeScannerRef.current.reset();
    };
  }, []);

  const handleValidScan = useCallback((result: ScanResult) => {
    const validation = validateVin(result.value);
    
    if (validation.isValid) {
      setLastResult(validation.normalizedVin);
      setIsScanning(false);
      setError(null);
    } else {
      setError(validation.errors[0] || 'Invalid VIN detected. Please try again.');
    }
  }, []);

  const handleFrame = useCallback(async (imageData: ImageData) => {
    if (isProcessingRef.current || !isScanning) return;
    isProcessingRef.current = true;

    try {
      let result: ScanResult | null = null;

      if (mode === "barcode") {
        result = await barcodeScannerRef.current.scanImageData(imageData);
      } else if (mode === "text") {
        result = await textScannerRef.current.scanImageData(imageData);
      }

      if (result?.value) {
        handleValidScan(result);
      }
    } catch (error) {
      ScannerDebug.logError(error, 'App.handleFrame');
    } finally {
      isProcessingRef.current = false;
    }
  }, [mode, isScanning, handleValidScan]);

  const handleToggleFlash = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      isFlashOn: !prev.isFlashOn,
    }));
  }, []);

  const handleModeChange = useCallback((newMode: ScannerMode) => {
    setMode(newMode);
    setLastResult(null);
    setIsScanning(true);
    setError(null);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div className="relative h-screen">
        {/* Camera View */}
        <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-white">Loading camera...</div>}>
          <CameraView
            config={config}
            mode={mode}
            onModeChange={handleModeChange}
            onFrame={handleFrame}
            isScanning={isScanning}
            onToggleFlash={handleToggleFlash}
          />
        </Suspense>
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-6 text-center">
          <h1 className="text-2xl font-bold text-white mb-2">
            {mode === "text" ? "Scan VIN Text" : "Scan VIN Barcode"}
          </h1>
          {error && (
            <div className="mt-2 bg-red-500/90 backdrop-blur-sm rounded-lg p-3 mx-auto max-w-sm">
              <p className="text-white text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Result Overlay */}
        {lastResult && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl p-8 w-full max-w-sm text-center">
              <h2 className="text-2xl font-bold text-green-600 mb-4">VIN Found! 🎉</h2>
              <div className="bg-gray-100 rounded-lg p-4 mb-6">
                <p className="font-mono text-2xl tracking-wider break-all">{lastResult}</p>
              </div>
              <button 
                onClick={() => {
                  setIsScanning(true);
                  setLastResult(null);
                  setError(null);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3 rounded-full transition-colors w-full"
              >
                Scan Another VIN
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App