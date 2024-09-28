const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const { MyAppErrors } = require('../utils/error');
const { formatResponse } = require('../utils/formatResponse'); // import formatResponse
const UserModel = require('../models/UserModel'); // import UserModel

dotenv.config();

const router = express.Router();
router.use(cookieParser());

const ACCESS_TOKEN_EXPIRE_MINUTES = parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES);
const REFRESH_TOKEN_EXPIRE_MINUTES = parseInt(process.env.REFRESH_TOKEN_EXPIRE_MINUTES);
const SECRET_KEY = process.env.APP_SECRET_KEY;
const ALGORITHM = process.env.ALGORITHM || 'HS256';
const DOMAIN = process.env.DOMAIN;

function createToken(data, expiresIn) {
  return jwt.sign(data, SECRET_KEY, { algorithm: ALGORITHM, expiresIn });
}

// ใช้ UserModel.findOne แทน pool.query เพื่อหาผู้ใช้
async function getUserByUsername(username) {
  return UserModel.findOne({ username });
}

router.post('/login', async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json(formatResponse(null, new MyAppErrors.BadRequestError('Username and password are required')));
  }

  try {
    const user = await getUserByUsername(username);

    if (!user) {
      return res.status(404).json(formatResponse(null, new MyAppErrors.NotFoundError('User not found')));
    }

    const passwordValid = await bcrypt.compare(password, user.password);

    if (passwordValid) {
      const userData = { id: user.id, username: user.username };
      const accessToken = createToken(userData, `${ACCESS_TOKEN_EXPIRE_MINUTES}m`);
      const refreshToken = createToken(userData, `${REFRESH_TOKEN_EXPIRE_MINUTES}m`);

      res.cookie(`_${DOMAIN}_access_token`, accessToken, { httpOnly: true, secure: true, sameSite: 'Strict' });
      res.cookie(`_${DOMAIN}_refresh_token`, refreshToken, { httpOnly: true, secure: true, sameSite: 'Strict' });
      return res.status(200).json(formatResponse({ user: userData }));
    } else {
      return res.status(401).json(formatResponse(null, new MyAppErrors.PasswordError()));
    }
  } catch (error) {
    console.error('Error during login', error);
    return res.status(500).json(formatResponse(null, new MyAppErrors.BadRequestError('Internal server error')));
  }
});

router.post('/logout', (req, res) => {
  // ลบทั้ง access token และ refresh token โดยใช้ clearCooki
  res.clearCookie(`_${DOMAIN}_access_token`, { httpOnly: true, secure: true, sameSite: 'Strict' });// ป้องกันการเข้าถึงจาก client-side JavaScript โดย ไม่ส่ง cookies กับ cross-site request
  res.clearCookie(`_${DOMAIN}_refresh_token`, { httpOnly: true, secure: true, sameSite: 'Strict' });
  
  return res.status(200).json(formatResponse({ detail: 'Logged out' }));
});

router.post('/refresh', async (req, res, next) => {
  const token = req.cookies[`_${DOMAIN}_refresh_token`];

  if (!token) {
    return res.status(404).json(formatResponse(null, new MyAppErrors.NotFoundError('Refresh token not found')));
  }

  try {
    const payload = jwt.verify(token, SECRET_KEY, { algorithms: [ALGORITHM] });
    const accessToken = createToken({ id: payload.id, username: payload.username }, `${ACCESS_TOKEN_EXPIRE_MINUTES}m`);

    res.cookie(`_${DOMAIN}_access_token`, accessToken, { httpOnly: true, secure: true, sameSite: 'Strict' });
    return res.status(200).json(formatResponse({ detail: 'Token refreshed' }));
  } catch (error) {
    return next(new MyAppErrors.UnauthorizedError('Invalid or expired refresh token'));
  }
});

module.exports = router;
