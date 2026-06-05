/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ShieldAlert, RefreshCw, Sparkles, Bell, ThumbsUp, MessageSquare, Share2, Heart } from 'lucide-react';
import { User, Post, DatabaseSchema, AppNotification } from './types';
import AuthSection from './components/AuthSection';
import Navbar from './components/Navbar';
import SidebarLeft from './components/SidebarLeft';
import SidebarRight from './components/SidebarRight';
import FeedSection from './components/FeedSection';
import ProfileSection from './components/ProfileSection';
import FriendsSection from './components/FriendsSection';
import ReelsSection from './components/ReelsSection';
import MessengerSection from './components/MessengerSection';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'feed' | 'reels' | 'profile' | 'friends' | 'messenger'>('feed');
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [preselectedUserId, setPreselectedUserId] = useState<string | null>(null);

  // Global theme state management
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('fb_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('fb_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Application Data States
  const [posts, setPosts] = useState<Post[]>([]);
  const [friendsState, setFriendsState] = useState<{
    friends: User[];
    pendingSent: User[];
    pendingReceived: User[];
    suggestions: User[];
  }>({
    friends: [],
    pendingSent: [],
    pendingReceived: [],
    suggestions: [],
  });

  const [loading, setLoading] = useState(true);
  const [isFeedLoading, setIsFeedLoading] = useState(true);
  const [networkError, setNetworkError] = useState('');

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);

  // Restore session from localStorage on startup
  useEffect(() => {
    const savedToken = localStorage.getItem('fb_user_token');
    if (savedToken) {
      setToken(savedToken);
      fetchSession(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch full application data once authenticated
  useEffect(() => {
    if (token && currentUser) {
      fetchFeed();
      fetchFriendsState();
      fetchNotifications();
    }
  }, [token, currentUser]);

  // Global WebSocket Connection for Real-Time Notification delivery
  useEffect(() => {
    if (!token || !currentUser) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socketUrl = `${protocol}//${window.location.host}`;
    const ws = new WebSocket(socketUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'auth',
        token: token
      }));
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'notification' && payload.notification) {
          const newNotif = payload.notification as AppNotification;
          
          setNotifications(prev => {
            const exists = prev.some(n => n.id === newNotif.id);
            if (exists) return prev;
            return [newNotif, ...prev];
          });

          setActiveToast(newNotif);

          const timeoutId = setTimeout(() => {
            setActiveToast(current => current?.id === newNotif.id ? null : current);
          }, 5000);

          return () => clearTimeout(timeoutId);
        }
      } catch (err) {
        console.error('Error handling notification in App.tsx socket receiver:', err);
      }
    };

    return () => {
      ws.close();
    };
  }, [token, currentUser]);

  const fetchSession = async (authToken: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
      } else {
        localStorage.removeItem('fb_user_token');
        setToken(null);
      }
    } catch (e) {
      console.error('Session restored error:', e);
      setNetworkError('Failed to establish connection with server db.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeed = async () => {
    setIsFeedLoading(true);
    try {
      const response = await fetch('/api/feed', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsFeedLoading(false);
    }
  };

  const fetchFriendsState = async () => {
    try {
      const response = await fetch('/api/friends', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFriendsState(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (e) {
      console.error('Error marking notifications as read:', e);
    }
  };

  const handleMarkNotificationAsRead = async (id: string) => {
    try {
      const response = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id })
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      }
    } catch (e) {
      console.error('Error marking notification as read:', e);
    }
  };

  const handleAuthSuccess = (user: User, authToken: string) => {
    setCurrentUser(user);
    setToken(authToken);
    localStorage.setItem('fb_user_token', authToken);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToken(null);
    setActiveTab('feed');
    setViewingUserId(null);
    localStorage.removeItem('fb_user_token');
  };

  // Relationship triggers
  const handleFriendRequest = async (targetUserId: string) => {
    try {
      const response = await fetch(`/api/friends/request/${targetUserId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        fetchFriendsState();
        fetchFeed();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAcceptRequest = async (senderUserId: string) => {
    try {
      const response = await fetch(`/api/friends/accept/${senderUserId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        fetchFriendsState();
        fetchFeed();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeclineRequest = async (partnerUserId: string) => {
    try {
      const response = await fetch(`/api/friends/decline/${partnerUserId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        fetchFriendsState();
        fetchFeed();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateProfile = async (updatedData: { displayName?: string; bio?: string; avatarUrl?: string; coverUrl?: string }) => {
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
        fetchFeed();
        fetchFriendsState();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTabChange = (tab: 'feed' | 'reels' | 'profile' | 'friends' | 'messenger', targetUserId: string | null = null) => {
    setViewingUserId(targetUserId);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleClickUser = (userId: string) => {
    if (userId === currentUser?.id) {
      handleTabChange('profile', null);
    } else {
      handleTabChange('profile', userId);
    }
  };

  const handleUpdateCurrentUserStatus = (status: 'active' | 'offline' | 'dnd') => {
    if (currentUser) {
      setCurrentUser(prev => prev ? { ...prev, statusMode: status } : null);
    }
  };

  const handleSendMessageFromProfile = (userId: string) => {
    setPreselectedUserId(userId);
    setActiveTab('messenger');
  };

  // Compile directory of all known users to search viewing context
  const allKnownUsers = currentUser 
    ? [
        currentUser,
        ...friendsState.friends,
        ...friendsState.pendingSent,
        ...friendsState.pendingReceived,
        ...friendsState.suggestions
      ].filter((u): u is User => !!u)
    : [];

  const viewingUser = viewingUserId 
    ? allKnownUsers.find(u => u.id === viewingUserId) || currentUser 
    : currentUser;

  // Derive friendship state indicators for the user profile header
  let derivedStatus: 'none' | 'pending_sent' | 'pending_received' | 'accepted' = 'none';
  if (viewingUser && viewingUser.id !== currentUser?.id) {
    if (friendsState.friends.some(f => f.id === viewingUser.id)) {
      derivedStatus = 'accepted';
    } else if (friendsState.pendingSent.some(f => f.id === viewingUser.id)) {
      derivedStatus = 'pending_sent';
    } else if (friendsState.pendingReceived.some(f => f.id === viewingUser.id)) {
      derivedStatus = 'pending_received';
    }
  }

  // Visual loaders
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-10 h-10 text-blue-600 dark:text-blue-500 animate-spin" />
          <h1 className="text-3xl font-extrabold text-blue-600 dark:text-blue-500 block animate-pulse">freebook</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">Setting up server connection...</p>
        </div>
      </div>
    );
  }

  if (networkError) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-955 flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg max-w-sm text-center shadow border border-gray-200 dark:border-gray-800 space-y-4">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">Connection Failed</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{networkError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-2 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 transition"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Not logged in -> Render Register/Login
  if (!token || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-10 flex items-center justify-center">
        <AuthSection onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-800 dark:text-gray-100 font-sans antialiased selection:bg-blue-100 dark:selection:bg-blue-900 select-none pb-12 transition-colors duration-200">
      
      {/* Universal Top Actions Navigation */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        onChangeTab={handleTabChange}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        notifications={notifications}
        onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
        onMarkNotificationAsRead={handleMarkNotificationAsRead}
      />

      {/* Main Structural Body Grid */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 pt-6">
        <div className="flex items-start gap-6">
          
          {/* 1. Left Sidebar Navigation Shortcuts */}
          {activeTab !== 'profile' && activeTab !== 'friends' && (
            <SidebarLeft 
              currentUser={currentUser} 
              onChangeTab={handleTabChange} 
            />
          )}

          {/* 2. Middle Content Panel (Renders specific panels under route tabs) */}
          <div className="flex-grow min-w-0">
            {activeTab === 'feed' && (
              <FeedSection
                currentUser={currentUser}
                posts={posts}
                onRefreshFeed={fetchFeed}
                onClickUser={handleClickUser}
                token={token}
                isLoading={isFeedLoading}
              />
            )}

            {activeTab === 'reels' && (
              <ReelsSection
                currentUser={currentUser}
                onClickUser={handleClickUser}
              />
            )}

            {activeTab === 'profile' && viewingUser && (
              <ProfileSection
                currentUser={currentUser}
                viewingUser={viewingUser}
                posts={posts}
                friendStatus={derivedStatus}
                onFriendRequest={handleFriendRequest}
                onAcceptRequest={handleAcceptRequest}
                onDeclineRequest={handleDeclineRequest}
                onUpdateProfile={handleUpdateProfile}
                onRefreshFeed={fetchFeed}
                onClickUser={handleClickUser}
                token={token}
                onSendMessageClick={handleSendMessageFromProfile}
              />
            )}

            {activeTab === 'friends' && (
              <FriendsSection
                friends={friendsState.friends}
                pendingSent={friendsState.pendingSent}
                pendingReceived={friendsState.pendingReceived}
                suggestions={friendsState.suggestions}
                onFriendRequest={handleFriendRequest}
                onAcceptRequest={handleAcceptRequest}
                onDeclineRequest={handleDeclineRequest}
                onClickUser={handleClickUser}
              />
            )}

            {activeTab === 'messenger' && (
              <MessengerSection
                currentUser={currentUser}
                friends={friendsState.friends}
                token={token}
                preselectedUserId={preselectedUserId}
                onClearPreselected={() => setPreselectedUserId(null)}
                onClickUser={handleClickUser}
                onUpdateCurrentUserStatus={handleUpdateCurrentUserStatus}
              />
            )}
          </div>

          {/* 3. Right Sidebar Contacts and Request Counters */}
          {activeTab !== 'profile' && activeTab !== 'friends' && activeTab !== 'messenger' && (
            <SidebarRight
              pendingRequests={friendsState.pendingReceived}
              friends={friendsState.friends}
              onAcceptRequest={handleAcceptRequest}
              onDeclineRequest={handleDeclineRequest}
              onClickUser={handleClickUser}
            />
          )}

        </div>
      </main>

      {/* Live Global Toast Popups */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, x: 20, scale: 0.9 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed top-16 right-4 z-50 bg-white dark:bg-gray-900 border border-blue-100 dark:border-blue-900 shadow-2xl rounded-2xl p-4 w-80 sm:w-96 flex items-start gap-4 cursor-pointer select-none"
            onClick={() => {
              // Mark as read
              handleMarkNotificationAsRead(activeToast.id);
              // Clear active toast
              setActiveToast(null);
              // Switch to feed
              handleTabChange('feed', null);
              // Scroll to post
              setTimeout(() => {
                const el = document.getElementById(`post-${activeToast.postId}`);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  el.classList.add('ring-4', 'ring-blue-500/40', 'dark:ring-blue-400/30', 'ring-offset-2', 'dark:ring-offset-gray-900', 'transition-all', 'duration-500');
                  setTimeout(() => {
                    el.classList.remove('ring-4', 'ring-blue-500/40', 'dark:ring-blue-400/30', 'ring-offset-2', 'dark:ring-offset-gray-900');
                  }, 3000);
                }
              }, 500);
            }}
          >
            <div className="relative shrink-0 w-11 h-11">
              <img
                src={activeToast.senderAvatar}
                alt={activeToast.senderName}
                className="w-11 h-11 rounded-full object-cover border border-gray-150 dark:border-gray-800"
                referrerPolicy="no-referrer"
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center ring-2 ring-white dark:ring-gray-900 shadow">
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </span>
            </div>
            
            <div className="flex-grow min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-gray-900 dark:text-white truncate">
                  {activeToast.senderName}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveToast(null);
                  }}
                  className="px-1.5 py-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0 cursor-pointer text-[10px] font-bold font-mono transition-colors"
                >
                  DISMISS
                </button>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-350 mt-1 font-sans leading-relaxed">
                {activeToast.type === 'like' && 'liked your post'}
                {activeToast.type === 'reaction' && `reacted with ${activeToast.reactionType} to your post`}
                {activeToast.type === 'comment' && `commented: "${activeToast.commentContent}"`}
                {activeToast.type === 'share' && 'shared your post'}
              </p>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold block mt-1.5 uppercase tracking-wider">
                Click to view post
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
