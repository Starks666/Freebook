/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  coverUrl: string;
  bio: string;
  createdAt: string;
  statusMode?: 'active' | 'offline' | 'dnd';
}

export interface Story {
  id: string;
  userId: string;
  author: {
    displayName: string;
    avatarUrl: string;
    username: string;
  };
  imageUrl: string;
  createdAt: string; 
}

export interface CommentReply {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string;
  content: string;
  createdAt: string;
  likes?: string[]; // List of User IDs who liked the reply
  reactions?: { [userId: string]: 'like' | 'love' | 'haha' | 'sad' | 'angry' };
  replies?: CommentReply[]; // Support nested replies
}

export interface Comment {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string;
  content: string;
  createdAt: string;
  likes?: string[]; // List of User IDs who liked the comment
  reactions?: { [userId: string]: 'like' | 'love' | 'haha' | 'sad' | 'angry' };
  replies?: CommentReply[];
}

export interface Post {
  id: string;
  userId: string;
  author: {
    displayName: string;
    avatarUrl: string;
    username: string;
  };
  content: string;
  imageUrl?: string;
  likes: string[]; // List of User IDs who liked the post
  reactions?: { [userId: string]: 'like' | 'love' | 'haha' | 'sad' | 'angry' };
  comments: Comment[];
  createdAt: string;
}

export interface Friendship {
  id: string;
  user1Id: string;
  user2Id: string;
  status: 'pending' | 'accepted';
  senderId: string;
  createdAt: string;
}

export interface DBUser extends User {
  passwordHash: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  voiceUrl?: string;
  voiceDuration?: number;
  imageUrl?: string;
  isEdited?: boolean;
  seenAt?: string;
  isCallEvent?: boolean;
  callType?: 'voice' | 'video';
  callStatus?: 'completed' | 'missed' | 'declined';
  callDuration?: string;
}

export interface AppNotification {
  id: string;
  userId: string; // The user who should receive this notification
  senderId: string; // The user who triggered the event
  senderName: string;
  senderAvatar: string;
  type: 'like' | 'reaction' | 'comment' | 'share';
  postId: string;
  postContentExcerpt?: string;
  reactionType?: string;
  commentContent?: string;
  isRead: boolean;
  createdAt: string;
}

export interface DatabaseSchema {
  users: DBUser[];
  posts: Post[];
  friendships: Friendship[];
  messages: Message[];
  notifications: AppNotification[];
  stories: Story[];
}
