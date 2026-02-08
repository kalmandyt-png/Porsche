const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Car = require('../models/Car');
const axios = require('axios'); // For External API
const Joi = require('joi'); // Подключаем Joi
// @route   GET /api/cars/specs/:model
// @desc    Get Real Specs from External API (API Ninjas)
// @access  Public (Optional)
// Получить машины, которые я арендую
router.get('/rented', auth, async (req, res) => {
  try {
    // Сначала проверим, валидный ли у юзера ID (на всякий случай)
    if (!req.user.id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.json([]); // Если ID кривой, просто вернем пустой список
    }

    const cars = await Car.find({ renter: req.user.id });
    res.json(cars);
  } catch (err) {
    console.error("ОШИБКА В /rented:", err.message);
    res.status(500).send('Server Error');
  }
});


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
        // Если ты НЕ владелец И ПРИ ЭТОМ ты НЕ админ — тогда ошибка.
        // А если ты админ — код пропустит тебя дальше.
        if (car.owner && car.owner.toString() !== req.user.id && req.user.role !== 'admin') {
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

                // Если ты не делаешь запрос в базу внутри этого файла, а веришь токену:
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied. Not an admin.' });
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
// --- АРЕНДА (RENT) ---
router.post('/rent/:id', auth, async (req, res) => {
    try {
        console.log(">>> НАЧАЛО АРЕНДЫ");
        console.log("Кто просит:", req.user.id);

        const car = await Car.findById(req.params.id);
        
        if (!car) {
            console.log("ОШИБКА: Машина не найдена в базе");
            return res.status(404).json({ msg: 'Car not found' });
        }

        console.log("Машина найдена:", car.model);
        console.log("Текущий арендатор (car.renter):", car.renter);

        // Проверка: занята ли?
        if (car.renter) {
            console.log("ОШИБКА: Машина уже занята юзером:", car.renter);
            return res.status(400).json({ msg: 'Car already rented' });
        }

        // Арендуем
        car.renter = req.user.id;
        await car.save();
        
        console.log("УСПЕХ: Машина арендована!");
        res.json(car);

    } catch (err) {
        console.error("КРИТИЧЕСКАЯ ОШИБКА:", err.message);
        res.status(500).send('Server Error');
    }
});


// --- ВОЗВРАТ (RETURN) ---
router.post('/return/:id', auth, async (req, res) => {
    try {
        console.log(">>> НАЧАЛО ВОЗВРАТА");
        console.log("Кто хочет вернуть:", req.user.id);

        const car = await Car.findById(req.params.id);
        console.log("ПОПЫТКА ВОЗВРАТА:");
        console.log("Машина Renter:", car.renter); 
        console.log("Твой ID:", req.user.id);
        if (!car) {
            return res.status(404).json({ msg: 'Car not found' });
        }

        console.log("Текущий арендатор в базе:", car.renter);

        // 1. Проверка: она вообще арендована?
        if (!car.renter) {
            console.log("ОШИБКА: Машина и так свободна");
            return res.status(400).json({ msg: 'Car is not rented' });
        }

        // 2. Проверка: это ты её брал?
        // Сравниваем строки!
        if (car.renter.toString() !== req.user.id) {
            console.log("ОШИБКА: ID не совпали!");
            console.log("В базе:", car.renter.toString());
            console.log("В токене:", req.user.id);
            return res.status(401).json({ msg: 'Not authorized to return this car' });
        }

        // Возвращаем
        car.renter = null;
        await car.save();
        
        console.log("УСПЕХ: Машина возвращена!");
        res.json(car);

    } catch (err) {
        console.error("КРИТИЧЕСКАЯ ОШИБКА:", err.message);
        res.status(500).send('Server Error');
    }
});



module.exports = router;
