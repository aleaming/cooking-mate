'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  IconPlus,
  IconTrash,
  IconStar,
  IconStarFilled,
  IconLoader2,
  IconGripVertical,
  IconEdit,
} from '@tabler/icons-react';
import { FileInput } from '@/components/ui/FileInput';
import { ImageEditor } from '@/components/ui/ImageEditor';
import { Modal } from '@/components/ui/Modal';
import type { RecipePhoto } from '@/types/recipe';

export interface PhotoGalleryManagerProps {
  photos: RecipePhoto[];
  onAddPhoto: (file: File) => Promise<void>;
  onRemovePhoto: (photoId: string) => void;
  onSetPrimary: (photoId: string) => void;
  onReorder: (photoIds: string[]) => void;
  maxPhotos?: number;
  disabled?: boolean;
}

export function PhotoGalleryManager({
  photos,
  onAddPhoto,
  onRemovePhoto,
  onSetPrimary,
  onReorder,
  maxPhotos = 10,
  disabled = false,
}: PhotoGalleryManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<string | null>(null);
  const [photoToEdit, setPhotoToEdit] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const canAddMore = photos.length < maxPhotos;

  const handleFileSelect = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    const file = files[0];
    setPendingFile(file);

    // Create preview URL for editing
    const previewUrl = URL.createObjectURL(file);
    setPhotoToEdit(previewUrl);
    setShowAddModal(false);
  }, []);

  const handleEditorSave = useCallback(
    async (blob: Blob) => {
      if (!pendingFile) return;

      setIsUploading(true);
      setUploadError(null);
      setPhotoToEdit(null);

      try {
        // Create a new file from the edited blob
        const editedFile = new File([blob], pendingFile.name, {
          type: 'image/jpeg',
        });

        await onAddPhoto(editedFile);
        setPendingFile(null);
      } catch (error) {
        console.error('Error uploading photo:', error);
        setUploadError(error instanceof Error ? error.message : 'Failed to upload photo');
      } finally {
        setIsUploading(false);
      }
    },
    [pendingFile, onAddPhoto]
  );

  const handleEditorCancel = useCallback(() => {
    if (photoToEdit) {
      URL.revokeObjectURL(photoToEdit);
    }
    setPhotoToEdit(null);
    setPendingFile(null);
  }, [photoToEdit]);

  const handleReorder = useCallback(
    (newOrder: RecipePhoto[]) => {
      onReorder(newOrder.map((p) => p.id));
    },
    [onReorder]
  );

  const handleRemove = useCallback(
    (photoId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onRemovePhoto(photoId);
    },
    [onRemovePhoto]
  );

  const handleSetPrimary = useCallback(
    (photoId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onSetPrimary(photoId);
    },
    [onSetPrimary]
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">
          Photos ({photos.length}/{maxPhotos})
        </h3>
        {canAddMore && !disabled && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 text-sm text-olive-600 hover:text-olive-700 transition-colors"
          >
            <IconPlus className="w-4 h-4" />
            Add photo
          </button>
        )}
      </div>

      {/* Error message */}
      {uploadError && (
        <div className="text-sm text-error bg-error/10 p-2 rounded-lg">
          {uploadError}
        </div>
      )}

      {/* Photo grid */}
      {photos.length > 0 ? (
        <Reorder.Group
          axis="x"
          values={photos}
          onReorder={handleReorder}
          className="flex flex-wrap gap-3"
        >
          {photos.map((photo) => (
            <Reorder.Item
              key={photo.id}
              value={photo}
              drag={!disabled}
              className="relative group"
            >
              <motion.div
                layout
                className={`
                  relative w-24 h-24 rounded-lg overflow-hidden
                  border-2 transition-colors cursor-grab active:cursor-grabbing
                  ${photo.isPrimary ? 'border-olive-500' : 'border-transparent hover:border-sand-300'}
                  ${disabled ? 'cursor-default' : ''}
                `}
              >
                {/* Photo */}
                <img
                  src={photo.thumbnailUrl || photo.url}
                  alt="Recipe photo"
                  className="w-full h-full object-cover"
                  draggable={false}
                />

                {/* Primary badge */}
                {photo.isPrimary && (
                  <div className="absolute top-1 left-1">
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-olive-600 text-white text-xs font-medium rounded">
                      <IconStarFilled className="w-3 h-3" />
                      Primary
                    </span>
                  </div>
                )}

                {/* Drag handle */}
                {!disabled && photos.length > 1 && (
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-1 bg-black/50 rounded">
                      <IconGripVertical className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}

                {/* Overlay with actions */}
                {!disabled && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    {!photo.isPrimary && (
                      <button
                        onClick={(e) => handleSetPrimary(photo.id, e)}
                        className="p-1.5 bg-card rounded-full shadow hover:bg-sand-50 dark:hover:bg-sand-700 transition-colors"
                        aria-label="Set as primary photo"
                        title="Set as primary"
                      >
                        <IconStar className="w-4 h-4 text-olive-600" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleRemove(photo.id, e)}
                      className="p-1.5 bg-card rounded-full shadow hover:bg-error/10 transition-colors"
                      aria-label="Remove photo"
                      title="Remove"
                    >
                      <IconTrash className="w-4 h-4 text-error" />
                    </button>
                  </div>
                )}
              </motion.div>
            </Reorder.Item>
          ))}

          {/* Upload indicator */}
          {isUploading && (
            <div className="w-24 h-24 rounded-lg border-2 border-dashed border-sand-300 flex items-center justify-center bg-sand-50">
              <IconLoader2 className="w-6 h-6 text-olive-600 animate-spin" />
            </div>
          )}
        </Reorder.Group>
      ) : (
        <div className="text-center py-8 border-2 border-dashed border-sand-200 rounded-lg">
          <p className="text-sm text-muted mb-2">No photos yet</p>
          {canAddMore && !disabled && (
            <button
              onClick={() => setShowAddModal(true)}
              className="text-sm text-olive-600 hover:text-olive-700"
            >
              Add your first photo
            </button>
          )}
        </div>
      )}

      {/* Hint text */}
      {photos.length > 1 && !disabled && (
        <p className="text-xs text-muted">
          Drag photos to reorder. Click the star to set a primary photo.
        </p>
      )}

      {/* Add photo modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Photo"
      >
        <div className="p-4">
          <FileInput
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            maxSize={10 * 1024 * 1024}
            onFileSelect={handleFileSelect}
            preview={true}
            dragDrop={true}
            label="Select photo"
            hint="JPG, PNG, WebP, or HEIC up to 10MB"
          />
        </div>
      </Modal>

      {/* Image editor modal */}
      <Modal
        isOpen={!!photoToEdit}
        onClose={handleEditorCancel}
        title="Edit Photo"
        size="lg"
      >
        {photoToEdit && (
          <div className="h-[70vh]">
            <ImageEditor
              src={photoToEdit}
              onSave={handleEditorSave}
              onCancel={handleEditorCancel}
              aspectRatio={4 / 3}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
