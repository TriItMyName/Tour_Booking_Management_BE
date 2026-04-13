const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const hostname = process.env.HOST_NAME || "localhost";
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/src', express.static(path.join(__dirname, 'src')));
app.use('/src/assets', express.static(path.join(__dirname, 'src', 'assets')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.listen(PORT,hostname, () => {
    console.log(`Server đang chạy tại http://${hostname}:${PORT}`);
});
