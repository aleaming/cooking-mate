'use client';

import { useState, useEffect, useCallback, ComponentType } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconHome,
  IconBook,
  IconSalad,
  IconCalendar,
  IconShoppingCart,
  IconChartBar,
  IconToolsKitchen2,
} from '@tabler/icons-react';

interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Home', icon: IconHome },
  { href: '/recipes', label: 'Recipes', icon: IconBook },
  { href: '/pantry-finder', label: 'Pantry Finder', icon: IconSalad },
  { href: '/calendar', label: 'Meal Plan', icon: IconCalendar },
  { href: '/shopping-list', label: 'Shopping List', icon: IconShoppingCart },
  { href: '/cooking-history', label: 'History', icon: IconChartBar },
];

export function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu handler
  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMobileMenu();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [closeMobileMenu]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-sand-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 min-h-[44px] min-w-[44px]">
            <motion.div
              whileHover={{ rotate: 10 }}
              className="text-olive-600"
            >
              <IconToolsKitchen2 size={28} />
            </motion.div>
            <span className="font-display text-xl font-semibold text-olive-800 whitespace-nowrap">
              Cooking Mate
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative px-4 py-2 text-sm font-medium transition-colors min-h-[44px] flex items-center"
                >
                  <span
                    className={
                      isActive
                        ? 'text-olive-700'
                        : 'text-sand-600 hover:text-olive-700'
                    }
                  >
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-x-2 bottom-0 h-0.5 bg-olive-500 rounded-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Mobile Menu Button - 44x44px minimum touch target */}
          <button
            className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-sand-600 hover:text-olive-700 active:bg-sand-100 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
          >
            <motion.div
              animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {isMobileMenuOpen ? (
                <svg
                  className="w-6 h-6"
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
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </motion.div>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 top-16 bg-black/20 backdrop-blur-sm z-40 md:hidden"
              onClick={closeMobileMenu}
            />

            {/* Menu Panel */}
            <motion.nav
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute left-0 right-0 top-16 bg-white border-b border-sand-200 shadow-lg z-50 md:hidden"
            >
              <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="flex flex-col gap-1">
                  {navItems.map((item, index) => {
                    const isActive = pathname === item.href;
                    return (
                      <motion.div
                        key={item.href}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link
                          href={item.href}
                          className={`
                            flex items-center gap-3 px-4 py-3 rounded-xl
                            min-h-[48px] text-base font-medium
                            transition-colors active:scale-[0.98]
                            ${isActive
                              ? 'bg-olive-100 text-olive-700'
                              : 'text-sand-700 hover:bg-sand-100 active:bg-sand-200'
                            }
                          `}
                          onClick={closeMobileMenu}
                        >
                          <item.icon size={24} className={isActive ? 'text-olive-600' : 'text-sand-500'} />
                          <span className="whitespace-nowrap">{item.label}</span>
                          {isActive && (
                            <motion.div
                              layoutId="mobile-nav-indicator"
                              className="ml-auto w-2 h-2 bg-olive-500 rounded-full"
                            />
                          )}
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
