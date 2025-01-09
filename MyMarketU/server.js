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
    try {
        console.log('Session user ID:', req.session.userId); // Debug log

        if (!req.session.userId) {
            console.log('No user session found');
            return res.json({ items: [] });
        }

        const [items] = await db.query(`
            SELECT 
                c.*,
                p.nama,
                p.harga,
                p.namaFileGambar,
                p.stok,
                p.diskon
            FROM cart c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = ?
        `, [req.session.userId]);

        console.log('Cart items found:', items); // Debug log

        res.json({ 
            items: items.map(item => ({
                ...item,
                harga: parseFloat(item.harga),
                diskon: parseFloat(item.diskon || 0)
            }))
        });
    } catch (error) {
        console.error('Error getting cart:', error);
        res.status(500).json({ 
            error: 'Failed to get cart items',
            items: [] 
        });
    }
});

// Cart endpoints - Update quantity
app.post('/api/cart/update', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Silakan login terlebih dahulu' 
            });
        }

        const { productId, quantity } = req.body;

        // Validasi input
        if (!productId || !quantity || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: 'Data tidak valid'
            });
        }

        // Cek stok produk
        const [product] = await db.query(
            'SELECT stok FROM products WHERE id = ?', 
            [productId]
        );

        if (product.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Produk tidak ditemukan'
            });
        }

        if (quantity > product[0].stok) {
            return res.status(400).json({
                success: false,
                message: `Stok tidak mencukupi. Maksimal ${product[0].stok}`
            });
        }

        // Update cart
        await db.query(
            'UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?',
            [quantity, req.session.userId, productId]
        );

        res.json({ 
            success: true,
            message: 'Keranjang berhasil diperbarui'
        });
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal memperbarui keranjang'
        });
    }
});

app.post('/api/cart/remove', async (req, res) => {
    try {
        // Cek apakah user sudah login
        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message: 'Silakan login terlebih dahulu'
            });
        }

        const { productId } = req.body;

        // Hapus item dari cart
        await db.query(
            'DELETE FROM cart WHERE user_id = ? AND product_id = ?',
            [req.session.userId, productId]
        );
        
        res.json({ 
            success: true,
            message: 'Produk berhasil dihapus dari keranjang'
        });

    } catch (error) {
        console.error('Error removing item from cart:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Gagal menghapus dari keranjang'
        });
    }
});
app.post('/api/cart/checkout', async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Ambil item cart dengan detail produk
        const [cartItems] = await connection.query(`
            SELECT c.*, p.nama, p.harga, p.stok, p.diskon
            FROM cart c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = ?
        `, [req.session.userId]);

        if (cartItems.length === 0) {
            throw new Error('Cart is empty');
        }

        // Hitung total harga dengan diskon
        const totalAmount = cartItems.reduce((sum, item) => {
            const finalPrice = item.harga * (1 - item.diskon/100);
            return sum + (finalPrice * item.quantity);
        }, 0);

        // Buat order baru
        const [orderResult] = await connection.query(
            'INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, "pending")',
            [req.session.userId, totalAmount]
        );

        const orderId = orderResult.insertId;

        // Masukkan item ke order_items
        for (const item of cartItems) {
            // Hitung harga final setelah diskon
            const finalPrice = item.harga * (1 - item.diskon/100);

            await connection.query(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                [orderId, item.product_id, item.quantity, finalPrice]
            );

            // Update stok
            await connection.query(
                'UPDATE products SET stok = stok - ? WHERE id = ?',
                [item.quantity, item.product_id]
            );
        }

        // Simpan data cart ke session sebelum dihapus
        const orderItems = cartItems;

        // Kosongkan cart
        await connection.query(
            'DELETE FROM cart WHERE user_id = ?',
            [req.session.userId]
        );

        await connection.commit();

        // Simpan item order ke session untuk ditampilkan di checkout
        req.session.lastOrder = {
            orderId,
            items: orderItems,
            totalAmount
        };

        res.json({ 
            success: true, 
            orderId,
            totalAmount
        });
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

// Di server.js

// Endpoint untuk mendapatkan items yang baru di-checkout (dari session)
app.get('/api/cart/session-items', async (req, res) => {
    try {
        if (!req.session.userId || !req.session.lastOrder) {
            return res.json({ items: [] });
        }

        res.json({ 
            items: req.session.lastOrder.items,
            totalAmount: req.session.lastOrder.totalAmount
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ items: [] });
    }
});

// Di server.js
app.get('/api/orders/history', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Please login first' 
            });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // Menggunakan helper functions dari database.js
        const [
            orders,
            totalOrders
        ] = await Promise.all([
            db.getOrderHistory(req.session.userId, page, limit),
            db.getTotalOrders(req.session.userId)
        ]);

        const totalPages = Math.ceil(totalOrders / limit);

        res.json({
            success: true,
            orders,
            totalPages,
            totalOrders,
            currentPage: page
        });

    } catch (error) {
        console.error('Error loading orders:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error loading order history'
        });
    }
});

app.get('/api/orders/last', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ success: false, message: 'Please login first' });
        }

        // Ambil pesanan terakhir dengan detail items
        const [orders] = await db.query(`
            SELECT o.*, oi.*, p.nama, p.harga, p.namaFileGambar, p.diskon
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
            WHERE o.user_id = ?
            ORDER BY o.created_at DESC
            LIMIT 1
        `, [req.session.userId]);

        if (orders && orders.length > 0) {
            // Format data untuk response
            const orderItems = orders.map(item => ({
                id: item.product_id,
                nama: item.nama,
                quantity: item.quantity,
                harga: item.harga,
                diskon: item.diskon,
                namaFileGambar: item.namaFileGambar
            }));

            res.json({
                success: true,
                orderId: orders[0].order_id,
                items: orderItems,
                totalAmount: orders[0].total_amount
            });
        } else {
            res.json({ success: false, message: 'No orders found' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error loading last order' });
    }
});

// Endpoint untuk mengambil riwayat pesanan
app.get('/api/orders', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json([]);
        }

        const [orders] = await db.query(`
            SELECT 
                orders.id,
                orders.created_at,
                orders.total_amount,
                COALESCE(orders.status, 'pending') as status
            FROM orders
            WHERE orders.user_id = ?
            ORDER BY orders.created_at DESC
        `, [req.session.userId]);

        // Format angka agar konsisten
        const formattedOrders = orders.map(order => ({
            ...order,
            total_amount: Math.round(order.total_amount) // Bulatkan ke angka penuh
        }));

        console.log('Orders found:', formattedOrders); // Debug log
        res.json(formattedOrders);
    } catch (error) {
        console.error('Error getting orders:', error);
        res.status(500).json([]);
    }
});

// Update endpoint register di server.js
app.post('/api/register', async (req, res) => {
    try {
        console.log('Register request received:', req.body); // Debug log
        const { username, email, password } = req.body;

        // Validasi input
        if (!username || !email || !password) {
            console.log('Missing required fields');
            return res.status(400).json({
                success: false,
                message: 'Semua field harus diisi'
            });
        }

        // Cek email sudah terdaftar
        const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (existingUsers.length > 0) {
            console.log('Email already exists');
            return res.status(400).json({
                success: false,
                message: 'Email sudah terdaftar'
            });
        }

        // Query untuk insert user baru
        const insertQuery = `
            INSERT INTO users (username, email, password, role) 
            VALUES (?, ?, ?, 'customer')
        `;

        const [result] = await db.query(insertQuery, [username, email, password]);

        console.log('Registration successful, result:', result);

        res.json({
            success: true,
            message: 'Registrasi berhasil'
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat registrasi: ' + error.message
        });
    }
});

// Tambahkan di server.js
app.post('/api/logout', (req, res) => {
    try {
        // Hapus session
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ 
                    success: false, 
                    message: 'Gagal logout' 
                });
            }
            res.json({ 
                success: true, 
                message: 'Berhasil logout' 
            });
        });
    } catch (error) {
        console.error('Error during logout:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Gagal logout' 
        });
    }
});

app.post('/api/user/profile/update', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message: 'Silakan login terlebih dahulu'
            });
        }

        const { username, email, phone, currentPassword, newPassword } = req.body;

        // Get current user data
        const [users] = await db.query(
            'SELECT * FROM users WHERE id = ?', 
            [req.session.userId]
        );

        if (!users.length) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }

        let query = 'UPDATE users SET username = ?, email = ?, phone = ?';
        let params = [username, email, phone || null];

        // Handle password update
        if (newPassword && currentPassword) {
            if (currentPassword !== users[0].password) {
                return res.status(400).json({
                    success: false,
                    message: 'Password saat ini tidak sesuai'
                });
            }
            query += ', password = ?';
            params.push(newPassword);
        }

        query += ' WHERE id = ?';
        params.push(req.session.userId);

        await db.query(query, params);

        res.json({
            success: true,
            message: 'Profil berhasil diperbarui'
        });

    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal memperbarui profil'
        });
    }
});

// Add to server.js
app.get('/api/user/profile', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message: 'Silakan login terlebih dahulu'
            });
        }

        const [users] = await db.query(
            'SELECT id, username, email, phone FROM users WHERE id = ?',
            [req.session.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }

        res.json({
            success: true,
            ...users[0]
        });
    } catch (error) {
        console.error('Error getting user profile:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal memuat profil'
        });
    }
});

// Di server.js
app.get('/api/orders/:id', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Please login first' 
            });
        }

        const orderId = req.params.id;

        // Get order details with items including discount
        const [orderDetails] = await db.query(`
            SELECT 
                o.id,
                o.created_at,
                o.total_amount,
                o.status,
                p.id as product_id,
                p.nama,
                p.namaFileGambar,
                p.diskon,
                oi.quantity,
                oi.price,
                p.harga as original_price
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
            WHERE o.id = ? AND o.user_id = ?
        `, [orderId, req.session.userId]);

        if (!orderDetails || orderDetails.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Format the response
        const order = {
            id: orderDetails[0].id,
            created_at: orderDetails[0].created_at,
            total_amount: orderDetails[0].total_amount,
            status: orderDetails[0].status,
            items: orderDetails.map(item => ({
                id: item.product_id,
                name: item.nama,
                image: item.namaFileGambar,
                quantity: item.quantity,
                price: item.price,
                original_price: item.original_price,
                discount: item.diskon || 0
            }))
        };

        res.json({
            success: true,
            order
        });
    } catch (error) {
        console.error('Error getting order details:', error);
        res.status(500).json({
            success: false,
            message: 'Error loading order details'
        });
    }
});

app.put('/api/orders/:id/status', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ success: false, message: 'Please login first' });
        }

        const { status } = req.body;
        const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        await db.query(
            'UPDATE orders SET status = ? WHERE id = ? AND user_id = ?',
            [status, req.params.id, req.session.userId]
        );

        res.json({
            success: true,
            message: 'Order status updated successfully'
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating order status'
        });
    }
});

async function getOrderHistory(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const [orders] = await db.query(`
        SELECT 
            o.id,
            o.created_at,
            o.total_amount,
            o.status,
            GROUP_CONCAT(
                JSON_OBJECT(
                    'product_id', p.id,
                    'nama', p.nama,
                    'quantity', oi.quantity,
                    'price', oi.price,
                    'namaFileGambar', p.namaFileGambar
                )
            ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE o.user_id = ?
        GROUP BY o.id
        ORDER BY o.created_at DESC
        LIMIT ? OFFSET ?
    `, [userId, limit, offset]);

    return orders.map(order => ({
        ...order,
        items: JSON.parse(`[${order.items}]`),
        created_at: order.created_at,
        status: order.status || 'pending'
    }));
}