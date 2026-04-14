"use client";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

interface UploadZoneProps {
  label: string;
  accept?: string;
  onFile: (file: File) => void;
  file: File | null;
  hint?: string;
}

export default function UploadZone({
  label,
  onFile,
  file,
  hint,
}: UploadZoneProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) onFile(accepted[0]);
    },
    [onFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`relative border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all duration-150 text-center
        ${isDragActive ? "border-[#1B3A6B] bg-[#f0f4fb]" : "border-[#CBD5E1] hover:border-[#1B3A6B] hover:bg-[#f8fafc]"}
        ${file ? "border-[#8FAF8F] bg-[#f4f9f4]" : ""}
      `}
    >
      <input {...getInputProps()} />

      {file ? (
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-[#8FAF8F]/20 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2C6.686 2 4 4.686 4 8c0 3.314 2.686 6 6 6s6-2.686 6-6c0-3.314-2.686-6-6-6z" stroke="#8FAF8F" strokeWidth="1.5"/>
              <path d="M7 10l2 2 4-4" stroke="#8FAF8F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="text-sm font-medium text-[#2d6a2d]">{file.name}</p>
          <p className="text-xs text-[#64748B]">Click to replace</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-[#1B3A6B]/10 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 13V7M10 7L7 10M10 7l3 3" stroke="#1B3A6B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 14s-1 0-1-1V5a2 2 0 012-2h6l4 4v6a1 1 0 01-1 1H5" stroke="#1B3A6B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="text-sm font-medium text-[#1B3A6B]">{label}</p>
          {hint && <p className="text-xs text-[#64748B]">{hint}</p>}
          <p className="text-xs text-[#94A3B8]">Drag & drop or click to browse</p>
        </div>
      )}
    </div>
  );
}
