'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Check, X, Loader2, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AvatarCropModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onConfirm: (croppedBlob: Blob) => Promise<void>;
  isUploading?: boolean;
}

export function AvatarCropModal({
  isOpen,
  imageSrc,
  onClose,
  onConfirm,
  isUploading = false,
}: AvatarCropModalProps) {
  if (!isOpen || !imageSrc) return null;

  return (
    <AvatarCropDialogInner
      key={imageSrc}
      imageSrc={imageSrc}
      onClose={onClose}
      onConfirm={onConfirm}
      isUploading={isUploading}
    />
  );
}

function AvatarCropDialogInner({
  imageSrc,
  onClose,
  onConfirm,
  isUploading = false,
}: Omit<AvatarCropModalProps, 'isOpen'> & { imageSrc: string }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const viewportSize = 260; // 260px circular aperture

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPan({
        x: panStartRef.current.x + dx,
        y: panStartRef.current.y + dy,
      });
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch pan handlers for mobile/tablets
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      panStartRef.current = { ...pan };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStartRef.current.x;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Export cropped circle to Blob
  const handleApply = async () => {
    if (!imageSrc || !imgRef.current) return;

    const img = imgRef.current;
    const canvas = document.createElement('canvas');
    const outputSize = 512;
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Circular crop path
    ctx.beginPath();
    ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Scale calculation
    const naturalWidth = img.naturalWidth || 512;
    const naturalHeight = img.naturalHeight || 512;

    // Base scale to cover 260px viewport
    const baseScale = Math.max(viewportSize / naturalWidth, viewportSize / naturalHeight);
    const displayedWidth = naturalWidth * baseScale * zoom;
    const displayedHeight = naturalHeight * baseScale * zoom;

    // Viewport to canvas scale ratio
    const ratio = outputSize / viewportSize;

    // Draw offset on canvas
    const drawX = (viewportSize / 2 - displayedWidth / 2 + pan.x) * ratio;
    const drawY = (viewportSize / 2 - displayedHeight / 2 + pan.y) * ratio;
    const drawW = displayedWidth * ratio;
    const drawH = displayedHeight * ratio;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    canvas.toBlob(
      async (blob) => {
        if (blob) {
          await onConfirm(blob);
        }
      },
      'image/jpeg',
      0.92
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0E1317] p-6 text-white shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Adjust Profile Photo</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Drag to reposition, use slider to zoom</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Circular Viewport Stage */}
        <div className="flex flex-col items-center justify-center py-2">
          <div
            className="relative overflow-hidden rounded-full cursor-grab active:cursor-grabbing select-none shadow-2xl ring-2 ring-primary/60"
            style={{ width: `${viewportSize}px`, height: `${viewportSize}px` }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Overlay hint badge */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-xs px-2.5 py-0.5 text-[10px] text-zinc-300 border border-white/10">
              <Move className="h-2.5 w-2.5" />
              <span>Drag to position</span>
            </div>

            {/* Image being cropped */}
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px)`,
                transition: isDragging ? 'none' : 'transform 0.05s ease-out',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop preview"
                draggable={false}
                style={{
                  transform: `scale(${zoom})`,
                  maxWidth: 'none',
                  maxHeight: 'none',
                  minWidth: `${viewportSize}px`,
                  minHeight: `${viewportSize}px`,
                  objectFit: 'cover',
                  userSelect: 'none',
                }}
              />
            </div>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="space-y-3 bg-white/[0.03] p-4 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-medium">Scale & Zoom</span>
            <span className="font-mono text-zinc-300">{Math.round(zoom * 100)}%</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.max(1, +(prev - 0.1).toFixed(2)))}
              className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0"
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>

            <input
              type="range"
              min={1}
              max={3}
              step={0.02}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full accent-primary h-1.5 bg-zinc-700 rounded-lg cursor-pointer"
            />

            <button
              type="button"
              onClick={() => setZoom((prev) => Math.max(1, +(prev + 0.1).toFixed(2)))}
              className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0"
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
              title="Reset position"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isUploading}
            className="text-xs text-zinc-400 hover:text-white hover:bg-white/5"
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleApply}
            disabled={isUploading}
            className="gap-2 px-5 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Applying…</span>
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Apply & Confirm Photo</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
