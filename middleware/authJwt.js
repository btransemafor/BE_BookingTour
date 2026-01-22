const { auth } = require('firebase-admin');
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET_KEY;
// Giải mã token (decode, không verify)
function decodeToken(token) {
    try {
        return jwt.decode(token);
    } catch (err) {
        return null;
    }
}


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


// Dong bo BE A 


function authenticateJWT(req, res, next) {
    // Log toàn bộ headers để debug
    console.log('HEADERS:', req.headers);
    const authHeader = req.headers.authorization;
    console.log('AUTH_HEADER:', authHeader);

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        console.log('TOKEN:', token);
        jwt.verify(token, secret, (err, user) => {
            if (err) {
                console.log('JWT VERIFY ERROR:', err);
                return res.sendStatus(403);
            }
            console.log("info", user )
            console.log('User_id', user.sub)
            req.user = user.sub; // user chứa user_id, email, ...
            next();
        });
    } else {
        console.log('NO AUTH HEADER OR WRONG FORMAT');
        res.sendStatus(401);
    }
}

module.exports = {
    generateAccessToken,
    authenticateToken,
    isAdmin, 
    decodeToken, 
    authenticateJWT
};
