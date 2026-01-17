'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/recipes', label: 'Recipes' },
  { href: '/pantry-finder', label: 'Pantry Finder' },
  { href: '/calendar', label: 'Meal Plan' },
  { href: '/shopping-list', label: 'Shopping List' },
  { href: '/cooking-history', label: 'History' },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-sand-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <motion.div
              whileHover={{ rotate: 10 }}
              className="text-2xl"
            >
              🫒
            </motion.div>
            <span className="font-display text-xl font-semibold text-olive-800">
              MedDiet
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative px-4 py-2 text-sm font-medium transition-colors"
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

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 text-sand-600 hover:text-olive-700">
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
          </button>
        </div>
      </div>
    </header>
  );
}
