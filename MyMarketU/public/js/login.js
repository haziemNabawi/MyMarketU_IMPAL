// public/js/login.js
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    console.log('Mengirim data login:', { email, password });

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        console.log('Response login:', data);

        if (data.success) {
            if (data.role === 'admin') {
                window.location.href = '/admin/dashboard.html';
            } else {
                window.location.href = '/customer/dashboard.html';
            }
        } else {
            document.getElementById('errorMessage').style.display = 'block';
            document.getElementById('errorMessage').textContent = data.message;
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('errorMessage').style.display = 'block';
        document.getElementById('errorMessage').textContent = 'Terjadi kesalahan saat login';
    }
});

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (data.success) {
            if (data.role === 'admin') {
                window.location.href = '/admin/dashboard.html';
            } else {
                window.location.href = '/customer/dashboard.html';
            }
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error during login', 'error');
    }
}