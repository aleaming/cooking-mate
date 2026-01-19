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
  IconUser,
  IconSettings,
  IconLogout,
  IconLogin,
  IconChefHat,
  IconPlus,
} from '@tabler/icons-react';
import { Logo } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { logout } from '@/lib/auth/actions';

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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, isLoading } = useAuth();

  // Close mobile menu handler
  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  // Close user menu handler
  const closeUserMenu = useCallback(() => {
    setIsUserMenuOpen(false);
  }, []);

  // Close menus on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMobileMenu();
        closeUserMenu();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [closeMobileMenu, closeUserMenu]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (isUserMenuOpen) {
        closeUserMenu();
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isUserMenuOpen, closeUserMenu]);

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
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-foreground/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 min-h-[44px] min-w-[44px] group">
            <motion.div
              whileHover={{ rotate: 10 }}
              transition={{ duration: 0.2 }}
            >
              <Logo size={28} />
            </motion.div>
            <span className="font-display text-xl font-semibold text-foreground whitespace-nowrap">
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
                        ? 'text-olive-600'
                        : 'text-foreground/70 hover:text-olive-600'
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

            {/* User Menu / Sign In */}
            <div className="ml-2 pl-2 border-l border-foreground/10">
              {isLoading ? (
                <div className="w-10 h-10 rounded-full bg-foreground/10 animate-pulse" />
              ) : user ? (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsUserMenuOpen(!isUserMenuOpen);
                    }}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-olive-100 text-olive-600 hover:bg-olive-200 transition-colors"
                    aria-label="User menu"
                    aria-expanded={isUserMenuOpen}
                  >
                    <IconUser size={20} />
                  </button>
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-12 w-56 bg-card rounded-xl shadow-lg border border-foreground/10 py-2 z-50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="px-4 py-2 border-b border-foreground/10">
                          <p className="text-sm font-medium text-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                        <Link
                          href="/recipes/my-recipes"
                          onClick={closeUserMenu}
                          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-foreground/80 hover:bg-foreground/5 transition-colors"
                        >
                          <IconChefHat size={18} />
                          My Recipes
                        </Link>
                        <Link
                          href="/recipes/import"
                          onClick={closeUserMenu}
                          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-foreground/80 hover:bg-foreground/5 transition-colors"
                        >
                          <IconPlus size={18} />
                          Import Recipe
                        </Link>
                        <div className="border-t border-foreground/10 my-1" />
                        <Link
                          href="/profile"
                          onClick={closeUserMenu}
                          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-foreground/80 hover:bg-foreground/5 transition-colors"
                        >
                          <IconUser size={18} />
                          Profile
                        </Link>
                        <Link
                          href="/settings"
                          onClick={closeUserMenu}
                          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-foreground/80 hover:bg-foreground/5 transition-colors"
                        >
                          <IconSettings size={18} />
                          Settings
                        </Link>
                        <div className="border-t border-foreground/10 my-1" />
                        <form action={logout}>
                          <button
                            type="submit"
                            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-foreground/80 hover:bg-foreground/5 transition-colors"
                          >
                            <IconLogout size={18} />
                            Sign out
                          </button>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-olive-600 hover:bg-olive-500/10 rounded-lg transition-colors min-h-[44px]"
                >
                  <IconLogin size={18} />
                  Sign in
                </Link>
              )}
            </div>
          </nav>

          {/* Mobile Menu Button - 44x44px minimum touch target */}
          <button
            className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-foreground/70 hover:text-olive-600 active:bg-foreground/5 rounded-lg transition-colors"
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
              className="absolute left-0 right-0 top-16 bg-card border-b border-foreground/10 shadow-lg z-50 md:hidden"
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
                              ? 'bg-olive-500/10 text-olive-600'
                              : 'text-foreground/80 hover:bg-foreground/5 active:bg-foreground/10'
                            }
                          `}
                          onClick={closeMobileMenu}
                        >
                          <item.icon size={24} className={isActive ? 'text-olive-600' : 'text-foreground/50'} />
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

                  {/* Divider */}
                  <div className="my-2 border-t border-foreground/10" />

                  {/* User Section in Mobile Menu */}
                  {!isLoading && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: navItems.length * 0.05 }}
                    >
                      {user ? (
                        <>
                          <div className="px-4 py-2 mb-1">
                            <p className="text-sm text-foreground/60">Signed in as</p>
                            <p className="text-sm font-medium text-foreground truncate">
                              {user.email}
                            </p>
                          </div>
                          <Link
                            href="/recipes/my-recipes"
                            className="flex items-center gap-3 px-4 py-3 rounded-xl min-h-[48px] text-base font-medium text-foreground/80 hover:bg-foreground/5 active:bg-foreground/10 transition-colors w-full"
                            onClick={closeMobileMenu}
                          >
                            <IconChefHat size={24} className="text-foreground/50" />
                            <span>My Recipes</span>
                          </Link>
                          <Link
                            href="/recipes/import"
                            className="flex items-center gap-3 px-4 py-3 rounded-xl min-h-[48px] text-base font-medium text-foreground/80 hover:bg-foreground/5 active:bg-foreground/10 transition-colors w-full"
                            onClick={closeMobileMenu}
                          >
                            <IconPlus size={24} className="text-foreground/50" />
                            <span>Import Recipe</span>
                          </Link>
                          <div className="my-2 border-t border-foreground/10" />
                          <Link
                            href="/profile"
                            className="flex items-center gap-3 px-4 py-3 rounded-xl min-h-[48px] text-base font-medium text-foreground/80 hover:bg-foreground/5 active:bg-foreground/10 transition-colors w-full"
                            onClick={closeMobileMenu}
                          >
                            <IconUser size={24} className="text-foreground/50" />
                            <span>Profile</span>
                          </Link>
                          <Link
                            href="/settings"
                            className="flex items-center gap-3 px-4 py-3 rounded-xl min-h-[48px] text-base font-medium text-foreground/80 hover:bg-foreground/5 active:bg-foreground/10 transition-colors w-full"
                            onClick={closeMobileMenu}
                          >
                            <IconSettings size={24} className="text-foreground/50" />
                            <span>Settings</span>
                          </Link>
                          <div className="my-2 border-t border-foreground/10" />
                          <form action={logout}>
                            <button
                              type="submit"
                              onClick={closeMobileMenu}
                              className="flex items-center gap-3 px-4 py-3 rounded-xl min-h-[48px] text-base font-medium text-foreground/80 hover:bg-foreground/5 active:bg-foreground/10 transition-colors w-full"
                            >
                              <IconLogout size={24} className="text-foreground/50" />
                              <span>Sign out</span>
                            </button>
                          </form>
                        </>
                      ) : (
                        <Link
                          href="/login"
                          className="flex items-center gap-3 px-4 py-3 rounded-xl min-h-[48px] text-base font-medium text-olive-600 bg-olive-500/10 hover:bg-olive-500/20 transition-colors"
                          onClick={closeMobileMenu}
                        >
                          <IconLogin size={24} className="text-olive-600" />
                          <span>Sign in</span>
                        </Link>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

