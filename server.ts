/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import { db, hashPassword } from './src/server/db';
import { User, DBUser, Post, Comment, CommentReply, Friendship, Message, AppNotification, Story } from './src/types';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Basic middleware to parse incoming JSON and forms
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Helper middleware to authenticate requests via Authorization header
  const authenticateUser = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header is required.' });
    }

    // Token is just the userId in this lightweight authentication design
    const userId = authHeader.replace('Bearer ', '').trim();
    const user = db.getUsers().find(u => u.id === userId);

    if (!user) {
      return res.status(401).json({ error: 'Invalid token or user does not exist.' });
    }

    // Attach user to req locals
    res.locals.userId = userId;
    res.locals.user = user;
    next();
  };

  // ------------------- AUTHENTICATION ROUTES -------------------

  // Register a new user
  app.post('/api/auth/register', (req, res) => {
    const { username, password, displayName } = req.body;

    if (!username || !password || !displayName) {
      return res.status(400).json({ error: 'All fields (username, password, displayName) are required.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const existing = db.getUsers().find(u => u.username === cleanUsername);
    if (existing) {
      return res.status(409).json({ error: 'Username is already taken.' });
    }

    const newUser: DBUser = {
      id: `user_${Date.now()}`,
      username: cleanUsername,
      displayName: displayName.trim(),
      passwordHash: hashPassword(password),
      avatarUrl: `https://images.unsplash.com/photo-${1535713875002 + Math.floor(Math.random() * 100000)}?auto=format&fit=crop&w=150&q=80`, // Random nice avatar
      coverUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1000&q=80', // Default modern slate blue cover
      bio: "Hello, I am new to Freebook!",
      createdAt: new Date().toISOString()
    };

    db.saveUser(newUser);

    // Filter secure password hash
    const { passwordHash, ...safeUser } = newUser;
    res.status(201).json({
      user: safeUser,
      token: newUser.id
    });
  });

  // Login existing user
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const user = db.getUsers().find(u => u.username === cleanUsername);

    if (!user || user.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const { passwordHash, ...safeUser } = user;
    res.json({
      user: safeUser,
      token: user.id
    });
  });

  // Check current session
  app.get('/api/auth/me', authenticateUser, (req, res) => {
    const user = res.locals.user as DBUser;
    const { passwordHash, ...safeUser } = user;
    res.json({ user: safeUser });
  });


  // ------------------- PROFILE & USER ROUTES -------------------

  // Update bio/avatar/cover
  app.put('/api/users/profile', authenticateUser, (req, res) => {
    const user = res.locals.user as DBUser;
    const { displayName, bio, avatarUrl, coverUrl } = req.body;

    if (displayName !== undefined) user.displayName = displayName.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl.trim();
    if (coverUrl !== undefined) user.coverUrl = coverUrl.trim();

    db.saveUser(user);

    // Keep post authors updated
    const posts = db.getPosts();
    posts.forEach(p => {
      if (p.userId === user.id) {
        p.author.displayName = user.displayName;
        p.author.avatarUrl = user.avatarUrl;
        db.savePost(p);
      }
    });

    const { passwordHash, ...safeUser } = user;
    res.json({ user: safeUser });
  });

  // List users
  app.get('/api/users', authenticateUser, (req, res) => {
    const currentUserId = res.locals.userId;
    const safeUsers = db.getUsers()
      .filter(u => u.id !== currentUserId)
      .map(({ passwordHash, ...safe }) => safe);
    res.json(safeUsers);
  });

  // Update active status mode manually
  app.put('/api/users/status', authenticateUser, (req, res) => {
    const user = res.locals.user as DBUser;
    const { statusMode } = req.body;

    if (statusMode === 'active' || statusMode === 'offline' || statusMode === 'dnd') {
      user.statusMode = statusMode;
      db.saveUser(user);
      
      // Notify connected websockets if function exists
      if (typeof (app as any).broadcastStatusUpdate === 'function') {
        (app as any).broadcastStatusUpdate(user.id, statusMode);
      }
      
      const { passwordHash, ...safeUser } = user;
      return res.json({ user: safeUser });
    }
    res.status(400).json({ error: 'Invalid statusMode. Must be active, offline, or dnd.' });
  });

  // Get conversation messages between the authenticated user and a specific target user
  app.get('/api/messages/:targetUserId', authenticateUser, (req, res) => {
    const currentUserId = res.locals.userId;
    const targetUserId = req.params.targetUserId;

    const messages = db.getMessages().filter(m => 
      (m.senderId === currentUserId && m.receiverId === targetUserId) ||
      (m.senderId === targetUserId && m.receiverId === currentUserId)
    ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    res.json(messages);
  });

  // Highlight all messages involving the current user
  app.get('/api/messages', authenticateUser, (req, res) => {
    const currentUserId = res.locals.userId;
    const messages = db.getMessages().filter(m => 
      m.senderId === currentUserId || m.receiverId === currentUserId
    );
    res.json(messages);
  });

  // Send a message via HTTP
  app.post('/api/messages', authenticateUser, (req, res) => {
    const currentUserId = res.locals.userId;
    const { 
      receiverId, 
      content, 
      voiceUrl, 
      voiceDuration,
      imageUrl, 
      isCallEvent, 
      callType, 
      callStatus, 
      callDuration 
    } = req.body;

    if (!receiverId) {
      return res.status(400).json({ error: 'Receiver ID is required.' });
    }

    if (!content && !voiceUrl && !imageUrl && !isCallEvent) {
      return res.status(400).json({ error: 'Content, voice representation, imageUrl, or call events are required.' });
    }

    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      senderId: currentUserId,
      receiverId,
      content: content ? content.trim() : (voiceUrl ? '🎤 Voice Message' : (imageUrl ? '🖼️ Photo Message' : (isCallEvent ? '📞 Call Log' : ''))),
      createdAt: new Date().toISOString(),
      ...(voiceUrl && { voiceUrl, voiceDuration }),
      ...(imageUrl && { imageUrl }),
      ...(isCallEvent && { isCallEvent, callType, callStatus, callDuration })
    };

    db.saveMessage(newMessage);

    // Notify receiver if connected via websocket
    if (typeof (app as any).sendMsgRealtime === 'function') {
      (app as any).sendMsgRealtime(newMessage);
    }

    res.status(201).json(newMessage);
  });

  // Edit private message
  app.put('/api/messages/:id', authenticateUser, (req, res) => {
    const currentUserId = res.locals.userId;
    const msgId = req.params.id;
    const { content, imageUrl, voiceUrl, voiceDuration } = req.body;

    const messages = db.getMessages();
    const msg = messages.find(m => m.id === msgId);

    if (!msg) {
      return res.status(404).json({ error: 'Message not found.' });
    }

    if (msg.senderId !== currentUserId) {
      return res.status(403).json({ error: 'You can only edit messages you sent.' });
    }

    if (msg.isCallEvent) {
      return res.status(400).json({ error: 'Cannot edit call logs.' });
    }

    if (msg.voiceUrl) {
      return res.status(400).json({ error: 'Cannot edit voice messages.' });
    }

    if (content !== undefined) msg.content = content.trim();
    if (imageUrl !== undefined) msg.imageUrl = imageUrl;
    if (voiceUrl !== undefined) {
      msg.voiceUrl = voiceUrl;
      msg.voiceDuration = voiceDuration;
    }
    msg.isEdited = true;

    db.updateMessage(msg);

    // Notify real-time receiver and sender via WS if live
    const broadcastAction = {
      type: 'message_action',
      action: 'edit',
      messageId: msgId,
      message: msg
    };

    if (typeof (app as any).broadcastMsgActionRealtime === 'function') {
      (app as any).broadcastMsgActionRealtime(msg.senderId, msg.receiverId, broadcastAction);
    }

    res.json(msg);
  });

  // Mark all conversation messages from a target sender as seen
  app.put('/api/messages/:targetUserId/seen', authenticateUser, (req, res) => {
    const currentUserId = res.locals.userId;
    const targetUserId = req.params.targetUserId;
    const seenAt = new Date().toISOString();

    const messages = db.getMessages();
    let updatedCount = 0;

    messages.forEach(m => {
      if (m.senderId === targetUserId && m.receiverId === currentUserId && !m.seenAt) {
        m.seenAt = seenAt;
        db.updateMessage(m);
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      // Notify targetUserId that currentUserId has seen the message(s)
      const broadcastAction = {
        type: 'message_action',
        action: 'seen',
        viewerId: currentUserId,
        seenAt
      };

      if (typeof (app as any).broadcastMsgActionRealtime === 'function') {
        (app as any).broadcastMsgActionRealtime(currentUserId, targetUserId, broadcastAction);
      }
    }

    res.json({ success: true, updatedCount, seenAt });
  });

  // Delete private message
  app.delete('/api/messages/:id', authenticateUser, (req, res) => {
    const currentUserId = res.locals.userId;
    const msgId = req.params.id;

    const messages = db.getMessages();
    const msg = messages.find(m => m.id === msgId);

    if (!msg) {
      return res.status(404).json({ error: 'Message not found.' });
    }

    if (msg.senderId !== currentUserId) {
      return res.status(403).json({ error: 'You can only delete messages you sent.' });
    }

    const wasDeleted = db.deleteMessage(msgId);
    if (!wasDeleted) {
      return res.status(500).json({ error: 'Failed to delete message.' });
    }

    // Notify real-time receiver and sender via WS if live
    const broadcastAction = {
      type: 'message_action',
      action: 'delete',
      messageId: msgId,
      senderId: msg.senderId,
      receiverId: msg.receiverId
    };

    if (typeof (app as any).broadcastMsgActionRealtime === 'function') {
      (app as any).broadcastMsgActionRealtime(msg.senderId, msg.receiverId, broadcastAction);
    }

    res.json({ success: true, messageId: msgId });
  });


  // ------------------- NOTIFICATION ACTIONS -------------------

  // Helper to trigger and persist notification, broadcasting it in real-time
  const triggerNotification = (recipientId: string, sender: DBUser, type: 'like' | 'reaction' | 'comment' | 'share', post: Post, extra?: { reactionType?: string; commentContent?: string }) => {
    if (recipientId === sender.id) return; // Ignore self-triggering notifications

    // De-duplicate unread notification of same type by same sender on same post
    const existing = db.getNotifications().find(n => 
      n.userId === recipientId && 
      n.senderId === sender.id && 
      n.postId === post.id && 
      n.type === type && 
      !n.isRead
    );

    if (existing) {
      existing.createdAt = new Date().toISOString();
      if (extra?.reactionType) existing.reactionType = extra.reactionType;
      if (extra?.commentContent) existing.commentContent = extra.commentContent;
      // Re-save/push
      db.saveNotification(existing);
      if (typeof (app as any).sendNotificationRealtime === 'function') {
        (app as any).sendNotificationRealtime(recipientId, existing);
      }
      return;
    }

    const newNotification: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: recipientId,
      senderId: sender.id,
      senderName: sender.displayName,
      senderAvatar: sender.avatarUrl,
      type,
      postId: post.id,
      postContentExcerpt: post.content ? (post.content.length > 60 ? post.content.substring(0, 60) + '...' : post.content) : '',
      reactionType: extra?.reactionType,
      commentContent: extra?.commentContent,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    db.saveNotification(newNotification);

    if (typeof (app as any).sendNotificationRealtime === 'function') {
      (app as any).sendNotificationRealtime(recipientId, newNotification);
    }
  };

  // Get all notifications for authenticated user
  app.get('/api/notifications', authenticateUser, (req, res) => {
    const currentUserId = res.locals.userId;
    const notifications = db.getNotifications()
      .filter(n => n.userId === currentUserId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(notifications);
  });

  // Mark specic notification or all notifications as read
  app.post('/api/notifications/read', authenticateUser, (req, res) => {
    const currentUserId = res.locals.userId;
    const { id } = req.body;

    if (id) {
      db.markNotificationAsRead(id);
    } else {
      db.markAllNotificationsAsRead(currentUserId);
    }

    res.json({ success: true });
  });

  // Add share post trigger + notification
  app.post('/api/posts/:id/share', authenticateUser, (req, res) => {
    const postId = req.params.id;
    const user = res.locals.user as DBUser;

    const post = db.getPosts().find(p => p.id === postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    // Trigger notification to post author about sharing
    triggerNotification(post.userId, user, 'share', post);

    res.json({ success: true });
  });


  // ------------------- STORY ROUTES -------------------

  // Get active stories
  app.get('/api/stories', authenticateUser, (req, res) => {
    const stories = db.getStories();
    const now = new Date().getTime();
    const activeStories = stories.filter(s => {
      const createdAt = new Date(s.createdAt).getTime();
      return (now - createdAt) < 24 * 60 * 60 * 1000; // 24 hours
    });
    res.json(activeStories);
  });

  // Post a story
  app.post('/api/stories', authenticateUser, (req, res) => {
    const user = res.locals.user as DBUser;
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Story requires an image URL.' });
    }

    const newStory: Story = {
      id: `story_${Date.now()}`,
      userId: user.id,
      author: {
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        username: user.username
      },
      imageUrl: imageUrl.trim(),
      createdAt: new Date().toISOString()
    };

    db.saveStory(newStory);
    res.status(201).json(newStory);
  });


  // ------------------- POST ROUTES -------------------

  // Create a post
  app.post('/api/posts', authenticateUser, (req, res) => {
    const user = res.locals.user as DBUser;
    const { content, imageUrl } = req.body;

    if (!content && !imageUrl) {
      return res.status(400).json({ error: 'Post must contain text or an image URL.' });
    }

    const newPost: Post = {
      id: `post_${Date.now()}`,
      userId: user.id,
      author: {
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        username: user.username
      },
      content: content || '',
      imageUrl: imageUrl || undefined,
      likes: [],
      comments: [],
      createdAt: new Date().toISOString()
    };

    db.savePost(newPost);
    res.status(201).json(newPost);
  });

  // Retrieve whole feed
  app.get('/api/feed', authenticateUser, (req, res) => {
    const posts = db.getPosts();
    res.json(posts);
  });

  // Delete a post (only allowed for post owner)
  app.delete('/api/posts/:id', authenticateUser, (req, res) => {
    const postId = req.params.id;
    const currentUserId = res.locals.userId;

    const post = db.getPosts().find(p => p.id === postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (post.userId !== currentUserId) {
      return res.status(403).json({ error: 'You are not authorized to delete this post.' });
    }

    db.deletePost(postId);
    res.json({ success: true });
  });

  // Edit/Update a post (only allowed for post owner)
  app.put('/api/posts/:id', authenticateUser, (req, res) => {
    const postId = req.params.id;
    const currentUserId = res.locals.userId;
    const { content, imageUrl } = req.body;

    const post = db.getPosts().find(p => p.id === postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (post.userId !== currentUserId) {
      return res.status(403).json({ error: 'You are not authorized to edit this post.' });
    }

    if (!content && !imageUrl) {
      return res.status(400).json({ error: 'Post must contain text or an image URL.' });
    }

    post.content = content || '';
    if (imageUrl !== undefined) {
      post.imageUrl = imageUrl || undefined;
    }

    db.savePost(post);
    res.json(post);
  });

  // Toggle liking a post (legacy but kept in sync)
  app.post('/api/posts/:id/like', authenticateUser, (req, res) => {
    const postId = req.params.id;
    const currentUserId = res.locals.userId;

    const post = db.getPosts().find(p => p.id === postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (!post.reactions) {
      post.reactions = {};
    }

    const likeIdx = post.likes.indexOf(currentUserId);
    if (likeIdx >= 0) {
      // Unlike
      post.likes.splice(likeIdx, 1);
      delete post.reactions[currentUserId];
    } else {
      // Like
      post.likes.push(currentUserId);
      post.reactions[currentUserId] = 'like';
      
      // Trigger notification
      const user = res.locals.user as DBUser;
      triggerNotification(post.userId, user, 'like', post, { reactionType: 'like' });
    }

    db.savePost(post);
    res.json(post);
  });

  // Toggle/Set high fidelity reactions
  app.post('/api/posts/:id/react', authenticateUser, (req, res) => {
    const postId = req.params.id;
    const currentUserId = res.locals.userId;
    const { type } = req.body; // 'like' | 'love' | 'haha' | 'sad' | 'angry'

    if (!type || !['like', 'love', 'haha', 'sad', 'angry'].includes(type)) {
      return res.status(400).json({ error: 'A valid reaction type calculation is required.' });
    }

    const post = db.getPosts().find(p => p.id === postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (!post.reactions) {
      post.reactions = {};
    }

    // Toggle off if clicking the EXACT same reaction twice
    if (post.reactions[currentUserId] === type) {
      delete post.reactions[currentUserId];
      
      // Remove from legacy likes array too
      const idx = post.likes.indexOf(currentUserId);
      if (idx >= 0) {
        post.likes.splice(idx, 1);
      }
    } else {
      // Assign or change the reaction type
      post.reactions[currentUserId] = type;
      
      // Backwards check: ensure present in legacy likes
      if (!post.likes.includes(currentUserId)) {
        post.likes.push(currentUserId);
      }

      // Trigger notification
      const user = res.locals.user as DBUser;
      triggerNotification(post.userId, user, 'reaction', post, { reactionType: type });
    }

    db.savePost(post);
    res.json(post);
  });

  // Post a comment
  app.post('/api/posts/:id/comments', authenticateUser, (req, res) => {
    const postId = req.params.id;
    const user = res.locals.user as DBUser;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content is required.' });
    }

    const post = db.getPosts().find(p => p.id === postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const newComment: Comment = {
      id: `comment_${Date.now()}`,
      userId: user.id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      content: content.trim(),
      createdAt: new Date().toISOString()
    };

    post.comments.push(newComment);
    db.savePost(post);

    // Trigger notification
    triggerNotification(post.userId, user, 'comment', post, { commentContent: newComment.content });

    res.json(post);
  });

  // Toggle reaction on a comment
  app.post('/api/posts/:postId/comments/:commentId/react', authenticateUser, (req, res) => {
    const { postId, commentId } = req.params;
    const currentUserId = res.locals.userId;
    const { type } = req.body;

    if (!type || !['like', 'love', 'haha', 'sad', 'angry'].includes(type)) {
      return res.status(400).json({ error: 'A valid reaction type calculation is required.' });
    }

    const post = db.getPosts().find(p => p.id === postId);
    if (!post) return res.status(404).json({ error: 'Post not found.' });

    const comment = post.comments.find(c => c.id === commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found.' });

    if (!comment.reactions) comment.reactions = {};

    if (comment.reactions[currentUserId] === type) {
      delete comment.reactions[currentUserId];
    } else {
      comment.reactions[currentUserId] = type;
    }

    db.savePost(post);
    res.json(post);
  });

  // Reply to a comment
  app.post('/api/posts/:postId/comments/:commentId/reply', authenticateUser, (req, res) => {
    const { postId, commentId } = req.params;
    const user = res.locals.user as DBUser;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Reply content is required.' });
    }

    const post = db.getPosts().find(p => p.id === postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const comment = post.comments.find(c => c.id === commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    if (!comment.replies) {
      comment.replies = [];
    }

    const newReply: CommentReply = {
      id: `reply_${Date.now()}`,
      userId: user.id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      likes: []
    };

    comment.replies.push(newReply);
    db.savePost(post);
    res.json(post);
  });

  // Reply to a reply (nested reply)
  app.post('/api/posts/:postId/comments/:commentId/replies/:replyId/reply', authenticateUser, (req, res) => {
    const { postId, commentId, replyId } = req.params;
    const user = res.locals.user as DBUser;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Reply content is required.' });
    }

    const post = db.getPosts().find(p => p.id === postId);
    if (!post) return res.status(404).json({ error: 'Post not found.' });

    const comment = post.comments.find(c => c.id === commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found.' });

    if (!comment.replies) comment.replies = [];
    const reply = comment.replies.find(r => r.id === replyId);
    if (!reply) return res.status(404).json({ error: 'Reply not found.' });
    
    if (!reply.replies) reply.replies = [];

    const newReply: CommentReply = {
      id: `reply_${Date.now()}`,
      userId: user.id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      likes: []
    };

    reply.replies.push(newReply);
    db.savePost(post);
    res.json(post);
  });

  // Toggle like on a comment reply
  app.post('/api/posts/:postId/comments/:commentId/replies/:replyId/toggle-like', authenticateUser, (req, res) => {
    const { postId, commentId, replyId } = req.params;
    const currentUserId = res.locals.userId;

    const post = db.getPosts().find(p => p.id === postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const comment = post.comments.find(c => c.id === commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    if (!comment.replies) {
      comment.replies = [];
    }

    const reply = comment.replies.find(r => r.id === replyId);
    if (!reply) {
      return res.status(404).json({ error: 'Reply not found.' });
    }

    if (!reply.likes) {
      reply.likes = [];
    }

    const idx = reply.likes.indexOf(currentUserId);
    if (idx >= 0) {
      reply.likes.splice(idx, 1);
    } else {
      reply.likes.push(currentUserId);
    }

    db.savePost(post);
    res.json(post);
  });


  // ------------------- FRIEND SYSTEM ROUTES -------------------

  // Get full friendship list state
  app.get('/api/friends', authenticateUser, (req, res) => {
    const currentUserId = res.locals.userId;
    const friendships = db.getFriendships();
    const users = db.getUsers();

    const friends: User[] = [];
    const pendingSent: User[] = [];
    const pendingReceived: User[] = [];
    const suggestionIds = new Set(users.map(u => u.id));
    suggestionIds.delete(currentUserId);

    friendships.forEach(f => {
      const isAssociated = f.user1Id === currentUserId || f.user2Id === currentUserId;
      if (!isAssociated) return;

      const partnerId = f.user1Id === currentUserId ? f.user2Id : f.user1Id;
      const partner = users.find(u => u.id === partnerId);
      if (!partner) return;

      const { passwordHash, ...safePartner } = partner;
      suggestionIds.delete(partnerId);

      if (f.status === 'accepted') {
        friends.push(safePartner);
      } else if (f.status === 'pending') {
        if (f.senderId === currentUserId) {
          pendingSent.push(safePartner);
        } else {
          pendingReceived.push(safePartner);
        }
      }
    });

    const suggestions = Array.from(suggestionIds).map(id => {
      const u = users.find(user => user.id === id)!;
      const { passwordHash, ...safe } = u;
      return safe;
    });

    res.json({
      friends,
      pendingSent,
      pendingReceived,
      suggestions
    });
  });

  // Request friendship
  app.post('/api/friends/request/:targetUserId', authenticateUser, (req, res) => {
    const currentUserId = res.locals.userId;
    const targetUserId = req.params.targetUserId;

    if (currentUserId === targetUserId) {
      return res.status(400).json({ error: 'You cannot request friendship with yourself.' });
    }

    const targetUser = db.getUsers().find(u => u.id === targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found.' });
    }

    const existing = db.getFriendships().find(f => 
      (f.user1Id === currentUserId && f.user2Id === targetUserId) ||
      (f.user1Id === targetUserId && f.user2Id === currentUserId)
    );

    if (existing) {
      return res.status(400).json({ error: 'A friendship relationship already exists between these users.' });
    }

    const newFriendship: Friendship = {
      id: `friend_${Date.now()}`,
      user1Id: currentUserId,
      user2Id: targetUserId,
      status: 'pending',
      senderId: currentUserId,
      createdAt: new Date().toISOString()
    };

    db.saveFriendship(newFriendship);
    res.status(201).json(newFriendship);
  });

  // Accept friendship request
  app.post('/api/friends/accept/:senderUserId', authenticateUser, (req, res) => {
    const currentUserId = res.locals.userId;
    const senderUserId = req.params.senderUserId;

    const friendship = db.getFriendships().find(f => 
      (f.user1Id === currentUserId && f.user2Id === senderUserId && f.senderId === senderUserId && f.status === 'pending') ||
      (f.user1Id === senderUserId && f.user2Id === currentUserId && f.senderId === senderUserId && f.status === 'pending')
    );

    if (!friendship) {
      return res.status(404).json({ error: 'Pending friendship request not found.' });
    }

    friendship.status = 'accepted';
    db.saveFriendship(friendship);
    res.json(friendship);
  });

  // Decline request, cancel sent request, or unfriend
  app.post('/api/friends/decline/:partnerUserId', authenticateUser, (req, res) => {
    const currentUserId = res.locals.userId;
    const partnerUserId = req.params.partnerUserId;

    const friendship = db.getFriendships().find(f => 
      (f.user1Id === currentUserId && f.user2Id === partnerUserId) ||
      (f.user1Id === partnerUserId && f.user2Id === currentUserId)
    );

    if (!friendship) {
      return res.status(404).json({ error: 'Friendship relation not found.' });
    }

    db.deleteFriendship(friendship.id);
    res.json({ success: true });
  });


  // ------------------- VITE ASSET HANDLING & INGRESS -------------------

  // Load Vite Dev Server or serve compiled static bundle
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Freebook Express Server running on http://0.0.0.0:${PORT}`);
  });

  // Create WebSocket Server attaching to the HTTP server
  const wss = new WebSocketServer({ server });

  // Map of connected clients (UserId -> WebSocket connection)
  const wsClients = new Map<string, WebSocket>();

  // Global helper on app for sending notifications in real-time
  (app as any).sendNotificationRealtime = (recipientId: string, notification: AppNotification) => {
    const receiverSocket = wsClients.get(recipientId);
    if (receiverSocket && receiverSocket.readyState === WebSocket.OPEN) {
      receiverSocket.send(JSON.stringify({
        type: 'notification',
        notification
      }));
    }
  };

  // Global helper on app for sending messages in real-time
  (app as any).sendMsgRealtime = (msg: Message) => {
    const receiverSocket = wsClients.get(msg.receiverId);
    if (receiverSocket && receiverSocket.readyState === WebSocket.OPEN) {
      receiverSocket.send(JSON.stringify({
        type: 'message',
        message: msg
      }));
    }
  };

  // Global helper on app for broadcasting message edit or delete actions in real-time
  (app as any).broadcastMsgActionRealtime = (senderId: string, receiverId: string, actionPayload: any) => {
    const rawData = JSON.stringify(actionPayload);
    
    const senderSocket = wsClients.get(senderId);
    if (senderSocket && senderSocket.readyState === WebSocket.OPEN) {
      senderSocket.send(rawData);
    }
    
    const receiverSocket = wsClients.get(receiverId);
    if (receiverSocket && receiverSocket.readyState === WebSocket.OPEN) {
      receiverSocket.send(rawData);
    }
  };

  // Global helper on app for broadcasting status updates
  (app as any).broadcastStatusUpdate = (userId: string, statusMode: 'active' | 'offline' | 'dnd') => {
    const payload = JSON.stringify({
      type: 'status_update',
      userId,
      statusMode
    });
    wsClients.forEach((clientSocket) => {
      if (clientSocket.readyState === WebSocket.OPEN) {
        clientSocket.send(payload);
      }
    });
  };

  wss.on('connection', (ws) => {
    let authUserId: string | null = null;

    ws.on('message', (data) => {
      try {
        const payload = JSON.parse(data.toString());

        if (payload.type === 'auth') {
          const userId = payload.userId;
          const user = db.getUsers().find(u => u.id === userId);
          if (user) {
            authUserId = userId;
            wsClients.set(userId, ws);

            // Ensure they have active mode unless offline
            if (!user.statusMode || user.statusMode === 'offline') {
              user.statusMode = 'active';
              db.saveUser(user);
            }

            // Sync statuses with new connections and let everyone know this user is active/online
            (app as any).broadcastStatusUpdate(userId, user.statusMode);

            // Send list of all users' current statuses immediately
            const activeStatuses = db.getUsers()
              .filter(u => u.statusMode && u.statusMode !== 'offline')
              .map(u => ({ userId: u.id, statusMode: u.statusMode }));
            
            ws.send(JSON.stringify({
              type: 'presence_sync',
              statuses: activeStatuses
            }));
          }
        }

        if (payload.type === 'message') {
          if (!authUserId) return;
          const { receiverId, content, imageUrl, voiceUrl, voiceDuration } = payload;
          if (!receiverId) return;
          if (!content && !voiceUrl && !imageUrl) return;

          const newMessage: Message = {
            id: `msg_${Date.now()}`,
            senderId: authUserId,
            receiverId,
            content: content ? content.trim() : (voiceUrl ? '🎤 Voice Message' : (imageUrl ? '🖼️ Photo Message' : '')),
            createdAt: new Date().toISOString(),
            ...(voiceUrl && { voiceUrl, voiceDuration }),
            ...(imageUrl && { imageUrl })
          };

          db.saveMessage(newMessage);

          // Deliver to sender to confirm receipt
          ws.send(JSON.stringify({
            type: 'message',
            message: newMessage
          }));

          // Deliver to receiver securely
          const recSocket = wsClients.get(receiverId);
          if (recSocket && recSocket.readyState === WebSocket.OPEN) {
            recSocket.send(JSON.stringify({
              type: 'message',
              message: newMessage
            }));
          }
        }

        if (payload.type === 'status_update') {
          if (!authUserId) return;
          const { statusMode } = payload;
          if (statusMode === 'active' || statusMode === 'offline' || statusMode === 'dnd') {
            const user = db.getUsers().find(u => u.id === authUserId);
            if (user) {
              user.statusMode = statusMode;
              db.saveUser(user);
              (app as any).broadcastStatusUpdate(authUserId, statusMode);
            }
          }
        }

      } catch (err) {
        console.error('Error on WS message parsing:', err);
      }
    });

    ws.on('close', () => {
      if (authUserId) {
        wsClients.delete(authUserId);
        
        // Go offline when socket drops
        const user = db.getUsers().find(u => u.id === authUserId);
        if (user) {
          user.statusMode = 'offline';
          db.saveUser(user);
          (app as any).broadcastStatusUpdate(authUserId, 'offline');
        }
      }
    });
  });
}

startServer().catch((err) => {
  console.error('Fatal dev server crash:', err);
});
