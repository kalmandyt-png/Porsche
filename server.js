require('dotenv').config(); // MUST be at the top
const express = require('express');
const connectDB = require('./config/db');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');

// Connect Database
connectDB();

const app = express();

// Настройка безопасности (разрешаем картинки и скрипты)
app.use(
  helmet({
    contentSecurityPolicy: false, // Отключаем строгую политику контента, чтобы работали кнопки и внешние картинки
    crossOriginEmbedderPolicy: false,
  })
);

app.use(cors());

// Rate Limiting (Protection)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Init Middleware (Body Parser)
app.use(express.json({ extended: false }));
// Serve static files from 'public' folder
app.use(express.static('public'));

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/cars', require('./routes/cars'));

// Base Route
app.get('/', (req, res) => res.send('Porsche API Running...'));

// Error Handler Middleware (Last)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

// This should be AFTER your API routes
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

