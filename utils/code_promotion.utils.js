const crypto = require('crypto');

function generateRandomCode(length = 8) {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex')  // Convert to hexadecimal format
        .slice(0, length) // Return required number of characters
        .toUpperCase();  
}


module.exports = {
    generateRandomCode, 
}
console.log(generateRandomCode());
