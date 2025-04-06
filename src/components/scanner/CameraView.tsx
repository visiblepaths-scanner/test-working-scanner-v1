import React, { useRef, useEffect, useState, useCallback } from "react";
import { Camera, Flashlight, ZoomIn, ZoomOut } from "lucide-react";
import type { CameraConfig } from "../../types/scanner";
import { ScannerOverlay } from "./ScannerOverlay";
import { ScannerModes } from "./ScannerModes";
import type { ScannerMode } from "../../types/scanner";

// Augment MediaTrackCapabilities to include zoom property
declare global {
  interface MediaTrackCapabilities {
    zoom?: {
      min: number;
      max: number;
      step: number;
    };
  }
  
  interface MediaTrackSettings {
    zoom?: number;
  }
  
  interface MediaTrackConstraintSet {
    zoom?: number;
  }
}

interface CameraViewProps {
  config: CameraConfig;
  mode: ScannerMode;
  onModeChange: (mode: ScannerMode) => void;
  onFrame?: (imageData: ImageData) => void;
  isScanning: boolean;
  onToggleFlash?: () => void;
}

const CameraView: React.FC<CameraViewProps> = ({
  config,
  mode,
  onModeChange,
  onFrame,
  isScanning,
  onToggleFlash,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const maxZoom = useRef(1);

  useEffect(() => {
    let stream: MediaStream | null = null;
    
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: config.deviceId,
            facingMode: config.facingMode,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 }
          }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // Get capabilities and set max zoom
          const track = stream.getVideoTracks()[0];
          const capabilities = track.getCapabilities();
          maxZoom.current = capabilities.zoom?.max || 1;
        }
      } catch (error) {
        console.error("Failed to start camera:", error);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [config.deviceId, config.facingMode]);

  const handleZoom = useCallback(async (direction: 'in' | 'out') => {
    if (!videoRef.current?.srcObject) return;
    
    const track = (videoRef.current.srcObject as MediaStream).getVideoTracks()[0];
    const capabilities = track.getCapabilities();
    
    if (!capabilities.zoom) return;
    
    const settings = track.getSettings();
    const step = (capabilities.zoom.max - capabilities.zoom.min) / 10;
    
    let newZoom = settings.zoom || 1;
    if (direction === 'in') {
      newZoom = Math.min(capabilities.zoom.max, newZoom + step);
    } else {
      newZoom = Math.max(capabilities.zoom.min, newZoom - step);
    }
    
    await track.applyConstraints({ advanced: [{ zoom: newZoom }] });
    setZoom(newZoom);
  }, []);

  useEffect(() => {
    if (!isScanning || !onFrame) return;

    let animationFrame: number;
    const processFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext('2d', {
          willReadFrequently: true,
          alpha: false
        });
        
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          // Draw video frame
          ctx.drawImage(video, 0, 0);
          
          // Get region of interest (middle 60% of the frame)
          const roi = {
            x: Math.floor(canvas.width * 0.2),
            y: Math.floor(canvas.height * 0.3),
            width: Math.floor(canvas.width * 0.6),
            height: Math.floor(canvas.height * 0.4)
          };
          
          const imageData = ctx.getImageData(roi.x, roi.y, roi.width, roi.height);
          onFrame(imageData);
        }
      }
      animationFrame = requestAnimationFrame(processFrame);
    };

    processFrame();
    return () => cancelAnimationFrame(animationFrame);
  }, [isScanning, onFrame]);

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />
      
      <ScannerOverlay mode={mode} isScanning={isScanning} />
      
      {/* Camera controls */}
      <div className="absolute top-4 left-4 flex gap-4">
        <div className="bg-black/50 rounded-full p-2">
          <Camera className="w-6 h-6 text-white" />
        </div>
        {config.isFlashAvailable && (
          <button
            onClick={onToggleFlash}
            className={`bg-black/50 rounded-full p-2 ${
              config.isFlashOn ? "text-yellow-300" : "text-white"
            }`}
          >
            <Flashlight className="w-6 h-6" />
          </button>
        )}
        {maxZoom.current > 1 && (
          <div className="flex gap-2">
            <button
              onClick={() => handleZoom('out')}
              className="bg-black/50 rounded-full p-2 text-white"
              disabled={zoom <= 1}
            >
              <ZoomOut className="w-6 h-6" />
            </button>
            <button
              onClick={() => handleZoom('in')}
              className="bg-black/50 rounded-full p-2 text-white"
              disabled={zoom >= maxZoom.current}
            >
              <ZoomIn className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>

      <ScannerModes currentMode={mode} onModeChange={onModeChange} />
    </div>
  );
}

export default CameraView;