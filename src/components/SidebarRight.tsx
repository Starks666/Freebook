/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  UserCheck, 
  UserX, 
  ExternalLink,
  MessageSquare,
  Gift
} from 'lucide-react';
import { User } from '../types';
import AnimatedMedia from './AnimatedMedia';

interface SidebarRightProps {
  pendingRequests: User[];
  friends: User[];
  onAcceptRequest: (userId: string) => void;
  onDeclineRequest: (userId: string) => void;
  onClickUser: (userId: string) => void;
}

export default function SidebarRight({ 
  pendingRequests, 
  friends, 
  onAcceptRequest, 
  onDeclineRequest,
  onClickUser
}: SidebarRightProps) {
  return (
    <aside className="w-80 shrink-0 hidden lg:flex flex-col gap-6 sticky top-20 overflow-y-auto max-h-[85vh] pl-4 select-none">
      
      {/* 1. Pending Friend Requests List */}
      {pendingRequests.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
              Friend Requests
            </h3>
            <span className="bg-red-500 text-white font-extrabold px-2 py-0.5 rounded-full text-2xs">
              {pendingRequests.length}
            </span>
          </div>

          <div className="space-y-4">
            {pendingRequests.map((sender) => (
              <div key={sender.id} className="flex gap-3 items-start border-b border-gray-100 dark:border-gray-800 pb-3 last:border-b-0 last:pb-0">
                <AnimatedMedia
                  src={sender.avatarUrl}
                  alt={sender.displayName}
                  className="w-11 h-11 rounded-full object-cover cursor-pointer hover:opacity-90 border border-gray-100 dark:border-gray-800"
                  onClick={() => onClickUser(sender.id)}
                  referrerPolicy="no-referrer"
                />
                <div className="flex-grow min-w-0 space-y-1.5">
                  <div>
                    <span 
                      onClick={() => onClickUser(sender.id)}
                      className="font-bold text-sm text-gray-800 dark:text-white hover:underline cursor-pointer block truncate"
                    >
                      {sender.displayName}
                    </span>
                    <span className="text-2xs text-gray-500 dark:text-gray-400 font-mono">@{sender.username}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onAcceptRequest(sender.id)}
                      className="flex-grow py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Confirm
                    </button>
                    <button
                      onClick={() => onDeclineRequest(sender.id)}
                      className="py-1.5 px-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Classic Sponsored Section (replicates Facebook) */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Sponsored Advertisements
        </h3>
        <div className="space-y-3 text-sm">
          <a
            href="https://ai.studio/build"
            target="_blank"
            rel="noopener noreferrer"
            className="flex gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 p-1.5 rounded-lg transition-all group"
          >
            <img
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=120&q=80"
              alt="Analytics visual"
              className="w-20 h-20 rounded-md object-cover border border-gray-150 dark:border-gray-800"
            />
            <div className="flex-grow min-w-0 flex flex-col justify-between py-0.5">
              <div>
                <span className="font-bold text-xs text-gray-800 dark:text-white block truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  Build Apps With Gemini AI
                </span>
                <span className="text-2xs text-gray-500 dark:text-gray-400 font-mono block">ai.studio/build</span>
              </div>
              <p className="text-2xs text-gray-600 dark:text-gray-400 leading-tight">
                Turn prompt ideas into scalable containerized web products. Ready to launch.
              </p>
            </div>
          </a>

          <hr className="border-gray-100 dark:border-gray-800" />

          <div className="flex gap-3 group p-1.5">
            <img
              src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=120&q=80"
              alt="Tech headset"
              className="w-20 h-20 rounded-md object-cover border border-gray-150 dark:border-gray-800"
            />
            <div className="flex-grow min-w-0 flex flex-col justify-between py-0.5 text-xs">
              <div>
                <span className="font-bold text-xs text-gray-800 dark:text-white block truncate">
                  Immersive VR Headsets
                </span>
                <span className="text-2xs text-gray-500 dark:text-gray-400 font-mono block">oculus.com/next-gen</span>
              </div>
              <p className="text-2xs text-gray-600 dark:text-gray-400 leading-tight">
                Experience next-generation virtual environments. 30% off this weekend!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Birthdays mimic Panel */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-4 flex gap-3 items-start text-sm">
        <div className="p-2 bg-pink-100 dark:bg-pink-950/40 rounded-lg text-pink-600 dark:text-pink-400 shrink-0">
          <Gift className="w-5 h-5" />
        </div>
        <div className="space-y-1 bg-transparent">
          <h4 className="font-bold text-gray-800 dark:text-white">Birthdays</h4>
          <p className="text-xs text-gray-650 dark:text-gray-300 leading-relaxed">
            <span className="font-bold cursor-pointer hover:underline">Marcus Vance</span> and <span className="font-bold">1 other friend</span> are celebrating their birthday today!
          </p>
        </div>
      </div>

      {/* 4. Active Contacts List */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-4 flex-grow flex flex-col min-h-[250px]">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 mb-2">
          <h3 className="text-sm font-bold text-gray-800 dark:text-white">
            Contacts & Active Friends
          </h3>
          <span className="flex items-center gap-1 text-[11px] font-mono text-green-600 dark:text-green-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span>Online</span>
          </span>
        </div>

        {friends.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center p-6 text-center text-gray-400 dark:text-gray-550 space-y-2">
            <MessageSquare className="w-8 h-8 opacity-60" />
            <p className="text-xs">No active friends found. Search connections in the "Friends" navigation tab above!</p>
          </div>
        ) : (
          <div className="space-y-1 overflow-y-auto max-h-[40vh] pr-1">
            {friends.map((friend) => (
              <button
                key={friend.id}
                onClick={() => onClickUser(friend.id)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-150 dark:hover:bg-gray-850 transition-all text-left cursor-pointer"
              >
                <div className="relative">
                  <AnimatedMedia
                    src={friend.avatarUrl}
                    alt={friend.displayName}
                    className="w-9 h-9 rounded-full object-cover border border-gray-150 dark:border-gray-750"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white dark:border-gray-900 ring-1 ring-green-600"></span>
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-sm text-gray-800 dark:text-white block truncate hover:underline">
                    {friend.displayName}
                  </span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">@{friend.username}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

    </aside>
  );
}
