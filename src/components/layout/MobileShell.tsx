import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, Bell, Search, User, Github, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

const NAV_ITEMS = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Compass, label: 'Explore', path: '/explore' },
  { icon: Bell, label: 'Inbox', path: '/notifications' },
  { icon: Search, label: 'Search', path: '/search' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export function MobileShell() {
  const location = useLocation();

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 overflow-hidden">
      {/* Header */}
      <header className="h-14 flex items-center px-4 bg-white border-b border-slate-200 shrink-0 z-10">
        <Github className="w-6 h-6 mr-2" />
        <h1 className="text-lg font-semibold tracking-tight">GitMobile</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="h-16 bg-white border-t border-slate-200 flex items-center justify-around px-2 fixed bottom-0 left-0 right-0 z-20">
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center w-16 h-full transition-colors",
                isActive ? "text-blue-600" : "text-slate-500"
              )
            }
          >
            <Icon className="w-6 h-6" />
            <span className="text-[10px] mt-1 font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
