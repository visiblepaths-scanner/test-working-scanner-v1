import { BrowserMultiFormatReader, BarcodeFormat } from '@zxing/browser';
import { DecodeHintType } from '@zxing/library';
import type { Result } from '@zxing/library';
import type { ScanResult } from '../../types/scanner';
import { ScannerDebug } from '../debug';

export class BarcodeScanner {
  private reader: BrowserMultiFormatReader;
  private static instance: BarcodeScanner;
  private isInitialized = false;
  private hasCamera: boolean = false;

  private constructor() {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.CODE_39,
      BarcodeFormat.CODE_128,
      BarcodeFormat.DATA_MATRIX,
      BarcodeFormat.QR_CODE,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    this.reader = new BrowserMultiFormatReader(hints);
  }

  public static getInstance(): BarcodeScanner {
    if (!BarcodeScanner.instance) {
      BarcodeScanner.instance = new BarcodeScanner();
    }
    return BarcodeScanner.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check if we can access the camera
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.hasCamera = devices.some(device => device.kind === 'videoinput');
      
      if (!this.hasCamera) {
        ScannerDebug.logError(new Error('No camera devices found - continuing in fallback mode'), 'BarcodeScanner.initialize');
      }

      this.isInitialized = true;
      ScannerDebug.logInfo({ message: 'Barcode scanner initialized successfully' }, 'BarcodeScanner.initialize');
    } catch (error) {
      ScannerDebug.logError(error, 'BarcodeScanner.initialize');
      this.isInitialized = true; // Still mark as initialized to prevent repeated attempts
    }
  }

  public async scanImageData(imageData: ImageData): Promise<ScanResult | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      ScannerDebug.logScanAttempt('barcode', imageData);

      // Create a canvas to draw the ImageData
      const canvas = document.createElement('canvas');
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      const ctx = canvas.getContext('2d', {
        willReadFrequently: true,
        alpha: false
      });
      
      if (!ctx) {
        ScannerDebug.logError(new Error('Could not get canvas context'), 'BarcodeScanner.scanImageData');
        return null;
      }
      
      ctx.putImageData(imageData, 0, 0);

      // Decode from the canvas element
      const result: Result = await this.reader.decodeFromCanvas(canvas);
      
      if (!result?.getText()) {
        ScannerDebug.logScanResult(null);
        return null;
      }

      const scanResult: ScanResult = {
        value: result.getText(),
        confidence: 1,
        source: 'barcode',
        timestamp: Date.now(),
      };

      ScannerDebug.logScanResult(scanResult);
      return scanResult;
    } catch (error) {
      if (error instanceof Error && error.message !== 'No MultiFormat Readers were able to detect the code.') {
        ScannerDebug.logError(error, 'BarcodeScanner.scanImageData');
      }
      return null;
    }
  }

  public reset(): void {
    try {
      this.isInitialized = false;
      this.hasCamera = false;
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.CODE_39,
        BarcodeFormat.CODE_128,
        BarcodeFormat.DATA_MATRIX,
        BarcodeFormat.QR_CODE,
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      this.reader = new BrowserMultiFormatReader(hints);
      
      ScannerDebug.logInfo({ message: 'Barcode scanner reset successfully' }, 'BarcodeScanner.reset');
    } catch (error) {
      ScannerDebug.logError(error, 'BarcodeScanner.reset');
    }
  }
}