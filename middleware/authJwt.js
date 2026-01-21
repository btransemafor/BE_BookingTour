const jwt = require('jsonwebtoken');

// Giải mã token (decode, không verify)
function decodeToken(token) {
    try {
        return jwt.decode(token);
    } catch (err) {
        return null;
    }
}

module.exports = {
    decodeToken
};
const jwt = require('jsonwebtoken'); 
require('dotenv').config(); 

function generateAccessToken(dataUser) {
    return jwt.sign({  
            id: dataUser.id,
            email: dataUser.email,
            role_id: dataUser.role_id
    }, process.env.JWT_SECRET_KEY , { expiresIn: "4h" }); //  Corrected syntax
}


function authenticateToken(req, res, next) {
    // if (req.originalUrl === '/auth/reset-password') {
    //     return next(); // Bỏ qua middleware cho route này
    //   }

    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1]; //  Optional chaining to avoid crashes

    if (!token) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    jwt.verify(token, process.env.JWT_SECRET_KEY, (error, user) => {
        if (error) {
            if (error.name === "TokenExpiredError") {
                return res.status(401).json({ message: "Token has expired" });
            } else {
                return res.status(403).json({ message: "Invalid token" });
            }
        }
        req.user = user;
        console.log('Return')
        console.log(user); 
        next();
    });
}

function isAdmin(req, res, next) {
    if (req.user?.role_id !== 2) {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    next();
}

module.exports = {
    generateAccessToken,
    authenticateToken,
    isAdmin
};
