/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Users, User as UserIcon, LogOut, Search, Video, Menu, X, Settings, HelpCircle, Heart, Sun, Moon } from 'lucide-react';
import { User } from '../types';
import AnimatedMedia from './AnimatedMedia';

interface NavbarProps {
  currentUser: User;
  activeTab: 'feed' | 'reels' | 'profile' | 'friends';
  onChangeTab: (tab: 'feed' | 'reels' | 'profile' | 'friends', targetUserId?: string | null) => void;
  onLogout: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function Navbar({ currentUser, activeTab, onChangeTab, onLogout, theme, onToggleTheme }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleMenuTabSelect = (tab: 'feed' | 'reels' | 'profile' | 'friends') => {
    onChangeTab(tab, null);
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm h-14 select-none px-4 flex items-center justify-between transition-colors duration-200">
      {/* Left side: Logo & mock Search bar */}
      <div className="flex items-center gap-2 flex-grow sm:flex-grow-0">
        <span 
          onClick={() => onChangeTab('feed', null)}
          className="text-2xl font-extrabold text-blue-600 dark:text-blue-500 tracking-tight cursor-pointer hover:scale-[1.02] transition-transform active:scale-95"
        >
          freebook
        </span>
        <div className="relative hidden md:block w-60">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search Freebook..."
            className="w-full pl-9 pr-4 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:bg-white dark:focus:bg-gray-750 border-0 text-sm rounded-full text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Center section: Core tabs */}
      <div className="flex items-center justify-center gap-1 sm:gap-4 md:gap-8 flex-grow">
        <button
          onClick={() => onChangeTab('feed', null)}
          className={`relative flex items-center justify-center p-3 sm:px-6 w-14 sm:w-24 border-b-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer ${
            activeTab === 'feed'
              ? 'border-blue-600 text-blue-600 dark:text-blue-500 dark:border-blue-500'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-750 dark:hover:text-gray-200'
          }`}
          title="Home Newsfeed"
        >
          <Home className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <button
          onClick={() => onChangeTab('reels', null)}
          className={`group relative flex items-center justify-center p-3 sm:px-6 w-14 sm:w-24 border-b-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer ${
            activeTab === 'reels'
              ? 'border-blue-600 text-blue-600 dark:text-blue-500 dark:border-blue-500'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-750 dark:hover:text-gray-200'
          }`}
          title="Reels Lounge - Immersive Vertical Video Loops"
        >
          <Video className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="absolute top-1.5 right-1.5 sm:right-3.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
          </span>
          {/* Custom Aesthetic Tooltip */}
          <span className="absolute top-14 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-950 text-white dark:text-gray-100 text-[11px] font-medium px-2.5 py-1.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
            Reels Lounge: View and publish immersive vertical stories
          </span>
        </button>

        <button
          onClick={() => onChangeTab('friends', null)}
          className={`relative flex items-center justify-center p-3 sm:px-6 w-14 sm:w-24 border-b-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer ${
            activeTab === 'friends'
              ? 'border-blue-600 text-blue-600 dark:text-blue-500 dark:border-blue-500'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-750 dark:hover:text-gray-200'
          }`}
          title="Friends"
        >
          <Users className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Right side: User details & Logout & Theme Toggle */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Animated Theme Toggling Button */}
        <button
          onClick={onToggleTheme}
          className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-750 dark:hover:text-gray-200 rounded-full transition-colors cursor-pointer"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          id="theme-toggle-navbar"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={theme}
              initial={{ rotate: -45, scale: 0.8, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 45, scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-5 h-5 flex items-center justify-center"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-500 fill-amber-500/10" />
              ) : (
                <Moon className="w-5 h-5 text-indigo-600 fill-indigo-600/5" />
              )}
            </motion.div>
          </AnimatePresence>
        </button>

        <button
          onClick={() => onChangeTab('profile', null)}
          className="flex items-center gap-2 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <AnimatedMedia
            src={currentUser.avatarUrl}
            alt={currentUser.displayName}
            className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700"
            referrerPolicy="no-referrer"
          />
          <span className="text-sm font-semibold text-gray-700 dark:text-white hidden lg:inline max-w-[120px] truncate">
            {currentUser.displayName}
          </span>
        </button>

        <div className="relative shrink-0" ref={menuRef}>
          {/* 3-Liner Hamburger Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`p-2.5 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center ${
              isMenuOpen 
                ? 'bg-blue-50 text-blue-600 ring-2 ring-blue-100' 
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
            title="Options Menu"
            id="options-hamburger-menu"
          >
            <motion.div
              animate={{ rotate: isMenuOpen ? 90 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="w-5 h-5 flex items-center justify-center"
            >
              {isMenuOpen ? <X className="w-5 h-5 text-blue-600" /> : <Menu className="w-5.5 h-5.5" />}
            </motion.div>
          </button>

          {/* Elegant Dropdown Container */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                className="absolute right-0 mt-2 w-72 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-150 dark:border-gray-805 py-3 text-left z-50 ring-1 ring-black/5 divide-y divide-gray-100 dark:divide-gray-800 font-sans"
              >
                {/* User card summary */}
                <div 
                  className="px-4 pb-3 flex items-center gap-3 cursor-pointer group hover:bg-gray-50/50 dark:hover:bg-gray-800/40 rounded-t-lg transition-colors"
                  onClick={() => handleMenuTabSelect('profile')}
                >
                  <AnimatedMedia
                    src={currentUser.avatarUrl}
                    alt={currentUser.displayName}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700 group-hover:border-blue-300 dark:group-hover:border-blue-500 transition-colors"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-gray-800 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {currentUser.displayName}
                    </span>
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 font-mono truncate">
                      @{currentUser.username}
                    </span>
                  </div>
                </div>

                {/* Quick tab shortcuts (highly useful on mobile) */}
                <div className="py-2.5 px-2.5 space-y-1">
                  <div className="px-2.5 py-0.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Quick Navigation
                  </div>
                  <button
                    onClick={() => handleMenuTabSelect('feed')}
                    className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                      activeTab === 'feed'
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60'
                    }`}
                  >
                    <Home className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                    <span>Home Newsfeed</span>
                  </button>
                  <button
                    onClick={() => handleMenuTabSelect('reels')}
                    className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                      activeTab === 'reels'
                        ? 'bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60'
                    }`}
                  >
                    <Video className="w-4 h-4 text-pink-500 dark:text-pink-400" />
                    <span>Reels Lounge</span>
                  </button>
                  <button
                    onClick={() => handleMenuTabSelect('friends')}
                    className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                      activeTab === 'friends'
                        ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60'
                    }`}
                  >
                    <Users className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                    <span>Friends Circle</span>
                  </button>
                  <button
                    onClick={() => handleMenuTabSelect('profile')}
                    className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                      activeTab === 'profile'
                        ? 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60'
                    }`}
                  >
                    <UserIcon className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                    <span>My Active Profile</span>
                  </button>
                </div>

                {/* App Settings / Theme Preferences / Brand credits info */}
                <div className="py-2.5 px-2.5 space-y-1">
                  <div className="px-2.5 py-0.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    System Preferences
                  </div>
                  {/* Theme Switcher within menu */}
                  <button
                    onClick={() => onToggleTheme()}
                    className="w-full flex items-center justify-between px-2.5 py-2 text-xs text-gray-650 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/55 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {theme === 'dark' ? (
                        <Sun className="w-4 h-4 text-amber-500" />
                      ) : (
                        <Moon className="w-4 h-4 text-indigo-500" />
                      )}
                      <span>Display Palette</span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded capitalize font-mono bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
                      {theme} Theme
                    </span>
                  </button>

                  <div className="flex items-center justify-between px-2.5 py-2 text-xs text-gray-650 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <div className="flex items-center gap-3">
                      <Settings className="w-4 h-4 text-teal-500 dark:text-teal-400" />
                      <span>Account Settings</span>
                    </div>
                    <span className="text-[9px] bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 font-bold px-1.5 py-0.5 rounded uppercase">MOCK</span>
                  </div>
                  <div className="flex items-center justify-between px-2.5 py-2 text-xs text-gray-650 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <div className="flex items-center gap-3">
                      <HelpCircle className="w-4 h-4 text-orange-400 dark:text-orange-500" />
                      <span>Support Desk</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-2.5 py-1 text-[10px] text-gray-400 dark:text-gray-500 font-mono pt-1.5 border-t border-gray-100/50 dark:border-gray-800/50 mt-1">
                    <span>Freebook v1.4.1</span>
                    <span className="flex items-center gap-1">With <Heart className="w-3 h-3 text-rose-500 fill-rose-500 animate-pulse" /></span>
                  </div>
                </div>

                {/* Account Logout Action */}
                <div className="pt-2 px-2.5">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-955/20 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4.5 h-4.5 text-rose-500" />
                    <span>Sign Out of Freebook</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
