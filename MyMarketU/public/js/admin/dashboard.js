// public/js/admin/dashboard.js

document.addEventListener('DOMContentLoaded', function() {
    // Load initial data
    loadDashboardData();
    loadRecentOrders();
    loadLowStockProducts();

    // Setup logout handler
    document.querySelector('a[href="/logout"]').addEventListener('click', function(e) {
        e.preventDefault();
        handleLogout();
    });
});

// Load dashboard statistics
async function loadDashboardData() {
    try {
        const response = await fetch('/api/admin/dashboard-stats');
        const data = await response.json();
        
        // Update stats
        document.getElementById('totalSales').textContent = `Rp${formatNumber(data.totalSales)}`;
        document.getElementById('totalOrders').textContent = data.totalOrders;
        document.getElementById('totalCustomers').textContent = data.totalCustomers;
        document.getElementById('totalProducts').textContent = data.totalProducts;
        
        // Update growth indicators
        updateGrowthIndicator('salesGrowth', data.salesGrowth);
        updateGrowthIndicator('ordersGrowth', data.ordersGrowth);
        updateGrowthIndicator('customersGrowth', data.customersGrowth);
        updateGrowthIndicator('productsGrowth', data.productsGrowth);
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Load recent orders
async function loadRecentOrders() {
    try {
        const response = await fetch('/api/admin/recent-orders');
        const orders = await response.json();
        
        const tbody = document.querySelector('#recentOrders tbody');
        tbody.innerHTML = orders.map(order => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#${order.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${order.customerName}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${order.productName}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Rp${formatNumber(order.amount)}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}">
                        ${order.status}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <button onclick="viewOrderDetails(${order.id})" class="text-red-600 hover:text-red-900 mr-3">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="processOrder(${order.id})" class="text-red-600 hover:text-red-900">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading recent orders:', error);
    }
}

// Load low stock products
async function loadLowStockProducts() {
    try {
        const response = await fetch('/api/admin/low-stock-products');
        const products = await response.json();
        
        const tbody = document.querySelector('#lowStockProducts tbody');
        tbody.innerHTML = products.map(product => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${product.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${product.stock}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading low stock products:', error);
    }
}

// Helper functions
function formatNumber(number) {
    return new Intl.NumberFormat('id-ID').format(number);
}

function getStatusColor(status) {
    const colors = {
        'Menunggu': 'bg-yellow-100 text-yellow-800',
        'Diproses': 'bg-blue-100 text-blue-800',
        'Selesai': 'bg-green-100 text-green-800',
        'Dibatalkan': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
}

function updateGrowthIndicator(elementId, growth) {
    const element = document.getElementById(elementId);
    const icon = growth >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
    const color = growth >= 0 ? 'text-green-500' : 'text-red-500';
    element.innerHTML = `<i class="fas ${icon}"></i> ${Math.abs(growth)}%`;
    element.className = color;
}

// Order management functions
function viewOrderDetails(orderId) {
    // Implementasi view detail pesanan
    window.location.href = `/admin/orders/${orderId}`;
}

function processOrder(orderId) {
    // Implementasi proses pesanan
    window.location.href = `/admin/orders/${orderId}/process`;
}

// Logout handler
async function handleLogout() {
    try {
        const response = await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            window.location.href = '/login.html';
        }
    } catch (error) {
        console.error('Error during logout:', error);
    }
}