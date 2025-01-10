// Global state for pagination and data management
const state = {
    orders: {
        currentPage: 1,
        totalPages: 1,
        itemsPerPage: 5
    },
    stock: {
        currentPage: 1,
        totalPages: 1,
        itemsPerPage: 5
    }
};

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Admin dashboard initializing...');
    try {
        // Check authentication first
        const authResponse = await fetch('/api/check-auth', {
            credentials: 'include'
        });
        const authData = await authResponse.json();
        
        if (!authData.loggedIn) {
            window.location.href = '/login.html';
            return;
        }

        // Initialize all dashboard components
        await initializeDashboard();
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showError('Terjadi kesalahan saat memuat dashboard');
    }
});

// Main initialization function
async function initializeDashboard() {
    try {
        await Promise.all([
            loadDashboardStats(),
            loadRecentOrders(1),
            loadLowStockProducts(1)
        ]);
        
        setupEventListeners();
        console.log('Dashboard initialized successfully');
    } catch (error) {
        console.error('Error in dashboard initialization:', error);
        showError('Gagal memuat data dashboard');
    }
}

// Setup all event listeners
function setupEventListeners() {
    setupPagination();
    setupLogoutHandler();
    setupRefreshHandlers();
}

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        console.log('Loading dashboard stats...');
        const response = await fetch('/api/admin/dashboard-stats', {
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to fetch dashboard stats');
        const stats = await response.json();
        
        // Update UI elements
        updateDashboardStats(stats);
        console.log('Dashboard stats loaded successfully');
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        showError('Gagal memuat statistik dashboard');
    }
}

// Update dashboard statistics in UI
function updateDashboardStats(stats) {
    document.getElementById('totalSales').textContent = formatCurrency(stats.totalSales);
    document.getElementById('totalOrders').textContent = stats.totalOrders;
    document.getElementById('totalCustomers').textContent = stats.totalCustomers;
    document.getElementById('totalProducts').textContent = stats.totalProducts;
}

// Load recent orders with pagination
async function loadRecentOrders(page = 1) {
    try {
        console.log(`Loading recent orders page ${page}...`);
        const response = await fetch(`/api/admin/recent-orders?page=${page}&limit=${state.orders.itemsPerPage}`, {
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to fetch recent orders');
        const data = await response.json();
        
        // Update orders table
        updateOrdersTable(data);
        // Update pagination state and controls
        updateOrdersPagination(data);
        
        console.log('Recent orders loaded successfully');
    } catch (error) {
        console.error('Error loading recent orders:', error);
        showError('Gagal memuat data pesanan');
    }
}

// Update orders table content
function updateOrdersTable(data) {
    const tbody = document.querySelector('#recentOrders tbody');
    if (data.orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                    Tidak ada pesanan hari ini
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = data.orders.map(order => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 text-sm text-gray-900">#${order.id}</td>
            <td class="px-6 py-4 text-sm text-gray-900">${order.customerName}</td>
            <td class="px-6 py-4 text-sm text-gray-900">${order.productName}</td>
            <td class="px-6 py-4 text-sm text-gray-900">${order.quantity}</td>
            <td class="px-6 py-4">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(order.status)}">
                    ${getStatusText(order.status)}
                </span>
            </td>
        </tr>
    `).join('');
}

// Load low stock products with pagination
async function loadLowStockProducts(page = 1) {
    try {
        console.log(`Loading low stock products page ${page}...`);
        const response = await fetch(`/api/admin/low-stock-products?page=${page}&limit=${state.stock.itemsPerPage}`, {
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to fetch low stock products');
        const data = await response.json();
        
        // Update products table
        updateLowStockTable(data);
        // Update pagination state and controls
        updateStockPagination(data);
        
        console.log('Low stock products loaded successfully');
    } catch (error) {
        console.error('Error loading low stock products:', error);
        showError('Gagal memuat data stok menipis');
    }
}

// Update low stock products table content
function updateLowStockTable(data) {
    const tbody = document.querySelector('#lowStockProducts tbody');
    if (data.products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="2" class="px-6 py-4 text-center text-gray-500">
                    Tidak ada produk dengan stok menipis
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = data.products.map(product => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 text-sm text-gray-900">${product.name}</td>
            <td class="px-6 py-4">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${product.stock <= 5 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}">
                    ${product.stock}
                </span>
            </td>
        </tr>
    `).join('');
}

// Setup pagination controls
function setupPagination() {
    // Orders pagination
    document.getElementById('ordersPrevPage')?.addEventListener('click', () => {
        if (state.orders.currentPage > 1) {
            loadRecentOrders(state.orders.currentPage - 1);
        }
    });

    document.getElementById('ordersNextPage')?.addEventListener('click', () => {
        if (state.orders.currentPage < state.orders.totalPages) {
            loadRecentOrders(state.orders.currentPage + 1);
        }
    });

    // Stock pagination
    document.getElementById('stockPrevPage')?.addEventListener('click', () => {
        if (state.stock.currentPage > 1) {
            loadLowStockProducts(state.stock.currentPage - 1);
        }
    });

    document.getElementById('stockNextPage')?.addEventListener('click', () => {
        if (state.stock.currentPage < state.stock.totalPages) {
            loadLowStockProducts(state.stock.currentPage + 1);
        }
    });
}

// Update orders pagination info and controls
function updateOrdersPagination(data) {
    state.orders.currentPage = data.page;
    state.orders.totalPages = data.totalPages;

    const startRange = data.total ? (data.page - 1) * state.orders.itemsPerPage + 1 : 0;
    const endRange = Math.min(data.page * state.orders.itemsPerPage, data.total);

    document.getElementById('ordersStartRange').textContent = startRange;
    document.getElementById('ordersEndRange').textContent = endRange;
    document.getElementById('ordersTotalItems').textContent = data.total;

    document.getElementById('ordersPrevPage').disabled = data.page <= 1;
    document.getElementById('ordersNextPage').disabled = data.page >= data.totalPages;
}

// Update stock pagination info and controls
function updateStockPagination(data) {
    state.stock.currentPage = data.page;
    state.stock.totalPages = data.totalPages;

    const startRange = data.total ? (data.page - 1) * state.stock.itemsPerPage + 1 : 0;
    const endRange = Math.min(data.page * state.stock.itemsPerPage, data.total);

    document.getElementById('stockStartRange').textContent = startRange;
    document.getElementById('stockEndRange').textContent = endRange;
    document.getElementById('stockTotalItems').textContent = data.total;

    document.getElementById('stockPrevPage').disabled = data.page <= 1;
    document.getElementById('stockNextPage').disabled = data.page >= data.totalPages;
}

// Setup logout handler
function setupLogoutHandler() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            try {
                const response = await fetch('/api/logout', {
                    method: 'POST',
                    credentials: 'include'
                });
                const data = await response.json();
                
                if (data.success) {
                    window.location.href = '/login.html';
                } else {
                    showError('Gagal logout: ' + (data.message || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error during logout:', error);
                showError('Gagal melakukan logout');
            }
        });
    }
}

// Setup refresh handlers for auto-refresh
function setupRefreshHandlers() {
    // Auto refresh every 5 minutes
    setInterval(() => {
        loadDashboardStats();
        loadRecentOrders(state.orders.currentPage);
        loadLowStockProducts(state.stock.currentPage);
    }, 5 * 60 * 1000);
}

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount || 0);
}

function getStatusStyle(status) {
    const styles = {
        'completed': 'bg-green-100 text-green-800',
        'pending': 'bg-yellow-100 text-yellow-800',
        'processing': 'bg-blue-100 text-blue-800',
        'cancelled': 'bg-red-100 text-red-800'
    };
    return styles[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
}

function getStatusText(status) {
    const texts = {
        'completed': 'Selesai',
        'pending': 'Menunggu',
        'processing': 'Diproses',
        'cancelled': 'Dibatalkan'
    };
    return texts[status.toLowerCase()] || status;
}

function showError(message) {
    // You can implement your preferred error notification method here
    console.error(message);
    // Example: Show error in a toast notification
    if (window.toastr) {
        toastr.error(message);
    } else {
        alert(message);
    }
}