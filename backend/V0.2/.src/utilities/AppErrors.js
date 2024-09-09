class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}

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

class MethodNotAllowedError extends AppError {
    constructor(message, data = null) {
        super(message, 405, data);
    }
}

class ConflictError extends AppError {
    constructor(message, data = null) {
        super(message, 409, data);
    }
}

class PasswordError extends AppError {
    constructor() {
        super('Invalid email or password', 401);
    }
}

class UserDuplicateError extends AppError {
    constructor() {
        super('national_id already exists', 409);
    }
}

module.exports = {
    ValidationError,
    AppError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    MethodNotAllowedError,
    ConflictError,
    PasswordError,
    UserDuplicateError,
};
