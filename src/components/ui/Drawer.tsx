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
              bg-card rounded-t-3xl shadow-2xl
              flex flex-col overflow-hidden
            `}
          >
            {/* Drag Handle - increased tap area */}
            <button
              onClick={onClose}
              className="flex justify-center w-full py-3 cursor-grab active:cursor-grabbing"
              aria-label="Close drawer"
            >
              <div className="w-12 h-1.5 rounded-full bg-foreground/20" />
            </button>

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-6 pb-4 border-b border-foreground/10">
                <h2 className="font-display text-xl font-semibold text-card-foreground">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-foreground/5 active:bg-foreground/10 transition-colors -mr-2"
                  aria-label="Close drawer"
                >
                  <svg
                    className="w-5 h-5 text-foreground/50"
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
