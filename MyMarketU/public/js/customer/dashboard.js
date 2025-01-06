// public/js/dashboard.js

// public/js/dashboard.js
document.addEventListener('DOMContentLoaded', async function() {
    try {
        const response = await fetch('/api/check-auth');
        const data = await response.json();
        
        if (!data.loggedIn) {
            window.location.href = '/login.html';
            return;
        }
        
        loadProducts();
        setupEventListeners();
        updateCartCount();
    } catch (error) {
        console.error('Error checking auth:', error);
        showNotification('Error checking authentication', 'error');
    }
});



function setupEventListeners() {
    const searchBox = document.getElementById('search-box');
    if (searchBox) {
        searchBox.addEventListener('input', function() {
            const query = this.value.trim();
            if (query === "") {
                loadProducts();
            } else {
                searchProducts(query);
            }
        });
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }

    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            subscribeNewsletter(this);
        });
    }
}

async function loadProducts() {
    try {
        console.log('Memuat produk...');
        const response = await fetch('/api/admin/products');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const products = await response.json();
        console.log('Data produk:', products);
        displayProductsByCategory(products);
        initializeSliders();
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Gagal memuat produk', 'error');
    }
}

function displayProductsByCategory(products) {
    const productList = document.getElementById('product-list');
    if (!productList) return;
 
    // Group products by category
    const productsByCategory = {};
    products.forEach(product => {
        if (!productsByCategory[product.kategori]) {
            productsByCategory[product.kategori] = [];
        }
        productsByCategory[product.kategori].push(product);
    });
 
    productList.innerHTML = Object.entries(productsByCategory).map(([category, categoryProducts]) => `
        <div class="category-block">
            <div class="category-header">
                <h2 class="category-title">${category}</h2>
                <a href="#" class="see-all">Lihat Semua</a>
            </div>
            <div class="products-slider">
                <button class="scroll-button left" onclick="scroll('${category}', 'left')" style="display: none;">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <div class="products-row" id="slider-${category}">
                    ${categoryProducts.map(product => `
                        <div class="product-card">
                            ${product.diskon > 0 ? `
                                <div class="discount-badge">-${product.diskon}%</div>
                            ` : ''}
                            <div class="product-image-container">
                                <img src="${product.namaFileGambar ? '/images/' + product.namaFileGambar : '/images/default-product.png'}" 
                                     alt="${product.nama}" 
                                     class="product-image"
                                     onerror="this.src='/images/default-product.png'">
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
                    `).join('')}
                </div>
                <button class="scroll-button right" onclick="scroll('${category}', 'right')">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>
    `).join('');
 
    initializeSliders();
 }

const resizeObserver = new ResizeObserver(entries => {
    entries.forEach(entry => {
        const slider = entry.target;
        const category = slider.id.replace('slider-', '');
        updateScrollButtons(category);
    });
});

function initializeSliders() {
    document.querySelectorAll('.products-row').forEach(slider => {
        const category = slider.id.replace('slider-', '');
        
        // Initial check
        updateScrollButtons(category);
        
        // Add scroll event listener
        slider.addEventListener('scroll', () => {
            updateScrollButtons(category);
        });

        // Force check after images load
        window.addEventListener('load', () => {
            updateScrollButtons(category);

        
        resizeObserver.observe(slider);
        });
    });
}

function updateScrollButtons(category) {
    const slider = document.getElementById(`slider-${category}`);
    const leftButton = slider.parentElement.querySelector('.scroll-button.left');
    const rightButton = slider.parentElement.querySelector('.scroll-button.right');
    
    // Hitung total lebar konten yang bisa di-scroll
    const totalScrollWidth = slider.scrollWidth;
    const visibleWidth = slider.clientWidth;
    const maxScroll = totalScrollWidth - visibleWidth;

    // Tampilkan/sembunyikan tombol berdasarkan posisi scroll
    leftButton.style.display = slider.scrollLeft > 0 ? 'flex' : 'none';
    rightButton.style.display = slider.scrollLeft < maxScroll ? 'flex' : 'none';

    // Debug log
    console.log({
        totalWidth: totalScrollWidth,
        visibleWidth: visibleWidth,
        currentScroll: slider.scrollLeft,
        maxScroll: maxScroll
    });
}

function scroll(category, direction) {
    const slider = document.getElementById(`slider-${category}`);
    const scrollAmount = slider.clientWidth * 0.8;

    slider.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
    });

    // Update buttons after scroll animation
    setTimeout(() => updateScrollButtons(category), 300);
}


// Modifikasi fungsi addToCart
async function addToCart(event, productId) {
    event.preventDefault();
    console.log('Adding to cart:', productId);
    
    try {
        // Ambil quantity dari form
        const quantity = event.target.querySelector('input[name="quantity"]').value;

        const response = await fetch('/api/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                productId: productId,
                quantity: parseInt(quantity)
            }),
            credentials: 'include' // Penting untuk session
        });

        const data = await response.json();
        
        if (data.success) {
            showNotification('Produk ditambahkan ke keranjang', 'success');
            updateCartCount(); // Update jumlah di ikon keranjang
        } else {
            showNotification(data.message || 'Gagal menambahkan ke keranjang', 'error'); 
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Gagal menambahkan ke keranjang', 'error');
    }
}
// Fungsi untuk update cart count
async function updateCartCount() {
    try {
        const response = await fetch('/api/cart/count');
        const data = await response.json();
        
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            cartCount.textContent = data.count > 0 ? data.count : '';
        }
    } catch (error) {
        console.error('Error getting cart count:', error);
    }
}

async function subscribeNewsletter(form) {
    try {
        const email = form.querySelector('input[type="email"]').value;
        
        const response = await fetch('/api/newsletter/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();
        
        if (data.success) {
            showNotification('Berhasil berlangganan newsletter!', 'success');
            form.reset();
        } else {
            showNotification(data.message || 'Gagal berlangganan newsletter', 'error');
        }
    } catch (error) {
        console.error('Error subscribing to newsletter:', error);
        showNotification('Gagal berlangganan newsletter', 'error');
    }
}

async function logout() {
    try {
        const response = await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include'
        });

        if (response.ok) {
            window.location.href = '/login.html';
        } else {
            throw new Error('Logout failed');
        }
    } catch (error) {
        console.error('Error during logout:', error);
        showNotification('Gagal logout', 'error');
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
        preventDuplicates: true,
        newestOnTop: true
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

async function loadProducts() {
    try {
        const response = await fetch('/api/admin/products');
        if (!response.ok) throw new Error('Network response was not ok');
        const products = await response.json();
        
        if (!Array.isArray(products)) {
            throw new Error('Invalid data format');
        }
        
        displayProductsByCategory(products);
    } catch (error) {
        console.error('Error loading products:', error);
        // Tambahkan timeout untuk menghilangkan notifikasi setelah beberapa detik
        showNotification('Gagal memuat produk. Mencoba memuat ulang...', 'error');
        // Coba load ulang setelah 3 detik
        setTimeout(loadProducts, 3000);
    }
}

function getProductImage(namaFileGambar) {
    if (!namaFileGambar) return '/images/default-product.png';
    return namaFileGambar.startsWith('/') ? namaFileGambar : `/${namaFileGambar}`;
}