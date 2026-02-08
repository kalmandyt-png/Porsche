const mongoose = require('mongoose');

const CarSchema = new mongoose.Schema({
  model: { type: String, required: true },
  year: { type: Number, required: true },
  type: { type: String, enum: ['Coupe', 'Convertible', 'SUV', 'Sedan'], required: true },
  
  // Убрали дубликат status, оставили один правильный вариант
  status: { type: String, enum: ['Available', 'Rented', 'Sold'], default: 'Available' },
  
  pricePerDay: { type: Number, required: true },
  imageUrl: { type: String },
  description: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  
  // Добавили поле renter
  renter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
});

module.exports = mongoose.model('Car', CarSchema);
