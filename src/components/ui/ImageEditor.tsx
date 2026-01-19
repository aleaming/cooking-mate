'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { motion } from 'framer-motion';
import {
  IconCrop,
  IconRotate,
  IconSun,
  IconContrast,
  IconCheck,
  IconX,
  IconRefresh,
} from '@tabler/icons-react';
import { Button } from './Button';

export interface ImageEditorProps {
  src: string;
  onSave: (editedBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
  initialCrop?: Crop;
}

type EditMode = 'crop' | 'adjust' | null;

const ROTATION_STEP = 90;

export function ImageEditor({
  src,
  onSave,
  onCancel,
  aspectRatio,
  initialCrop,
}: ImageEditorProps) {
  const [crop, setCrop] = useState<Crop>(
    initialCrop || {
      unit: '%',
      width: 80,
      height: 80,
      x: 10,
      y: 10,
    }
  );
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [editMode, setEditMode] = useState<EditMode>('crop');
  const [isProcessing, setIsProcessing] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Apply aspect ratio to crop
  useEffect(() => {
    if (aspectRatio && imgRef.current) {
      setCrop({
        unit: '%',
        width: 80,
        height: 80 / aspectRatio,
        x: 10,
        y: 10,
      });
    }
  }, [aspectRatio]);

  // Get CSS filter string for adjustments
  const getFilterStyle = useCallback(() => {
    const filters = [];
    if (brightness !== 100) {
      filters.push(`brightness(${brightness}%)`);
    }
    if (contrast !== 100) {
      filters.push(`contrast(${contrast}%)`);
    }
    return filters.length > 0 ? filters.join(' ') : 'none';
  }, [brightness, contrast]);

  // Get transform style for rotation
  const getTransformStyle = useCallback(() => {
    return rotation !== 0 ? `rotate(${rotation}deg)` : 'none';
  }, [rotation]);

  // Process and export the edited image
  const processImage = useCallback(async (): Promise<Blob> => {
    const image = imgRef.current;
    const canvas = canvasRef.current;

    if (!image || !canvas) {
      throw new Error('Image or canvas not available');
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Determine output dimensions based on crop or full image
    let srcX = 0;
    let srcY = 0;
    let srcWidth = image.naturalWidth;
    let srcHeight = image.naturalHeight;

    if (completedCrop) {
      // Scale crop coordinates from displayed size to natural size
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      srcX = completedCrop.x * scaleX;
      srcY = completedCrop.y * scaleY;
      srcWidth = completedCrop.width * scaleX;
      srcHeight = completedCrop.height * scaleY;
    }

    // Handle rotation - swap dimensions for 90/270 degree rotations
    const isRotated90or270 = rotation === 90 || rotation === 270;
    const outputWidth = isRotated90or270 ? srcHeight : srcWidth;
    const outputHeight = isRotated90or270 ? srcWidth : srcHeight;

    canvas.width = outputWidth;
    canvas.height = outputHeight;

    // Apply filters
    ctx.filter = getFilterStyle();

    // Handle rotation
    ctx.save();
    ctx.translate(outputWidth / 2, outputHeight / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    if (isRotated90or270) {
      ctx.drawImage(
        image,
        srcX,
        srcY,
        srcWidth,
        srcHeight,
        -srcHeight / 2,
        -srcWidth / 2,
        srcHeight,
        srcWidth
      );
    } else {
      ctx.drawImage(
        image,
        srcX,
        srcY,
        srcWidth,
        srcHeight,
        -srcWidth / 2,
        -srcHeight / 2,
        srcWidth,
        srcHeight
      );
    }

    ctx.restore();

    // Convert canvas to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/jpeg',
        0.9
      );
    });
  }, [completedCrop, rotation, getFilterStyle]);

  const handleSave = async () => {
    setIsProcessing(true);
    try {
      const blob = await processImage();
      onSave(blob);
    } catch (error) {
      console.error('Error processing image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + ROTATION_STEP) % 360);
  };

  const handleReset = () => {
    setRotation(0);
    setBrightness(100);
    setContrast(100);
    setCrop({
      unit: '%',
      width: 80,
      height: aspectRatio ? 80 / aspectRatio : 80,
      x: 10,
      y: 10,
    });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditMode(editMode === 'crop' ? null : 'crop')}
            className={`
              p-2 rounded-lg transition-colors
              ${editMode === 'crop' ? 'bg-olive-100 text-olive-700' : 'hover:bg-sand-100 text-muted'}
            `}
            aria-label="Crop"
          >
            <IconCrop className="w-5 h-5" />
          </button>
          <button
            onClick={handleRotate}
            className="p-2 rounded-lg hover:bg-sand-100 text-muted transition-colors"
            aria-label="Rotate 90 degrees"
          >
            <IconRotate className="w-5 h-5" />
          </button>
          <button
            onClick={() => setEditMode(editMode === 'adjust' ? null : 'adjust')}
            className={`
              p-2 rounded-lg transition-colors
              ${editMode === 'adjust' ? 'bg-olive-100 text-olive-700' : 'hover:bg-sand-100 text-muted'}
            `}
            aria-label="Adjustments"
          >
            <IconSun className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-border mx-1" />
          <button
            onClick={handleReset}
            className="p-2 rounded-lg hover:bg-sand-100 text-muted transition-colors"
            aria-label="Reset all edits"
          >
            <IconRefresh className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <IconX className="w-4 h-4 mr-1" />
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={isProcessing}
          >
            <IconCheck className="w-4 h-4 mr-1" />
            {isProcessing ? 'Processing...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Adjustment sliders */}
      {editMode === 'adjust' && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="p-4 border-b border-border bg-sand-50"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <IconSun className="w-5 h-5 text-muted flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted">Brightness</span>
                  <span className="text-sm font-medium">{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full accent-olive-600"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <IconContrast className="w-5 h-5 text-muted flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted">Contrast</span>
                  <span className="text-sm font-medium">{contrast}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full accent-olive-600"
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Image editor area */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden bg-sand-100">
        <div
          className="relative max-w-full max-h-full"
          style={{
            transform: getTransformStyle(),
            transition: 'transform 0.3s ease',
          }}
        >
          {editMode === 'crop' ? (
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspectRatio}
              className="max-w-full max-h-full"
            >
              <img
                ref={imgRef}
                src={src}
                alt="Edit preview"
                style={{
                  filter: getFilterStyle(),
                  maxHeight: '60vh',
                  maxWidth: '100%',
                }}
                onLoad={() => {
                  // Reset crop on new image load if needed
                }}
              />
            </ReactCrop>
          ) : (
            <img
              ref={imgRef}
              src={src}
              alt="Edit preview"
              style={{
                filter: getFilterStyle(),
                maxHeight: '60vh',
                maxWidth: '100%',
              }}
            />
          )}
        </div>
      </div>

      {/* Rotation indicator */}
      {rotation !== 0 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 bg-black/60 text-white text-sm rounded-full">
            {rotation}°
          </span>
        </div>
      )}

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
