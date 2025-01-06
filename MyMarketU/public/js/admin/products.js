// public/js/admin/products.js

document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, loading products...');
    loadProducts();  // Load products immediately
    setupEventListeners();
});

function setupEventListeners() {
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', handleSubmitProduct);
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

async function loadProducts() {
    try {
        console.log('Fetching products...');
        const response = await fetch('/api/admin/products');
        console.log('Response received:', response.status);
        const products = await response.json();
        console.log('Products data:', products);
        
        const tbody = document.querySelector('#productTable tbody');
        if (products.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                        Belum ada produk yang tersedia
                    </td>
                </tr>
            `;
        } else {
            displayProducts(products);
        }
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Gagal memuat produk: ' + error.message, 'error');
    }
}

function displayProducts(products) {
    const tbody = document.querySelector('#productTable tbody');
    if (!tbody) {
        console.error('Tbody element not found');
        return;
    }

    if (products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                    Belum ada produk yang tersedia
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = products.map(product => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${product.id}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <img src="/images/${product.namaFileGambar || 'default.png'}" 
                     alt="${product.nama}"
                     class="h-16 w-16 object-cover rounded shadow-sm"
                     onerror="this.src='/img/default-product.png'">
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${product.nama}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.kategori}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Rp ${formatNumber(product.harga)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    product.stok > 10 ? 'bg-green-100 text-green-800' : 
                    product.stok > 0 ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-red-100 text-red-800'
                }">
                    ${product.stok}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div class="flex space-x-2">
                    <button onclick="editProduct(${product.id})" 
                            class="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                            title="Edit Produk">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteProduct(${product.id})" 
                            class="text-red-600 hover:text-red-900 transition-colors duration-200"
                            title="Hapus Produk">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function handleSubmitProduct(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const productId = formData.get('id');
    
    // Validasi form
    const nama = formData.get('nama');
    const harga = formData.get('harga');
    const stok = formData.get('stok');
    
    if (!nama || !harga || !stok) {
        showNotification('Mohon lengkapi semua field yang wajib diisi', 'error');
        return;
    }

    const url = productId ? 
        `/api/admin/products/${productId}` : 
        '/api/admin/products/add';
        
    const method = productId ? 'PUT' : 'POST';
    
    try {
        const response = await fetch(url, {
            method: method,
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(
                productId ? 'Produk berhasil diperbarui' : 'Produk berhasil ditambahkan', 
                'success'
            );
            hideAddForm();
            loadProducts();
            e.target.reset();
        } else {
            showNotification(result.message || 'Gagal menyimpan produk', 'error');
        }
    } catch (error) {
        console.error('Error submitting product:', error);
        showNotification('Gagal menyimpan produk: ' + error.message, 'error');
    }
}

async function editProduct(productId) {
    try {
        const response = await fetch(`/api/admin/products/${productId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const product = await response.json();
        
        const form = document.getElementById('productForm');
        form.querySelector('[name="nama"]').value = product.nama;
        form.querySelector('[name="kategori"]').value = product.kategori;
        form.querySelector('[name="harga"]').value = product.harga;
        form.querySelector('[name="stok"]').value = product.stok;
        form.querySelector('[name="deskripsi"]').value = product.deskripsi || '';
        form.querySelector('[name="diskon"]').value = product.diskon || 0;
        
        let idInput = form.querySelector('[name="id"]');
        if (!idInput) {
            idInput = document.createElement('input');
            idInput.type = 'hidden';
            idInput.name = 'id';
            form.appendChild(idInput);
        }
        idInput.value = productId;

        document.querySelector('#addProductForm h2').textContent = 'Edit Produk';
        document.querySelector('#addProductForm button[type="submit"]').textContent = 'Update Produk';
        showAddForm();
    } catch (error) {
        console.error('Error getting product details:', error);
        showNotification('Gagal memuat detail produk: ' + error.message, 'error');
    }
}

async function deleteProduct(productId) {
    if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
        try {
            const response = await fetch(`/api/admin/products/${productId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                showNotification('Produk berhasil dihapus', 'success');
                loadProducts();
            } else {
                showNotification(result.message || 'Gagal menghapus produk', 'error');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            showNotification('Gagal menghapus produk: ' + error.message, 'error');
        }
    }
}

async function handleLogout(e) {
    e.preventDefault();
    if (confirm('Apakah Anda yakin ingin keluar?'   )) {
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
            showNotification('Gagal logout: ' + error.message, 'error');
        }
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

function showAddForm() {
    const form = document.getElementById('addProductForm');
    form.classList.remove('hidden');
    
    if (!form.querySelector('[name="id"]')?.value) {
        form.querySelector('h2').textContent = 'Tambah Produk Baru';
        form.querySelector('button[type="submit"]').textContent = 'Simpan Produk';
        document.getElementById('productForm').reset();
    }
}

function hideAddForm() {
    const form = document.getElementById('addProductForm');
    form.classList.add('hidden');
    document.getElementById('productForm').reset();
    
    const idInput = form.querySelector('[name="id"]');
    if (idInput) idInput.remove();
    
    document.querySelector('#addProductForm h2').textContent = 'Tambah Produk Baru';
    document.querySelector('#addProductForm button[type="submit"]').textContent = 'Simpan Produk';
}