const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

app.use(cors());
app.use(express.json());

// Connect to database
const db = new sqlite3.Database(path.join(__dirname, 'database', 'record_store.db'), (err) => {
    if (err) {
        console.error(' Database connection error:', err.message);
    } else {
        console.log(' Connected to SQLite database');
    }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// ==================== AUTH MIDDLEWARE ====================
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// ==================== USERS API ====================
app.post('/api/users/login', (req, res) => {
    const { username, password } = req.body;
    
    db.get(
        'SELECT * FROM Users WHERE username = ? OR email = ?',
        [username, username],
        async (err, user) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            if (!user) {
                return res.json({ 
                    success: false, 
                    message: '用户名或密码错误' 
                });
            }
            
            const validPassword = await bcrypt.compare(password, user.password_hash);
            if (!validPassword) {
                return res.json({ 
                    success: false, 
                    message: '用户名或密码错误' 
                });
            }
            
            const token = jwt.sign(
                { userId: user.user_id, username: user.username, role: user.role },
                JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            res.json({
                success: true,
                user: {
                    id: user.user_id,
                    username: user.username,
                    name: user.username,
                    email: user.email,
                    role: user.role,
                    avatar: user.avatar_url
                },
                token
            });
        }
    );
});

// ==================== PRODUCTS API ====================
app.get('/api/products', (req, res) => {
    const { category, search, limit } = req.query;
    
    let sql = `
        SELECT 
            p.product_id as id,
            a.title as name,
            a.artist,
            a.cover_image_url as image,
            p.price,
            p.condition,
            p.description,
            a.genre as category
        FROM Products p
        JOIN Albums a ON p.album_id = a.album_id
        WHERE p.is_active = 1
    `;
    const params = [];
    
    if (category && category !== 'undefined') {
        sql += ' AND a.genre = ?';
        params.push(category);
    }
    
    if (search) {
        sql += ' AND (a.title LIKE ? OR a.artist LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }
    
    sql += ' ORDER BY p.created_at DESC';
    
    if (limit) {
        sql += ' LIMIT ?';
        params.push(parseInt(limit));
    }
    
    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

app.get('/api/products/:id', (req, res) => {
    const productId = req.params.id;
    
    // Make sure productId is a number
    if (isNaN(productId)) {
        return res.status(400).json({ error: 'Invalid product ID' });
    }
    
    db.get(
        `SELECT 
            p.product_id as id,
            a.title as name,
            a.artist,
            a.cover_image_url as image,
            p.price,
            p.condition,
            p.description,
            a.genre,
            a.release_year,
            a.tracklist
        FROM Products p
        JOIN Albums a ON p.album_id = a.album_id
        WHERE p.product_id = ?`,
        [productId],
        (err, product) => {
            if (err) {
                console.error('Database error:', err.message);
                return res.status(500).json({ error: err.message });
            }
            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }
            res.json(product);
        }
    );
});

// ==================== CART API ====================
app.get('/api/cart', authenticateToken, (req, res) => {
    db.all(
        `SELECT 
            p.product_id as id,
            a.title as name,
            a.artist,
            a.cover_image_url as image,
            p.price,
            p.condition,
            ci.quantity
        FROM Cart_Items ci
        JOIN Products p ON ci.product_id = p.product_id
        JOIN Albums a ON p.album_id = a.album_id
        WHERE ci.user_id = ?`,
        [req.user.userId],
        (err, items) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: err.message });
            }
            res.json(items || []);
        }
    );
});

app.post('/api/cart/add', authenticateToken, (req, res) => {
    const { product_id, quantity = 1 } = req.body;
    const userId = req.user.userId;
    
    // First check if product exists
    db.get('SELECT * FROM Products WHERE product_id = ?', [product_id], (err, product) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        // Check if item already in cart
        db.get(
            'SELECT * FROM Cart_Items WHERE user_id = ? AND product_id = ?',
            [userId, product_id],
            (err, existingItem) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                
                if (existingItem) {
                    db.run(
                        'UPDATE Cart_Items SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?',
                        [quantity, userId, product_id],
                        function(err) {
                            if (err) {
                                return res.status(500).json({ error: err.message });
                            }
                            res.json({ success: true, message: 'Cart updated' });
                        }
                    );
                } else {
                    db.run(
                        'INSERT INTO Cart_Items (user_id, product_id, quantity) VALUES (?, ?, ?)',
                        [userId, product_id, quantity],
                        function(err) {
                            if (err) {
                                return res.status(500).json({ error: err.message });
                            }
                            res.json({ success: true, message: 'Item added to cart' });
                        }
                    );
                }
            }
        );
    });
});

app.put('/api/cart/update', authenticateToken, (req, res) => {
    const { product_id, quantity } = req.body;
    const userId = req.user.userId;
    
    if (quantity <= 0) {
        db.run(
            'DELETE FROM Cart_Items WHERE user_id = ? AND product_id = ?',
            [userId, product_id],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.json({ success: true });
            }
        );
    } else {
        db.run(
            'UPDATE Cart_Items SET quantity = ? WHERE user_id = ? AND product_id = ?',
            [quantity, userId, product_id],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.json({ success: true });
            }
        );
    }
});

app.delete('/api/cart/remove/:productId', authenticateToken, (req, res) => {
    const productId = req.params.productId;
    const userId = req.user.userId;
    
    db.run(
        'DELETE FROM Cart_Items WHERE user_id = ? AND product_id = ?',
        [userId, productId],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true });
        }
    );
});

app.get('/api/cart/summary', authenticateToken, (req, res) => {
    db.get(
        `SELECT 
            COALESCE(SUM(ci.quantity), 0) as count,
            COALESCE(SUM(ci.quantity * p.price), 0) as total
        FROM Cart_Items ci
        JOIN Products p ON ci.product_id = p.product_id
        WHERE ci.user_id = ?`,
        [req.user.userId],
        (err, summary) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: err.message });
            }
            res.json({
                count: summary.count || 0,
                total: summary.total || 0
            });
        }
    );
});

// ==================== FORUM API ====================
app.get('/api/forum/messages', (req, res) => {
    const { limit = 10 } = req.query;
    
    db.all(
        `SELECT 
            db.bubble_id as id,
            db.content,
            db.created_at,
            u.username,
            u.avatar_url
        FROM Discussion_Bubbles db
        JOIN Users u ON db.user_id = u.user_id
        ORDER BY db.created_at DESC
        LIMIT ?`,
        [parseInt(limit)],
        (err, rows) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: err.message });
            }
            res.json(rows || []);
        }
    );
});

app.post('/api/forum/messages', authenticateToken, (req, res) => {
    const { content } = req.body;
    const userId = req.user.userId;
    
    if (!content || content.length > 144) {
        return res.status(400).json({ error: 'Content must be between 1-144 characters' });
    }
    
    db.run(
        'INSERT INTO Discussion_Bubbles (user_id, content) VALUES (?, ?)',
        [userId, content],
        function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: err.message });
            }
            
            db.get(
                `SELECT 
                    db.bubble_id as id,
                    db.content,
                    db.created_at,
                    u.username,
                    u.avatar_url
                FROM Discussion_Bubbles db
                JOIN Users u ON db.user_id = u.user_id
                WHERE db.bubble_id = ?`,
                [this.lastID],
                (err, message) => {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    res.status(201).json(message);
                }
            );
        }
    );
});

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
    console.log(` Server running on http://localhost:${PORT}`);
    console.log(` API endpoints:`);
    console.log(`   - POST /api/users/login`);
    console.log(`   - GET /api/products`);
    console.log(`   - GET /api/products/:id`);
    console.log(`   - GET /api/cart (protected)`);
    console.log(`   - POST /api/cart/add (protected)`);
    console.log(`   - PUT /api/cart/update (protected)`);
    console.log(`   - DELETE /api/cart/remove/:id (protected)`);
    console.log(`   - GET /api/cart/summary (protected)`);
    console.log(`   - GET /api/forum/messages`);
    console.log(`   - POST /api/forum/messages (protected)`);
    console.log(`   - GET /api/health`);
});