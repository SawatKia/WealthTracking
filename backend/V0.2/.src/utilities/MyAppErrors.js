class MyAppErrors extends Error {
    constructor(message, statusCode, data = null, headers = {}) {
        super(message);
        this.statusCode = statusCode;
        this.data = data;
        this.headers = headers;
        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(message, data = null, headers = {}) {
        return new MyAppErrors(message || 'Bad Request', 400, data, headers);
        // return new MyAppErrors(`Bad Request: ${message}`, 400, data, headers);
    }

    static unauthorized(message, data = null, headers = {}) {
        return new MyAppErrors(message || 'Unauthorized', 401, data, headers);
        // return new MyAppErrors(`Unauthorized: ${message}`, 401, data, headers);
    }

    static forbidden(message, data = null, headers = {}) {
        return new MyAppErrors(message || 'Forbidden', 403, data, headers);
        // return new MyAppErrors(`Forbidden: ${message}`, 403, data, headers);
    }

    static notFound(message, data = null, headers = {}) {
        return new MyAppErrors(message || 'Not Found', 404, data, headers);
        // return new MyAppErrors(`Not Found: ${message}`, 404, data, headers);
    }

    static methodNotAllowed(message, data = null, headers = {}) {
        return new MyAppErrors(message || 'Method Not Allowed', 405, data, headers);
        // return new MyAppErrors(`Method Not Allowed: ${message}`, 405, data, headers);
    }

    static conflict(message, data = null, headers = {}) {
        return new MyAppErrors(message || 'Conflict', 409, data, headers);
        // return new MyAppErrors(`Conflict: ${message}`, 409, data, headers);
    }

    static unProcessableEntity(message, data = null, headers = {}) {
        return new MyAppErrors(message || 'Unprocessable Entity', 422, data, headers);
        // return new MyAppErrors(`Unprocessable Entity: ${message}`, 422, data, headers);
    }

    static tooManyRequests(message, data = null, headers = {}) {
        return new MyAppErrors(message || 'Too Many Requests', 429, data, headers);
    }

    static internalServerError(message, data = null, headers = {}) {
        let preparedMessage = 'Internal Server Error';
        preparedMessage += ', please try again later';
        return new MyAppErrors(preparedMessage, 500, data, headers);
    }

    static serviceUnavailable(message, data = null, headers = {}) {
        return new MyAppErrors(message || 'Service Unavailable', 503, data, headers);
    }

    static userNotFound() {
        return new MyAppErrors('user not found', 404);
    }

    static passwordError() {
        return new MyAppErrors('Invalid email or password', 401);
    }

    static userDuplicateError() {
        return new MyAppErrors('national_id or email are already taken', 409);
    }
}

module.exports = MyAppErrors;
