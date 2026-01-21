const jwt = require('jsonwebtoken');

// Middleware verify JWT for Express
function verifyJWT(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    console.log("Decode: ", decoded)
    req.user = decoded;

    next();
  });
}

module.exports = verifyJWT;
