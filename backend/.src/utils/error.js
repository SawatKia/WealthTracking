class AppError extends Error {
    constructor(message, statusCode, data = null) {
        super(message);
        this.statusCode = statusCode;
        this.data = data;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

class BadRequestError extends AppError {
    constructor(message, data = null) {
        super(message, 400, data);
    }
}

class UnauthorizedError extends AppError {
    constructor(message, data = null) {
        super(message, 401, data);
    }
}

class ForbiddenError extends AppError {
    constructor(message, data = null) {
        super(message, 403, data);
    }
}

class NotFoundError extends AppError {
    constructor(message, data = null) {
        super(message, 404, data);
    }
}

class ConflictError extends AppError {
    constructor(message, data = null) {
        super(message, 409, data);
    }
}

module.exports = {
    AppError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError
};
