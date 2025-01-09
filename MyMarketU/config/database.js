// config/database.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'mymarketu_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Helper function untuk riwayat pesanan (basic info only)
async function getOrderHistory(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    const [orders] = await pool.query(`
        SELECT 
            o.id,
            o.created_at,
            o.total_amount,
            o.status,
            COUNT(DISTINCT oi.id) as total_items,
            GROUP_CONCAT(
                CONCAT(
                    p.nama,
                    '::',
                    oi.quantity
                ) SEPARATOR '||'
            ) as product_info
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
        created_at: order.created_at,
        status: order.status || 'pending',
        products: order.product_info ? order.product_info.split('||').map(info => {
            const [name, quantity] = info.split('::');
            return { name, quantity: parseInt(quantity) };
        }) : []
    }));
}

// Helper function untuk detail pesanan
async function getOrderDetail(orderId, userId) {
    const [orders] = await pool.query(`
        SELECT 
            o.id,
            o.created_at,
            o.total_amount,
            o.status,
            p.nama as product_name,
            p.namaFileGambar,
            oi.quantity,
            oi.price
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN products p ON oi.product_id = p.id
        WHERE o.id = ? AND o.user_id = ?
    `, [orderId, userId]);

    if (!orders.length) return null;

    // Group items under a single order
    const orderDetail = {
        id: orders[0].id,
        created_at: orders[0].created_at,
        total_amount: orders[0].total_amount,
        status: orders[0].status || 'pending',
        items: orders.map(item => ({
            name: item.product_name,
            quantity: item.quantity,
            price: item.price,
            image: item.namaFileGambar
        }))
    };

    return orderDetail;
}

// Get total orders count
async function getTotalOrders(userId) {
    const [result] = await pool.query(
        'SELECT COUNT(*) as total FROM orders WHERE user_id = ?',
        [userId]
    );
    return result[0].total;
}

pool.getConnection()
    .then(connection => {
        console.log('Database connected successfully');
        connection.release();
    })
    .catch(err => {
        console.error('Database connection failed:', err);
    });

module.exports = {
    query: pool.query.bind(pool),
    getConnection: pool.getConnection.bind(pool),
    getOrderHistory,
    getOrderDetail,
    getTotalOrders
};