class MyAppErrors extends Error {
    constructor(message, statusCode, data = null) {
        super(message);
        this.statusCode = statusCode;
        this.data = data;
        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(message, data = null) {
        return new MyAppErrors(message || 'Bad Request', 400, data);
    }

    static unauthorized(message, data = null) {
        return new MyAppErrors(message || 'Unauthorized', 401, data);
    }

    static forbidden(message, data = null) {
        return new MyAppErrors(message || 'Forbidden', 403, data);
    }

    static notFound(message, data = null) {
        return new MyAppErrors(message || 'Not Found', 404, data);
    }

    static methodNotAllowed(message, data = null) {
        return new MyAppErrors(message || 'Method Not Allowed', 405, data);
    }

    static conflict(message, data = null) {
        return new MyAppErrors(message || 'Conflict', 409, data);
    }

    static passwordError() {
        return new MyAppErrors('Invalid email or password', 401);
    }

    static userDuplicateError() {
        return new MyAppErrors('national_id or email are already taken', 409);
    }
}

module.exports = MyAppErrors;
