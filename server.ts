/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db, hashPassword } from './src/server/db';
import { User, DBUser, Post, Comment, Friendship } from './src/types';

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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Freebook Express Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal dev server crash:', err);
});
