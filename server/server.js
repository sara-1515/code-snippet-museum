const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('✅ Database connected successfully!');
  }
});

// ============ ROUTES ============

// Get all snippets
app.get('/api/snippets', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = 'SELECT * FROM snippets ORDER BY created_at DESC';
    let params = [];

    if (category && category !== 'All') {
      query = 'SELECT * FROM snippets WHERE category = $1 ORDER BY created_at DESC';
      params = [category];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single snippet
// Increment views when opening snippet
app.post('/api/snippets/:id/view', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE snippets SET views = views + 1 WHERE id = $1', [id]);
    const result = await pool.query('SELECT views FROM snippets WHERE id = $1', [id]);
    res.json({ views: result.rows[0].views });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get comments for a snippet
app.get('/api/snippets/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM comments WHERE snippet_id = $1 ORDER BY created_at DESC',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add comment to snippet
// Add comment to snippet
app.post('/api/snippets/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, username, comment_text } = req.body;

    if (!comment_text || !username) {
      return res.status(400).json({ error: 'Comment text and username required' });
    }

    // Validate user is logged in
    if (!user_id) {
      return res.status(401).json({ error: 'Must be logged in to comment' });
    }

    // Check if user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [user_id]);
    if (userCheck.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid user' });
    }

    const result = await pool.query(
      'INSERT INTO comments (snippet_id, user_id, username, comment_text) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, user_id, username, comment_text]
    );

    // Increment comment count
    await pool.query('UPDATE snippets SET comments = comments + 1 WHERE id = $1', [id]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create snippet
// Create snippet
app.post('/api/snippets', async (req, res) => {
  try {
    const { title, category, language, story, code, before, tags, author, user_id } = req.body;

    if (!title || !category || !language || !story || !code || !author) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate user is logged in
    if (!user_id) {
      return res.status(401).json({ error: 'Must be logged in to create snippets' });
    }

    // Check if user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [user_id]);
    if (userCheck.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid user' });
    }

    const result = await pool.query(
      `INSERT INTO snippets (title, category, language, story, code, before_code, tags, author, user_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [title, category, language, story, code, before, tags, author, user_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
// Like snippet
app.post('/api/snippets/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    
    // Validate user is logged in
    if (!user_id) {
      return res.status(401).json({ error: 'Must be logged in to like snippets' });
    }
    
    // Check if user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [user_id]);
    if (userCheck.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid user' });
    }
    
    await pool.query('UPDATE snippets SET likes = likes + 1 WHERE id = $1', [id]);
    
    const result = await pool.query('SELECT likes FROM snippets WHERE id = $1', [id]);
    res.json({ likes: result.rows[0].likes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Like snippet
app.post('/api/snippets/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query('UPDATE snippets SET likes = likes + 1 WHERE id = $1', [id]);
    
    const result = await pool.query('SELECT likes FROM snippets WHERE id = $1', [id]);
    res.json({ likes: result.rows[0].likes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// User registration (simplified - no password hashing for demo)
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields required' });
    }

    // Check if user exists
    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Insert user
    const result = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, password]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// User login (simplified)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      'SELECT id, username, email FROM users WHERE email = $1 AND password = $2',
      [email, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Code Museum API Server', version: '1.0.0' });
});

const PORT = process.env.PORT || 5000;

// Only listen in development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

module.exports = app;
