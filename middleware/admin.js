const User = require('../models/User'); // Проверь путь к модели!

module.exports = async function(req, res, next) {
  try {
    // Мы берем ID из токена и ищем юзера в базе ПРЯМО СЕЙЧАС
    const user = await User.findById(req.user.id);
    
    // Смотрим, что там в базе
    if (user.role !== 'admin') { 
      return res.status(403).json({ msg: 'User not authorized as admin' });
    }
    
    next();
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error in Admin Check');
  }
};
