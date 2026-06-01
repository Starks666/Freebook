/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  UserPlus, 
  UserMinus, 
  UserCheck, 
  Clock, 
  Edit3, 
  Camera, 
  Check, 
  X,
  FileCode,
  Upload,
  AlertTriangle
} from 'lucide-react';
import { User, Post } from '../types';
import FeedSection from './FeedSection';
import AnimatedMedia from './AnimatedMedia';

interface ProfileSectionProps {
  currentUser: User;
  viewingUser: User;
  posts: Post[];
  friendStatus: 'none' | 'pending_sent' | 'pending_received' | 'accepted';
  onFriendRequest: (targetUserId: string) => void;
  onAcceptRequest: (senderUserId: string) => void;
  onDeclineRequest: (partnerUserId: string) => void;
  onUpdateProfile: (updatedData: { displayName?: string; bio?: string; avatarUrl?: string; coverUrl?: string }) => Promise<void>;
  onRefreshFeed: () => void;
  onClickUser: (userId: string) => void;
  token: string;
}

export default function ProfileSection({
  currentUser,
  viewingUser,
  posts,
  friendStatus,
  onFriendRequest,
  onAcceptRequest,
  onDeclineRequest,
  onUpdateProfile,
  onRefreshFeed,
  onClickUser,
  token
}: ProfileSectionProps) {
  const isMe = currentUser.id === viewingUser.id;

  // Bio and profile editing states
  const [isEditing, setIsEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState(viewingUser.displayName);
  const [editBio, setEditBio] = useState(viewingUser.bio);
  const [editAvatarUrl, setEditAvatarUrl] = useState(viewingUser.avatarUrl);
  const [editCoverUrl, setEditCoverUrl] = useState(viewingUser.coverUrl);
  const [updating, setUpdating] = useState(false);
  const [showPhotoEditors, setShowPhotoEditors] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // Media uploader checking (restricts duration of animated videos to <= 3 seconds)
  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorStatus(null);

    if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > 3.05) {
          setErrorStatus(`The selected animated video is too long (${video.duration.toFixed(2)}s). Animated loops cannot be more than 3 seconds.`);
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          if (target === 'avatar') {
            setEditAvatarUrl(reader.result as string);
          } else {
            setEditCoverUrl(reader.result as string);
          }
        };
        reader.readAsDataURL(file);
      };
      video.src = URL.createObjectURL(file);
    } else if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (target === 'avatar') {
          setEditAvatarUrl(reader.result as string);
        } else {
          setEditCoverUrl(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    } else {
      setErrorStatus("Unsupported layout media. Please upload an image, GIF, or MP4/WebM video.");
    }
  };

  // Filter posts to show only the ones belong to this specific user
  const timelinePosts = posts.filter(post => post.userId === viewingUser.id);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await onUpdateProfile({
        displayName: editDisplayName.trim(),
        bio: editBio.trim(),
        avatarUrl: editAvatarUrl.trim(),
        coverUrl: editCoverUrl.trim()
      });
      setIsEditing(false);
      setShowPhotoEditors(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setUpdating(false);
    }
  };

  const cancelEditing = () => {
    setEditDisplayName(viewingUser.displayName);
    setEditBio(viewingUser.bio);
    setEditAvatarUrl(viewingUser.avatarUrl);
    setEditCoverUrl(viewingUser.coverUrl);
    setIsEditing(false);
    setShowPhotoEditors(false);
    setErrorStatus(null);
  };

  return (
    <div className="flex-grow max-w-4xl mx-auto space-y-6 pb-12 select-none">
      
      {/* 1. Header Card: Cover & Overlapping Avatar */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm relative">
        
        {/* Cover Photo banner */}
        <div className="h-48 sm:h-64 bg-slate-350 relative">
          <AnimatedMedia
            src={viewingUser.coverUrl}
            alt="Profile Cover banner"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {isMe && (
            <button
              onClick={() => {
                setIsEditing(true);
                setShowPhotoEditors(true);
              }}
              className="absolute bottom-3 right-3 bg-white/70 hover:bg-white dark:bg-gray-800/70 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-250 text-xs px-3 py-1.5 rounded-lg shadow-md font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Edit Cover Photo</span>
            </button>
          )}
        </div>

        {/* Profile Info Row holds overlapping Avatar, name, bio, and relationship action button */}
        <div className="p-4 sm:p-6 pt-0 flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 relative z-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
            <div className="relative">
              <AnimatedMedia
                src={viewingUser.avatarUrl}
                alt={viewingUser.displayName}
                className="w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover border-4 border-white dark:border-gray-900 shadow-md bg-white dark:bg-gray-850 shrink-0"
                referrerPolicy="no-referrer"
              />
              {isMe && (
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setShowPhotoEditors(true);
                  }}
                  className="absolute bottom-1 right-1 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-colors cursor-pointer"
                  title="Edit Avatar URL"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="pb-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center justify-center sm:justify-start gap-1.5">
                <span>{viewingUser.displayName}</span>
              </h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">@{viewingUser.username}</p>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mt-2 max-w-md block">
                {viewingUser.bio || "No biography provided yet."}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono">
                <Clock className="w-3.5 h-3.5" />
                <span>Joined {new Date(viewingUser.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</span>
              </div>
            </div>
          </div>

          {/* Contextual Action Button based on friendship status */}
          <div className="flex justify-center shrink-0">
            {isMe ? (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 bg-gray-105 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-bold shadow-xs transition-colors flex items-center gap-1.5 border border-gray-201 dark:border-gray-700 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                Edit Profile Info
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {friendStatus === 'none' && (
                  <button
                    onClick={() => onFriendRequest(viewingUser.id)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Add Friend</span>
                  </button>
                )}

                {friendStatus === 'pending_sent' && (
                  <button
                    onClick={() => onDeclineRequest(viewingUser.id)}
                    className="px-5 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Clock className="w-4 h-4 text-blue-500 animate-pulse" />
                    <span>Cancel Request</span>
                  </button>
                )}

                {friendStatus === 'pending_received' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onAcceptRequest(viewingUser.id)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Confirm Request</span>
                    </button>
                    <button
                      onClick={() => onDeclineRequest(viewingUser.id)}
                      className="px-3 py-2 bg-gray-100 dark:bg-gray-805 hover:bg-gray-200 dark:hover:bg-gray-705 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-bold transition-colors cursor-pointer"
                    >
                      Decline
                    </button>
                  </div>
                )}

                {friendStatus === 'accepted' && (
                  <button
                    onClick={() => onDeclineRequest(viewingUser.id)}
                    className="px-5 py-2.5 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 hover:bg-red-50 dark:hover:bg-red-955/20 hover:text-red-700 dark:hover:text-red-400 border border-green-200 dark:border-green-900/30 hover:border-red-200 dark:hover:border-red-900/30 rounded-lg text-sm font-bold shadow-xs transition-all flex items-center gap-1.5 group cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4 group-hover:hidden" />
                    <UserMinus className="w-4 h-4 hidden group-hover:inline text-red-500" />
                    <span className="group-hover:hidden">Connected Friends</span>
                    <span className="hidden group-hover:inline">Unfriend User</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Editing Modal Panel (Inlined for high visual compliance) */}
        {isEditing && (
          <div className="border-t border-gray-150 dark:border-gray-800 p-4 sm:p-6 bg-slate-50 dark:bg-gray-950 animate-fadeIn">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">
              Edit Public Bio & Info
            </h3>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-850 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Biography</label>
                  <input
                    type="text"
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-850 dark:text-white"
                    placeholder="Short summary about you..."
                  />
                </div>
              </div>

              {showPhotoEditors && (
                <div className="space-y-4 pt-1">
                  
                  {errorStatus && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl text-xs text-rose-600 dark:text-rose-450 font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{errorStatus}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Avatar editing block */}
                    <div className="space-y-2 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                      <span className="block text-xs font-bold text-gray-700 dark:text-gray-300">Avatar / Profile Picture</span>
                      <div className="flex flex-col gap-2">
                        <input
                          type="url"
                          placeholder="Or paste image or video URL..."
                          value={editAvatarUrl}
                          onChange={(e) => setEditAvatarUrl(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-gray-350 dark:border-gray-750 bg-gray-55 dark:bg-gray-950 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-850 dark:text-white"
                        />
                        <label className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-105 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg border border-dashed border-blue-200 dark:border-blue-900/60 cursor-pointer text-2xs font-semibold justify-center transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload File (GIF/Video max 3s)</span>
                          <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={(e) => handleMediaUpload(e, 'avatar')}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Cover photo editing block */}
                    <div className="space-y-2 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                      <span className="block text-xs font-bold text-gray-700 dark:text-gray-300">Avatar Cover Photo</span>
                      <div className="flex flex-col gap-2">
                        <input
                          type="url"
                          placeholder="Or paste cover or video URL..."
                          value={editCoverUrl}
                          onChange={(e) => setEditCoverUrl(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-gray-350 dark:border-gray-750 bg-gray-55 dark:bg-gray-950 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-850 dark:text-white"
                        />
                        <label className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-105 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg border border-dashed border-blue-200 dark:border-blue-900/60 cursor-pointer text-2xs font-semibold justify-center transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload File (GIF/Video max 3s)</span>
                          <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={(e) => handleMediaUpload(e, 'cover')}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                    💡 <strong>Pro Tip:</strong> Freebook supports looping animated avatars and covers! Animated clips must not exceed 3 seconds. Supported formats: looping GIFs, MP4 or WebM videos.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-305 text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                >
                  {updating ? (
                    'Saving...'
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* 2. Timeline Grid Layout (Left sidebar info, right sidebar feed of personal posts) */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        
        {/* Profile Intro sidebar */}
        <div className="w-full md:w-80 shrink-0 space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-4 space-y-3">
            <h3 className="font-extrabold text-sm text-gray-800 dark:text-gray-100">Intro Details</h3>
            
            <div className="space-y-3.5 text-xs text-gray-655 dark:text-gray-300 pt-1">
              <p className="italic text-center text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 pb-3">{viewingUser.bio || "No bio published yet."}</p>
              
              <div className="flex items-center gap-2.5">
                <FileCode className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
                <span>Lives in <span className="font-semibold text-gray-800 dark:text-gray-205">San Francisco, California</span></span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
                <span>Followed by <span className="font-semibold text-gray-800 dark:text-gray-205">1,429 people</span></span>
              </div>
              <div className="flex items-center gap-2.5 text-blue-605 dark:text-blue-400 font-bold hover:underline cursor-pointer">
                <Edit3 className="w-4 h-4 shrink-0 text-blue-500" />
                <span>View hobbies, education, city details</span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline updates */}
        <div className="flex-grow w-full">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-550 mb-4 px-1">
            Timeline Posts ({timelinePosts.length})
          </h3>
          <FeedSection
            currentUser={currentUser}
            posts={timelinePosts}
            onRefreshFeed={onRefreshFeed}
            onClickUser={onClickUser}
            token={token}
          />
        </div>

      </div>

    </div>
  );
}
