import { createWorker, Worker } from 'tesseract.js';
import type { ScanResult } from '../../types/scanner';
import { ScannerDebug } from '../debug';

export class TextScanner {
  private static instance: TextScanner;
  private worker: Worker | null = null;
  private isInitialized = false;
  private readonly VIN_LENGTH = 17;

  private constructor() {}

  public static getInstance(): TextScanner {
    if (!TextScanner.instance) {
      TextScanner.instance = new TextScanner();
    }
    return TextScanner.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      this.worker = await createWorker('eng', 1, {
        logger: (m: any) => ScannerDebug.logInfo(m, 'Tesseract.initialize')
      });
      
      // Configure Tesseract for VIN recognition
      if (!this.worker) {
        throw new Error('Worker initialization failed');
      }
      
      await this.worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789',
        tessedit_pageseg_mode: 7, // Treat as single line
        tessedit_ocr_engine_mode: '2', // Use neural nets mode
      });
      
      this.isInitialized = true;
      ScannerDebug.logInfo({ message: 'Text scanner initialized successfully' }, 'TextScanner.initialize');
    } catch (error) {
      ScannerDebug.logError(error, 'TextScanner.initialize');
      throw error;
    }
  }

  public async scanImageData(imageData: ImageData): Promise<ScanResult | null> {
    try {
      if (!this.isInitialized || !this.worker) {
        await this.initialize();
      }

      ScannerDebug.logScanAttempt('text', imageData);

      // Create a canvas to process the image
      const canvas = document.createElement('canvas');
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      const ctx = canvas.getContext('2d', {
        willReadFrequently: true,
        alpha: false
      });
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Draw and preprocess the image
      ctx.putImageData(imageData, 0, 0);
      
      // Apply contrast enhancement
      ctx.filter = 'contrast(1.4) brightness(1.1)';
      ctx.drawImage(canvas, 0, 0);
      ctx.filter = 'none';

      // Perform OCR
      if (!this.worker) {
        throw new Error('Worker is not initialized');
      }
      
      const result = await this.worker.recognize(canvas);
      
      // Process the results
      const lines = result.data.lines
        .map(line => ({
          text: line.text.replace(/[^A-Z0-9]/g, ''),
          confidence: line.confidence / 100
        }))
        .filter(line => line.text.length >= this.VIN_LENGTH);

      // Find the most likely VIN
      for (const line of lines) {
        const possibleVins = this.findPossibleVins(line.text);
        
        for (const vin of possibleVins) {
          if (this.isValidVinFormat(vin)) {
            const scanResult: ScanResult = {
              value: vin,
              confidence: line.confidence,
              source: 'text',
              timestamp: Date.now()
            };
            
            ScannerDebug.logScanResult(scanResult);
            return scanResult;
          }
        }
      }

      ScannerDebug.logScanResult(null);
      return null;
    } catch (error) {
      ScannerDebug.logError(error, 'TextScanner.scanImageData');
      return null;
    }
  }

  private findPossibleVins(text: string): string[] {
    const vins: string[] = [];
    
    // Look for VIN-like patterns
    const pattern = /[A-HJ-NPR-Z0-9]{17}/g;
    let match;
    
    while ((match = pattern.exec(text)) !== null) {
      vins.push(match[0]);
    }
    
    // Also try sliding window approach
    if (text.length >= this.VIN_LENGTH) {
      for (let i = 0; i <= text.length - this.VIN_LENGTH; i++) {
        const possibleVin = text.slice(i, i + this.VIN_LENGTH);
        if (this.isValidVinFormat(possibleVin)) {
          vins.push(possibleVin);
        }
      }
    }
    
    return [...new Set(vins)]; // Remove duplicates
  }

  private isValidVinFormat(vin: string): boolean {
    // Basic VIN format validation
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) return false;
    
    // Check first character
    if (!/^[A-HJ-NPR-Z1-5]/.test(vin)) return false;
    
    // Check position 9 (check digit)
    if (!/[0-9X]/.test(vin[8])) return false;
    
    // Check for invalid sequences
    if (/(.)\1{4}/.test(vin)) return false;
    
    return true;
  }

  public terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.isInitialized = false;
  }
}