// public/js/customer/product-detail.js
document.addEventListener('DOMContentLoaded', async function() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');

        if (!productId) {
            window.location.href = '/customer/dashboard.html';
            return;
        }

        await Promise.all([
            loadUserProfile(),
            loadProductDetails(productId),
            updateCartCount()
        ]);

        setupEventListeners();
        setupNavigationLinks();

    } catch (error) {
        console.error('Error:', error);
        showNotification('Error loading product details', 'error');
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
                // Update username dan email di semua lokasi
                document.querySelectorAll('[id="userName"]').forEach(element => {
                    element.textContent = data.username || 'User';
                });
                document.querySelectorAll('[id="userEmail"]').forEach(element => {
                    element.textContent = data.email || '';
                });
            }
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error loading profile:', error);
        showNotification('Gagal memuat profil', 'error');
        return false;
    }
}

async function updateCartCount() {
    try {
        const response = await fetch('/api/cart/count', {
            credentials: 'include'
        });
        const data = await response.json();
        
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            cartCount.textContent = data.count || '';
            cartCount.style.display = data.count ? 'block' : 'none';
        }
    } catch (error) {
        console.error('Error getting cart count:', error);
    }
}

// Perbaiki fungsi loadProductDetails
async function loadProductDetails(productId) {
    try {
        const response = await fetch('/api/admin/products');
        const products = await response.json();
        
        const product = products.find(p => p.id == productId);
        if (!product) {
            throw new Error('Produk tidak ditemukan');
        }

        // Update UI elements
        document.getElementById('productImage').src = product.namaFileGambar ? 
            `/images/${product.namaFileGambar}` : '/images/default-product.png';
        document.getElementById('productName').textContent = product.nama;
        document.getElementById('productPrice').textContent = `Rp ${formatNumber(product.harga)}`;
        document.getElementById('stockInfo').textContent = `Stok: ${product.stok}`;
        document.getElementById('productDescription').textContent = product.deskripsi || 'Tidak ada deskripsi';
        
        // Reset quantity ke 1
        const quantityInput = document.getElementById('quantity');
        quantityInput.value = 1;
        quantityInput.max = product.stok;

        // Setup event listeners setelah elemen dimuat
        setupEventListeners();

    } catch (error) {
        console.error('Error:', error);
        showNotification('Gagal memuat detail produk', 'error');
    }
}

function handleQuantity(action) {
    const quantityInput = document.getElementById('quantity');
    const currentValue = parseInt(quantityInput.value);
    const stockText = document.getElementById('stockInfo').textContent;
    const maxStock = parseInt(stockText.split(': ')[1]); // Ambil angka stok

    if (action === 'increase' && currentValue < maxStock) {
        quantityInput.value = currentValue + 1;
    } else if (action === 'decrease' && currentValue > 1) {
        quantityInput.value = currentValue - 1;
    }
}

// Tambahkan event listeners untuk tombol + dan -
document.querySelector('button[onclick="handleQuantity(\'decrease\')"]').addEventListener('click', () => handleQuantity('decrease'));
document.querySelector('button[onclick="handleQuantity(\'increase\')"]').addEventListener('click', () => handleQuantity('increase'));

function setupEventListeners() {
    // Tombol tambah dan kurang quantity
    const decreaseBtn = document.querySelector('.btn-decrease');
    const increaseBtn = document.querySelector('.btn-increase');
    const quantityInput = document.getElementById('quantity');
    
    if (decreaseBtn && increaseBtn && quantityInput) {
        decreaseBtn.addEventListener('click', () => handleQuantity('decrease'));
        increaseBtn.addEventListener('click', () => handleQuantity('increase'));
    }

    // Tombol tambah ke keranjang
    const addToCartButton = document.querySelector('.btn-add-to-cart');
    if (addToCartButton) {
        addToCartButton.addEventListener('click', handleAddToCart);
    }
}

function updateQuantity(action) {
    const quantityInput = document.getElementById('quantity');
    const currentValue = parseInt(quantityInput.value);
    const stockInfo = document.getElementById('stockInfo').textContent;
    const maxStock = parseInt(stockInfo.replace('Stok: ', ''));

    if (action === 'increase' && currentValue < maxStock) {
        quantityInput.value = currentValue + 1;
    } else if (action === 'decrease' && currentValue > 1) {
        quantityInput.value = currentValue - 1;
    }
}

function updateQuantityButtons() {
    const quantityInput = document.getElementById('quantityInput');
    const incrementBtn = document.getElementById('incrementBtn');
    const decrementBtn = document.getElementById('decrementBtn');

    const value = parseInt(quantityInput.value);
    const max = parseInt(quantityInput.max);

    incrementBtn.disabled = value >= max;
    decrementBtn.disabled = value <= 1;
}

async function addToCart() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        const quantity = parseInt(document.getElementById('quantity').value);

        const response = await fetch('/api/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                productId: parseInt(productId),
                quantity: quantity
            }),
            credentials: 'include'
        });

        const data = await response.json();
        if (data.success) {
            showNotification('Produk berhasil ditambahkan ke keranjang', 'success');
            updateCartCount();
        } else {
            throw new Error(data.message || 'Gagal menambahkan ke keranjang');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification(error.message, 'error');
    }
}

async function handleAddToCart() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        const quantity = document.getElementById('quantityInput').value;

        const response = await fetch('/api/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                productId: parseInt(productId),
                quantity: parseInt(quantity)
            }),
            credentials: 'include'
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Produk berhasil ditambahkan ke keranjang', 'success');
            updateCartCount();
        } else {
            throw new Error(data.message || 'Failed to add to cart');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification(error.message || 'Gagal menambahkan ke keranjang', 'error');
    }
}

function setupNavigationLinks() {
    const navLinks = document.querySelectorAll('.navbar-links a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const category = link.dataset.category;
            
            if (category === 'beranda') {
                window.location.href = '/customer/dashboard.html';
            } else {
                window.location.href = `/customer/dashboard.html?category=${category}`;
            }
        });
    });
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


// Handle tambah ke keranjang
document.querySelector('button[type="submit"]').addEventListener('click', async function(e) {
    e.preventDefault();
    
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        const quantity = document.getElementById('quantity').value;

        const response = await fetch('/api/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                productId: parseInt(productId),
                quantity: parseInt(quantity)
            }),
            credentials: 'include'
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Produk berhasil ditambahkan ke keranjang', 'success');
            updateCartCount();
        } else {
            throw new Error(data.message || 'Gagal menambahkan ke keranjang');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification(error.message, 'error');
    }
});