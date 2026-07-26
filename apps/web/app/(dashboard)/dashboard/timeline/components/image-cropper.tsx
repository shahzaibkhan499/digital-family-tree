'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCw, Check, Maximize2 } from 'lucide-react';

interface ImageCropperProps {
  src: string;
  onSave: (blob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
}

const ASPECT_RATIOS = [
  { label: 'Free', value: 0 },
  { label: '16:9', value: 16 / 9 },
  { label: '4:3', value: 4 / 3 },
  { label: '1:1', value: 1 },
  { label: '3:2', value: 3 / 2 },
];

export function ImageCropper({ src, onSave, onCancel, aspectRatio = 0 }: ImageCropperProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [selectedRatio, setSelectedRatio] = useState(aspectRatio);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSave = useCallback(async () => {
    const img = imgRef.current;
    if (!img || !canvasRef.current) return;

    setIsProcessing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) { setIsProcessing(false); return; }

    const rad = (rotation * Math.PI) / 180;
    const absRot = Math.abs(rotation % 360);
    const isRightAngle = absRot === 90 || absRot === 270;

    let srcW = img.naturalWidth;
    let srcH = img.naturalHeight;

    if (selectedRatio > 0) {
      if (srcW / srcH > selectedRatio) {
        srcW = srcH * selectedRatio;
      } else {
        srcH = srcW / selectedRatio;
      }
    }

    const sx = (img.naturalWidth - srcW) / 2;
    const sy = (img.naturalHeight - srcH) / 2;

    if (isRightAngle) {
      canvas.width = Math.round(srcH * zoom);
      canvas.height = Math.round(srcW * zoom);
    } else {
      canvas.width = Math.round(srcW * zoom);
      canvas.height = Math.round(srcH * zoom);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rad);
    ctx.drawImage(img, sx, sy, srcW, srcH, -srcW * zoom / 2, -srcH * zoom / 2, srcW * zoom, srcH * zoom);

    canvas.toBlob((blob) => {
      if (blob) onSave(blob);
      setIsProcessing(false);
    }, 'image/jpeg', 0.92);
  }, [zoom, rotation, selectedRatio, onSave]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') handleSave();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel, handleSave]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-md"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h3 className="text-sm font-semibold text-white">Edit Image</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-white/70 hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isProcessing}
            className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
          >
            {isProcessing ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Save
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex flex-1 items-center justify-center overflow-hidden p-8"
      >
        <div
          className="relative overflow-hidden bg-slate-900 rounded-lg shadow-2xl"
          style={{
            maxWidth: selectedRatio > 0 ? `${Math.min(80, 80 * selectedRatio)}vw` : '80vw',
            maxHeight: '70vh',
            aspectRatio: selectedRatio > 0 ? selectedRatio : undefined,
          }}
        >
          <img
            ref={imgRef}
            src={src}
            alt="Crop preview"
            className="h-full w-full object-contain"
            style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
            crossOrigin="anonymous"
          />
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 border-t border-white/10 px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setZoom((z) => Math.max(0.25, z - 0.1))}
            className="rounded-lg bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <div className="relative w-32">
            <input
              type="range"
              min={25}
              max={300}
              value={zoom * 100}
              onChange={(e) => setZoom(Number(e.target.value) / 100)}
              className="w-full accent-emerald-500"
            />
          </div>
          <button
            onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
            className="rounded-lg bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <span className="min-w-[45px] text-center text-xs text-white/60">{Math.round(zoom * 100)}%</span>

          <div className="mx-2 h-6 w-px bg-white/20" />

          <button
            onClick={() => setRotation((r) => r - 90)}
            className="rounded-lg bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
            title="Rotate left"
          >
            <RotateCw className="h-4 w-4 -scale-x-100" />
          </button>
          <button
            onClick={() => setRotation((r) => r + 90)}
            className="rounded-lg bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
            title="Rotate right"
          >
            <RotateCw className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {ASPECT_RATIOS.map((ratio) => (
            <button
              key={ratio.label}
              onClick={() => setSelectedRatio(ratio.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedRatio === ratio.value
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
              }`}
            >
              {ratio.label}
            </button>
          ))}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </motion.div>
  );
}
