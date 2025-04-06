import type { ScanResult } from '../types/scanner';

export const DEBUG = {
  ENABLED: true,
  SAVE_FRAMES: false,
};

export class ScannerDebug {
  private static frameCount = 0;

  static logScanAttempt(mode: 'barcode' | 'text', imageData: ImageData) {
    if (!DEBUG.ENABLED) return;

    console.group(`Scan Attempt - ${mode.toUpperCase()}`);
    console.log(`Frame dimensions: ${imageData.width}x${imageData.height}`);
    console.log(`Frame data size: ${imageData.data.length} bytes`);
    
    if (DEBUG.SAVE_FRAMES) {
      this.saveFrame(imageData);
    }
  }

  static logScanResult(result: ScanResult | null) {
    if (!DEBUG.ENABLED) return;

    if (result) {
      console.log('Scan successful:', {
        value: result.value,
        confidence: result.confidence,
        timestamp: new Date(result.timestamp).toISOString(),
      });
    } else {
      console.log('No result found in frame');
    }
    console.groupEnd();
  }

  static logError(error: unknown, context: string) {
    if (!DEBUG.ENABLED) return;

    console.error(`Error in ${context}:`, error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
    console.groupEnd();
  }

  static logInfo(info: Record<string, unknown>, context: string) {
    if (!DEBUG.ENABLED) return;

    console.group(`Info - ${context}`);
    console.log(info);
    console.groupEnd();
  }

  private static saveFrame(imageData: ImageData) {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.putImageData(imageData, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    
    console.log(`Frame ${++this.frameCount}:`, dataUrl);
  }
}