/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Users, User as UserIcon, LogOut, Search, Video, Menu, X, Settings, HelpCircle, Heart, Sun, Moon, MessageCircle, Bell, MessageSquare, ThumbsUp, Share2, Sparkles, CheckCheck } from 'lucide-react';
import { User, AppNotification } from '../types';
import AnimatedMedia from './AnimatedMedia';
import InteractiveLogo from './InteractiveLogo';

interface NavbarProps {
  currentUser: User;
  activeTab: 'feed' | 'reels' | 'profile' | 'friends' | 'messenger';
  onChangeTab: (tab: 'feed' | 'reels' | 'profile' | 'friends' | 'messenger', targetUserId?: string | null) => void;
  onLogout: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  notifications: AppNotification[];
  onMarkAllNotificationsAsRead: () => void;
  onMarkNotificationAsRead: (id: string) => void;
}

export default function Navbar({ 
  currentUser, 
  activeTab, 
  onChangeTab, 
  onLogout, 
  theme, 
  onToggleTheme,
  notifications,
  onMarkAllNotificationsAsRead,
  onMarkNotificationAsRead
}: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    if (isMenuOpen || isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen, isNotificationsOpen]);

  const handleMenuTabSelect = (tab: 'feed' | 'reels' | 'profile' | 'friends' | 'messenger') => {
    onChangeTab(tab, null);
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm h-14 select-none px-4 flex items-center justify-between transition-colors duration-200">
      {/* Left side: Logo & mock Search bar */}
      <div className="flex items-center gap-2 flex-grow sm:flex-grow-0">
        <InteractiveLogo onClick={() => onChangeTab('feed', null)} />
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

        <button
          onClick={() => onChangeTab('messenger', null)}
          className={`relative flex items-center justify-center p-3 sm:px-6 w-14 sm:w-24 border-b-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer ${
            activeTab === 'messenger'
              ? 'border-blue-600 text-blue-600 dark:text-blue-500 dark:border-blue-500'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-750 dark:hover:text-gray-200'
          }`}
          title="Free Chat"
        >
          <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Right side: User details & Logout */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Real-time Notifications Bell */}
        <div className="relative shrink-0" ref={notificationsRef}>
          <button
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
            }}
            className={`p-2 rounded-full transition-all duration-200 cursor-pointer relative flex items-center justify-center ${
              isNotificationsOpen
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-750 dark:hover:text-gray-200'
            }`}
            title="Notifications Panel"
            id="notifications-toggle-button"
          >
            <Bell className="w-5 h-5" />
            {notifications.filter(n => !n.isRead).length > 0 && (
              <span className="absolute top-1 right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-900 animate-pulse">
                {notifications.filter(n => !n.isRead).length}
              </span>
            )}
          </button>

          <AnimatePresence>
            {isNotificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.95 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-2xl border border-gray-150 dark:border-gray-800 shadow-xl overflow-hidden z-50 flex flex-col max-h-[480px]"
              >
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-150 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/60 shrink-0">
                  <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    Notifications
                  </h3>
                  {notifications.some(n => !n.isRead) ? (
                    <button
                      onClick={() => {
                        onMarkAllNotificationsAsRead();
                      }}
                      className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark all read</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-gray-450 dark:text-gray-550 italic">
                      All caught up!
                    </span>
                  )}
                </div>

                {/* List Container */}
                <div className="overflow-y-auto divide-y divide-gray-100 dark:divide-gray-850 max-h-[400px]">
                  {notifications.length === 0 ? (
                    <div className="py-12 px-6 text-center space-y-3 select-none">
                      <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-855 border border-gray-100 dark:border-gray-800 flex items-center justify-center text-gray-450 mx-auto">
                        <Bell className="w-5 h-5 text-gray-400 dark:text-gray-555" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200">No notifications yet</p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed">
                          When people like, comment, react, or share your posts, we'll notify you instantly here.
                        </p>
                      </div>
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      const isUnread = !notif.isRead;
                      
                      // Icon badge selector
                      const getNotifBadge = () => {
                        switch (notif.type) {
                          case 'like':
                            return { bg: 'bg-blue-500', icon: <ThumbsUp className="w-2.5 h-2.5 text-white" /> };
                          case 'reaction':
                            if (notif.reactionType === 'love') return { bg: 'bg-rose-500', icon: <Heart className="w-2.5 h-2.5 text-white fill-white" /> };
                            return { bg: 'bg-amber-500', icon: <Sparkles className="w-2.5 h-2.5 text-white" /> };
                          case 'comment':
                            return { bg: 'bg-teal-500', icon: <MessageSquare className="w-2.5 h-2.5 text-white" /> };
                          case 'share':
                            return { bg: 'bg-indigo-500', icon: <Share2 className="w-2.5 h-2.5 text-white" /> };
                          default:
                            return { bg: 'bg-gray-500', icon: <Bell className="w-2.5 h-2.5 text-white" /> };
                        }
                      };

                      const badge = getNotifBadge();

                      // Relative format time
                      const formatRelativeTime = (iso: string) => {
                        try {
                          const diffMs = Date.now() - new Date(iso).getTime();
                          const diffMins = Math.floor(diffMs / 60000);
                          if (diffMins < 1) return 'Just now';
                          if (diffMins < 60) return `${diffMins}m ago`;
                          const diffHours = Math.floor(diffMins / 60);
                          if (diffHours < 24) return `${diffHours}h ago`;
                          return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
                        } catch (_) {
                          return '';
                        }
                      };

                      // Customize text wording
                      const getNotificationText = () => {
                        switch (notif.type) {
                          case 'like':
                            return <>liked your post: <span className="italic">"{notif.postContentExcerpt}"</span></>;
                          case 'reaction':
                            return <>reacted with <span className="font-bold underline capitalize text-[10px]">{notif.reactionType}</span> on your post: <span className="italic">"{notif.postContentExcerpt}"</span></>;
                          case 'comment':
                            return <>commented: <span className="font-bold">"{notif.commentContent}"</span></>;
                          case 'share':
                            return <>shared your post: <span className="italic">"{notif.postContentExcerpt}"</span></>;
                          default:
                            return <>interacted with your post.</>;
                        }
                      };

                      return (
                        <button
                          key={notif.id}
                          onClick={() => {
                            // Mark as read
                            if (isUnread) onMarkNotificationAsRead(notif.id);
                            // Close menu
                            setIsNotificationsOpen(false);
                            // Shift view to feed & scroll to post
                            onChangeTab('feed', null);
                            setTimeout(() => {
                              const el = document.getElementById(`post-${notif.postId}`);
                              if (el) {
                                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                el.classList.add('ring-4', 'ring-blue-500/40', 'dark:ring-blue-400/30', 'ring-offset-2', 'dark:ring-offset-gray-900', 'transition-all', 'duration-500');
                                setTimeout(() => {
                                  el.classList.remove('ring-4', 'ring-blue-500/40', 'dark:ring-blue-400/30', 'ring-offset-2', 'dark:ring-offset-gray-900');
                                }, 3000);
                              }
                            }, 500);
                          }}
                          className={`w-full text-left p-3 flex gap-3 transition-colors duration-200 cursor-pointer select-none items-start hover:bg-gray-50 dark:hover:bg-gray-800/40 ${
                            isUnread ? 'bg-blue-50/20 dark:bg-blue-950/5' : ''
                          }`}
                        >
                          {/* Left Avatar with Type overlapping badge */}
                          <div className="relative shrink-0 w-10 h-10">
                            <AnimatedMedia
                              src={notif.senderAvatar}
                              alt={notif.senderName}
                              className="w-10 h-10 rounded-full object-cover border border-gray-100 dark:border-gray-800"
                              referrerPolicy="no-referrer"
                            />
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${badge.bg} flex items-center justify-center ring-1.5 ring-white dark:ring-gray-900 shadow-sm`}>
                              {badge.icon}
                            </div>
                          </div>

                          {/* Middle Body */}
                          <div className="flex-grow min-w-0">
                            <p className="text-xs text-gray-700 dark:text-gray-200 leading-normal">
                              <span className="font-extrabold text-gray-900 dark:text-white mr-1">
                                {notif.senderName}
                              </span>
                              {getNotificationText()}
                            </p>
                            <span className="text-[10px] text-gray-450 dark:text-gray-550 font-mono mt-1 block">
                              {formatRelativeTime(notif.createdAt)}
                            </span>
                          </div>

                          {/* Right Side blue circle showing unread state */}
                          {isUnread && (
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 self-center mt-2 ring-1 ring-blue-400/30 animate-pulse" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative shrink-0" ref={menuRef}>
          {/* User Name and Profile Click triggers the dropdown menu options */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`flex items-center gap-2 p-1.5 rounded-full transition-all duration-200 cursor-pointer ${
              isMenuOpen
                ? 'bg-blue-50 dark:bg-blue-950/40 ring-2 ring-blue-100 dark:ring-blue-900/40'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            id="user-profile-menu-trigger"
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
                    <span className="text-[11px] text-gray-400 dark:text-gray-550 font-mono truncate">
                      @{currentUser.username}
                    </span>
                  </div>
                </div>

                {/* Quick tab shortcuts (highly useful on mobile) */}
                <div className="py-2.5 px-2.5 space-y-1">
                  <div className="px-2.5 py-0.5 text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-wider">
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
                    onClick={() => handleMenuTabSelect('messenger')}
                    className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                      activeTab === 'messenger'
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                    <span>Free Chat</span>
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
                  <div className="px-2.5 py-0.5 text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-wider">
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
                  <div className="flex items-center justify-between px-2.5 py-1 text-[10px] text-gray-450 dark:text-gray-550 font-mono pt-1.5 border-t border-gray-100/50 dark:border-gray-800/50 mt-1">
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
