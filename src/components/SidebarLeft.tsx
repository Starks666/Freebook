/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Users, 
  Bookmark, 
  Tv, 
  ShoppingBag, 
  Clock, 
  Compass,
  Briefcase,
  HelpCircle,
  FileText
} from 'lucide-react';
import { User } from '../types';
import AnimatedMedia from './AnimatedMedia';

interface SidebarLeftProps {
  currentUser: User;
  onChangeTab: (tab: 'feed' | 'reels' | 'profile' | 'friends', targetUserId?: string | null) => void;
}

export default function SidebarLeft({ currentUser, onChangeTab }: SidebarLeftProps) {
  const sidebarItems = [
    {
      id: 'friends-shortcut',
      icon: <Users className="w-6 h-6 text-blue-500" />,
      label: 'Friends & Contacts',
      onClick: () => onChangeTab('friends', null)
    },
    {
      id: 'reels-shortcut',
      icon: <Tv className="w-6 h-6 text-pink-500 animate-pulse" />,
      label: 'Reels Lounge',
      badge: 'New',
      onClick: () => onChangeTab('reels', null)
    },
    {
      id: 'saved-shortcut',
      icon: <Bookmark className="w-6 h-6 text-purple-500" />,
      label: 'Saved Collections',
      badge: '3',
      onClick: () => {}
    },
    {
      id: 'marketplace-shortcut',
      icon: <ShoppingBag className="w-6 h-6 text-amber-500" />,
      label: 'Marketplace',
      onClick: () => {}
    },
    {
      id: 'memories-shortcut',
      icon: <Clock className="w-6 h-6 text-rose-500" />,
      label: 'Memories (On This Day)',
      onClick: () => {}
    },
    {
      id: 'explore-shortcut',
      icon: <Compass className="w-6 h-6 text-indigo-500" />,
      label: 'Explore Pages',
      onClick: () => {}
    },
    {
      id: 'jobs-shortcut',
      icon: <Briefcase className="w-6 h-6 text-orange-500" />,
      label: 'Jobs & Careers',
      onClick: () => {}
    },
  ];

  return (
    <aside className="w-72 shrink-0 hidden xl:flex flex-col gap-6 sticky top-20 overflow-y-auto max-h-[85vh] pr-4 select-none">
      {/* Current User Profile Shortcut */}
      <div 
        onClick={() => onChangeTab('profile', null)}
        className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-150 dark:border-gray-800 hover:bg-gray-150 dark:hover:bg-gray-800 cursor-pointer shadow-sm transition-all"
      >
        <AnimatedMedia
          src={currentUser.avatarUrl}
          alt={currentUser.displayName}
          className="w-10 h-10 rounded-full object-cover border border-gray-100 dark:border-gray-850 shrink-0"
          referrerPolicy="no-referrer"
        />
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-gray-800 dark:text-white text-sm truncate">
            {currentUser.displayName}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
            View My Profile
          </span>
        </div>
      </div>

      {/* Primary Shortcut Navigation List */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-2">
        <h3 className="px-3 pt-2 pb-1 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Core Shortcuts
        </h3>
        <div className="space-y-0.5 mt-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={item.onClick}
              className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-all text-left text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full text-xs font-bold">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Helpful Info section */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl p-4 shadow-sm text-xs text-blue-800 dark:text-blue-300 space-y-2">
        <div className="flex items-center gap-1.5 font-bold">
          <HelpCircle className="w-4 h-4 shrink-0" />
          <span>Need help getting started?</span>
        </div>
        <p className="leading-relaxed">
          Create some test posts, comment on Emma or Marcus's posts, or send/accept friend requests in the active contacts lists.
        </p>
      </div>

      {/* Subtle branding footer */}
      <div className="px-3 text-[11px] text-gray-400 dark:text-gray-500 font-mono space-y-1">
        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
          <FileText className="w-3.5 h-3.5" />
          <span>Local storage persistence</span>
        </div>
        <div>freebook © 2026. Made with ❤️ in Cloud Run environment.</div>
      </div>
    </aside>
  );
}
