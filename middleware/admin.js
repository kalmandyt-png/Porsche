const User = require('../models/User'); 

module.exports = async function(req, res, next) {
  try {
    
    const user = await User.findById(req.user.id);
    
    
    if (user.role !== 'admin') { 
      return res.status(403).json({ msg: 'User not authorized as admin' });
    }
    
    next();
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error in Admin Check');
  }
};
