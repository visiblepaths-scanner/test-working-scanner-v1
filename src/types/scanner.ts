export type ScannerMode = "barcode" | "text" | "manual";

export type ScannerStatus = {
  isScanning: boolean;
  mode: ScannerMode;
  error: string | null;
  lastResult: string | null;
};

export type CameraConfig = {
  deviceId: string;
  facingMode: "environment" | "user";
  isFlashAvailable: boolean;
  isFlashOn: boolean;
};

export type ScanResult = {
  value: string;
  confidence: number;
  source: ScannerMode;
  timestamp: number;
};