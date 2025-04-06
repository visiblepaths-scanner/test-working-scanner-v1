declare module 'tesseract.js' {
  export function createWorker(
    language?: string,
    oem?: number,
    options?: {
      logger?: (log: any) => void;
      errorHandler?: (error: any) => void;
      workerPath?: string;
      corePath?: string;
      langPath?: string;
    }
  ): Promise<Worker>;

  export interface Worker {
    load(jobId?: string): Promise<any>;
    writeText(text: string, jobId?: string): Promise<any>;
    readText(jobId?: string): Promise<any>;
    removeText(jobId?: string): Promise<any>;
    FS(method: string, args: any): Promise<any>;
    setParameters(params: Partial<WorkerParams>): Promise<any>;
    recognize(image: ImageLike, options?: any): Promise<RecognizeResult>;
    detect(image: ImageLike): Promise<DetectResult>;
    terminate(): Promise<any>;
    reinitialize(newOptions?: any): Promise<any>;
    getImage(jobId?: string): Promise<any>;
    getPDF(title?: string, textonly?: boolean, jobId?: string): Promise<any>;
  }

  export interface WorkerParams {
    tessedit_ocr_engine_mode: string;
    tessedit_pageseg_mode: number | string;
    tessedit_char_whitelist: string;
    [key: string]: string | number;
  }

  export type ImageLike = string | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | OffscreenCanvas | ImageBitmap | ImageData;

  export interface RecognizeResult {
    data: {
      text: string;
      confidence: number;
      blocks: any[];
      paragraphs: any[];
      lines: Array<{
        text: string;
        confidence: number;
        bbox: {
          x0: number;
          y0: number;
          x1: number;
          y1: number;
        };
        words: any[];
        symbols: any[];
      }>;
      words: any[];
      symbols: any[];
    };
  }

  export interface DetectResult {
    data: {
      orientation: number;
      scripts: Array<{
        script: string;
        confidence: number;
      }>;
    };
  }

  // For backwards compatibility with existing code
  namespace Tesseract {
    type Worker = import('tesseract.js').Worker;
    type WorkerParams = import('tesseract.js').WorkerParams;
    type ImageLike = import('tesseract.js').ImageLike;
    type RecognizeResult = import('tesseract.js').RecognizeResult;
    type DetectResult = import('tesseract.js').DetectResult;
  }
} 