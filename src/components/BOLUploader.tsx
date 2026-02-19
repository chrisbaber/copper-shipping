"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

interface BOLUploaderProps {
  onExtracted: (data: Record<string, unknown>) => void;
  onError: (error: string) => void;
}

/** Compress an image to fit within maxWidth/maxHeight and target file size */
async function compressImage(file: File, maxWidth = 2048, maxHeight = 2048, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Scale down if needed
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to create canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to compress image"));
            return;
          }
          resolve(blob);
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => reject(new Error("Failed to load image for compression"));
    img.src = URL.createObjectURL(file);
  });
}

export function BOLUploader({ onExtracted, onError }: BOLUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("");

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);

      setIsProcessing(true);
      setStatusText("Compressing image...");
      try {
        // Compress image to avoid 413 Payload Too Large on Vercel (4.5MB limit)
        let uploadFile: File | Blob = file;
        if (file.size > 3 * 1024 * 1024) {
          uploadFile = await compressImage(file);
        }

        setStatusText("Extracting data from BOL...");

        const formData = new FormData();
        formData.append("file", uploadFile, file.name);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 55000); // 55s client timeout

        const response = await fetch("/api/extract", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          let errorMsg = `Extraction failed (${response.status})`;
          try {
            const result = await response.json();
            errorMsg = result.error || errorMsg;
          } catch {
            // Non-JSON response (e.g. 413, 504 HTML pages)
            if (response.status === 413) {
              errorMsg = "Photo is too large. Please try taking the photo in lower resolution or from farther away.";
            } else if (response.status === 504) {
              errorMsg = "Extraction timed out. Please try again — it usually works on the second attempt.";
            }
          }
          onError(errorMsg);
          return;
        }

        const result = await response.json();
        onExtracted(result.data);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          onError("Extraction timed out. Please try again.");
        } else {
          onError("Failed to connect to extraction service. Check your internet connection and try again.");
        }
      } finally {
        setIsProcessing(false);
        setStatusText("");
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
      "image/heic": [".heic"],
      "image/heif": [".heif"],
    },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
    disabled: isProcessing,
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          relative rounded-xl border-2 border-dashed p-8 sm:p-10 text-center transition-all duration-200 cursor-pointer
          ${isDragActive ? "border-blue-500 bg-blue-50/80" : "border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/30"}
          ${isProcessing ? "pointer-events-none opacity-60" : ""}
        `}
      >
        <input {...getInputProps()} capture="environment" />

        {isProcessing ? (
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{statusText || "Processing..."}</p>
              <p className="text-xs text-slate-500 mt-1">AI is reading your document</p>
            </div>
          </div>
        ) : preview ? (
          <div className="flex flex-col items-center gap-4">
            <img src={preview} alt="BOL Preview" className="max-h-48 rounded-lg object-contain shadow-sm" />
            <p className="text-sm text-slate-500">Drop a new image to replace, or click to browse</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold text-slate-800">
                {isDragActive ? "Drop your BOL photo here" : "Upload Bill of Lading"}
              </p>
              <p className="mt-1.5 text-sm text-slate-500">Drag and drop or tap to take a photo</p>
              <p className="text-xs text-slate-400 mt-1">JPEG, PNG, or WebP up to 20MB</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
