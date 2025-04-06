import React from "react";
import type { ScannerMode } from "../../types/scanner";

interface ScannerOverlayProps {
  mode: ScannerMode;
  isScanning: boolean;
}

export const ScannerOverlay: React.FC<ScannerOverlayProps> = ({
  mode,
  isScanning,
}) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* Darkened overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Scanning area */}
      <div
        className={`relative ${
          mode === "text" ? "w-4/5 h-32" : "w-4/5 h-48"
        } transition-all duration-300`}
      >
        {/* Cut-out effect */}
        <div className="absolute inset-0 bg-transparent border-2 border-white/80 rounded-lg overflow-hidden">
          {/* Corner markers */}
          <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-indigo-400 rounded-tl-lg" />
          <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-indigo-400 rounded-tr-lg" />
          <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-indigo-400 rounded-bl-lg" />
          <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-indigo-400 rounded-br-lg" />
          
          {/* Scanning animation */}
          {isScanning && (
            <div 
              className={`absolute ${
                mode === "text" 
                  ? "w-full h-0.5 top-1/2 -translate-y-1/2 animate-scan-horizontal" 
                  : "h-full w-0.5 left-1/2 -translate-x-1/2 animate-scan-vertical"
              } bg-indigo-400/60 blur-sm`} 
            />
          )}
        </div>

        {/* Helper text */}
        <div className="absolute -bottom-12 left-0 right-0 text-center">
          <p className="text-white/90 text-sm">
            {mode === "text" 
              ? "Position the VIN text inside the box" 
              : "Center the barcode in the frame"}
          </p>
        </div>
      </div>
    </div>
  );
};