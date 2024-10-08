const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { MyAppErrors } = require('../utils/error');
const { createToken } = require('../utils/token');
const UserModel = require('../models/UserModel');

const ACCESS_TOKEN_EXPIRE_MINUTES = parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES);
const REFRESH_TOKEN_EXPIRE_MINUTES = parseInt(process.env.REFRESH_TOKEN_EXPIRE_MINUTES);
const DOMAIN = process.env.DOMAIN;

async function login(req, res, next) {
  const { username, password } = req.body;

  if (!username || !password) {
    throw new MyAppErrors.BadRequestError('Username and password are required');
  }

  try {
    const user = await UserModel.findOne({ username });

    if (!user) {
      throw new MyAppErrors.NotFoundError('User not found');
    }

    const passwordValid = await bcrypt.compare(password, user.password);

    if (passwordValid) {
      const userData = { id: user.id, username: user.username };
      const accessToken = createToken(userData, `${ACCESS_TOKEN_EXPIRE_MINUTES}m`);
      const refreshToken = createToken(userData, `${REFRESH_TOKEN_EXPIRE_MINUTES}m`);

      res.cookie(`_${DOMAIN}_access_token`, accessToken, { httpOnly: true, secure: true, sameSite: 'Strict' });
      res.cookie(`_${DOMAIN}_refresh_token`, refreshToken, { httpOnly: true, secure: true, sameSite: 'Strict' });

      // format from GB
      req.formattedResponse = formatResponse(200, { user: userData });
    } else {
      throw new MyAppErrors.PasswordError();
    }
  } catch (error) {
    next(error); 
  }
}

module.exports = { login };
