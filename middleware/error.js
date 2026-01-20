// create a global error handler middleware.
const errorHandler = (err, req, res, next) => {
    console.error("Error:", err); // Log the full error for debugging

    // If the error is a string, return it as a message
    if (typeof err === 'string') {
        return res.status(400).json({ message: err });
    }

    // Handle Sequelize Validation Errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({ message: err.message });
    }

    // Handle Unauthorized Errors
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({ message: err.message });
    }

    // Default error response
    return res.status(500).json({ message: err.message || 'Internal Server Error' });
};

module.exports = errorHandler;
