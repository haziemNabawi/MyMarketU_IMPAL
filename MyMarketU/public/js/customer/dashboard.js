// public/js/customer/dashboard.js
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Check auth first
        const authResponse = await fetch('/api/check-auth', {
            credentials: 'include'
        });
        const authData = await authResponse.json();
        
        if (!authData.loggedIn) {
            window.location.href = '/login.html';
            return;
        }

        // Load all data in parallel
        await Promise.all([
            loadUserProfile(),
            loadProducts(),
            updateCartCount()
        ]);

        setupEventListeners();
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
                // Update username and email in all locations
                document.querySelectorAll('[id="userName"]').forEach(element => {
                    element.textContent = data.username || 'User';
                });
                document.querySelectorAll('[id="userEmail"]').forEach(element => {
                    element.textContent = data.email || '';
                });
            }
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showNotification('Gagal memuat profil', 'error');
    }
}

function setupEventListeners() {
    // Category navigation
    const navLinks = document.querySelectorAll('.navbar-links a');
    navLinks.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            const category = link.textContent.trim();
            
            // Update active state
            navLinks.forEach(a => a.classList.remove('active'));
            link.classList.add('active');

            if (category === 'Beranda') {
                await loadProducts();
            } else {
                await loadCategoryProducts(category);
            }
        });
    });

    // Search functionality
    const searchBox = document.getElementById('search-box');
    if (searchBox) {
        let debounceTimer;
        searchBox.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const query = e.target.value.trim();
                if (query === "") {
                    loadProducts();
                } else {
                    searchProducts(query);
                }
            }, 300);
        });
    }

    // Logout handler
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Newsletter form
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
        const response = await fetch('/api/admin/products');
        if (!response.ok) throw new Error('Failed to fetch products');
        const products = await response.json();
        
        // Group by category
        const productsByCategory = {};
        products.forEach(product => {
            if (!productsByCategory[product.kategori]) {
                productsByCategory[product.kategori] = [];
            }
            productsByCategory[product.kategori].push(product);
        });

        displayHomeView(productsByCategory);
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Gagal memuat produk', 'error');
    }
}

async function loadCategoryProducts(category) {
    try {
        const response = await fetch('/api/admin/products');
        if (!response.ok) throw new Error('Failed to fetch products');
        const products = await response.json();

        // Filter products for this category
        const categoryProducts = products.filter(product => 
            product.kategori.toLowerCase() === category.toLowerCase()
        );

        displayCategoryView(category, categoryProducts);
    } catch (error) {
        console.error('Error loading category products:', error);
        showNotification('Gagal memuat produk kategori', 'error');
    }
}

function displayHomeView(productsByCategory) {
    const productList = document.getElementById('product-list');
    if (!productList) return;

    productList.innerHTML = Object.entries(productsByCategory).map(([category, products]) => `
        <div class="category-block">
            <div class="category-header">
                <h2 class="category-title">${category}</h2>
            </div>
            <div class="products-slider">
                <button class="scroll-button left" onclick="scroll('${category}', 'left')">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <div class="products-row" id="slider-${category}">
                    ${renderProductCards(products)}
                </div>
                <button class="scroll-button right" onclick="scroll('${category}', 'right')">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>
    `).join('');

    initializeSliders();
}

function displayCategoryView(category, products) {
    const productList = document.getElementById('product-list');
    if (!productList) return;

    // Temukan produk dengan diskon terbesar
    const promoProduct = products.reduce((max, product) => 
        (product.diskon > (max?.diskon || 0)) ? product : max, null);

    const categoryStyles = {
        'Makanan': {
            icon: 'bi-egg-fried',
            gradient: 'linear-gradient(135deg, #dc3545 0%, #fd7e14 100%);',
            description: 'Temukan berbagai makanan lezat dan berkualitas untuk menemani hari-harimu. Dari makanan ringan hingga makanan berat, semua tersedia dengan harga terbaik.'
        },
        'Minuman': {
            icon: 'bi-cup-straw',
            gradient: 'linear-gradient(135deg, #dc3545 0%, #fd7e14 100%);',
            description: 'Nikmati kesegaran berbagai pilihan minuman yang kami sediakan. Dari minuman tradisional hingga modern, semuanya siap melepas dahagamu.'
        },
        'Kebutuhan': {
            icon: 'bi-basket',
            gradient: 'linear-gradient(135deg, #dc3545 0%, #fd7e14 100%);',
            description: 'Penuhi kebutuhan sehari-harimu dengan produk-produk berkualitas. Tersedia berbagai kebutuhan pokok dengan harga yang terjangkau.'
        }
    };

    const style = categoryStyles[category] || categoryStyles['Kebutuhan'];

    productList.innerHTML = `
        <div class="category-view">
            <!-- Category Header with Improved Design -->
            <div class="category-hero mb-5" style="background: ${style.gradient}">
                <div class="container py-5">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <div class="d-flex align-items-center mb-3">
                                <i class="bi ${style.icon} fs-1 me-3"></i>
                                <h1 class="category-title mb-0">${category}</h1>
                            </div>
                            <p class="category-description lead mb-0 text-white opacity-90">
                                ${style.description}
                            </p>
                        </div>
                        <div class="col-md-4">
                            ${promoProduct && promoProduct.diskon >= 90 ? `
                                <div class="promo-card">
                                    <div class="promo-badge">
                                        <span class="display-4">-${promoProduct.diskon}%</span>
                                        <span class="text-uppercase">Super Deal!</span>
                                    </div>
                                    <img src="${promoProduct.namaFileGambar ? '/images/' + promoProduct.namaFileGambar : '/images/default-product.png'}" 
                                         alt="${promoProduct.nama}"
                                         class="promo-image"
                                         onerror="this.src='/images/default-product.png'">
                                    <div class="promo-details">
                                        <h3>${promoProduct.nama}</h3>
                                        <div class="price-info">
                                            <span class="original-price">Rp ${formatNumber(promoProduct.harga)}</span>
                                            <span class="final-price">Rp ${formatNumber(promoProduct.harga * (1 - promoProduct.diskon/100))}</span>
                                        </div>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Filters Section -->
            <div class="container mb-4">
                <div class="filters-section p-4 bg-white rounded-lg shadow-sm">
                    <div class="row align-items-center">
                        <div class="col-md-4">
                            <div class="input-group">
                                <span class="input-group-text bg-white"><i class="bi bi-sort-down"></i></span>
                                <select class="form-select border-start-0" onchange="sortProducts(event)">
                                    <option value="newest">Terbaru</option>
                                    <option value="price-low">Harga: Rendah ke Tinggi</option>
                                    <option value="price-high">Harga: Tinggi ke Rendah</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-8">
                            <div class="d-flex justify-content-end gap-4">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="inStock" onchange="filterProducts()">
                                    <label class="form-check-label" for="inStock">
                                        <i class="bi bi-box-seam me-1"></i> Stok Tersedia
                                    </label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="hasDiscount" onchange="filterProducts()">
                                    <label class="form-check-label" for="hasDiscount">
                                        <i class="bi bi-tag me-1"></i> Promo
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Products Grid -->
            <div class="container">
                <div class="products-grid">
                    ${renderProductCards(products)}
                </div>
            </div>
        </div>
    `;
}

function renderProductCards(products) {
    return products.map(product => `
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

function getCategoryDescription(category) {
    const descriptions = {
        'Makanan': 'Temukan berbagai makanan lezat dan berkualitas',
        'Minuman': 'Pilihan minuman segar untuk menemani harimu',
        'Kebutuhan': 'Berbagai kebutuhan sehari-hari dengan harga terbaik'
    };
    return descriptions[category] || '';
}

// Slider functions
function initializeSliders() {
    document.querySelectorAll('.products-row').forEach(slider => {
        const category = slider.id.replace('slider-', '');
        updateScrollButtons(category);
        
        slider.addEventListener('scroll', () => updateScrollButtons(category));
        slider.querySelectorAll('img').forEach(img => {
            img.addEventListener('load', () => updateScrollButtons(category));
        });
    });
}

function updateScrollButtons(category) {
    const slider = document.getElementById(`slider-${category}`);
    if (!slider) return;

    const leftButton = slider.parentElement.querySelector('.scroll-button.left');
    const rightButton = slider.parentElement.querySelector('.scroll-button.right');
    
    const totalScrollWidth = slider.scrollWidth;
    const visibleWidth = slider.clientWidth;
    const maxScroll = totalScrollWidth - visibleWidth;

    if (leftButton) leftButton.style.display = slider.scrollLeft > 0 ? 'flex' : 'none';
    if (rightButton) rightButton.style.display = slider.scrollLeft < maxScroll ? 'flex' : 'none';
}

function scroll(category, direction) {
    const slider = document.getElementById(`slider-${category}`);
    if (!slider) return;

    const scrollAmount = slider.clientWidth * 0.8;
    slider.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
    });

    setTimeout(() => updateScrollButtons(category), 300);
}

// Product filtering and sorting functions
function sortProducts(event) {
    const sortBy = event.target.value;
    const productsGrid = document.querySelector('.products-grid');
    if (!productsGrid) return;

    const products = Array.from(productsGrid.children);
    products.sort((a, b) => {
        const priceA = getPriceFromCard(a);
        const priceB = getPriceFromCard(b);

        switch(sortBy) {
            case 'price-low':
                return priceA - priceB;
            case 'price-high':
                return priceB - priceA;
            default:
                return 0;
        }
    });

    productsGrid.innerHTML = '';
    products.forEach(product => productsGrid.appendChild(product));
}

function filterProducts() {
    const inStock = document.getElementById('inStock').checked;
    const hasDiscount = document.getElementById('hasDiscount').checked;
    
    document.querySelectorAll('.product-card').forEach(card => {
        const stock = parseInt(card.querySelector('.stock-badge').textContent.match(/\d+/)[0]);
        const hasDiscountBadge = card.querySelector('.discount-badge') !== null;
        
        const showCard = (!inStock || stock > 0) && (!hasDiscount || hasDiscountBadge);
        card.style.display = showCard ? '' : 'none';
    });
}

function getPriceFromCard(card) {
    const finalPriceEl = card.querySelector('.final-price');
    return parseInt(finalPriceEl.textContent.replace(/[^\d]/g, ''));
}

// Cart functions remain the same
async function addToCart(event, productId) {
    event.preventDefault();
    
    try {
        const form = event.target;
        const quantity = form.querySelector('input[name="quantity"]').value;

        const response = await fetch('/api/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                productId,
                quantity: parseInt(quantity)
            }),
            credentials: 'include'
        });

        const data = await response.json();
        
        if (data.success) {
            showNotification('Produk ditambahkan ke keranjang', 'success');
            await updateCartCount();
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

// User functions
async function handleLogout(e) {
    e.preventDefault();
    try {
        const response = await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Berhasil logout', 'success');
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 1000);
        } else {
            showNotification(data.message || 'Gagal logout', 'error');
        }
    } catch (error) {
        console.error('Error during logout:', error);
        showNotification('Gagal logout', 'error');
    }
}

async function subscribeNewsletter(form) {
    try {
        const email = form.querySelector('input[type="email"]').value;
        
        const response = await fetch('/api/newsletter/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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

async function searchProducts(query) {
    try {
        const response = await fetch('/api/admin/products');
        if (!response.ok) throw new Error('Failed to fetch products');
        
        const products = await response.json();
        const filteredProducts = products.filter(product => 
            product.nama.toLowerCase().includes(query.toLowerCase()) ||
            product.kategori.toLowerCase().includes(query.toLowerCase())
        );

        // Check if we're in category view or home view
        const categoryView = document.querySelector('.category-view');
        if (categoryView) {
            // We're in category view - only show products from this category
            const currentCategory = document.querySelector('.category-title').textContent;
            const categoryProducts = filteredProducts.filter(product => 
                product.kategori === currentCategory
            );
            displayCategoryView(currentCategory, categoryProducts);
        } else {
            // We're in home view - group by category
            const productsByCategory = {};
            filteredProducts.forEach(product => {
                if (!productsByCategory[product.kategori]) {
                    productsByCategory[product.kategori] = [];
                }
                productsByCategory[product.kategori].push(product);
            });
            displayHomeView(productsByCategory);
        }
    } catch (error) {
        console.error('Error searching products:', error);
        showNotification('Gagal mencari produk', 'error');
    }
}

// Utility functions
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

const style = document.createElement('style');{
    style.textContent = `
        .category-hero {
            color: white;
            border-radius: 1rem;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
    
        .promo-card {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 1rem;
            padding: 1.5rem;
            text-align: center;
            border: 1px solid rgba(255,255,255,0.2);
        }
    
        .promo-badge {
            background: #FF4B2B;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            display: inline-block;
            margin-bottom: 1rem;
        }
    
        .promo-badge .display-4 {
            font-weight: bold;
            line-height: 1;
            font-size: 2.5rem;
        }
    
        .promo-image {
            width: 150px;
            height: 150px;
            object-fit: cover;
            border-radius: 0.5rem;
            margin: 1rem 0;
        }
    
        .promo-details h3 {
            color: white;
            font-size: 1.25rem;
            margin-bottom: 0.5rem;
        }
    
        .price-info {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.25rem;
        }
    
        .original-price {
            text-decoration: line-through;
            opacity: 0.7;
        }
    
        .final-price {
            font-size: 1.25rem;
            font-weight: bold;
        }
    
        .filters-section {
            border: 1px solid rgba(0,0,0,0.1);
        }
    `;
    document.head.appendChild(style);
    }