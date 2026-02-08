const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Car = require('../models/Car');
const axios = require('axios'); // For External API
const Joi = require('joi'); // Подключаем Joi
// @route   GET /api/cars/specs/:model
// @desc    Get Real Specs from External API (API Ninjas)
// @access  Public (Optional)
router.get('/specs/:model', async (req, res, next) => {
    try {
        const model = req.params.model;
        // Fetches real car data for your "Wiki" section
        const response = await axios.get(`https://api.api-ninjas.com/v1/cars?make=porsche&model=${model}`, {
            headers: { 'X-Api-Key': process.env.EXTERNAL_API_KEY }
        });
        res.json(response.data);
    } catch (err) {
        console.error("External API Error:", err.message);
        res.status(500).json({ msg: "Failed to fetch external car data" });
    }
});

// Схема для машины
const carSchema = Joi.object({
    model: Joi.string().required(),
    year: Joi.number().integer().min(1900).max(2027).required(),
    type: Joi.string().valid('Coupe', 'Convertible', 'SUV', 'Sedan').required(),
    pricePerDay: Joi.number().positive().required(),
    imageUrl: Joi.string().uri().allow('').optional(), // Разрешаем URL или пусто
    description: Joi.string().optional()
});

router.post('/', auth, async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Admins only' });

        // ВАЛИДАЦИЯ ЗДЕСЬ
        const { error } = carSchema.validate(req.body);
        if (error) return res.status(400).json({ msg: error.details[0].message });

        const { model, year, type, pricePerDay, imageUrl, description } = req.body;
        // ... сохранение ...

        const newCar = new Car({
            model,
            year,
            type,
            pricePerDay,
            imageUrl,
            description,
            owner: req.user.id
        });
        const car = await newCar.save();
        res.json(car);
    } catch (err) {
        next(err);
    }
});

// @route   GET /api/cars
// @desc    Get all cars
// @access  Public
router.get('/', async (req, res, next) => {
    try {
        const cars = await Car.find().sort({ date: -1 });
        res.json(cars);
    } catch (err) {
        next(err);
    }
});

// @route   GET /api/cars/:id
// @desc    Get specific car
// @access  Public
router.get('/:id', async (req, res, next) => {
    try {
        const car = await Car.findById(req.params.id);
        if (!car) return res.status(404).json({ msg: 'Car not found' });
        res.json(car);
    } catch (err) {
        if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Car not found' });
        next(err);
    }
});

// @route   PUT /api/cars/:id
// @desc    Update car details
// @access  Private
router.put('/:id', auth, async (req, res, next) => {
    try {
        let car = await Car.findById(req.params.id);
        if (!car) return res.status(404).json({ msg: 'Car not found' });

        // Check user
        if (car.owner.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        car = await Car.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
        res.json(car);
    } catch (err) {
        next(err);
    }
});

// @route   DELETE /api/cars/:id
// @desc    Delete a car
// @access  Private
router.delete('/:id', auth, async (req, res, next) => {
    try {
        const car = await Car.findById(req.params.id);
        if (!car) return res.status(404).json({ msg: 'Car not found' });

        if (car.owner.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        await car.deleteOne();
        res.json({ msg: 'Car removed' });
    } catch (err) {
        next(err);
    }
});
// @route   PUT /api/cars/rent/:id
// @desc    Rent a car (Change status to Rented)
// @access  Private
router.put('/rent/:id', auth, async (req, res, next) => {
    try {
        const car = await Car.findById(req.params.id);
        
        if (!car) return res.status(404).json({ msg: 'Car not found' });
        
        if (car.status !== 'Available') {
            return res.status(400).json({ msg: 'Sorry, this car is already rented!' });
        }

        car.status = 'Rented';
        car.renter = req.user.id; // <--- ЗАПИСЫВАЕМ, КТО АРЕНДОВАЛ
        await car.save();
        
        res.json(car);
    } catch (err) {
        next(err);
    }
});
router.get('/my/rentals', auth, async (req, res, next) => {
    try {
        // Ищем машины, где renter == текущий юзер
        const cars = await Car.find({ renter: req.user.id });
        res.json(cars);
    } catch (err) {
        next(err);
    }
});

// @route   PUT /api/cars/return/:id
// @desc    Return a rented car
// @access  Private
router.put('/return/:id', auth, async (req, res, next) => {
    try {
        const car = await Car.findById(req.params.id);
        
        if (!car) return res.status(404).json({ msg: 'Car not found' });

        // Проверяем, действительно ли этот юзер арендовал эту машину
        // (Приводим к строке для сравнения ID)
        if (car.renter && car.renter.toString() !== req.user.id) {
             return res.status(401).json({ msg: 'Not authorized to return this car' });
        }

        car.status = 'Available';
        car.renter = null; // Очищаем поле арендатора
        await car.save();
        
        res.json(car);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
