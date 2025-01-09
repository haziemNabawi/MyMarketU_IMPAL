// public/js/customer/category.js
document.addEventListener('DOMContentLoaded', async function() {
    // Get category from URL or data attribute
    const category = document.body.dataset.category;
    if (!category) return;

    try {
        await loadCategoryProducts(category);
        setupEventListeners();
        updateCartCount();
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error loading products', 'error');
    }
});

async function loadCategoryProducts(category) {
    try {
        const response = await fetch('/api/admin/products');
        if (!response.ok) throw new Error('Failed to fetch products');
        
        const products = await response.json();
        const filteredProducts = products.filter(product => 
            product.kategori.toLowerCase() === category.toLowerCase()
        );
        
        displayProducts(filteredProducts);
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Gagal memuat produk', 'error');
    }
}

function displayProducts(products) {
    const productsContainer = document.getElementById('products-container');
    if (!productsContainer) return;

    if (products.length === 0) {
        productsContainer.innerHTML = `
            <div class="text-center py-5">
                <h4>Tidak ada produk dalam kategori ini</h4>
            </div>
        `;
        return;
    }

    productsContainer.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="product-image-container">
                <img src="${product.namaFileGambar ? '/images/' + product.namaFileGambar : '/images/default-product.png'}" 
                     alt="${product.nama}" 
                     class="product-image"
                     onerror="this.src='/images/default-product.png'">
                ${product.diskon > 0 ? `
                    <div class="discount-badge">-${product.diskon}%</div>
                ` : ''}
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.nama}</h3>
                <div class="price-section">
                    ${product.diskon > 0 ? `
                        <div class="original-price">Rp ${formatNumber(product.harga)}</div>
                        <div class="final-price">Rp ${formatNumber(product.harga * (1 - product.diskon/100))}</div>
                    ` : `
                        <div class="final-price">Rp ${formatNumber(product.harga)}</div>
                    `}
                </div>
                <div class="stock-badge ${product.stok <= 5 ? 'low-stock' : ''}">
                    Stok: ${product.stok}
                </div>
                
                <form class="add-to-cart-form" onsubmit="addToCart(event, ${product.id})">
                    <div class="quantity-control">
                        <input type="number" 
                               name="quantity" 
                               class="quantity-input" 
                               value="1"
                               min="1" 
                               max="${product.stok}"
                               ${product.stok === 0 ? 'disabled' : ''}
                               required>
                    </div>
                    <button type="submit" 
                            class="add-cart-btn ${product.stok === 0 ? 'disabled' : ''}"
                            ${product.stok === 0 ? 'disabled' : ''}>
                        ${product.stok === 0 ? 'Stok Habis' : 'Tambah ke Keranjang'}
                    </button>
                </form>
            </div>
        </div>
    `).join('');
}

async function addToCart(event, productId) {
    event.preventDefault();
    
    try {
        const quantity = event.target.querySelector('input[name="quantity"]').value;
        
        const response = await fetch('/api/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                productId: productId,
                quantity: parseInt(quantity)
            }),
            credentials: 'include'
        });

        const data = await response.json();
        
        if (data.success) {
            showNotification('Produk ditambahkan ke keranjang', 'success');
            updateCartCount();
        } else {
            showNotification(data.message || 'Gagal menambahkan ke keranjang', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Gagal menambahkan ke keranjang', 'error');
    }
}

async function updateCartCount() {
    try {
        const response = await fetch('/api/cart/count');
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
        case 'warning':
            toastr.warning(message);
            break;
        default:
            toastr.info(message);
    }
}