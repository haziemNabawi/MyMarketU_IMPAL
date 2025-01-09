// public/js/customer/orders.js
document.addEventListener('DOMContentLoaded', async function() {
    try {
        const authResponse = await fetch('/api/check-auth', {
            credentials: 'include'
        });
        const authData = await authResponse.json();
        
        if (!authData.loggedIn) {
            window.location.href = '/login.html';
            return;
        }

        await Promise.all([
            loadUserProfile(),
            loadOrders(1)
        ]);

    } catch (error) {
        console.error('Error:', error);
        showNotification('Error loading data', 'error');
    }
});

async function loadUserProfile() {
    try {
        const response = await fetch('/api/user/profile', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                // Update profile elements
                const userNameElements = document.querySelectorAll('#userName, #sidebarUserName');
                const userEmailElements = document.querySelectorAll('#userEmail, #sidebarUserEmail');
                
                userNameElements.forEach(el => el.textContent = data.username);
                userEmailElements.forEach(el => el.textContent = data.email);
            }
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

async function loadOrders(page) {
    try {
        const response = await fetch(`/api/orders/history?page=${page}&limit=10`, {
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to load orders');
        
        const { orders, totalPages } = await response.json();
        const orderList = document.querySelector('.order-list');
        
        if (!orderList) return;

        if (!orders || orders.length === 0) {
            orderList.innerHTML = `
                <div class="text-center py-5">
                    <img src="../images/empty-order.png" alt="No Orders" style="width: 120px; opacity: 0.5;">
                    <h5 class="mt-3">Belum ada pesanan</h5>
                    <p class="text-muted">Yuk mulai belanja!</p>
                    <a href="/customer/dashboard.html" class="btn btn-danger">Belanja Sekarang</a>
                </div>
            `;
            return;
        }

        orderList.innerHTML = `
        ${orders.map(order => `
            <div class="card mb-3 border-0 shadow-sm">
                <div class="card-header bg-white">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <span class="text-muted small">${new Date(order.created_at).toLocaleDateString('id-ID')}</span>
                            <span class="ms-2 badge ${getStatusBadgeClass(order.status)}">
                                ${getStatusText(order.status)}
                            </span>
                        </div>
                        <div class="fw-bold">No. Pesanan: #${order.id}</div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-8">
                            ${formatProductList(order.products)}
                        </div>
                        <div class="col-md-4">
                            <div class="text-md-end">
                                <div class="text-danger fw-bold mb-2">
                                    Total: Rp ${formatNumber(order.total_amount)}
                                </div>
                                <button class="btn btn-outline-secondary btn-sm" 
                                        onclick="viewOrderDetail(${order.id})">
                                    Detail Pesanan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('')}
        
        ${generatePagination(page, totalPages)}
    `;

        setupPaginationListeners();
    } catch (error) {
        console.error('Error loading orders:', error);
        showNotification('Gagal memuat riwayat pesanan', 'error');
    }
}

// Di orders.js
async function viewOrderDetail(orderId) {
    try {
        const response = await fetch(`/api/orders/${orderId}`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to load order details');
        }
        
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message || 'Failed to load order details');
        }

        const order = data.order;
        const modal = new bootstrap.Modal(document.getElementById('orderDetailModal'));
        const modalContent = document.getElementById('orderDetailContent');

        // Hitung subtotal (total harga asli sebelum diskon)
        const subtotal = order.items.reduce((sum, item) => {
            return sum + (item.original_price * item.quantity);
        }, 0);

        // Hitung total diskon dalam rupiah
        const totalDiscount = subtotal - order.total_amount;
        
        if (modalContent) {
            modalContent.innerHTML = `
                <div class="p-4">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h5 class="mb-1">Pesanan #${order.id}</h5>
                            <div class="text-muted">
                                ${new Date(order.created_at).toLocaleDateString('id-ID')}
                            </div>
                        </div>
                        <span class="badge ${getStatusBadgeClass(order.status)}">
                            ${getStatusText(order.status)}
                        </span>
                    </div>
                    
                    <div class="border-bottom pb-3 mb-3">
                        ${order.items.map(item => `
                            <div class="d-flex align-items-center mb-3">
                                <img src="${item.image ? '/images/' + item.image : '../images/default-product.png'}" 
                                     alt="${item.name}"
                                     class="rounded me-3"
                                     style="width: 64px; height: 64px; object-fit: cover;">
                                <div class="flex-grow-1">
                                    <div class="d-flex align-items-center">
                                        <div class="fw-semibold">${item.name}</div>
                                        ${item.discount > 0 ? `
                                            <span class="badge bg-danger ms-2">-${item.discount}%</span>
                                        ` : ''}
                                    </div>
                                    <div class="mt-2">
                                        ${item.discount > 0 ? `
                                            <span class="text-decoration-line-through text-muted me-2">
                                                Rp ${formatNumber(item.original_price)}
                                            </span>
                                        ` : ''}
                                        <span class="text-danger">
                                            Rp ${formatNumber(item.price)}
                                        </span>
                                    </div>
                                    <div class="text-muted mt-1">
                                        ${item.quantity} item
                                    </div>
                                </div>
                                <div class="text-end text-danger fw-semibold">
                                    Rp ${formatNumber(item.quantity * item.price)}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="border-bottom pb-3 mb-3">
                        <div class="d-flex justify-content-between mb-2">
                            <span class="text-muted">Subtotal</span>
                            <span>Rp ${formatNumber(Math.round(subtotal))}</span>
                        </div>
                        ${totalDiscount > 0 ? `
                            <div class="d-flex justify-content-between mb-2">
                                <span class="text-muted">Total Diskon</span>
                                <span class="text-danger">-Rp ${formatNumber(Math.round(totalDiscount))}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="fw-bold">Total Pembayaran</div>
                        <div class="text-danger fw-bold fs-5">
                            Rp ${formatNumber(Math.round(order.total_amount))}
                        </div>
                    </div>
                </div>
            `;
        }
        
        modal.show();
    } catch (error) {
        console.error('Error:', error);
        showNotification('Gagal memuat detail pesanan', 'error');
    }
}

function generatePagination(currentPage, totalPages) {
    if (totalPages <= 1) return '';

    let pages = '';
    for (let i = 1; i <= totalPages; i++) {
        pages += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <button class="page-link" data-page="${i}">${i}</button>
            </li>
        `;
    }

    return `
        <nav aria-label="Order pagination" class="mt-4">
            <ul class="pagination justify-content-center">
                <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                    <button class="page-link" data-page="${currentPage - 1}">Previous</button>
                </li>
                ${pages}
                <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                    <button class="page-link" data-page="${currentPage + 1}">Next</button>
                </li>
            </ul>
        </nav>
    `;
}

function setupPaginationListeners() {
    document.querySelectorAll('.page-link').forEach(button => {
        button.addEventListener('click', async (e) => {
            const page = parseInt(e.target.dataset.page);
            if (!isNaN(page)) {
                await loadOrders(page);
                window.scrollTo(0, 0);
            }
        });
    });
}

function getStatusBadgeClass(status) {
    switch(status?.toLowerCase()) {
        case 'pending': return 'bg-warning text-dark';
        case 'processing': return 'bg-info text-white';
        case 'completed': return 'bg-success text-white';
        case 'cancelled': return 'bg-danger text-white';
        default: return 'bg-secondary text-white';
    }
}

function getStatusText(status) {
    switch(status?.toLowerCase()) {
        case 'pending': return 'Menunggu Pembayaran';
        case 'processing': return 'Diproses';
        case 'completed': return 'Selesai';
        case 'cancelled': return 'Dibatalkan';
        default: return 'Unknown';
    }
}
function formatNumber(number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(number);
}

function formatProductList(products) {
    if (!products || products.length === 0) {
        return '<div class="text-muted">Tidak ada produk</div>';
    }

    if (products.length === 1) {
        const product = products[0];
        return `
            <div class="product-name">
                ${product.name} 
                <span class="text-muted">(${product.quantity} item)</span>
            </div>
        `;
    }

    // Jika ada lebih dari satu produk
    const mainProduct = products[0];
    const remainingCount = products.length - 1;

    return `
        <div class="product-item">
            <div class="product-name">
                ${mainProduct.name}
                <span class="text-muted">(${mainProduct.quantity} item)</span>
            </div>
            <div class="text-muted small">
                +${remainingCount} produk lainnya
            </div>
        </div>
    `;
}


function showNotification(message, type = 'info') {
    if (window.toastr) {
        toastr.options = {
            closeButton: true,
            progressBar: true,
            positionClass: "toast-top-right",
            timeOut: 3000,
            preventDuplicates: true
        };
        
        switch(type) {
            case 'success': toastr.success(message); break;
            case 'error': toastr.error(message); break;
            case 'warning': toastr.warning(message); break;
            default: toastr.info(message);
        }
    } else {
        alert(message);
    }
}

const style = document.createElement('style');
style.textContent = `
    .product-item {
        padding: 0.5rem 0;
    }
    
    .product-name {
        font-weight: 500;
        color: #333;
        margin-bottom: 0.25rem;
    }

    .product-quantity {
        color: #666;
        font-size: 0.9rem;
    }
`;
document.head.appendChild(style);