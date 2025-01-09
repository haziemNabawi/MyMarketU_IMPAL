// checkout.js

document.addEventListener('DOMContentLoaded', async function() {
    await loadCartData();  // Load cart data pertama
    loadOrderHistory();    // Load riwayat pesanan
    setupEventListeners(); // Setup event listeners
    checkAdminRole();      // Cek role admin
});

function setupEventListeners() {
    // Setup WhatsApp checkout button
    const whatsappCheckoutBtn = document.getElementById('whatsappOrderBtn');
    if (whatsappCheckoutBtn) {
        whatsappCheckoutBtn.addEventListener('click', handleWhatsappCheckout);
    }

    // Setup logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Prevent form submission on enter
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            return false;
        }
    });
}

async function loadCartData() {
    try {
        console.log('Loading cart data...');
        
        const response = await fetch('/api/cart/session-items', {
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Failed to load cart');
        const data = await response.json();
        
        console.log('Received cart data:', data);

        if (!data.items || data.items.length === 0) {
            // Jika tidak ada di session, coba ambil dari cart biasa
            const cartResponse = await fetch('/api/cart', {
                credentials: 'include'
            });
            const cartData = await cartResponse.json();
            console.log('Received regular cart data:', cartData);
            
            if (cartData.items && cartData.items.length > 0) {
                displayCartItems(cartData.items);
                return;
            }
            
            showEmptyCart();
            return;
        }

        displayCartItems(data.items);
    } catch (error) {
        console.error('Error loading cart:', error);
        showNotification('Gagal memuat data keranjang', 'error');
    }
}
function displayCartItems(items) {
    const orderItemsDiv = document.getElementById('orderItems');
    const emptyCartMessage = document.querySelector('.cart-empty-message');

    // Hide empty cart message if we have items
    if (emptyCartMessage) {
        emptyCartMessage.style.display = 'none';
    }

    if (!orderItemsDiv) return;

    // Debug log untuk melihat data items
    console.log('Items to display:', items);

    orderItemsDiv.innerHTML = items.map(item => {
        // Pastikan harga tidak 0
        const basePrice = item.harga || 200000; // Default harga jika undefined
        const quantity = item.quantity || 1; // Default quantity jika undefined
        const discount = item.diskon || 10; // Default diskon 10% jika undefined
        
        const subtotal = basePrice * quantity;
        const discountAmount = (subtotal * discount) / 100;
        const finalPrice = subtotal - discountAmount;

        return `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div class="d-flex align-items-center">
                    <img src="${item.namaFileGambar || '/images/default-product.png'}" 
                         alt="${item.nama}" 
                         class="me-2" 
                         style="width: 50px; height: 50px; object-fit: cover;"
                         onerror="this.src='/images/default-product.png'">
                    <div>
                        <div class="fw-bold">${item.nama}</div>
                        <small class="text-muted">${quantity} x Rp ${formatNumber(basePrice)}</small>
                        ${discount > 0 ? `<small class="text-danger d-block">Diskon ${discount}%</small>` : ''}
                    </div>
                </div>
                <div class="text-end">
                    <div>Rp ${formatNumber(finalPrice)}</div>
                </div>
            </div>
        `;
    }).join('');

    // Update summary setelah menampilkan items
    updateSummary(items);
}


function updateSummary(items) {
    let subtotal = 0;
    let totalDiscount = 0;

    items.forEach(item => {
        const basePrice = item.harga || 200000;
        const quantity = item.quantity || 1;
        const discount = item.diskon || 10;
        
        const itemSubtotal = basePrice * quantity;
        const itemDiscount = (itemSubtotal * discount) / 100;
        
        subtotal += itemSubtotal;
        totalDiscount += itemDiscount;
    });

    const total = subtotal - totalDiscount;

    document.getElementById('subtotal').textContent = `Rp ${formatNumber(subtotal)}`;
    document.getElementById('discount').textContent = `-Rp ${formatNumber(totalDiscount)}`;
    document.getElementById('total').textContent = `Rp ${formatNumber(total)}`;
}

// WhatsApp checkout handling
async function handleWhatsappCheckout(e) {
    e.preventDefault();
    
    // Redirect ke WhatsApp dulu
    window.location.href = 'https://wa.link/5nelx9';

    try {
        // Proses checkout di background setelah redirect
        await fetch('/api/cart/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
    } catch (error) {
        console.error('Error during checkout:', error);
        // Tidak perlu menampilkan notifikasi karena user sudah di redirect
    }
}

// Order history handling
async function loadOrderHistory() {
    try {
        const response = await fetch('/api/orders', {
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to load orders');
        const orders = await response.json();
        
        const tbody = document.querySelector('table tbody');
        if (!tbody) return;

        if (!orders || orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">Belum ada riwayat pesanan</td></tr>';
            return;
        }

        tbody.innerHTML = orders.map(order => `
            <tr>
                <td>${order.id}</td>
                <td>${new Date(order.created_at).toLocaleDateString('id-ID')}</td>
                <td>Rp ${formatNumber(order.total_amount)}</td>
                <td>
                    <span class="badge ${getStatusColor(order.status)}">
                        ${getStatusText(order.status)}
                    </span>
                </td>
                <td>
                    <button onclick="viewOrderDetail(${order.id})" class="btn btn-info btn-sm">Detail</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading order history:', error);
    }
}

// Admin related functions
async function checkAdminRole() {
    try {
        const response = await fetch('/api/check-auth');
        const data = await response.json();
        
        if (data.role === 'admin') {
            document.getElementById('adminSettings').style.display = 'block';
            loadAdminWhatsapp();
        }
    } catch (error) {
        console.error('Error checking role:', error);
    }
}

function loadAdminWhatsapp() {
    const savedNumber = localStorage.getItem('adminWhatsapp');
    if (savedNumber) {
        document.getElementById('adminWhatsapp').value = savedNumber;
    }
}

function saveAdminWhatsapp() {
    const number = document.getElementById('adminWhatsapp').value;
    if (!validateWhatsappNumber(number)) {
        showNotification('Nomor WhatsApp tidak valid', 'error');
        return;
    }
    localStorage.setItem('adminWhatsapp', number);
    showNotification('Nomor WhatsApp admin berhasil disimpan', 'success');
}

// Utility functions
function formatNumber(number) {
    return new Intl.NumberFormat('id-ID').format(Math.round(number));
}

function validateWhatsappNumber(number) {
    const phoneRegex = /^[0-9]{10,13}$/;
    return phoneRegex.test(number);
}

function getStatusColor(status) {
    switch(status.toLowerCase()) {
        case 'menunggu':
        case 'pending': return 'bg-warning';
        case 'selesai':
        case 'completed': return 'bg-success';
        case 'dibatalkan':
        case 'cancelled': return 'bg-danger';
        default: return 'bg-warning';
    }
}

function getStatusText(status) {
    switch(status.toLowerCase()) {
        case 'pending':
        case 'menunggu': return 'Menunggu';
        case 'completed':
        case 'selesai': return 'Selesai';
        case 'cancelled':
        case 'dibatalkan': return 'Dibatalkan';
        default: return 'Menunggu';
    }
}

function showNotification(message, type = 'info') {
    toastr.options = {
        closeButton: true,
        progressBar: true,
        positionClass: "toast-top-right",
        timeOut: 3000
    };
    
    switch(type) {
        case 'success':
            toastr.success(message);
            break;
        case 'error':
            toastr.error(message);
            break;
        default:
            toastr.info(message);
    }
}

// Logout handling
async function handleLogout() {
    try {
        const response = await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            window.location.href = '/login.html';
        } else {
            showNotification('Gagal logout', 'error');
        }
    } catch (error) {
        console.error('Error during logout:', error);
        showNotification('Gagal logout', 'error');
    }
}