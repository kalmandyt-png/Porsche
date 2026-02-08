require('dotenv').config();
const express = require('express');

const connectDB = require('./config/db');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');

connectDB();

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(cors());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100
});
app.use(limiter);

app.use(express.json({ extended: false }));
app.use(express.static('public'));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/cars', require('./routes/cars'));

app.get('/', (req, res) => res.send('Porsche API Running...'));

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

app.get(/(.*)/, (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

