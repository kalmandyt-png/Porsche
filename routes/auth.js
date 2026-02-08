const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi'); 
const User = require('../models/User');

const registerSchema = Joi.object({
    username: Joi.string().min(3).max(30).required().messages({
        'string.min': 'Username must be at least 3 characters',
        'any.required': 'Username is required'
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'Please enter a valid email address'
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Password must be at least 6 characters'
    })
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

router.post('/register', async (req, res, next) => {
    try {
        const { error } = registerSchema.validate(req.body);
        if (error) return res.status(400).json({ msg: error.details[0].message });

        const { username, email, password } = req.body;

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User with this email already exists' });

        user = new User({ username, email, password });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        const payload = { user: { id: user.id, role: user.role } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: user.id, role: user.role, username: user.username } });
        });
    } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
    try {
        const { error } = loginSchema.validate(req.body);
        if (error) return res.status(400).json({ msg: error.details[0].message });

        const { email, password } = req.body;

        let user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

        const payload = { user: { id: user.id, role: user.role } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: user.id, role: user.role, username: user.username } });
        });
    } catch (err) { next(err); }
});

module.exports = router;
