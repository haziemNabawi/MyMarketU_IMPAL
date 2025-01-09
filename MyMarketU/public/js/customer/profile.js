// public/js/customer/profile.js
document.addEventListener('DOMContentLoaded', async function() {
    toastr.options = {
        closeButton: true,
        progressBar: true,
        positionClass: "toast-top-right",
        timeOut: 3000
    };

    try {
        const authResponse = await fetch('/api/check-auth', {
            credentials: 'include'
        });
        const authData = await authResponse.json();
        
        if (!authData.loggedIn) {
            window.location.href = '/login.html';
            return;
        }

        await loadUserProfile();
        setupEventListeners();
        await updateCartCount(); // Tambahkan ini untuk update cart count
    } catch (error) {
        console.error('Error:', error);
        toastr.error('Error loading data');
    }
});

function setupEventListeners() {
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }

    // Tambahkan event listener untuk logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Tambahkan event listener untuk validasi password
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    if (confirmPassword) {
        confirmPassword.addEventListener('input', () => {
            if (newPassword.value !== confirmPassword.value) {
                confirmPassword.setCustomValidity('Password tidak cocok');
            } else {
                confirmPassword.setCustomValidity('');
            }
        });
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    
    try {
        const formData = {
            username: document.getElementById('username').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            currentPassword: document.getElementById('currentPassword').value,
            newPassword: document.getElementById('newPassword').value,
            confirmPassword: document.getElementById('confirmPassword').value
        };

        // Validasi email
        if (!isValidEmail(formData.email)) {
            toastr.error('Format email tidak valid');
            submitBtn.disabled = false;
            return;
        }

        // Validasi nomor telepon
        if (formData.phone && !isValidPhone(formData.phone)) {
            toastr.error('Format nomor telepon tidak valid');
            submitBtn.disabled = false;
            return;
        }

        if (formData.newPassword) {
            if (!formData.currentPassword) {
                toastr.error('Masukkan password saat ini');
                submitBtn.disabled = false;
                return;
            }
            if (formData.newPassword !== formData.confirmPassword) {
                toastr.error('Password baru tidak cocok');
                submitBtn.disabled = false;
                return;
            }
            // Validasi kekuatan password
            if (!isStrongPassword(formData.newPassword)) {
                toastr.error('Password harus minimal 8 karakter dan mengandung huruf besar, huruf kecil, dan angka');
                submitBtn.disabled = false;
                return;
            }
        }

        const response = await fetch('/api/user/profile/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        
        if (result.success) {
            toastr.success('Profil berhasil diperbarui');
            if (formData.newPassword) {
                toastr.success('Password berhasil diubah');
                // Reset password fields
                document.getElementById('currentPassword').value = '';
                document.getElementById('newPassword').value = '';
                document.getElementById('confirmPassword').value = '';
            }
            
            await loadUserProfile();
        } else {
            toastr.error(result.message || 'Gagal memperbarui profil');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        toastr.error('Gagal memperbarui profil');
    } finally {
        submitBtn.disabled = false;
    }
}

async function handleLogout(e) {
    e.preventDefault();
    try {
        const response = await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            toastr.success('Berhasil logout');
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 1000);
        } else {
            throw new Error('Logout failed');
        }
    } catch (error) {
        console.error('Error during logout:', error);
        toastr.error('Gagal logout');
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^[0-9]{10,13}$/;
    return phoneRegex.test(phone);
}

function isStrongPassword(password) {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return strongPasswordRegex.test(password);
}

async function loadUserProfile() {
    try {
        const response = await fetch('/api/user/profile', {
            credentials: 'include'
        });
        
        const data = await response.json();
        if (data.success) {
            // Update both sidebar instances
            const sidebarUsernameElements = document.querySelectorAll('#sidebarUsername');
            const sidebarEmailElements = document.querySelectorAll('#sidebarEmail');
            
            sidebarUsernameElements.forEach(element => {
                element.textContent = data.username;
            });
            
            sidebarEmailElements.forEach(element => {
                element.textContent = data.email;
            });
            
            // Update form
            document.getElementById('username').value = data.username;
            document.getElementById('email').value = data.email;
            document.getElementById('phone').value = data.phone || '';

            return true;
        }
        return false;
    } catch (error) {
        console.error('Error loading profile:', error);
        toastr.error('Gagal memuat profil');
        return false;
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