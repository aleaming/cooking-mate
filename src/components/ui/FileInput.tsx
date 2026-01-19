'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconUpload,
  IconX,
  IconFile,
  IconPhoto,
  IconAlertCircle,
} from '@tabler/icons-react';

export interface FileInputProps {
  accept?: string;
  maxSize?: number; // in bytes
  multiple?: boolean;
  onFileSelect: (files: File[]) => void;
  error?: string;
  preview?: boolean;
  dragDrop?: boolean;
  disabled?: boolean;
  label?: string;
  hint?: string;
  className?: string;
}

interface FilePreview {
  file: File;
  preview?: string;
}

export function FileInput({
  accept = '*/*',
  maxSize = 10 * 1024 * 1024, // 10MB default
  multiple = false,
  onFileSelect,
  error,
  preview = true,
  dragDrop = true,
  disabled = false,
  label = 'Upload file',
  hint,
  className = '',
}: FileInputProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FilePreview[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isImageAccepted = accept.includes('image');

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file size
      if (file.size > maxSize) {
        const maxMB = (maxSize / (1024 * 1024)).toFixed(1);
        return `File "${file.name}" is too large. Maximum size is ${maxMB}MB.`;
      }

      // Check file type
      if (accept !== '*/*') {
        const acceptedTypes = accept.split(',').map((t) => t.trim());
        const fileType = file.type;
        const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;

        const isAccepted = acceptedTypes.some((acceptedType) => {
          if (acceptedType.startsWith('.')) {
            return fileExtension === acceptedType.toLowerCase();
          }
          if (acceptedType.endsWith('/*')) {
            const baseType = acceptedType.replace('/*', '');
            return fileType.startsWith(baseType);
          }
          return fileType === acceptedType;
        });

        if (!isAccepted) {
          return `File "${file.name}" is not an accepted file type.`;
        }
      }

      return null;
    },
    [accept, maxSize]
  );

  const processFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const validFiles: File[] = [];
      const previews: FilePreview[] = [];

      for (const file of fileArray) {
        const error = validateFile(file);
        if (error) {
          setValidationError(error);
          return;
        }
        validFiles.push(file);

        // Generate preview for images
        if (preview && file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            previews.push({ file, preview: e.target?.result as string });
            if (previews.length === validFiles.length) {
              setSelectedFiles(previews);
            }
          };
          reader.readAsDataURL(file);
        } else {
          previews.push({ file });
        }
      }

      setValidationError(null);
      setSelectedFiles(previews);
      onFileSelect(validFiles);
    },
    [onFileSelect, preview, validateFile]
  );

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled && dragDrop) {
        setIsDragging(true);
      }
    },
    [disabled, dragDrop]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled || !dragDrop) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        processFiles(multiple ? files : [files[0]]);
      }
    },
    [disabled, dragDrop, multiple, processFiles]
  );

  const handleClick = useCallback(() => {
    if (!disabled) {
      inputRef.current?.click();
    }
  }, [disabled]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        processFiles(files);
      }
    },
    [processFiles]
  );

  const removeFile = useCallback(
    (index: number) => {
      const newFiles = selectedFiles.filter((_, i) => i !== index);
      setSelectedFiles(newFiles);
      onFileSelect(newFiles.map((f) => f.file));

      // Reset input so same file can be selected again
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [selectedFiles, onFileSelect]
  );

  const clearAll = useCallback(() => {
    setSelectedFiles([]);
    setValidationError(null);
    onFileSelect([]);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [onFileSelect]);

  const displayError = error || validationError;

  return (
    <div className={className}>
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        disabled={disabled}
        className="hidden"
        aria-label={label}
      />

      {/* Drop zone */}
      <motion.div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        animate={{
          borderColor: isDragging ? 'var(--color-olive-500)' : 'var(--color-sand-300)',
          backgroundColor: isDragging ? 'var(--color-olive-50)' : 'transparent',
        }}
        className={`
          relative border-2 border-dashed rounded-xl p-6
          transition-colors cursor-pointer
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-olive-400 hover:bg-sand-50'}
          ${displayError ? 'border-error/50' : ''}
        `}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div
            className={`
              w-12 h-12 rounded-full flex items-center justify-center
              ${isDragging ? 'bg-olive-100' : 'bg-sand-100'}
            `}
          >
            {isImageAccepted ? (
              <IconPhoto className="w-6 h-6 text-olive-600" />
            ) : (
              <IconUpload className="w-6 h-6 text-olive-600" />
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-foreground">{label}</p>
            {hint && <p className="text-xs text-muted mt-1">{hint}</p>}
            {dragDrop && (
              <p className="text-xs text-muted mt-1">
                {isDragging ? 'Drop to upload' : 'or drag and drop'}
              </p>
            )}
          </div>

          {!multiple && selectedFiles.length === 0 && (
            <p className="text-xs text-muted">
              Max size: {(maxSize / (1024 * 1024)).toFixed(0)}MB
            </p>
          )}
        </div>
      </motion.div>

      {/* Error message */}
      <AnimatePresence>
        {displayError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 mt-2 text-sm text-error"
          >
            <IconAlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{displayError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File previews */}
      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4"
          >
            {multiple && selectedFiles.length > 1 && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted">
                  {selectedFiles.length} files selected
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearAll();
                  }}
                  className="text-xs text-error hover:text-error/80"
                >
                  Clear all
                </button>
              </div>
            )}

            <div className="space-y-2">
              {selectedFiles.map((filePreview, index) => (
                <motion.div
                  key={`${filePreview.file.name}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-3 p-2 bg-sand-50 rounded-lg"
                >
                  {/* Preview thumbnail or icon */}
                  {filePreview.preview ? (
                    <img
                      src={filePreview.preview}
                      alt={filePreview.file.name}
                      className="w-10 h-10 rounded object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-sand-200 flex items-center justify-center">
                      <IconFile className="w-5 h-5 text-sand-500" />
                    </div>
                  )}

                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {filePreview.file.name}
                    </p>
                    <p className="text-xs text-muted">
                      {(filePreview.file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="p-1 rounded-full hover:bg-sand-200 text-sand-500 hover:text-sand-700 transition-colors"
                    aria-label={`Remove ${filePreview.file.name}`}
                  >
                    <IconX className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
