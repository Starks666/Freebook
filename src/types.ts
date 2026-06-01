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
}

export interface Comment {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string;
  content: string;
  createdAt: string;
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

export interface DatabaseSchema {
  users: DBUser[];
  posts: Post[];
  friendships: Friendship[];
}
