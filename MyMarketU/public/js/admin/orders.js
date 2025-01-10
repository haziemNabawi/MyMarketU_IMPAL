// Global variables
let currentPage = 1;
let currentOrderId = null;

// Fetch orders from API
async function fetchOrders(page = 1, status = '', search = '') {
    try {
        const response = await fetch(`/api/admin/orders?page=${page}&status=${status}&search=${search}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching orders:', error);
        return { orders: [], totalPages: 0, totalOrders: 0 };
    }
}

// Format currency
function formatCurrency(amount) {
    return `Rp${amount.toLocaleString('id-ID')}`;
}

// Get status badge color
function getStatusBadgeClass(status) {
    const colors = {
        pending: 'bg-yellow-100 text-yellow-800',
        processing: 'bg-blue-100 text-blue-800',
        completed: 'bg-green-100 text-green-800',
        cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
}

// Render orders table
function renderOrders(orders) {
    const tbody = document.querySelector('table tbody');
    tbody.innerHTML = '';

    if (orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                    Tidak ada pesanan
                </td>
            </tr>
        `;
        return;
    }

    orders.forEach(order => {
        const productsList = order.products.map(p => 
            `${p.name} (${p.quantity})`
        ).join(', ');

        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50';
        tr.innerHTML = `
            <td class="px-6 py-4">#${order.id}</td>
            <td class="px-6 py-4">${new Date(order.created_at).toLocaleString('id-ID')}</td>
            <td class="px-6 py-4">${order.customer_name}</td>
            <td class="px-6 py-4">${productsList}</td>
            <td class="px-6 py-4">${formatCurrency(order.total_amount)}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 rounded text-sm ${getStatusBadgeClass(order.status)}">
                    ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
            </td>
            <td class="px-6 py-4">
                <button onclick="viewOrderDetails(${order.id})" class="text-blue-600 hover:text-blue-800">
                    <i class="fas fa-eye"></i> Lihat
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// View order details
async function viewOrderDetails(orderId) {
    try {
        currentOrderId = orderId;
        const response = await fetch(`/api/admin/orders/${orderId}`);
        const data = await response.json();
        
        if (data.success) {
            const order = data.order;
            document.getElementById('modalOrderId').textContent = order.id;
            document.getElementById('updateStatus').value = order.status;
            
            const detailsHtml = `
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <p class="text-sm text-gray-600">Tanggal Order</p>
                        <p>${new Date(order.created_at).toLocaleString('id-ID')}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Status</p>
                        <p class="capitalize">${order.status}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Pelanggan</p>
                        <p>${order.customer_name}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Email</p>
                        <p>${order.customer_email}</p>
                    </div>
                </div>
                <div class="border-t pt-4">
                    <h4 class="font-semibold mb-2">Produk</h4>
                    ${order.items.map(item => `
                        <div class="flex justify-between items-center py-2 border-b">
                            <div class="flex items-center space-x-4">
                                <img src="${item.image}" alt="${item.name}" class="w-12 h-12 object-cover rounded">
                                <div>
                                    <p class="font-medium">${item.name}</p>
                                    <p class="text-sm text-gray-600">Jumlah: ${item.quantity}</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <p>${formatCurrency(item.price)}</p>
                                ${item.discount > 0 ? `
                                    <p class="text-sm text-gray-600">
                                        Diskon: ${item.discount}%
                                    </p>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                    <div class="mt-4 text-right">
                        <p class="text-lg font-bold">
                            Total: ${formatCurrency(order.total_amount)}
                        </p>
                    </div>
                </div>
            `;
            
            document.getElementById('orderDetails').innerHTML = detailsHtml;
            document.getElementById('orderModal').classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error fetching order details:', error);
        alert('Error loading order details');
    }
}

// Close order modal
function closeOrderModal() {
    document.getElementById('orderModal').classList.add('hidden');
    currentOrderId = null;
}

async function updateOrderStatus() {
    if (!currentOrderId) return;
    
    const status = document.getElementById('updateStatus').value;
    
    try {
        const response = await fetch(`/api/admin/orders/${currentOrderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Gagal mengupdate status');
        }

        if (data.success) {
            closeOrderModal();
            await loadOrders(); // Refresh orders list
            showToast('Status pesanan berhasil diperbarui');
        } else {
            showToast('Gagal mengupdate status: ' + (data.message || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error updating order status:', error);
        showToast('Error: ' + error.message, 'error');
    }
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded shadow-lg ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Load orders with filters
async function loadOrders() {
    const statusFilter = document.getElementById('statusFilter').value;
    const searchInput = document.getElementById('searchOrder').value;
    
    const data = await fetchOrders(currentPage, statusFilter, searchInput);
    if (data.success) {
        renderOrders(data.orders);
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Load initial data
    loadOrders();

    // Add event listeners
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', loadOrders);
    }

    const searchInput = document.getElementById('searchOrder');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(loadOrders, 300));
    }

    // Close modal when clicking outside
    const modal = document.getElementById('orderModal');
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeOrderModal();
        }
    });
});

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}