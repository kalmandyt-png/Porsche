const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

router.get('/profile', auth, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        next(err);
    }
});

router.put('/profile', auth, async (req, res, next) => {
    try {
        const { username } = req.body;
        const userFields = {};
        if (username) userFields.username = username;

        let user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        user = await User.findByIdAndUpdate(req.user.id, { $set: userFields }, { new: true }).select('-password');
        res.json(user);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
