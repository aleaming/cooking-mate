'use client';

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { drawerBackdrop, drawerContent } from '@/lib/constants/animations';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  height?: '50%' | '75%' | '90%' | 'full';
}

const heightStyles = {
  '50%': 'h-[50vh]',
  '75%': 'h-[75vh]',
  '90%': 'h-[90vh]',
  'full': 'h-screen',
};

export function Drawer({ isOpen, onClose, title, children, height = '75%' }: DrawerProps) {
  // Handle escape key
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleEscape]);

  if (typeof window === 'undefined') {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <motion.div
            variants={drawerBackdrop}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Drawer Content */}
          <motion.div
            variants={drawerContent}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`
              relative w-full ${heightStyles[height]}
              bg-white rounded-t-3xl shadow-2xl
              flex flex-col overflow-hidden
            `}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 rounded-full bg-sand-300" />
            </div>

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-6 pb-4 border-b border-sand-200">
                <h2 className="font-display text-xl font-semibold text-olive-900">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-sand-100 transition-colors"
                  aria-label="Close drawer"
                >
                  <svg
                    className="w-5 h-5 text-sand-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
