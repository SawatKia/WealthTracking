const UserController = require('../UserController');
const User = require('../../models/UserModel');
const Utils = require('../../utilities/Utils');
const {
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    MethodNotAllowedError,
    ConflictError,
    PasswordError,
    UserDuplicateError
} = require('../../utilities/AppErrors');

jest.mock('../../models/UserModel');
jest.mock('../../utilities/Utils');

describe('UserController', () => {
    let userController;
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
        userController = new UserController();
        mockReq = {
            body: {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                confirmPassword: 'password123'
            }
        };
        mockRes = {};
        mockNext = jest.fn();
        Utils.formatResponse.mockImplementation((status, message, data) => ({ status, message, data }));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('registerUser', () => {
        it('should successfully register a user', async () => {
            const mockCreatedUser = { username: 'testuser', email: 'test@example.com' };
            User.prototype.createUser = jest.fn().mockResolvedValue(mockCreatedUser);

            await userController.registerUser(mockReq, mockRes, mockNext);

            expect(User.prototype.createUser).toHaveBeenCalledWith({
                username: 'testuser',
                email: 'test@example.com'
            });
            expect(mockReq.formattedResponse).toEqual({
                status: 201,
                message: 'User created successfully',
                data: mockCreatedUser
            });
            expect(mockNext).toHaveBeenCalled();
        });

        it('should throw BadRequestError if passwords do not match', async () => {
            mockReq.body.confirmPassword = 'differentpassword';

            await userController.registerUser(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
            expect(mockNext.mock.calls[0][0].message).toBe('Password and confirm password do not match');
        });

        it('should throw BadRequestError if email is invalid', async () => {
            mockReq.body.email = 'invalidemail';

            await userController.registerUser(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
            expect(mockNext.mock.calls[0][0].message).toBe('Invalid email address');
        });

        it('should throw BadRequestError if required fields are missing', async () => {
            delete mockReq.body.username;

            await userController.registerUser(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
            expect(mockNext.mock.calls[0][0].message).toContain('Missing required field:');
        });

        it('should pass through other errors', async () => {
            const mockError = new Error('Unexpected error');
            User.prototype.createUser = jest.fn().mockRejectedValue(mockError);

            await userController.registerUser(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(mockError);
        });
    });

    describe('normalizeUsernameEmail', () => {
        it('should normalize username and email to lowercase', () => {
            const result = userController.normalizeUsernameEmail('TestUser', 'Test@Example.com');
            expect(result).toEqual({ username: 'testuser', email: 'test@example.com' });
        });

        it('should handle null values', () => {
            const result = userController.normalizeUsernameEmail(null, null);
            expect(result).toEqual({});
        });
    });

    describe('validateEmail', () => {
        it('should return true for valid email addresses', () => {
            expect(userController.validateEmail('test@example.com')).toBe(true);
            expect(userController.validateEmail('user.name+tag@example.co.uk')).toBe(true);
        });

        it('should return false for invalid email addresses', () => {
            expect(userController.validateEmail('invalidemail')).toBe(false);
            expect(userController.validateEmail('user@example')).toBe(false);
        });
    });
});