import { createWorker, Worker } from 'tesseract.js';
import { ScannerDebug } from '../../debug';

export class ImageProcessor {
  private static worker: Worker | null = null;
  private static isInitializing = false;
  private static readonly MOBILE_SCREEN_PARAMS = {
    brightness: 1.2,
    contrast: 1.3,
    gamma: 0.8
  };

  static async initialize() {
    if (this.worker || this.isInitializing) return;
    
    try {
      this.isInitializing = true;
      this.worker = await createWorker('eng', 1, {
        logger: (m: any) => ScannerDebug.logInfo(m, 'Tesseract.initialize'),
        workerPath: '/node_modules/tesseract.js/dist/worker.min.js',
        corePath: '/node_modules/tesseract.js-core/tesseract-core.wasm.js',
        langPath: '/node_modules/tesseract.js-core/lang-data'
      });
      
      // Configure Tesseract for better text recognition
      if (!this.worker) {
        throw new Error('Worker initialization failed');
      }
      
      await this.worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789',
        tessedit_pageseg_mode: 7, // Treat as single line
        tessedit_ocr_engine_mode: '2', // Use neural nets mode
        textord_heavy_nr: '1', // Heavy noise reduction
        textord_min_linesize: '2.5', // Minimum text size
        classify_min_scale: '0.5', // Allow smaller text
        tessedit_do_invert: '0', // Don't invert colors
      });
      
      this.isInitializing = false;
    } catch (error) {
      this.isInitializing = false;
      throw error;
    }
  }

  static async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }

  static async recognizeCharacter(imageData: ImageData, options: {
    allowlist: string;
    tessedit_char_whitelist: string;
  }): Promise<{ text: string; confidence: number }> {
    if (!this.worker) {
      await this.initialize();
    }

    // Apply screen-specific preprocessing
    const processedData = await this.preprocessForScreenType(imageData);
    const canvas = this.imageDataToCanvas(processedData);
    
    // Set character whitelist and recognition parameters
    if (!this.worker) {
      throw new Error('Worker is not initialized');
    }
    
    await this.worker.setParameters({
      tessedit_char_whitelist: options.allowlist,
      tessedit_pageseg_mode: 10, // Treat as single character
    });

    const result = await this.worker.recognize(canvas);
    
    return {
      text: result.data.text.replace(/[^A-Z0-9]/g, ''), // Remove any non-alphanumeric chars
      confidence: result.data.confidence
    };
  }

  static imageDataToCanvas(imageData: ImageData): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  private static async preprocessForScreenType(imageData: ImageData): Promise<ImageData> {
    // Detect if image is likely from a screen
    const isScreen = this.detectScreenSource(imageData);
    
    if (isScreen) {
      // Apply screen-specific processing
      return this.processScreenImage(imageData);
    } else {
      // Apply standard document processing
      return this.processDocumentImage(imageData);
    }
  }

  private static detectScreenSource(imageData: ImageData): boolean {
    // Count high contrast transitions typical of screens
    let screenPatternCount = 0;
    const threshold = 50;
    
    for (let y = 0; y < imageData.height; y += 2) {
      for (let x = 0; x < imageData.width - 1; x++) {
        const i = (y * imageData.width + x) * 4;
        const nextI = i + 4;
        
        const diff = Math.abs(imageData.data[i] - imageData.data[nextI]);
        if (diff > threshold) {
          screenPatternCount++;
        }
      }
    }
    
    // If high contrast transitions exceed threshold, likely a screen
    return screenPatternCount > (imageData.width * imageData.height * 0.01);
  }

  private static async processScreenImage(imageData: ImageData): Promise<ImageData> {
    // Apply screen-specific processing pipeline
    let processed = imageData;
    
    // 1. Apply moiré pattern reduction
    processed = await this.reduceMoirePattern(processed);
    
    // 2. Adjust brightness and contrast for screen capture
    processed = this.adjustImageParams(processed, this.MOBILE_SCREEN_PARAMS);
    
    // 3. Apply sharpening for screen text
    processed = await this.sharpenImage(processed);
    
    // 4. Apply final CLAHE and thresholding
    processed = await this.applyCLAHE(processed);
    processed = await this.applyAdaptiveThreshold(processed);
    
    return processed;
  }

  private static async processDocumentImage(imageData: ImageData): Promise<ImageData> {
    // Standard document processing pipeline
    let processed = imageData;
    
    // 1. Apply CLAHE for contrast enhancement
    processed = await this.applyCLAHE(processed);
    
    // 2. Apply noise reduction
    processed = await this.applyNoiseReduction(processed);
    
    // 3. Apply adaptive thresholding
    processed = await this.applyAdaptiveThreshold(processed);
    
    return processed;
  }

  private static async reduceMoirePattern(imageData: ImageData): Promise<ImageData> {
    const result = new ImageData(imageData.width, imageData.height);
    const kernelSize = 3;
    
    for (let y = 0; y < imageData.height; y++) {
      for (let x = 0; x < imageData.width; x++) {
        const i = (y * imageData.width + x) * 4;
        let sumR = 0, sumG = 0, sumB = 0, count = 0;
        
        // Apply Gaussian-like kernel
        for (let ky = -kernelSize; ky <= kernelSize; ky++) {
          for (let kx = -kernelSize; kx <= kernelSize; kx++) {
            const ny = y + ky;
            const nx = x + kx;
            if (ny >= 0 && ny < imageData.height && nx >= 0 && nx < imageData.width) {
              const ni = (ny * imageData.width + nx) * 4;
              const weight = Math.exp(-(kx * kx + ky * ky) / (2 * kernelSize * kernelSize));
              sumR += imageData.data[ni] * weight;
              sumG += imageData.data[ni + 1] * weight;
              sumB += imageData.data[ni + 2] * weight;
              count += weight;
            }
          }
        }
        
        result.data[i] = sumR / count;
        result.data[i + 1] = sumG / count;
        result.data[i + 2] = sumB / count;
        result.data[i + 3] = 255;
      }
    }
    
    return result;
  }

  private static async sharpenImage(imageData: ImageData): Promise<ImageData> {
    const result = new ImageData(imageData.width, imageData.height);
    const kernel = [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0
    ];
    
    for (let y = 1; y < imageData.height - 1; y++) {
      for (let x = 1; x < imageData.width - 1; x++) {
        const i = (y * imageData.width + x) * 4;
        let sum = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const ni = ((y + ky) * imageData.width + (x + kx)) * 4;
            sum += imageData.data[ni] * kernel[(ky + 1) * 3 + (kx + 1)];
          }
        }
        
        result.data[i] = Math.min(255, Math.max(0, sum));
        result.data[i + 1] = result.data[i];
        result.data[i + 2] = result.data[i];
        result.data[i + 3] = 255;
      }
    }
    
    return result;
  }

  private static adjustImageParams(
    imageData: ImageData,
    params: { brightness: number; contrast: number; gamma: number }
  ): ImageData {
    const result = new ImageData(imageData.width, imageData.height);
    
    for (let i = 0; i < imageData.data.length; i += 4) {
      for (let j = 0; j < 3; j++) {
        // Apply gamma correction
        let value = imageData.data[i + j] / 255;
        value = Math.pow(value, 1 / params.gamma);
        
        // Apply brightness
        value = value * params.brightness;
        
        // Apply contrast
        value = (value - 0.5) * params.contrast + 0.5;
        
        result.data[i + j] = Math.min(255, Math.max(0, Math.round(value * 255)));
      }
      result.data[i + 3] = 255;
    }
    
    return result;
  }

  static async applyCLAHE(imageData: ImageData): Promise<ImageData> {
    const result = new ImageData(imageData.width, imageData.height);
    const histSize = 256;
    const windowSize = 16;
    const clipLimit = 4.0;
    
    for (let y = 0; y < imageData.height; y += windowSize) {
      for (let x = 0; x < imageData.width; x += windowSize) {
        const histogram = new Array(histSize).fill(0);
        const windowHeight = Math.min(windowSize, imageData.height - y);
        const windowWidth = Math.min(windowSize, imageData.width - x);
        
        // Build histogram
        for (let wy = 0; wy < windowHeight; wy++) {
          for (let wx = 0; wx < windowWidth; wx++) {
            const i = ((y + wy) * imageData.width + (x + wx)) * 4;
            histogram[imageData.data[i]]++;
          }
        }
        
        // Clip histogram
        const limit = (windowHeight * windowWidth * clipLimit) / histSize;
        let clippedPixels = 0;
        for (let i = 0; i < histSize; i++) {
          if (histogram[i] > limit) {
            clippedPixels += histogram[i] - limit;
            histogram[i] = limit;
          }
        }
        
        // Redistribute clipped pixels
        const redistrib = Math.floor(clippedPixels / histSize);
        for (let i = 0; i < histSize; i++) {
          histogram[i] += redistrib;
        }
        
        // Create lookup table
        const lut = new Array(histSize).fill(0);
        let sum = 0;
        for (let i = 0; i < histSize; i++) {
          sum += histogram[i];
          lut[i] = Math.round((sum * 255) / (windowHeight * windowWidth));
        }
        
        // Apply to window
        for (let wy = 0; wy < windowHeight; wy++) {
          for (let wx = 0; wx < windowWidth; wx++) {
            const i = ((y + wy) * imageData.width + (x + wx)) * 4;
            const value = lut[imageData.data[i]];
            result.data[i] = value;
            result.data[i + 1] = value;
            result.data[i + 2] = value;
            result.data[i + 3] = 255;
          }
        }
      }
    }
    
    return result;
  }

  static async applyAdaptiveThreshold(imageData: ImageData): Promise<ImageData> {
    const result = new ImageData(imageData.width, imageData.height);
    const windowSize = 15;
    const C = 5;

    for (let y = 0; y < imageData.height; y++) {
      for (let x = 0; x < imageData.width; x++) {
        const i = (y * imageData.width + x) * 4;
        let sum = 0;
        let count = 0;

        for (let wy = -windowSize; wy <= windowSize; wy++) {
          for (let wx = -windowSize; wx <= windowSize; wx++) {
            const ny = y + wy;
            const nx = x + wx;
            if (ny >= 0 && ny < imageData.height && nx >= 0 && nx < imageData.width) {
              const ni = (ny * imageData.width + nx) * 4;
              sum += imageData.data[ni];
              count++;
            }
          }
        }

        const mean = sum / count;
        const threshold = mean - C;
        const value = imageData.data[i] > threshold ? 255 : 0;

        result.data[i] = value;
        result.data[i + 1] = value;
        result.data[i + 2] = value;
        result.data[i + 3] = 255;
      }
    }

    return result;
  }

  static async applyNoiseReduction(imageData: ImageData): Promise<ImageData> {
    const result = new ImageData(imageData.width, imageData.height);
    const kernelSize = 3;
    const halfKernel = Math.floor(kernelSize / 2);

    for (let y = 0; y < imageData.height; y++) {
      for (let x = 0; x < imageData.width; x++) {
        const i = (y * imageData.width + x) * 4;
        let sum = 0;
        let count = 0;

        for (let ky = -halfKernel; ky <= halfKernel; ky++) {
          for (let kx = -halfKernel; kx <= halfKernel; kx++) {
            const ny = y + ky;
            const nx = x + kx;
            if (ny >= 0 && ny < imageData.height && nx >= 0 && nx < imageData.width) {
              const ni = (ny * imageData.width + nx) * 4;
              sum += imageData.data[ni];
              count++;
            }
          }
        }

        const value = Math.round(sum / count);
        result.data[i] = value;
        result.data[i + 1] = value;
        result.data[i + 2] = value;
        result.data[i + 3] = 255;
      }
    }

    return result;
  }
}