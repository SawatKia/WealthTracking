const UserModel = require('../UserModel');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const Logging = require('../../configs/logger');

jest.mock('bcrypt');
jest.mock('mongoose');
jest.mock('../../configs/logger');

describe('UserModel Tests', () => {
    let userModel;
    let mockUser;

    beforeAll(() => {
        userModel = new UserModel();
        mockUser = {
            username: 'testuser',
            hashedPassword: 'hashedpassword123'
        };
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('_hashPassword', () => {
        test('should hash password correctly', async () => {
            const password = 'password123';
            const hashedPassword = 'hashedpassword123';
            bcrypt.hash.mockResolvedValue(hashedPassword);

            const result = await userModel._hashPassword(password);

            expect(bcrypt.hash).toHaveBeenCalledWith(password, parseInt(process.env.SALT_ROUNDS));
            expect(result).toBe(hashedPassword);
        });

        test('should throw error if bcrypt.hash fails', async () => {
            const password = 'password123';
            bcrypt.hash.mockRejectedValue(new Error('bcrypt error'));

            await expect(userModel._hashPassword(password)).rejects.toThrow('bcrypt error');
            expect(bcrypt.hash).toHaveBeenCalledWith(password, parseInt(process.env.SALT_ROUNDS));
        });
    });

    describe('createUser', () => {
        test('should create user successfully', async () => {
            const data = { username: 'testuser', email: 'test@example.com', password: 'password123' };
            const hashedPassword = 'hashedpassword123';
            bcrypt.hash.mockResolvedValue(hashedPassword);
            userModel.create = jest.fn().mockResolvedValue({ _id: '1', ...data, hashedPassword });

            const result = await userModel.createUser(data);

            expect(bcrypt.hash).toHaveBeenCalledWith('password123', parseInt(process.env.SALT_ROUNDS));
            expect(userModel.create).toHaveBeenCalledWith({ username: 'testuser', email: 'test@example.com', hashedPassword });
            expect(result).toEqual({ _id: '1', username: 'testuser', email: 'test@example.com', hashedPassword });
        });

        test('should throw error if creating user fails', async () => {
            const data = { username: 'testuser', email: 'test@example.com', password: 'password123' };
            bcrypt.hash.mockResolvedValue('hashedpassword123');
            userModel.create = jest.fn().mockRejectedValue(new Error('create error'));

            await expect(userModel.createUser(data)).rejects.toThrow('create error');
        });
    });

    describe('updateById', () => {
        test('should update user successfully without password', async () => {
            const id = '1';
            const data = { username: 'updateduser', email: 'updated@example.com' };
            const updatedUser = { _id: '1', ...data };
            userModel.model.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedUser);

            const result = await userModel.updateById(id, data);

            expect(userModel.model.findByIdAndUpdate).toHaveBeenCalledWith(id, data, { new: true });
            expect(result).toEqual(updatedUser);
        });

        test('should update user successfully with password', async () => {
            const id = '1';
            const data = { username: 'updateduser', email: 'updated@example.com', password: 'newpassword123' };
            const hashedPassword = 'hashednewpassword123';
            const updatedUser = { _id: '1', username: 'updateduser', email: 'updated@example.com', hashedPassword };
            bcrypt.hash.mockResolvedValue(hashedPassword);
            userModel.model.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedUser);

            const result = await userModel.updateById(id, data);

            expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', parseInt(process.env.SALT_ROUNDS));
            expect(userModel.model.findByIdAndUpdate).toHaveBeenCalledWith(id, { username: 'updateduser', email: 'updated@example.com', hashedPassword }, { new: true });
            expect(result).toEqual(updatedUser);
        });

        test('should throw error if updating user fails', async () => {
            const id = '1';
            const data = { username: 'updateduser', email: 'updated@example.com' };
            userModel.model.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error('update error'));

            await expect(userModel.updateById(id, data)).rejects.toThrow('update error');
        });
    });

    describe('checkPassword', () => {
        test('should return true when password matches', async () => {
            userModel.find = jest.fn().mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(true);

            const result = await userModel.checkPassword('testuser', 'password123');

            expect(userModel.find).toHaveBeenCalledWith('username', 'testuser');
            expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword123');
            expect(result).toBe(true);
        });

        test('should return false when password does not match', async () => {
            userModel.find = jest.fn().mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(false);

            const result = await userModel.checkPassword('testuser', 'wrongpassword');

            expect(userModel.find).toHaveBeenCalledWith('username', 'testuser');
            expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedpassword123');
            expect(result).toBe(false);
        });

        test('should return false when user is not found', async () => {
            userModel.find = jest.fn().mockResolvedValue(null);

            const result = await userModel.checkPassword('nonexistentuser', 'password123');

            expect(userModel.find).toHaveBeenCalledWith('username', 'nonexistentuser');
            expect(result).toBe(false);
        });

        test('should throw an error when bcrypt.compare fails', async () => {
            userModel.find = jest.fn().mockResolvedValue(mockUser);
            bcrypt.compare.mockRejectedValue(new Error('bcrypt error'));

            await expect(userModel.checkPassword('testuser', 'password123')).rejects.toThrow('bcrypt error');

            expect(userModel.find).toHaveBeenCalledWith('username', 'testuser');
            expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword123');
        });
    });
});
