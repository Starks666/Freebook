/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DatabaseSchema, DBUser, Post, Friendship, Message, AppNotification } from '../types';

const DB_PATH = path.join(process.cwd(), 'db.json');

// Simple crypto utilities for password hashing
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Initial seed data to populate Freebook instantly
const SEED_DATA: DatabaseSchema = {
  users: [
    {
      id: 'user_1',
      username: 'sarah_j',
      displayName: 'Sarah Jones',
      passwordHash: hashPassword('password123'),
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
      bio: 'Adventure lover 🌲, UI/UX Designer 🎨. Always looking for the next mountain to climb!',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      statusMode: 'active',
    },
    {
      id: 'user_2',
      username: 'tech_marcus',
      displayName: 'Marcus Vance',
      passwordHash: hashPassword('password123'),
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1000&q=80',
      bio: 'Full Stack Engineer 💻. Building the future of social networking one commit at a time.',
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      statusMode: 'dnd',
    },
    {
      id: 'user_3',
      username: 'emma_w',
      displayName: 'Emma Watson',
      passwordHash: hashPassword('password123'),
      avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1000&q=80',
      bio: 'Travel blogger & photographer 📸. Wandering where the wifi is weak but the views are breathtaking.',
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      statusMode: 'active',
    }
  ],
  posts: [
    {
      id: 'post_1',
      userId: 'user_3',
      author: {
        displayName: 'Emma Watson',
        avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
        username: 'emma_w'
      },
      content: 'Woke up early to catch the sunrise at Yosemite. There is nothing quite like hearing the forest wake up. Highly recommend taking some time away from screens this weekend! 🌲🎒🔋',
      imageUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80',
      likes: ['user_1', 'user_2'],
      comments: [
        {
          id: 'comment_1',
          userId: 'user_1',
          displayName: 'Sarah Jones',
          avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
          content: 'This picture is absolutely breathtaking, Emma! Which trail did you take? 😍',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'comment_2',
          userId: 'user_3',
          displayName: 'Emma Watson',
          avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
          content: 'Thanks Sarah! I took the Mist Trail up to Vernal Fall. It was tough but entirely worth it!',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 3 * 60 * 60 * 1000).toISOString()
        }
      ],
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 6 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'post_2',
      userId: 'user_2',
      author: {
        displayName: 'Marcus Vance',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
        username: 'tech_marcus'
      },
      content: 'Just launched my very own fully responsive Facebook clone named "Freebook" using full-stack React and Express. Designing database schemas, endpoints, and the classic clean blue look has been an exciting journey! What do you guys think? 💻🚀🔥',
      imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
      likes: ['user_1', 'user_3'],
      comments: [
        {
          id: 'comment_3',
          userId: 'user_2',
          displayName: 'Marcus Vance',
          avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
          content: 'Code runs fully in the Cloud Run containers! We have instant reactive updates via JSON file storage. 😎',
          createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString()
        }
      ],
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
    }
  ],
  friendships: [
    {
      id: 'friend_1',
      user1Id: 'user_1',
      user2Id: 'user_2',
      status: 'accepted',
      senderId: 'user_1',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'friend_2',
      user1Id: 'user_2',
      user2Id: 'user_3',
      status: 'pending',
      senderId: 'user_2',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  messages: [
    {
      id: 'msg_1',
      senderId: 'user_1',
      receiverId: 'user_2',
      content: 'Hey Marcus! Awesome work on Freebook 🚀',
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'msg_2',
      senderId: 'user_2',
      receiverId: 'user_1',
      content: 'Thanks Sarah! Appreciate the kind words. Are you working on any new designs?',
      createdAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'msg_3',
      senderId: 'user_1',
      receiverId: 'user_2',
      content: 'Yes! Sketching some layouts for the custom messenger feature right now.',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    }
  ],
  notifications: []
};

// Main Database Manager
class DatabaseManager {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_PATH)) {
        const fileContent = fs.readFileSync(DB_PATH, 'utf-8');
        return JSON.parse(fileContent);
      }
    } catch (e) {
      console.error('Error loading database, resetting to seed...', e);
    }
    this.save(SEED_DATA);
    return SEED_DATA;
  }

  private save(data: DatabaseSchema): void {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save database:', e);
    }
  }

  public getUsers(): DBUser[] {
    return this.data.users;
  }

  public getPosts(): Post[] {
    return this.data.posts;
  }

  public getFriendships(): Friendship[] {
    return this.data.friendships;
  }

  public saveUser(user: DBUser): void {
    const idx = this.data.users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      this.data.users[idx] = user;
    } else {
      this.data.users.push(user);
    }
    this.save(this.data);
  }

  public savePost(post: Post): void {
    const idx = this.data.posts.findIndex(p => p.id === post.id);
    if (idx >= 0) {
      this.data.posts[idx] = post;
    } else {
      this.data.posts.unshift(post); // newest posts go first
    }
    this.save(this.data);
  }

  public deletePost(postId: string): boolean {
    const lenBefore = this.data.posts.length;
    this.data.posts = this.data.posts.filter(p => p.id !== postId);
    if (this.data.posts.length !== lenBefore) {
      this.save(this.data);
      return true;
    }
    return false;
  }

  public saveFriendship(friendship: Friendship): void {
    const idx = this.data.friendships.findIndex(f => f.id === friendship.id);
    if (idx >= 0) {
      this.data.friendships[idx] = friendship;
    } else {
      this.data.friendships.push(friendship);
    }
    this.save(this.data);
  }

  public deleteFriendship(friendshipId: string): boolean {
    const lenBefore = this.data.friendships.length;
    this.data.friendships = this.data.friendships.filter(f => f.id !== friendshipId);
    if (this.data.friendships.length !== lenBefore) {
      this.save(this.data);
      return true;
    }
    return false;
  }

  public getMessages(): Message[] {
    if (!this.data.messages) {
      this.data.messages = [];
    }
    return this.data.messages;
  }

  public saveMessage(message: Message): void {
    if (!this.data.messages) {
      this.data.messages = [];
    }
    this.data.messages.push(message);
    this.save(this.data);
  }

  public updateMessage(message: Message): void {
    if (!this.data.messages) {
      this.data.messages = [];
    }
    const idx = this.data.messages.findIndex(m => m.id === message.id);
    if (idx >= 0) {
      this.data.messages[idx] = message;
      this.save(this.data);
    }
  }

  public deleteMessage(messageId: string): boolean {
    if (!this.data.messages) {
      this.data.messages = [];
    }
    const lenBefore = this.data.messages.length;
    this.data.messages = this.data.messages.filter(m => m.id !== messageId);
    if (this.data.messages.length !== lenBefore) {
      this.save(this.data);
      return true;
    }
    return false;
  }

  public getNotifications(): AppNotification[] {
    if (!this.data.notifications) {
      this.data.notifications = [];
    }
    return this.data.notifications;
  }

  public saveNotification(notification: AppNotification): void {
    if (!this.data.notifications) {
      this.data.notifications = [];
    }
    this.data.notifications.unshift(notification); // newest first
    this.save(this.data);
  }

  public markNotificationAsRead(id: string): void {
    const notifications = this.getNotifications();
    const notification = notifications.find(n => n.id === id);
    if (notification) {
      notification.isRead = true;
      this.save(this.data);
    }
  }

  public markAllNotificationsAsRead(userId: string): void {
    const notifications = this.getNotifications();
    let updated = false;
    notifications.forEach(n => {
      if (n.userId === userId && !n.isRead) {
        n.isRead = true;
        updated = true;
      }
    });
    if (updated) {
      this.save(this.data);
    }
  }
}

export const db = new DatabaseManager();
