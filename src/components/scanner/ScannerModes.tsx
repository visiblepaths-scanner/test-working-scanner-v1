import React from "react";
import { FileText, Barcode } from "lucide-react";
import type { ScannerMode } from "../../types/scanner";

interface ScannerModesProps {
  currentMode: ScannerMode;
  onModeChange: (mode: ScannerMode) => void;
}

export const ScannerModes: React.FC<ScannerModesProps> = ({
  currentMode,
  onModeChange,
}) => {
  const modes = [
    { id: "text" as const, icon: FileText, label: "Text" },
    { id: "barcode" as const, icon: Barcode, label: "Barcode" }
  ];

  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4">
      {modes.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onModeChange(id)}
          className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-200 ${
            currentMode === id
              ? "bg-white text-indigo-600 shadow-lg scale-105"
              : "bg-black/30 text-white hover:bg-black/40 backdrop-blur-sm"
          }`}
        >
          <Icon className="w-5 h-5" />
          <span className="font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
};