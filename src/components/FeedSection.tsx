/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ThumbsUp, 
  MessageSquare, 
  Trash2, 
  Image as ImageIcon,
  Smile,
  Send,
  Share2,
  MoreVertical,
  AlertTriangle,
  EyeOff,
  Flag,
  CheckCircle,
  Pencil
} from 'lucide-react';
import { User, Post, Comment } from '../types';
import { playReactionTone } from '../utils/audio';
import AnimatedMedia from './AnimatedMedia';

const pickerVariants = {
  hidden: { opacity: 0, scale: 0.85, y: 15 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 350,
      damping: 22,
      staggerChildren: 0.05
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.85, 
    y: 10,
    transition: {
      duration: 0.15
    }
  }
};

const emojiVariants = {
  hidden: { opacity: 0, scale: 0.4, y: 15 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { 
      type: 'spring', 
      stiffness: 400, 
      damping: 16 
    } 
  },
  hover: { 
    scale: 1.45, 
    y: -10, 
    zIndex: 10,
    transition: { 
      type: 'spring', 
      stiffness: 450, 
      damping: 12 
    } 
  },
  tap: { 
    scale: 0.9, 
    y: 2 
  }
};

interface FeedSectionProps {
  currentUser: User;
  posts: Post[];
  onRefreshFeed: () => void;
  onClickUser: (userId: string) => void;
  token: string;
  isLoading?: boolean;
}

export default function FeedSection({ 
  currentUser, 
  posts, 
  onRefreshFeed, 
  onClickUser,
  token,
  isLoading = false
}: FeedSectionProps) {
  // Post Creator states
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState('');

  // Comment input states: maps postId -> commentText
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});
  // Track open comment trays: maps postId -> boolean (expanded)
  const [openComments, setOpenComments] = useState<{ [postId: string]: boolean }>({});
  
  // Track visible reactions picker on mobile: maps postId -> boolean
  const [pickerOpenPostId, setPickerOpenPostId] = useState<string | null>(null);
  // Track visible reactions picker on desktop hover: maps postId -> string/null
  const [hoveredPostId, setHoveredPostId] = useState<string | null>(null);

  // Three-dot menu and report states
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);
  const [hiddenPostIds, setHiddenPostIds] = useState<string[]>([]);
  const [reportingPost, setReportingPost] = useState<Post | null>(null);
  const [reportReason, setReportReason] = useState<string>('');
  const [reportIssues, setReportIssues] = useState<string[]>([]);
  const [reportSuccess, setReportSuccess] = useState(false);

  // Post Editing States
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');
  const [editingImageUrl, setEditingImageUrl] = useState<string>('');
  const [isUpdatingPost, setIsUpdatingPost] = useState(false);

  // Comment & replies states
  const [activeReplyCommentId, setActiveReplyCommentId] = useState<string | null>(null);
  const [replyInputs, setReplyInputs] = useState<{ [commentId: string]: string }>({});

  const getPostReactionsState = (p: Post) => {
    const rs = p.reactions || {};
    // Fallback: If UID exists in likes but not in reactions, treat it as 'like'
    const finalReactions: { [userId: string]: 'like' | 'love' | 'haha' | 'sad' | 'angry' } = {};
    p.likes.forEach(uid => {
      finalReactions[uid] = rs[uid] || 'like';
    });

    const counts = {
      like: 0,
      love: 0,
      haha: 0,
      sad: 0,
      angry: 0
    };

    Object.entries(finalReactions).forEach(([uid, rType]) => {
      if (counts[rType] !== undefined) {
        counts[rType]++;
      } else {
        counts.like++;
      }
    });

    const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);
    const activeTypes = (Object.keys(counts) as Array<'like' | 'love' | 'haha' | 'sad' | 'angry'>)
      .filter(t => counts[t] > 0);

    const myReaction = finalReactions[currentUser.id] || null;

    return {
      reactionsMap: finalReactions,
      counts,
      totalCount,
      activeTypes,
      myReaction
    };
  };

  const handleReactToPost = async (postId: string, reactionType: 'like' | 'love' | 'haha' | 'sad' | 'angry') => {
    try {
      // Play beautiful synthesizer feel chime!
      playReactionTone(reactionType);

      const response = await fetch(`/api/posts/${postId}/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type: reactionType })
      });

      if (response.ok) {
        setPickerOpenPostId(null);
        onRefreshFeed();
      }
    } catch (e) {
      console.error('Reaction error:', e);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostError('');

    if (!content.trim() && !imageUrl.trim()) {
      setPostError('Please write some content or supply an image URL to publish.');
      return;
    }

    setIsPosting(true);
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content, imageUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to publish post. Try again.');
      }

      setContent('');
      setImageUrl('');
      setShowImageInput(false);
      onRefreshFeed();
    } catch (err: any) {
      setPostError(err.message || 'Error occurred while publishing.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post permanently?')) {
      return;
    }

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        onRefreshFeed();
      } else {
        alert('Could not delete post. Permission denied.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleLike = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        onRefreshFeed();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePostComment = async (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = commentInputs[postId] || '';
    if (!text.trim()) return;

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: text })
      });

      if (response.ok) {
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
        // Ensure comments tray stays open
        setOpenComments(prev => ({ ...prev, [postId]: true }));
        onRefreshFeed();
      }
    } catch (e) {
      console.error('Comment error:', e);
    }
  };

  const handleToggleCommentLike = async (postId: string, commentId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments/${commentId}/toggle-like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        onRefreshFeed();
      }
    } catch (e) {
      console.error('Comment like error:', e);
    }
  };

  const handlePostCommentReply = async (postId: string, commentId: string, text: string) => {
    if (!text.trim()) return;
    try {
      const response = await fetch(`/api/posts/${postId}/comments/${commentId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: text })
      });
      if (response.ok) {
        setReplyInputs(prev => ({ ...prev, [commentId]: '' }));
        setActiveReplyCommentId(null);
        onRefreshFeed();
      }
    } catch (e) {
      console.error('Comment reply error:', e);
    }
  };

  const handleToggleReplyLike = async (postId: string, commentId: string, replyId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments/${commentId}/replies/${replyId}/toggle-like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        onRefreshFeed();
      }
    } catch (e) {
      console.error('Reply like error:', e);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHrs = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHrs / 24);

      if (diffSecs < 60) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHrs < 24) return `${diffHrs}h ago`;
      return `${diffDays}d ago`;
    } catch (e) {
      return 'Recently';
    }
  };

  const formatAbsoluteTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="flex-1 max-w-2xl space-y-6">
      
      {/* 1. Post Creation Composer Card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-4 space-y-4">
        {postError && (
          <div className="text-xs bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 p-2.5 rounded border border-red-100 dark:border-red-900/30 mb-2">
            {postError}
          </div>
        )}

        <div className="flex gap-3">
          <AnimatedMedia
            src={currentUser.avatarUrl}
            alt={currentUser.displayName}
            className="w-10 h-10 rounded-full object-cover shrink-0 cursor-pointer hover:opacity-85 border border-gray-100 dark:border-gray-800"
            onClick={() => onClickUser(currentUser.id)}
            referrerPolicy="no-referrer"
          />
          <form onSubmit={handleCreatePost} className="flex-grow space-y-3">
            <textarea
              placeholder={`What's on your mind, ${currentUser.displayName.split(' ')[0]}?`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              className="w-full border-0 focus:ring-0 text-sm focus:outline-none resize-none text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-gray-50 dark:bg-gray-800 rounded-xl p-3 focus:bg-gray-50 dark:focus:bg-gray-800 transition-colors"
            />

            {showImageInput && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Image URL</label>
                <input
                  type="url"
                  placeholder="Paste an Unsplash image URL (e.g. https://images.unsplash.com/...)"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-855 text-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}

            <hr className="border-gray-100 dark:border-gray-800" />

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowImageInput(!showImageInput)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    showImageInput 
                      ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=40&q=80" alt="" className="hidden" />
                  <ImageIcon className="w-4 h-4 text-green-500" />
                  <span>Photo / Video Link</span>
                </button>
                <button
                  type="button"
                  onClick={() => alert("Select a mood sticker - feature coming soon!")}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs font-bold transition-all cursor-pointer"
                >
                  <Smile className="w-4 h-4 text-amber-500" />
                  <span>Feeling/Activity</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={isPosting || (!content.trim() && !imageUrl.trim())}
                className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {isPosting ? 'Publishing...' : 'Post'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 2. Scrollable Posts List */}
      {isLoading ? (
        <div className="space-y-6">
          {/* Skeleton Post Card 1 (with mock image attachment) */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col p-4 space-y-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800" />
                <div className="space-y-2">
                  <div className="h-3.5 w-32 bg-gray-200 dark:bg-gray-800 rounded-md" />
                  <div className="h-2.5 w-20 bg-gray-155 dark:bg-gray-805 rounded-md" />
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-150 dark:bg-gray-800" />
            </div>
            <div className="space-y-2 pt-1">
              <div className="h-3 w-full bg-gray-150 dark:bg-gray-800 rounded" />
              <div className="h-3 w-5/6 bg-gray-150 dark:bg-gray-800 rounded" />
              <div className="h-3 w-3/4 bg-gray-150 dark:bg-gray-800 rounded" />
            </div>
            <div className="h-48 sm:h-56 bg-gray-100 dark:bg-gray-950 rounded-lg border border-gray-100 dark:border-gray-800/45" />
            <div className="flex items-center justify-between border-t border-b border-gray-100 dark:border-gray-800 py-3">
              <div className="h-3 w-20 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-3 w-14 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
            <div className="flex gap-2 pt-1">
              <div className="h-8 flex-grow bg-gray-100 dark:bg-gray-800/70 rounded-lg" />
              <div className="h-8 flex-grow bg-gray-100 dark:bg-gray-800/70 rounded-lg" />
              <div className="h-8 flex-grow bg-gray-100 dark:bg-gray-800/70 rounded-lg" />
            </div>
          </div>

          {/* Skeleton Post Card 2 (text content only) */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col p-4 space-y-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800" />
                <div className="space-y-2">
                  <div className="h-3.5 w-28 bg-gray-200 dark:bg-gray-800 rounded-md" />
                  <div className="h-2.5 w-24 bg-gray-155 dark:bg-gray-805 rounded-md" />
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-150 dark:bg-gray-800" />
            </div>
            <div className="space-y-2 pt-1">
              <div className="h-3 w-full bg-gray-150 dark:bg-gray-800 rounded" />
              <div className="h-3 w-11/12 bg-gray-150 dark:bg-gray-800 rounded" />
            </div>
            <div className="flex items-center justify-between border-t border-b border-gray-100 dark:border-gray-800 py-3">
              <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-3 w-12 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
            <div className="flex gap-2 pt-1">
              <div className="h-8 flex-grow bg-gray-100 dark:bg-gray-800/70 rounded-lg" />
              <div className="h-8 flex-grow bg-gray-100 dark:bg-gray-800/70 rounded-lg" />
              <div className="h-8 flex-grow bg-gray-100 dark:bg-gray-800/70 rounded-lg" />
            </div>
          </div>

          {/* Skeleton Post Card 3 (compact layout) */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col p-4 space-y-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800" />
                <div className="space-y-2">
                  <div className="h-3.5 w-36 bg-gray-200 dark:bg-gray-800 rounded-md" />
                  <div className="h-2.5 w-16 bg-gray-155 dark:bg-gray-850 rounded-md" />
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-150 dark:bg-gray-800" />
            </div>
            <div className="space-y-2 pt-1">
              <div className="h-3 w-full bg-gray-150 dark:bg-gray-800 rounded" />
              <div className="h-3 w-2/3 bg-gray-150 dark:bg-gray-800 rounded" />
            </div>
            <div className="flex gap-2 pt-3">
              <div className="h-8 flex-grow bg-gray-100 dark:bg-gray-800/70 rounded-lg" />
              <div className="h-8 flex-grow bg-gray-100 dark:bg-gray-800/70 rounded-lg" />
              <div className="h-8 flex-grow bg-gray-100 dark:bg-gray-800/70 rounded-lg" />
            </div>
          </div>
        </div>
      ) : posts.filter(post => !hiddenPostIds.includes(post.id)).length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-12 text-center text-gray-500 dark:text-gray-400 space-y-4">
          <p className="font-semibold text-lg">No updates yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Be the first to create an updates thread or make new friends to light up the feed!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.filter(post => !hiddenPostIds.includes(post.id)).map((post) => {
            const { counts, totalCount, activeTypes, myReaction } = getPostReactionsState(post);
            const isCommentsTrayOpen = !!openComments[post.id];

            let cardBorderClass = 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700 text-gray-800 dark:text-gray-150';
            if (myReaction === 'like') {
              cardBorderClass = 'border-blue-200 dark:border-blue-900/60 bg-gradient-to-b from-white dark:from-gray-900 via-white dark:via-gray-900 to-blue-50/5 dark:to-blue-950/20 shadow-sm shadow-blue-50/10 dark:shadow-blue-950/25 text-gray-800 dark:text-gray-150';
            } else if (myReaction === 'love') {
              cardBorderClass = 'border-rose-200 dark:border-rose-900/60 bg-gradient-to-b from-white dark:from-gray-900 via-white dark:via-gray-900 to-rose-50/5 dark:to-rose-955/20 shadow-sm shadow-rose-50/10 dark:shadow-rose-955/25 text-gray-800 dark:text-gray-150';
            } else if (myReaction === 'haha') {
              cardBorderClass = 'border-amber-200 dark:border-amber-900/60 bg-gradient-to-b from-white dark:from-gray-900 via-white dark:via-gray-900 to-amber-50/5 dark:to-amber-955/20 shadow-sm shadow-amber-50/10 dark:shadow-amber-955/25 text-gray-800 dark:text-gray-150';
            } else if (myReaction === 'sad') {
              cardBorderClass = 'border-sky-200 dark:border-sky-900/60 bg-gradient-to-b from-white dark:from-gray-900 via-white dark:via-gray-900 to-sky-50/5 dark:to-sky-955/20 shadow-sm shadow-sky-50/10 dark:shadow-sky-955/25 text-gray-800 dark:text-gray-155';
            } else if (myReaction === 'angry') {
              cardBorderClass = 'border-orange-200 dark:border-orange-900/60 bg-gradient-to-b from-white dark:from-gray-900 via-white dark:via-gray-900 to-orange-50/5 dark:to-orange-955/20 shadow-sm shadow-orange-50/10 dark:shadow-orange-955/25 text-gray-800 dark:text-gray-155';
            }

            return (
              <div key={post.id} id={`post-${post.id}`} className={`rounded-xl border shadow-sm overflow-hidden flex flex-col transition-all duration-300 ${cardBorderClass}`}>
                
                {/* Post Header */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AnimatedMedia
                      src={post.author.avatarUrl}
                      alt={post.author.displayName}
                      className="w-10 h-10 rounded-full object-cover shrink-0 cursor-pointer hover:opacity-90 border border-gray-100 dark:border-gray-800"
                      onClick={() => onClickUser(post.userId)}
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <span 
                        onClick={() => onClickUser(post.userId)}
                        className="font-bold text-sm text-gray-850 dark:text-white hover:underline cursor-pointer block"
                      >
                        {post.author.displayName}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                        <span className="font-mono">@{post.author.username}</span>
                        <span>•</span>
                        <span 
                          className="relative group/time cursor-help hover:text-gray-650 dark:hover:text-gray-300 transition-colors"
                          title={formatAbsoluteTime(post.createdAt)}
                        >
                          {formatTime(post.createdAt)}
                          <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 opacity-0 group-hover/time:opacity-100 bg-gray-900 dark:bg-gray-950 text-white dark:text-gray-200 text-[10px] font-medium px-2 py-1 rounded-md shadow-lg transition-all duration-200 whitespace-nowrap z-50">
                            {formatAbsoluteTime(post.createdAt)}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3-Dot Options dropdown menu */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id);
                      }}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                      title="Post Options"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {activeMenuPostId === post.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-40 cursor-default" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuPostId(null);
                          }}
                        />
                        <div className="absolute right-0 mt-1.5 w-52 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl py-1.5 z-50 text-xs animate-fade-in text-gray-800 dark:text-gray-150">
                          {/* Option 1: Delete from sight */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuPostId(null);
                              setHiddenPostIds(prev => [...prev, post.id]);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <EyeOff className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            <span>Delete post from sight</span>
                          </button>

                          {/* Allow author to also delete permanently */}
                          {post.userId === currentUser.id && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuPostId(null);
                                  setEditingPostId(post.id);
                                  setEditingContent(post.content);
                                  setEditingImageUrl(post.imageUrl || '');
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-950/20 text-blue-600 dark:text-blue-400 flex items-center gap-2 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-800"
                              >
                                <Pencil className="w-4 h-4" />
                                <span>Edit post details</span>
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuPostId(null);
                                  handleDeletePost(post.id);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 flex items-center gap-2 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-800"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete permanently</span>
                              </button>
                            </>
                          )}

                          {/* Option 2: Report Option */}
                          <div className="border-t border-gray-100 dark:border-gray-800 mt-1 pt-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuPostId(null);
                                setReportingPost(post);
                                setReportReason('');
                                setReportIssues([]);
                                setReportSuccess(false);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-amber-50 dark:hover:bg-amber-955/20 text-amber-600 dark:text-amber-400 flex items-center gap-2 cursor-pointer transition-colors font-semibold"
                            >
                              <AlertTriangle className="w-4 h-4 text-amber-500" />
                              <span className="flex-1">Report Post</span>
                              <span className="text-[9px] uppercase font-mono tracking-wider text-amber-500 bg-amber-500/10 px-1 py-0.5 rounded">bottom</span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {editingPostId === post.id ? (
                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setIsUpdatingPost(true);
                      try {
                        const response = await fetch(`/api/posts/${post.id}`, {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          },
                          body: JSON.stringify({ content: editingContent, imageUrl: editingImageUrl.trim() || undefined })
                        });
                        if (response.ok) {
                          setEditingPostId(null);
                          onRefreshFeed();
                        } else {
                          const errData = await response.json();
                          alert(errData.error || 'Failed to update post.');
                        }
                      } catch (err) {
                        console.error('Update post error:', err);
                        alert('An error occurred while updating the post.');
                      } finally {
                        setIsUpdatingPost(false);
                      }
                    }}
                    className="px-4 pb-4 space-y-3"
                  >
                    <textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      rows={3}
                      className="w-full text-sm border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-850 dark:text-white rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Write your updated post thoughts..."
                      required
                    />
                    
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider font-extrabold text-gray-500 dark:text-gray-400">Post Image URL (Optional)</label>
                      <input
                        type="url"
                        value={editingImageUrl}
                        onChange={(e) => setEditingImageUrl(e.target.value)}
                        placeholder="Paste an Unsplash image URL or leave empty to remove..."
                        className="w-full px-3 py-2 text-xs border border-gray-250 dark:border-gray-755 bg-gray-55 dark:bg-gray-850 text-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex justify-end gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingPostId(null)}
                        className="px-3.5 py-1.5 text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-605 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-750 rounded-lg cursor-pointer transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isUpdatingPost || (!editingContent.trim() && !editingImageUrl.trim())}
                        className="px-4 py-1.5 text-xs font-bold bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-all disabled:opacity-50"
                      >
                        {isUpdatingPost ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    {/* Post Content */}
                    <div className="px-4 pb-3 text-sm text-gray-800 dark:text-white/85 whitespace-pre-wrap leading-relaxed animate-fade-in">
                      {post.content}
                    </div>

                    {/* Optional Post Image */}
                    {post.imageUrl && (
                      <div className="border-y border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 max-h-[500px] overflow-hidden flex items-center justify-center">
                        <img
                          src={post.imageUrl}
                          alt="Post attachment"
                          className="w-full h-full object-cover select-none animate-fade-in"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            // Suppress visually broken image boxes
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </>
                )}

                {/* Engagement counts */}
                <div className="px-4 py-2.5 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-medium border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-1.5 min-h-[22px]">
                    {totalCount > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <div className="flex -space-x-1.5 items-center">
                          {activeTypes.map((t) => {
                            const emoji = t === 'like' ? '👍' : t === 'love' ? '❤️' : t === 'haha' ? '😆' : t === 'sad' ? '😢' : '😡';
                            const label = t.toUpperCase();
                            return (
                              <span 
                                key={t} 
                                className="flex items-center justify-center w-5.5 h-5.5 rounded-full bg-white dark:bg-gray-805 border border-gray-150 dark:border-gray-700 text-[11px] shadow-sm ring-1 ring-black/5"
                                title={`${counts[t]} ${label}`}
                              >
                                {emoji}
                              </span>
                            );
                          })}
                        </div>
                        <span className="font-semibold text-gray-650 dark:text-gray-300">
                          {totalCount} {totalCount === 1 ? 'Reaction' : 'Reactions'}
                        </span>
                        {myReaction && (
                          <span className="text-3xs text-gray-400 dark:text-gray-500 font-medium italic pl-1 ml-0.5">
                            (You felt {myReaction})
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 italic text-2xs">No reactions yet</span>
                    )}
                  </div>
                  <button
                    onClick={() => setOpenComments(prev => ({ ...prev, [post.id]: !isCommentsTrayOpen }))}
                    className="hover:underline font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1 cursor-pointer"
                  >
                    <span>{post.comments.length} {post.comments.length === 1 ? 'Comment' : 'Comments'}</span>
                  </button>
                </div>

                {/* Post Action Buttons */}
                <div className="px-2 py-1 flex items-center border-b border-gray-100 dark:border-gray-800 select-none relative">
                  
                  {/* High Fidelity Hover/Click Reactions Launcher bar wrapper */}
                  <div 
                    className="flex-grow relative"
                    onMouseEnter={() => setHoveredPostId(post.id)}
                    onMouseLeave={() => setHoveredPostId(null)}
                  >
                    
                    {/* Reactions Tooltip Panel on Hover/Click with Framer Motion animations */}
                    <AnimatePresence>
                      {(pickerOpenPostId === post.id || hoveredPostId === post.id) && (
                        <motion.div
                          variants={pickerVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="absolute bottom-full left-4 sm:left-10 mb-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-3.5 py-2 rounded-full shadow-xl border border-gray-205 dark:border-gray-800 flex gap-4 z-40 items-center ring-1 ring-black/5 select-none"
                        >
                          {([
                            { type: 'like', emoji: '👍', label: 'Like' },
                            { type: 'love', emoji: '❤️', label: 'Love' },
                            { type: 'haha', emoji: '😆', label: 'Haha' },
                            { type: 'sad', emoji: '😢', label: 'Sad' },
                            { type: 'angry', emoji: '😡', label: 'Angry' }
                          ] as const).map((choice) => (
                            <motion.button
                              key={choice.type}
                              type="button"
                              variants={emojiVariants}
                              whileHover="hover"
                              whileTap="tap"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReactToPost(post.id, choice.type);
                              }}
                              className="flex flex-col items-center gap-1 relative cursor-pointer group/item"
                            >
                              <span className="text-2xl filter drop-shadow hover:rotate-12 transition-transform duration-100 flex items-center justify-center">
                                {choice.emoji}
                              </span>
                              <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-950 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg opacity-0 group-hover/item:opacity-100 pointer-events-none transition-all duration-150 whitespace-nowrap z-50">
                                {choice.label}
                              </span>
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Integrated Reaction Button */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          // Standard toggle action
                          if (myReaction) {
                            handleReactToPost(post.id, myReaction); // toggle off
                          } else {
                            handleReactToPost(post.id, 'like'); // toggle on
                          }
                        }}
                        className={`flex-grow flex items-center justify-center gap-2 p-2 rounded-lg text-sm font-bold transition-all duration-300 cursor-pointer ${
                          myReaction === 'like' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100/60 dark:hover:bg-blue-900/30' :
                          myReaction === 'love' ? 'text-rose-500 dark:text-rose-450 bg-rose-50 dark:bg-rose-955/20 hover:bg-rose-100/60 dark:hover:bg-rose-900/30' :
                          myReaction === 'haha' ? 'text-amber-600 dark:text-amber-450 bg-amber-50 dark:bg-amber-955/20 hover:bg-amber-100/60 dark:hover:bg-amber-900/30' :
                          myReaction === 'sad' ? 'text-sky-500 dark:text-sky-450 bg-sky-50 dark:bg-sky-955/20 hover:bg-sky-100/60 dark:hover:bg-sky-900/30' :
                          myReaction === 'angry' ? 'text-orange-600 dark:text-orange-450 bg-orange-50 dark:bg-orange-955/20 hover:bg-orange-100/60 dark:hover:bg-orange-900/30' :
                          'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-750 dark:hover:text-gray-250'
                        }`}
                      >
                        {myReaction === 'like' ? <span className="text-base select-none">👍</span> :
                         myReaction === 'love' ? <span className="text-base select-none">❤️</span> :
                         myReaction === 'haha' ? <span className="text-base select-none">😆</span> :
                         myReaction === 'sad' ? <span className="text-base select-none flex animate-bounce">😢</span> :
                         myReaction === 'angry' ? <span className="text-base select-none flex animate-pulse">😡</span> :
                         <ThumbsUp className="w-5 h-5" />}
                        
                        <span className="capitalize">{myReaction || 'Like'}</span>
                      </button>

                      {/* Mobile React trigger selector */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPickerOpenPostId(pickerOpenPostId === post.id ? null : post.id);
                        }}
                        className={`p-2 rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer transition-all ${
                          pickerOpenPostId === post.id ? 'bg-blue-50 border-blue-200 text-blue-500 dark:bg-blue-950/40 border-blue-900/20' : 'border-transparent'
                        }`}
                        title="Choose reaction emoji"
                      >
                        <Smile className="w-4.5 h-4.5" />
                      </button>
                    </div>

                  </div>

                  <button
                    onClick={() => setOpenComments(prev => ({ ...prev, [post.id]: !isCommentsTrayOpen }))}
                    className={`flex-grow flex items-center justify-center gap-2 p-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                      isCommentsTrayOpen
                        ? 'text-blue-600 dark:text-blue-400 bg-gray-50 dark:bg-gray-850/60'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span>Comment</span>
                  </button>

                  <button
                    onClick={async () => {
                      navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
                      try {
                        await fetch(`/api/posts/${post.id}/share`, {
                          method: 'POST',
                          headers: {
                            'Authorization': `Bearer ${token}`
                          }
                        });
                      } catch (e) {
                        console.error('Error reporting shared post event:', e);
                      }
                      alert('Post share link copied to clipboard!');
                    }}
                    className="flex-grow flex items-center justify-center gap-2 p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                  >
                    <Share2 className="w-5 h-5" />
                    <span>Share</span>
                  </button>
                </div>

                {/* Comments Section Tray */}
                {(isCommentsTrayOpen || post.comments.length > 0) && (
                  <div className="bg-gray-50 dark:bg-gray-950 p-4 space-y-4 transition-colors">
                    
                    {/* Render comments thread */}
                    {post.comments.length > 0 && (
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                        {post.comments.map((comment) => (
                          <div key={comment.id} className="space-y-2">
                            <div className="flex gap-3 items-start group">
                              <AnimatedMedia
                                src={comment.avatarUrl}
                                alt={comment.displayName}
                                className="w-8 h-8 rounded-full object-cover shrink-0 cursor-pointer hover:opacity-85 border border-gray-100 dark:border-gray-800"
                                onClick={() => onClickUser(comment.userId)}
                                referrerPolicy="no-referrer"
                              />
                              <div className="flex-grow space-y-0.5">
                                <div className="bg-white dark:bg-gray-900 p-3 rounded-2xl border border-gray-150 dark:border-gray-800 inline-block max-w-[95%] text-sm shadow-xs relative text-gray-800 dark:text-gray-200">
                                  <span 
                                    onClick={() => onClickUser(comment.userId)}
                                    className="font-bold text-gray-850 dark:text-white hover:underline cursor-pointer block text-xs"
                                  >
                                    {comment.displayName}
                                  </span>
                                  <p className="text-gray-750 dark:text-white/85 leading-relaxed mt-0.5">{comment.content}</p>
                                </div>

                                <div className="flex items-center gap-2.5 mt-1 ml-1 text-[11px] text-gray-500 font-medium select-none">
                                  <span 
                                    className="relative group/time cursor-help text-[10px] text-gray-400 dark:text-gray-500 font-mono"
                                    title={formatAbsoluteTime(comment.createdAt)}
                                  >
                                    {formatTime(comment.createdAt)}
                                  </span>

                                  <span className="text-gray-300 dark:text-gray-750">•</span>

                                  <button
                                    type="button"
                                    onClick={() => handleToggleCommentLike(post.id, comment.id)}
                                    className={`hover:underline cursor-pointer transition-colors ${
                                      comment.likes?.includes(currentUser.id) 
                                        ? 'text-blue-600 dark:text-blue-400 font-bold' 
                                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                                  >
                                    {comment.likes?.includes(currentUser.id) ? 'Liked' : 'Like'}
                                    {comment.likes && comment.likes.length > 0 && ` (${comment.likes.length})`}
                                  </button>

                                  <span className="text-gray-300 dark:text-gray-750">•</span>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (activeReplyCommentId === comment.id) {
                                        setActiveReplyCommentId(null);
                                      } else {
                                        setActiveReplyCommentId(comment.id);
                                        setReplyInputs(prev => ({ ...prev, [comment.id]: prev[comment.id] || '' }));
                                      }
                                    }}
                                    className={`hover:underline cursor-pointer transition-colors ${
                                      activeReplyCommentId === comment.id
                                        ? 'text-blue-600 dark:text-blue-400 font-bold'
                                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                                  >
                                    Reply
                                    {comment.replies && comment.replies.length > 0 && ` (${comment.replies.length})`}
                                  </button>
                                </div>

                                {/* Render comment replies nested */}
                                {comment.replies && comment.replies.length > 0 && (
                                  <div className="ml-2 mt-2.5 pl-3 border-l-2 border-gray-200 dark:border-gray-800 space-y-3">
                                    {comment.replies.map((reply) => (
                                      <div key={reply.id} className="flex gap-2.5 items-start group/reply">
                                        <AnimatedMedia
                                          src={reply.avatarUrl}
                                          alt={reply.displayName}
                                          className="w-6.5 h-6.5 rounded-full object-cover shrink-0 cursor-pointer hover:opacity-85 border border-gray-100 dark:border-gray-800"
                                          onClick={() => onClickUser(reply.userId)}
                                          referrerPolicy="no-referrer"
                                        />
                                        <div className="flex-grow space-y-0.5">
                                          <div className="bg-gray-100/70 dark:bg-gray-900/60 p-2.5 rounded-xl border border-gray-150/40 dark:border-gray-850 inline-block max-w-[95%] text-xs shadow-2xs relative text-gray-800 dark:text-gray-200">
                                            <span 
                                              onClick={() => onClickUser(reply.userId)}
                                              className="font-bold text-gray-850 dark:text-white hover:underline cursor-pointer block text-[10px]"
                                            >
                                              {reply.displayName}
                                            </span>
                                            <p className="text-gray-755 dark:text-white/80 leading-normal mt-0.5">{reply.content}</p>
                                          </div>
                                          <div className="flex items-center gap-2 mt-0.5 ml-1 text-[10px] text-gray-400 dark:text-gray-500 font-medium select-none">
                                            <span>{formatTime(reply.createdAt)}</span>
                                            <span className="text-gray-300 dark:text-gray-700">•</span>
                                            <button
                                              type="button"
                                              onClick={() => handleToggleReplyLike(post.id, comment.id, reply.id)}
                                              className={`hover:underline cursor-pointer transition-colors ${
                                                reply.likes?.includes(currentUser.id)
                                                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                                                  : 'text-gray-450 hover:text-gray-600 dark:hover:text-gray-300'
                                              }`}
                                            >
                                              {reply.likes?.includes(currentUser.id) ? 'Liked' : 'Like'}
                                              {reply.likes && reply.likes.length > 0 && ` (${reply.likes.length})`}
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Direct reply form inline */}
                                {activeReplyCommentId === comment.id && (
                                  <form 
                                    onSubmit={(e) => {
                                      e.preventDefault();
                                      handlePostCommentReply(post.id, comment.id, replyInputs[comment.id] || '');
                                    }}
                                    className="ml-2 mt-2 flex gap-2 animate-fade-in"
                                  >
                                    <AnimatedMedia
                                      src={currentUser.avatarUrl}
                                      alt={currentUser.displayName}
                                      className="w-6.5 h-6.5 rounded-full object-cover shrink-0 border border-gray-100 dark:border-gray-800"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="flex-grow flex items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full px-3 py-1 focus-within:ring-1 focus-within:ring-blue-500 shadow-2xs">
                                      <input
                                        type="text"
                                        placeholder={`Reply to ${comment.displayName}...`}
                                        value={replyInputs[comment.id] || ''}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setReplyInputs(prev => ({ ...prev, [comment.id]: val }));
                                        }}
                                        className="flex-grow text-xs focus:ring-0 focus:outline-none border-0 text-gray-800 dark:text-white bg-transparent"
                                        autoFocus
                                      />
                                      <button
                                        type="submit"
                                        disabled={!(replyInputs[comment.id] || '').trim()}
                                        className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:scale-105 transition-all disabled:opacity-30 shrink-0 p-0.5 cursor-pointer"
                                      >
                                        <Send className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </form>
                                )}

                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Submit Comment Form */}
                    <form 
                      onSubmit={(e) => handlePostComment(post.id, e)}
                      className="flex gap-3"
                    >
                      <AnimatedMedia
                        src={currentUser.avatarUrl}
                        alt={currentUser.displayName}
                        className="w-8 h-8 rounded-full object-cover shrink-0 border border-gray-100 dark:border-gray-800"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-grow flex items-center bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-700 rounded-full px-3.5 py-1.5 focus-within:ring-1 focus-within:ring-blue-500 shadow-inner">
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          value={commentInputs[post.id] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCommentInputs(prev => ({ ...prev, [post.id]: val }));
                          }}
                          className="flex-grow text-xs focus:ring-0 focus:outline-none border-0 text-gray-800 dark:text-white bg-transparent"
                        />
                        <button
                          type="submit"
                          disabled={!(commentInputs[post.id] || '').trim()}
                          className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:scale-105 transition-all disabled:opacity-30 shrink-0 p-0.5 cursor-pointer"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </form>

                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Report Post Modal */}
      {reportingPost && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 text-gray-800 dark:text-gray-100">
            
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
                <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
                  Report Inappropriate Content
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReportingPost(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xs font-mono px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 cursor-pointer"
              >
                Close
              </button>
            </div>

            {reportSuccess ? (
              <div className="py-6 text-center space-y-4 animate-scale-up">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-gray-900 dark:text-white">Report Submitted Successfully</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
                  Thank you for keeping our community safe! This post is now reported and has been deleted from your feed/sight.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    // Hide the post from feed and close modal
                    setHiddenPostIds(prev => [...prev, reportingPost.id]);
                    setReportingPost(null);
                  }}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  OK, Return to Feed
                </button>
              </div>
            ) : (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  setReportSuccess(true);
                }}
                className="space-y-4"
              >
                {/* Preview of reported post */}
                <div className="bg-gray-55 dark:bg-gray-950/80 p-3 rounded-lg border border-gray-150 dark:border-gray-800 text-2xs space-y-1.5">
                  <div className="font-bold text-gray-500 dark:text-gray-400">REPORTING POST BY @{reportingPost.author.username}</div>
                  <p className="text-gray-750 dark:text-gray-300 italic line-clamp-3">"{reportingPost.content}"</p>
                  {reportingPost.imageUrl && (
                    <div className="text-blue-500 font-mono text-[10px]">Contains attached image</div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-3xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    What inappropriate elements are included?
                  </label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { id: 'violence', label: 'Violence / hate speech' },
                      { id: 'harassment', label: 'Harassment / bullying' },
                      { id: 'media', label: 'Inappropriate media' },
                      { id: 'spam', label: 'Spam or scams' },
                      { id: 'guidelines', label: 'Guideline violation' },
                      { id: 'other', label: 'Other issues' },
                    ].map((issue) => (
                      <label 
                        key={issue.id} 
                        className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                          reportIssues.includes(issue.id)
                            ? 'bg-amber-50/50 dark:bg-amber-950/15 border-amber-300 dark:border-amber-900/60 text-amber-900 dark:text-amber-200'
                            : 'bg-transparent border-gray-150 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={reportIssues.includes(issue.id)}
                          onChange={() => {
                            if (reportIssues.includes(issue.id)) {
                              setReportIssues(prev => prev.filter(i => i !== issue.id));
                            } else {
                              setReportIssues(prev => [...prev, issue.id]);
                            }
                          }}
                          className="mt-0.5 accent-amber-500 rounded"
                        />
                        <span>{issue.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-3xs font-extrabold uppercase tracking-wider text-gray-550 dark:text-gray-400">
                    Explain details of inappropriate content (Required)
                  </label>
                  <textarea
                    placeholder="Provide details about why you find this post inappropriate..."
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-250 dark:border-gray-800 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 focus:outline-none text-gray-800 dark:text-white bg-white dark:bg-gray-950 resize-none font-sans"
                    required
                  />
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">
                    By submitting, this report is flagged for administrative evaluation.
                  </p>
                </div>

                <div className="flex gap-3 justify-end pt-2 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => setReportingPost(null)}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reportIssues.length === 0 || !reportReason.trim()}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>Submit Report</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
