/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  UserMinus, 
  Clock, 
  ShieldAlert,
  SearchCheck,
  SearchCode
} from 'lucide-react';
import { User } from '../types';
import AnimatedMedia from './AnimatedMedia';

interface FriendsSectionProps {
  friends: User[];
  pendingSent: User[];
  pendingReceived: User[];
  suggestions: User[];
  onFriendRequest: (targetUserId: string) => void;
  onAcceptRequest: (senderUserId: string) => void;
  onDeclineRequest: (partnerUserId: string) => void;
  onClickUser: (userId: string) => void;
}

export default function FriendsSection({
  friends,
  pendingSent,
  pendingReceived,
  suggestions,
  onFriendRequest,
  onAcceptRequest,
  onDeclineRequest,
  onClickUser
}: FriendsSectionProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 select-none">
      
      {/* Upper header */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-105 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-gray-800 dark:text-gray-100">
              Connections Dashboard
            </h2>
            <p className="text-xs text-gray-550 dark:text-gray-400">
              Build your custom circle, respond to incoming requests, or search active suggestions on Freebook.
            </p>
          </div>
        </div>
        <div className="flex gap-2 text-xs font-mono">
          <span className="bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-400 font-bold px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-900/30">
            {friends.length} Active {friends.length === 1 ? 'Friend' : 'Friends'}
          </span>
          {pendingReceived.length > 0 && (
            <span className="bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-400 font-bold px-3 py-1.5 rounded-lg border border-red-100 dark:border-red-900/30 animate-pulse">
              {pendingReceived.length} New Requests
            </span>
          )}
        </div>
      </div>

      {/* Grid columns - 1: Requests Panel, 2: Friends or Suggestions List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Left Side: Pending requests (Target of 1 col or full depending on presence) */}
        <div className="md:col-span-1 space-y-6">
          
          {/* Incoming requests check */}
          <div className="bg-white dark:bg-gray-900 p-4 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-gray-800 dark:text-gray-200 flex items-center justify-between">
              <span>Incoming Requests</span>
              <span className="text-xs bg-red-100 dark:bg-red-950/50 text-red-650 dark:text-red-400 px-2 py-0.5 rounded-full font-bold">
                {pendingReceived.length}
              </span>
            </h3>

            {pendingReceived.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-gray-500 py-3 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">No pending invitations received.</p>
            ) : (
              <div className="space-y-3.5">
                {pendingReceived.map((u) => (
                  <div key={u.id} className="flex gap-3 pb-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0 last:pb-0 items-start">
                    <AnimatedMedia
                      src={u.avatarUrl}
                      alt={u.displayName}
                      className="w-10 h-10 rounded-full object-cover shrink-0 cursor-pointer"
                      onClick={() => onClickUser(u.id)}
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-grow min-w-0 space-y-1.5">
                      <div>
                        <span 
                          onClick={() => onClickUser(u.id)}
                          className="font-bold text-xs text-gray-800 dark:text-white hover:underline cursor-pointer block truncate"
                        >
                          {u.displayName}
                        </span>
                        <span className="text-2xs text-gray-450 dark:text-gray-500 block truncate">@{u.username}</span>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => onAcceptRequest(u.id)}
                          className="flex-1 py-1.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 cursor-pointer"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => onDeclineRequest(u.id)}
                          className="px-2 py-1.5 bg-gray-105 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outgoing Requests Check */}
          <div className="bg-white dark:bg-gray-900 p-4 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-gray-800 dark:text-gray-200">Sent Pending Invites</h3>
            
            {pendingSent.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-gray-500 py-3 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">No pending invites sent.</p>
            ) : (
              <div className="space-y-3.5">
                {pendingSent.map((u) => (
                  <div key={u.id} className="flex gap-3 items-center justify-between pb-2 last:border-0 last:pb-0">
                    <div className="flex gap-2 items-center min-w-0">
                      <AnimatedMedia
                        src={u.avatarUrl}
                        alt={u.displayName}
                        className="w-8 h-8 rounded-full object-cover shrink-0 cursor-pointer"
                        onClick={() => onClickUser(u.id)}
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <span 
                          onClick={() => onClickUser(u.id)}
                          className="font-bold text-xs text-gray-805 dark:text-white hover:underline cursor-pointer block truncate"
                        >
                          {u.displayName}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 block truncate">@{u.username}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onDeclineRequest(u.id)}
                      className="px-2 py-1 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 hover:border-red-100 text-[10px] font-bold shrink-0 transition-colors cursor-pointer"
                      title="Cancel sent request"
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Active Connections & Recommendations */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Friends List Grid */}
          <div className="bg-white dark:bg-gray-900 p-5 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-gray-808 dark:text-gray-100 flex items-center gap-1.5">
              <UserCheck className="w-4.5 h-4.5 text-green-500" />
              <span>My Friends ({friends.length})</span>
            </h3>

            {friends.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-gray-400 dark:text-gray-500 space-y-2">
                <SearchCode className="w-8 h-8 mx-auto opacity-50" />
                <p className="text-sm font-semibold">Your connections drawer is empty</p>
                <p className="text-xs">Browse the people recommendations directory on the right to expand your circle!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {friends.map((friend) => (
                  <div key={friend.id} className="p-3 border border-gray-150 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <AnimatedMedia
                        src={friend.avatarUrl}
                        alt={friend.displayName}
                        className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-90"
                        onClick={() => onClickUser(friend.id)}
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <span 
                          onClick={() => onClickUser(friend.id)}
                          className="font-bold text-xs text-gray-800 dark:text-white hover:underline cursor-pointer block truncate"
                        >
                          {friend.displayName}
                        </span>
                        <p className="text-[10px] text-gray-405 dark:text-gray-450 truncate">@{friend.username}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to remove ${friend.displayName} from your friends?`)) {
                          onDeclineRequest(friend.id);
                        }
                      }}
                      className="p-1 px-2.5 bg-gray-50 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-955/30 text-gray-505 dark:text-gray-400 hover:text-red-650 dark:hover:text-red-400 border border-gray-200 dark:border-gray-700 hover:border-red-150 rounded text-2xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <UserMinus className="w-3.5 h-3.5 shrink-0" />
                      <span>Remove</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User Search & Suggestions Catalog */}
          <div className="bg-white dark:bg-gray-900 p-5 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
              <SearchCheck className="w-4.5 h-4.5 text-blue-500" />
              <span>People Recommendations</span>
            </h3>

            {suggestions.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-gray-500 py-3 text-center">Everyone on Freebook is already connected with you!</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {suggestions.map((u) => (
                  <div key={u.id} className="p-3 border border-gray-150 dark:border-gray-800 bg-gray-25/50 dark:bg-gray-950/20 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex flex-col justify-between gap-3 shadow-2xs">
                    <div className="flex gap-3">
                      <AnimatedMedia
                        src={u.avatarUrl}
                        alt={u.displayName}
                        className="w-11 h-11 rounded-full object-cover border border-gray-200 dark:border-gray-700 shrink-0 cursor-pointer hover:opacity-90"
                        onClick={() => onClickUser(u.id)}
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <span 
                          onClick={() => onClickUser(u.id)}
                          className="font-extrabold text-xs text-gray-850 dark:text-white hover:underline cursor-pointer block truncate"
                        >
                          {u.displayName}
                        </span>
                        <span className="text-[10px] text-gray-409 dark:text-gray-500 font-mono">@{u.username}</span>
                        <p className="text-2xs text-gray-550 dark:text-gray-400 leading-normal mt-1 line-clamp-2 italic">{u.bio || "No summary biography specified."}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => onFriendRequest(u.id)}
                      className="w-full py-1.5 px-3 bg-blue-50 dark:bg-gray-800 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white text-blue-700 dark:text-blue-400 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add Friend</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
