// Image processing Web Worker
import { ImageProcessor } from './imageProcessor';

// Define the Worker context type
type WorkerGlobalScope = {
  onmessage: (this: WorkerGlobalScope, ev: MessageEvent) => void;
  postMessage: (message: any, transfer?: ArrayBuffer[]) => void;
};

declare const self: WorkerGlobalScope;

self.onmessage = async (e: MessageEvent) => {
  const { imageData, operation } = e.data;

  try {
    let result;
    switch (operation) {
      case 'adaptiveThreshold':
        result = await ImageProcessor.applyAdaptiveThreshold(imageData);
        break;
      case 'clahe':
        result = await ImageProcessor.applyCLAHE(imageData);
        break;
      case 'erosionDilation':
        // This operation is not implemented
        throw new Error('applyErosionDilation not implemented');
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    const transferables = result?.data?.buffer ? [result.data.buffer] : [];
    self.postMessage({ result }, transferables);
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
};