const express = require('express');
const multer = require('multer');
const db = require('./config/database');
const bcrypt = require('bcrypt');
const path = require('path');
const app = express();
const session = require('express-session');

// Konfigurasi Multer untuk upload file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb('Error: Images Only!');
        }
    }
});

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`, req.body);
    next();
});

// Middleware
app.use(express.json());
app.use(session({
    secret: 'mymarketu-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // set true if using HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));
app.use(express.static('public'));

// Route Login
// server.js - route login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (users.length > 0) {
            const user = users[0];
            if (user.password === password) {  // Idealnya gunakan bcrypt
                req.session.userId = user.id;
                req.session.role = user.role;
                return res.json({ success: true, role: user.role });
            }
        }
        return res.json({ success: false, message: 'Email atau password salah' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error server' });
    }
});

// Endpoint untuk cek status login
function checkAuth(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ 
            success: false, 
            message: 'Please login first' 
        });
    }
    next();
}

// Dashboard Stats
app.get('/api/admin/dashboard-stats', async (req, res) => {
    try {
        const [totalSales] = await db.query('SELECT SUM(amount) as total FROM orders');
        const [totalOrders] = await db.query('SELECT COUNT(*) as total FROM orders');
        const [totalCustomers] = await db.query('SELECT COUNT(*) as total FROM users WHERE role = "customer"');
        const [totalProducts] = await db.query('SELECT COUNT(*) as total FROM products');

        res.json({
            totalSales: totalSales[0].total || 0,
            totalOrders: totalOrders[0].total || 0,
            totalCustomers: totalCustomers[0].total || 0,
            totalProducts: totalProducts[0].total || 0,
            salesGrowth: 49.5,
            ordersGrowth: 12.5,
            customersGrowth: 23.4,
            productsGrowth: -2.4
        });
    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Recent Orders
app.get('/api/admin/recent-orders', async (req, res) => {
    try {
        const query = `
            SELECT 
                o.id, 
                u.username as customerName,
                p.nama as productName,
                o.amount,
                o.status
            FROM orders o
            JOIN users u ON o.user_id = u.id
            JOIN products p ON o.product_id = p.id
            ORDER BY o.created_at DESC
            LIMIT 5
        `;
        const [orders] = await db.query(query);
        res.json(orders);
    } catch (error) {
        console.error('Error getting recent orders:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Low Stock Products
app.get('/api/admin/low-stock-products', async (req, res) => {
    try {
        const query = `
            SELECT nama as name, stok as stock
            FROM products
            WHERE stok < 10
            ORDER BY stok ASC
        `;
        const [products] = await db.query(query);
        res.json(products);
    } catch (error) {
        console.error('Error getting low stock products:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Products API
// Di server.js
app.get('/api/admin/products', async (req, res) => {
    try {
        console.log('Getting products from database...');
        const query = 'SELECT * FROM products ORDER BY id DESC';
        const [products] = await db.query(query);
        console.log('Found products:', products.length);
        res.json(products);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error getting products',
            error: error.message 
        });
    }
});

app.get('/api/admin/products', async (req, res) => {
    try {
        const [products] = await db.query('SELECT * FROM products ORDER BY id DESC');
        res.json(products);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json([]);  // Return empty array instead of error object
    }
});

app.post('/api/admin/products/add', upload.single('gambar'), async (req, res) => {
    try {
        const { nama, kategori, harga, stok, deskripsi, diskon } = req.body;
        const gambar = req.file ? `/images/${req.file.filename}` : '/img/default-product.png';
        console.log('Data yang diterima:', req.body);
        console.log('File yang diterima:', req.file);

        const query = `
            INSERT INTO products (nama, kategori, harga, stok, deskripsi, namaFileGambar, diskon) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await db.query(query, [nama, kategori, harga, stok, deskripsi, gambar, diskon]);
        
        res.json({ 
            success: true, 
            message: 'Product added successfully',
            productId: result.insertId 
        });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ success: false, message: 'Error adding product' });
    }
});

app.put('/api/admin/products/:id', upload.single('gambar'), async (req, res) => {
    try {
        const { nama, kategori, harga, stok, deskripsi, diskon } = req.body;
        const productId = req.params.id;
        
        let query = `
            UPDATE products 
            SET nama = ?, kategori = ?, harga = ?, stok = ?, deskripsi = ?, diskon = ?
        `;
        let params = [nama, kategori, harga, stok, deskripsi, diskon];

        if (req.file) {
            query += `, namaFileGambar = ?`;
            params.push(req.file.filename);
        }

        query += ` WHERE id = ?`;
        params.push(productId);

        await db.query(query, params);
        
        res.json({ success: true, message: 'Product updated successfully' });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ success: false, message: 'Error updating product' });
    }
});

app.delete('/api/admin/products/:id', async (req, res) => {
    try {
        const query = 'DELETE FROM products WHERE id = ?';
        await db.query(query, [req.params.id]);
        
        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ success: false, message: 'Error deleting product' });
    }
});

// Cart endpoints
app.get('/api/cart', async (req, res) => {
    if (!req.session.userId) {
        return res.json({ items: [] });
    }

    try {
        const [items] = await db.query(`
            SELECT c.*, p.nama, p.harga, p.namaFileGambar, p.stok, p.diskon
            FROM cart c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = ?
        `, [req.session.userId]);

        console.log('Cart items:', items); // Debug log
        res.json({ items });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ items: [] });
    }
});

app.post('/api/cart/update', async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        
        // Check product stock
        const [product] = await db.query('SELECT stok FROM products WHERE id = ?', [productId]);
        if (product[0].stok < quantity) {
            return res.status(400).json({ 
                success: false, 
                message: 'Quantity exceeds available stock' 
            });
        }

        // Update cart quantity
        await db.query(
            'UPDATE cart SET quantity = ? WHERE product_id = ? AND user_id = ?',
            [quantity, productId, req.session.userId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ success: false, message: 'Error updating cart' });
    }
});

app.post('/api/cart/remove', async (req, res) => {
    try {
        const { productId } = req.body;
        await db.query(
            'DELETE FROM cart WHERE product_id = ? AND user_id = ?',
            [productId, req.session.userId]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error removing item from cart:', error);
        res.status(500).json({ success: false, message: 'Error removing item' });
    }
});

app.post('/api/cart/checkout', async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Get cart items
        const [cartItems] = await connection.query(`
            SELECT c.*, p.harga, p.stok, p.diskon
            FROM cart c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = ?
        `, [req.session.userId]);

        if (cartItems.length === 0) {
            throw new Error('Cart is empty');
        }

        // Create order
        const [orderResult] = await connection.query(
            'INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)',
            [req.session.userId, 0, 'pending']
        );
        const orderId = orderResult.insertId;

        let totalAmount = 0;

        // Process each cart item
        for (const item of cartItems) {
            // Check stock
            if (item.stok < item.quantity) {
                throw new Error(`Insufficient stock for product ID ${item.product_id}`);
            }

            // Calculate price with discount
            const finalPrice = item.harga * (1 - item.diskon/100);
            const itemTotal = finalPrice * item.quantity;
            totalAmount += itemTotal;

            // Add order item
            await connection.query(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                [orderId, item.product_id, item.quantity, finalPrice]
            );

            // Update stock
            await connection.query(
                'UPDATE products SET stok = stok - ? WHERE id = ?',
                [item.quantity, item.product_id]
            );
        }

        // Update order total
        await connection.query(
            'UPDATE orders SET total_amount = ? WHERE id = ?',
            [totalAmount, orderId]
        );

        // Clear cart
        await connection.query(
            'DELETE FROM cart WHERE user_id = ?',
            [req.session.userId]
        );

        await connection.commit();
        res.json({ success: true, orderId });
    } catch (error) {
        await connection.rollback();
        console.error('Error during checkout:', error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
});

// Add to cart endpoint
app.post('/api/cart/add', checkAuth, async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        console.log('Received request:', { productId, quantity });
        
        // Check if user is logged in
        if (!req.session.userId) {
            console.log('No user session found');
            return res.status(401).json({
                success: false,
                message: 'Silakan login terlebih dahulu'
            });
        }

        console.log('User ID:', req.session.userId);

        // Check product stock
        const [product] = await db.query('SELECT * FROM products WHERE id = ?', [productId]);
        console.log('Product found:', product[0]);

        if (!product[0] || product[0].stok < quantity) {
            return res.status(400).json({
                success: false,
                message: 'Stok tidak mencukupi'
            });
        }

        // Check existing cart item
        const [existingItem] = await db.query(
            'SELECT * FROM cart WHERE user_id = ? AND product_id = ?',
            [req.session.userId, productId]
        );

        if (existingItem.length > 0) {
            console.log('Updating existing cart item');
            const newQuantity = existingItem[0].quantity + parseInt(quantity);
            
            if (newQuantity > product[0].stok) {
                return res.status(400).json({
                    success: false,
                    message: 'Total quantity melebihi stok tersedia'
                });
            }

            await db.query(
                'UPDATE cart SET quantity = ? WHERE id = ?',
                [newQuantity, existingItem[0].id]
            );
        } else {
            console.log('Adding new cart item');
            await db.query(
                'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
                [req.session.userId, productId, quantity]
            );
        }

        res.json({
            success: true,
            message: 'Produk berhasil ditambahkan ke keranjang'
        });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal menambahkan ke keranjang: ' + error.message
        });
    }
});

// Get cart count endpoint
app.get('/api/cart/count', checkAuth, async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.json({ count: 0 });
        }

        const [result] = await db.query(
            'SELECT SUM(quantity) as count FROM cart WHERE user_id = ?',
            [req.session.userId]
        );
        
        res.json({ count: result[0].count || 0 });
    } catch (error) {
        console.error('Error getting cart count:', error);
        res.status(500).json({ count: 0 });
    }
});

// Products endpoint
app.get('/api/admin/products', async (req, res) => {
    try {
        const [products] = await db.query('SELECT * FROM products ORDER BY id DESC');
        res.json(products);
    } catch (error) {
        console.error('Error getting products:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting products'
        });
    }
});

// Middleware untuk serving static files
app.use('/img', express.static('public/img'));
app.use('/images', express.static('public/images'));

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});

const cors = require('cors');
app.use(cors());

app.get('/api/check-auth', (req, res) => {
  res.json({ loggedIn: !!req.session.userId });
});
