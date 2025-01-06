// public/js/cart.js

document.addEventListener('DOMContentLoaded', function() {
    loadCart();
    setupEventListeners();
});

function setupEventListeners() {
    // Checkout button
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckout);
    }
}

async function loadCart() {
    try {
        const response = await fetch('/api/cart', {
            credentials: 'include' // Add this
        });
        if (!response.ok) throw new Error('Failed to load cart');
        const cartData = await response.json();
        
        displayCart(cartData);
        updateSummary(cartData);
    } catch (error) {
        console.error('Error:', error);
        showNotification('Gagal memuat keranjang', 'error');
    }
}

function displayCart(cartData) {
    const cartContainer = document.querySelector('.cart-items');
    console.log('Cart data:', cartData); // Debug

    if (!cartData.items || cartData.items.length === 0) {
        cartContainer.innerHTML = `
            <div class="text-center py-5">
                <h4>Keranjang Belanja Kosong</h4>
                <a href="/customer/dashboard.html" class="btn btn-danger">Belanja Sekarang</a>
            </div>
        `;
        return;
    }

    cartContainer.innerHTML = cartData.items.map(item => `
        <div class="cart-item" data-id="${item.id}">
            <img src="/images/${item.namaFileGambar || 'default.png'}" 
                 alt="${item.nama}"
                 class="cart-item-image"
                 onerror="this.src='../images/default-product.png'">
            
            <div class="cart-item-info">
                <h5 class="cart-item-title">${item.nama}</h5>
                <div class="price-section mb-2">
                    ${item.diskon > 0 ? `
                        <span class="cart-item-original-price">Rp ${formatNumber(item.harga)}</span>
                        <span class="cart-item-price">Rp ${formatNumber(item.harga * (1 - item.diskon/100))}</span>
                    ` : `
                        <span class="cart-item-price">Rp ${formatNumber(item.harga)}</span>
                    `}
                </div>
                <div class="quantity-control">
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                    <input type="number" class="quantity-input" 
                           value="${item.quantity}" 
                           min="1" 
                           max="${item.stok}"
                           onchange="updateQuantity(${item.id}, null, this.value)">
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                </div>
            </div>

            <button class="remove-item" onclick="removeItem(${item.id})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function updateSummary(cartData) {
    const totalPrice = cartData.items.reduce((sum, item) => sum + (item.harga * item.quantity), 0);
    const totalDiscount = cartData.items.reduce((sum, item) => 
        sum + (item.harga * item.quantity * (item.diskon/100)), 0);
    const grandTotal = totalPrice - totalDiscount;

    document.getElementById('totalPrice').textContent = `Rp ${formatNumber(totalPrice)}`;
    document.getElementById('totalDiscount').textContent = `-Rp ${formatNumber(totalDiscount)}`;
    document.getElementById('grandTotal').textContent = `Rp ${formatNumber(grandTotal)}`;
}

async function updateQuantity(productId, change, newValue = null) {
    try {
        const quantity = newValue !== null ? newValue : 
            parseInt(document.querySelector(`.cart-item[data-id="${productId}"] .quantity-input`).value) + change;

        const response = await fetch('/api/cart/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                productId,
                quantity
            })
        });

        if (!response.ok) throw new Error('Failed to update quantity');
        
        loadCart(); // Reload cart after update
    } catch (error) {
        console.error('Error updating quantity:', error);
        showNotification('Gagal mengubah jumlah', 'error');
    }
}

async function removeItem(productId) {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini dari keranjang?')) return;

    try {
        const response = await fetch('/api/cart/remove', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productId })
        });

        if (!response.ok) throw new Error('Failed to remove item');
        
        loadCart(); // Reload cart after removal
        showNotification('Produk berhasil dihapus dari keranjang', 'success');
    } catch (error) {
        console.error('Error removing item:', error);
        showNotification('Gagal menghapus produk', 'error');
    }
}

async function handleCheckout() {
    try {
        const response = await fetch('/api/cart/checkout', {
            method: 'POST'
        });

        if (!response.ok) throw new Error('Checkout failed');
        
        const result = await response.json();
        if (result.success) {
            showNotification('Checkout berhasil!', 'success');
            window.location.href = '/customer/orders.html';
        } else {
            throw new Error(result.message || 'Checkout failed');
        }
    } catch (error) {
        console.error('Error during checkout:', error);
        showNotification('Gagal melakukan checkout', 'error');
    }
}

function formatNumber(number) {
    return new Intl.NumberFormat('id-ID').format(number);
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