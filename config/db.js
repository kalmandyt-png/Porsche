const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Если соединение уже есть (состояние 1 = connected), ничего не делаем
    if (mongoose.connection.readyState === 1) {
      console.log('MongoDB already connected');
      return;
    }

    // Если нет — подключаемся
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('MongoDB Connection Error:', err.message);
    // На Vercel лучше НЕ делать process.exit(1), иначе функция умрет
    // process.exit(1); 
  }
};

module.exports = connectDB;
