/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Music, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Trash2,
  Video,
  Play,
  Volume2,
  VolumeX,
  Send
} from 'lucide-react';
import { User } from '../types';
import AnimatedMedia from './AnimatedMedia';

interface Reel {
  id: string;
  author: {
    displayName: string;
    avatarUrl: string;
    username: string;
  };
  caption: string;
  mediaUrl: string;
  musicTrack: string;
  likes: string[]; // List of user IDs
  commentsCount: number;
}

interface ReelsSectionProps {
  currentUser: User;
  onClickUser: (userId: string) => void;
}

export default function ReelsSection({ currentUser, onClickUser }: ReelsSectionProps) {
  // Preset highly aesthetic vertical loops representing travel, design, city, and nature
  const [reels, setReels] = useState<Reel[]>([
    {
      id: 'reel_1',
      author: {
        displayName: 'Emma Watson',
        avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
        username: 'emma_w'
      },
      caption: 'Chasing sunsets in the wild valleys. 🌲✨ There is nothing more beautiful than moments when time stands still.',
      mediaUrl: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=600&q=80',
      musicTrack: 'Wanderlust Chill Beats - Emma (Original Audio)',
      likes: ['user_1', 'user_2'],
      commentsCount: 14
    },
    {
      id: 'reel_2',
      author: {
        displayName: 'Marcus Vance',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
        username: 'tech_marcus'
      },
      caption: 'Building Freebook UI in dark mode! Code looks so pretty clean in JetBrains Mono. 💻🚀 What\'s your favorite font?',
      mediaUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
      musicTrack: 'Synthwave Coding Chill Jam - Marcus V.',
      likes: ['user_3'],
      commentsCount: 22
    },
    {
      id: 'reel_3',
      author: {
        displayName: 'Sarah Jones',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
        username: 'sarah_j'
      },
      caption: 'Late night Tokyo neon walks. Subliminal lights and warm ramen vibes 🍜🗼🇯🇵',
      mediaUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80',
      musicTrack: 'Midnight Tokyo Lo-Fi - Sarah J.',
      likes: ['user_2', 'user_3'],
      commentsCount: 9
    },
    {
      id: 'reel_4',
      author: {
        displayName: 'Aesthetic Traveler',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        username: 'wander_dream'
      },
      caption: 'Morning mist at Lake Como. Feels like dreaming awake. Who else needs a vacation? ✈️🇮🇹',
      mediaUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80',
      musicTrack: 'Italian Sunsets - Original Audio',
      likes: [],
      commentsCount: 3
    }
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [customComments, setCustomComments] = useState<{[reelId: string]: Array<{author: string, content: string}>}>({
    'reel_1': [
      { author: 'Marcus Vance', content: 'Wow this looks breathtaking Emma!' },
      { author: 'Sarah Jones', content: 'Gosh I need to go camping now' }
    ]
  });

  // Reel creation forms
  const [captionInput, setCaptionInput] = useState('');
  const [imageInput, setImageInput] = useState('');
  const [musicInput, setMusicInput] = useState('');
  const [creatorMsg, setCreatorMsg] = useState('');

  const currentReel = reels[currentIndex];

  const handleNext = () => {
    if (currentIndex < reels.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setCommentOpen(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setCommentOpen(false);
    }
  };

  const handleToggleLike = () => {
    setReels(prev => prev.map((reel, index) => {
      if (index === currentIndex) {
        const alreadyLiked = reel.likes.includes(currentUser.id);
        const updatedLikes = alreadyLiked
          ? reel.likes.filter(id => id !== currentUser.id)
          : [...reel.likes, currentUser.id];
        return { ...reel, likes: updatedLikes };
      }
      return reel;
    }));
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const reelId = currentReel.id;
    const newComment = {
      author: currentUser.displayName,
      content: newCommentText.trim()
    };

    setCustomComments(prev => ({
      ...prev,
      [reelId]: [...(prev[reelId] || []), newComment]
    }));

    setReels(prev => prev.map((reel, idx) => {
      if (idx === currentIndex) {
        return { ...reel, commentsCount: reel.commentsCount + 1 };
      }
      return reel;
    }));

    setNewCommentText('');
  };

  const handlePublishReel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!captionInput.trim()) {
      setCreatorMsg('Please provide a short reels caption template.');
      return;
    }

    const defaultCover = imageInput.trim() || 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=600&q=80';
    const defaultMusic = musicInput.trim() || `Radio Jam - ${currentUser.displayName}`;

    const newReel: Reel = {
      id: `reel_${Date.now()}`,
      author: {
        displayName: currentUser.displayName,
        avatarUrl: currentUser.avatarUrl,
        username: currentUser.username
      },
      caption: captionInput.trim(),
      mediaUrl: defaultCover,
      musicTrack: defaultMusic,
      likes: [],
      commentsCount: 0
    };

    setReels(prev => [newReel, ...prev]);
    setCurrentIndex(0);
    setCaptionInput('');
    setImageInput('');
    setMusicInput('');
    setCreatorMsg('Successfully published! Reel pushed to top of your story reels.');
    setTimeout(() => setCreatorMsg(''), 4000);
  };

  const currentCommentsList = customComments[currentReel?.id] || [];

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-start select-none pb-12">
      
      {/* Immersive Vertical Reels Player (occupies 7 columns on desktop) */}
      <div className="md:col-span-7 flex flex-col items-center">
        <div className="w-full flex items-center justify-between px-2 mb-3 text-sm">
          <div className="flex items-center gap-1.5 font-bold text-gray-800 dark:text-gray-100">
            <Video className="w-4.5 h-4.5 text-pink-500 animate-pulse" />
            <span>Vertical Reels Loop</span>
          </div>
          <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 bg-gray-200/65 dark:bg-gray-800 px-2.5 py-1 rounded-full">
            {currentIndex + 1} / {reels.length}
          </span>
        </div>

        {/* Player Container */}
        <div className="relative w-full max-w-[340px] aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-900 group">
          
          {/* Aesthetic Tall Background Story Image */}
          <img
            src={currentReel.mediaUrl}
            alt={currentReel.caption}
            className="w-full h-full object-cover transition-all duration-500"
            referrerPolicy="no-referrer"
          />

          {/* Video Mask Vignette Overlay shadow */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/25 pointer-events-none"></div>

          {/* Central Play/Pause Micro toggle */}
          <div 
            onClick={() => setIsPlaying(!isPlaying)}
            className="absolute inset-0 flex items-center justify-center cursor-pointer"
          >
            {!isPlaying && (
              <span className="p-4 bg-black/60 rounded-full text-white backdrop-blur-xs scale-[1.05] transition-transform animate-ping">
                <Play className="w-8 h-8 fill-current text-white" />
              </span>
            )}
          </div>

          {/* top row action buttons: sound toggle */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-xs transition-colors cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute sound'}
            >
              {isMuted ? <VolumeX className="w-4.5 h-4.5" /> : <Volume2 className="w-4.5 h-4.5" />}
            </button>
          </div>

          {/* Right Floating Actions Side Tray */}
          <div className="absolute bottom-24 right-3 flex flex-col items-center gap-4.5 z-20">
            
            {/* Liker */}
            <div className="flex flex-col items-center">
              <button
                onClick={handleToggleLike}
                className={`p-3 rounded-full text-white shadow transition-all hover:scale-110 active:scale-95 cursor-pointer ${
                  currentReel.likes.includes(currentUser.id)
                    ? 'bg-red-500 text-white'
                    : 'bg-black/50 text-white hover:bg-black/60'
                }`}
              >
                <Heart className={`w-5.5 h-5.5 ${currentReel.likes.includes(currentUser.id) ? 'fill-current' : ''}`} />
              </button>
              <span className="text-2xs font-extrabold text-white mt-1 drop-shadow font-mono">
                {currentReel.likes.length}
              </span>
            </div>

            {/* Comment Drawer button */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => setCommentOpen(!commentOpen)}
                className={`p-3 rounded-full shadow text-white transition-all hover:scale-110 active:scale-95 cursor-pointer ${
                  commentOpen
                    ? 'bg-blue-600'
                    : 'bg-black/50 hover:bg-black/60'
                }`}
              >
                <MessageSquare className="w-5.5 h-5.5" />
              </button>
              <span className="text-2xs font-extrabold text-white mt-1 drop-shadow font-mono">
                {currentReel.commentsCount}
              </span>
            </div>

            {/* Share link tool */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/reels/${currentReel.id}`);
                  alert('Reel link copied to your clipboard!');
                }}
                className="p-3 bg-black/50 hover:bg-black/60 rounded-full shadow text-white transition-all hover:scale-110 cursor-pointer"
                title="Copy share link"
              >
                <Share2 className="w-5.5 h-5.5" />
              </button>
              <span className="text-[10px] text-white mt-1 drop-shadow font-bold font-mono">
                Share
              </span>
            </div>

          </div>

          {/* Bottom Captions Overlay Drawer */}
          <div className="absolute bottom-4 left-4 right-16 text-white z-10 space-y-2">
            
            {/* Profile Avatar identifier */}
            <div className="flex items-center gap-2.5">
              <AnimatedMedia
                src={currentReel.author.avatarUrl}
                alt={currentReel.author.displayName}
                className="w-8 h-8 rounded-full border border-white/60 object-cover cursor-pointer"
                onClick={() => onClickUser(currentReel.author.username)}
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0">
                <span 
                  onClick={() => onClickUser(currentReel.author.username)}
                  className="font-extrabold text-sm hover:underline cursor-pointer block truncate"
                >
                  {currentReel.author.displayName}
                </span>
                <span className="text-[10px] opacity-75 font-mono">@{currentReel.author.username}</span>
              </div>
            </div>

            {/* Caption bio text */}
            <p className="text-xs text-white/95 leading-normal font-sans line-clamp-3">
              {currentReel.caption}
            </p>

            {/* Scrolling audio soundtrack loop simulation */}
            <div className="flex items-center gap-1.5 text-[10px] text-pink-300 font-mono italic overflow-hidden w-full pt-1.5">
              <Music className="w-3.5 h-3.5 animate-bounce shrink-0" />
              <div className="whitespace-nowrap overflow-hidden relative w-full">
                <span className="inline-block animate-marquee font-mono">
                  {currentReel.musicTrack} • Original Sound
                </span>
              </div>
            </div>

          </div>

          {/* Visual Interactive Progress bar bottom line */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div 
              className="h-full bg-pink-500 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / reels.length) * 100}%` }}
            ></div>
          </div>

        </div>

        {/* Up / Down navigation buttons overlay */}
        <div className="flex items-center gap-4 mt-4 font-bold">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="p-2.5 bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-805 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 rounded-full shadow text-gray-705 dark:text-gray-300 transition active:scale-95 cursor-pointer"
            title="Previous Reel (Key Up)"
          >
            <ChevronUp className="w-5.5 h-5.5" />
          </button>
          
          <button
            onClick={handleNext}
            disabled={currentIndex === reels.length - 1}
            className="p-2.5 bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-850 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 rounded-full shadow text-gray-705 dark:text-gray-300 transition active:scale-95 cursor-pointer"
            title="Next Reel (Key Down)"
          >
            <ChevronDown className="w-5.5 h-5.5" />
          </button>
        </div>

      </div>

      {/* Side dynamic controls (Comments Drawer & Publish controller) */}
      <div className="md:col-span-5 space-y-6">

        {/* Dynamic Interactive Comment Drawer Panel */}
        {commentOpen && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-805 shadow-sm p-4 space-y-3.5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2.5">
              <h3 className="font-extrabold text-sm text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                <span>Reel Comments ({currentCommentsList.length})</span>
              </h3>
              <button 
                onClick={() => setCommentOpen(false)}
                className="text-xs text-gray-400 hover:text-gray-650 dark:hover:text-gray-300 block cursor-pointer"
              >
                Close
              </button>
            </div>

            {currentCommentsList.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-gray-500 py-6 text-center italic animate-pulse">No comments written yet. Leave your feedback below!</p>
            ) : (
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {currentCommentsList.map((c, i) => (
                  <div key={i} className="text-xs pb-2 border-b border-gray-50 dark:border-gray-850 last:border-0 last:pb-0">
                    <span className="font-bold text-gray-800 dark:text-white">{c.author}</span>
                    <p className="text-gray-600 dark:text-gray-300 mt-0.5">{c.content}</p>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handlePostComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Reply to this loop..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                className="flex-grow pl-3 pr-2 py-1.5 border border-gray-200 dark:border-gray-800 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 dark:text-white bg-white dark:bg-gray-950 placeholder-gray-405 dark:placeholder-gray-550"
              />
              <button
                type="submit"
                className="p-1 px-3 bg-blue-600 text-white font-bold rounded-lg text-xs hover:bg-blue-700 transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

        {/* Publisher Composer panel so user can add their mock reels */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-4 space-y-4">
          
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2.5">
            <Plus className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-sm text-gray-808 dark:text-gray-100">Publish Your Reel</h3>
          </div>

          {creatorMsg && (
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300 text-2xs rounded border border-blue-100 dark:border-blue-900/30 animate-pulse font-semibold">
              {creatorMsg}
            </div>
          )}

          <form onSubmit={handlePublishReel} className="space-y-3">
            <div>
              <label className="block text-3xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                Aesthetic Cover Image URL (Unsplash)
              </label>
              <input
                type="url"
                placeholder="e.g. https://images.unsplash.com/photo-..."
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700 dark:text-white bg-white dark:bg-gray-950 placeholder-gray-404 dark:placeholder-gray-550"
              />
            </div>

            <div>
              <label className="block text-3xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                Music Track Title Accent
              </label>
              <input
                type="text"
                placeholder="e.g. Morning Lofi beats for study"
                value={musicInput}
                onChange={(e) => setMusicInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-750 dark:text-white bg-white dark:bg-gray-955 placeholder-gray-404 dark:placeholder-gray-550"
              />
            </div>

            <div>
              <label className="block text-3xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                Story Caption (Required)
              </label>
              <textarea
                placeholder="Write a catchy 1-2 sentence description..."
                value={captionInput}
                onChange={(e) => setCaptionInput(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700 dark:text-white bg-white dark:bg-gray-955 placeholder-gray-404 dark:placeholder-gray-550 resize-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-lg text-xs font-bold shadow hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Video className="w-4 h-4" />
              <span>Publish to Reels Lounge</span>
            </button>
          </form>

        </div>

      </div>

    </div>
  );
}
