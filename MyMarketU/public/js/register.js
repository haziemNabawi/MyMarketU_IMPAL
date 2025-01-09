// Di public/js/register.js
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});

async function handleRegister(e) {
    e.preventDefault();
    console.log('Form submitted'); // Debug log

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        toastr.error('Password dan konfirmasi password tidak cocok');
        return;
    }

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                email,
                password
            })
        });

        console.log('Response received:', response); // Debug log

        const data = await response.json();
        console.log('Response data:', data); // Debug log

        if (data.success) {
            toastr.success('Registrasi berhasil! Mengalihkan ke halaman login...');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            toastr.error(data.message || 'Gagal melakukan registrasi');
        }
    } catch (error) {
        console.error('Registration error:', error);
        toastr.error('Terjadi kesalahan saat registrasi');
    }
}

// Konfigurasi toastr
toastr.options = {
    closeButton: true,
    progressBar: true,
    positionClass: "toast-top-right",
    timeOut: 3000,
    preventDuplicates: true
};