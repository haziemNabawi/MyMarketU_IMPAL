// public/js/cart.js

document.addEventListener('DOMContentLoaded', function() {
    loadCart();
});

async function loadCart() {
    try {
        const response = await fetch('/api/cart', {
            credentials: 'include'
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
    
    if (!cartData.items || cartData.items.length === 0) {
        cartContainer.innerHTML = `
            <div class="text-center py-5">
                <h4>Keranjang Belanja Kosong</h4>
                <a href="/customer/dashboard.html" class="btn btn-danger mt-3">Belanja Sekarang</a>
            </div>
        `;
        return;
    }

    cartContainer.innerHTML = cartData.items.map(item => `
        <div class="cart-item bg-white rounded shadow-sm mb-3 p-3">
            <div class="d-flex align-items-center">
                <div class="me-3">
                    <img src="${item.namaFileGambar ? '/images/' + item.namaFileGambar : '../images/default-product.png'}" 
                         alt="${item.nama}"
                         class="rounded"
                         style="width: 100px; height: 100px; object-fit: cover;"
                         onerror="this.src='../images/default-product.png'">
                </div>
                
                <div class="flex-grow-1">
                    <h5 class="mb-1">${item.nama}</h5>
                    <div class="mb-2">
                        ${item.diskon > 0 ? `
                            <span class="text-decoration-line-through text-muted me-2">
                                Rp ${formatNumber(item.harga)}
                            </span>
                        ` : ''}
                        <span class="text-danger fw-bold">
                            Rp ${formatNumber(item.harga * (1 - item.diskon/100))}
                        </span>
                        ${item.diskon > 0 ? `
                            <span class="badge bg-danger ms-2">-${item.diskon}%</span>
                        ` : ''}
                    </div>
                    <div class="d-flex align-items-center">
                        <button type="button" 
                                class="btn btn-outline-secondary"
                                onclick="handleQuantityUpdate(${item.product_id}, ${item.quantity - 1})"
                                ${item.quantity <= 1 ? 'disabled' : ''}>
                            -
                        </button>
                        <span class="mx-3">${item.quantity}</span>
                        <button type="button" 
                                class="btn btn-outline-secondary"
                                onclick="handleQuantityUpdate(${item.product_id}, ${item.quantity + 1})"
                                ${item.quantity >= item.stok ? 'disabled' : ''}>
                            +
                        </button>
                        <button type="button" 
                                class="btn btn-outline-danger ms-3"
                                onclick="handleRemoveItem(${item.product_id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="ms-3 text-end">
                    <div class="text-muted">Subtotal</div>
                    <div class="text-danger fw-bold">
                        Rp ${formatNumber(item.harga * (1 - item.diskon/100) * item.quantity)}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

async function handleQuantityUpdate(productId, newQuantity) {
    try {
        // Basic validation
        if (newQuantity < 1) {
            showNotification('Jumlah minimal 1', 'error');
            return;
        }

        // Get current cart state
        const cartResponse = await fetch('/api/cart', {
            credentials: 'include'
        });
        const cartData = await cartResponse.json();
        const item = cartData.items.find(item => item.product_id === productId);
        
        if (!item) {
            showNotification('Produk tidak ditemukan', 'error');
            return;
        }

        // Check stock
        if (newQuantity > item.stok) {
            showNotification(`Stok tidak mencukupi. Maksimal ${item.stok}`, 'error');
            return;
        }

        // Send update request
        const response = await fetch('/api/cart/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                productId: productId,
                quantity: newQuantity
            })
        });

        const result = await response.json();

        if (result.success) {
            loadCart();
            showNotification('Jumlah berhasil diperbarui', 'success');
        } else {
            throw new Error(result.message || 'Gagal mengubah jumlah');
        }
    } catch (error) {
        console.error('Error updating quantity:', error);
        showNotification(error.message || 'Gagal mengubah jumlah', 'error');
    }
}

async function handleRemoveItem(productId) {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini dari keranjang?')) {
        return;
    }

    try {
        const response = await fetch('/api/cart/remove', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                productId: productId
            })
        });

        const result = await response.json();

        if (result.success) {
            await loadCart(); // Reload cart after successful removal
            showNotification('Produk berhasil dihapus dari keranjang', 'success');
        } else {
            throw new Error(result.message || 'Gagal menghapus produk');
        }
    } catch (error) {
        console.error('Error removing item:', error);
        showNotification(error.message || 'Gagal menghapus produk', 'error');
        await loadCart(); // Reload cart in case of error
    }
}

function updateSummary(cartData) {
    const items = cartData.items || [];
    const totalPrice = items.reduce((sum, item) => sum + (item.harga * item.quantity), 0);
    const totalDiscount = items.reduce((sum, item) => 
        sum + (item.harga * item.quantity * (item.diskon/100)), 0);
    const grandTotal = totalPrice - totalDiscount;

    document.getElementById('totalPrice').textContent = `Rp ${formatNumber(totalPrice)}`;
    document.getElementById('totalDiscount').textContent = `-Rp ${formatNumber(totalDiscount)}`;
    document.getElementById('grandTotal').textContent = `Rp ${formatNumber(grandTotal)}`;
}

async function handleCheckout() {
    try {
        const response = await fetch('/api/cart/checkout', {
            method: 'POST',
            credentials: 'include'
        });

        const result = await response.json();
        
        if (result.success) {
            window.location.href = '/customer/checkout.html';
        } else {
            throw new Error(result.message || 'Checkout gagal');
        }
    } catch (error) {
        console.error('Error during checkout:', error);
        showNotification(error.message || 'Gagal melakukan checkout', 'error');
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
        timeOut: 3000,
        preventDuplicates: true
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