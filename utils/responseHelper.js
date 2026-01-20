// utils/responseHelper.js
const handleServiceCallback = (res, { successStatus = 200 } = {}) => {
    return (error, result) => {
      if (error) {
        return res.status(500).json({ message: error.message });
      }
  
      if (result?.success === false) {
        return res.status(404).json(result);
      }
  
      return res.status(successStatus).json(result);
    };
  };
  
  module.exports = {
    handleServiceCallback,
  };
  