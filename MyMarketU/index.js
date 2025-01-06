const express = require('express');
const path = require('path');
const app = express();

// Pindahkan ke atas
app.use(express.static('public'));
app.use(express.json());

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// API routes
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (email === 'admin@mymarketu.com' && password === 'admin123') {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));