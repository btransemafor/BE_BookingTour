module.exports = (req,res,next) => {
    // Get phone in body of request 
    const { emailOrPhone } = req.body ; 

    if (!isVietnamesePhoneNumber(phone)) {
        return res.status(400).json({message: "Invalid Phone!"}); 
    }

    next(); 
    // Dieu kien SDT ở VietNam 
    // Đủ 10 số 

}

function isVietnamesePhoneNumber(number) {
    return /(03|05|07|08|09|01[2|6|8|9])+([0-9]{8})\b/.test(number);
  }

// Test cases
console.log(isVietnamesePhoneNumber("0387654321")); // true (valid)
console.log(isVietnamesePhoneNumber("0123456789")); // false (01x no longer valid)
