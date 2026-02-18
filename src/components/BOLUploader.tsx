"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

interface BOLUploaderProps {
  onExtracted: (data: Record<string, unknown>) => void;
  onError: (error: string) => void;
}

export function BOLUploader({ onExtracted, onError }: BOLUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      // Show preview
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);

      // Upload and extract
      setIsProcessing(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/extract", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          onError(result.error || "Failed to extract data from BOL");
          return;
        }

        onExtracted(result.data);
      } catch {
        onError("Failed to connect to extraction service");
      } finally {
        setIsProcessing(false);
      }
    },
    [onExtracted, onError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled: isProcessing,
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          relative rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer
          ${isDragActive ? "border-blue-500 bg-blue-50" : "border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50"}
          ${isProcessing ? "pointer-events-none opacity-60" : ""}
        `}
      >
        <input {...getInputProps()} />

        {isProcessing ? (
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600" />
            <p className="text-sm font-medium text-zinc-700">Extracting data from BOL...</p>
            <p className="text-xs text-zinc-500">Claude AI is reading your document</p>
          </div>
        ) : preview ? (
          <div className="flex flex-col items-center gap-3">
            <img src={preview} alt="BOL Preview" className="max-h-48 rounded-lg object-contain" />
            <p className="text-sm text-zinc-600">Drop a new image to replace, or click to browse</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100">
              <svg className="h-7 w-7 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-700">
                {isDragActive ? "Drop your BOL photo here" : "Upload Bill of Lading"}
              </p>
              <p className="mt-1 text-xs text-zinc-500">Drag and drop or tap to take a photo</p>
              <p className="text-xs text-zinc-400">JPEG, PNG, or WebP up to 10MB</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
