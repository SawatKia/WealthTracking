const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const Pool = require('pg-pool'); // PostgreSQL client
const dotenv = require('dotenv');
const { BadRequestError, NotFoundError ,PasswordError, UnauthorizedError} = require('../utils/error');

dotenv.config();

const router = express.Router();
router.use(cookieParser());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const ACCESS_TOKEN_EXPIRE_MINUTES = parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES);
const REFRESH_TOKEN_EXPIRE_MINUTES = parseInt(process.env.REFRESH_TOKEN_EXPIRE_MINUTES);
const SECRET_KEY = process.env.APP_SECRET_KEY;
const ALGORITHM = process.env.ALGORITHM || 'HS256';
const DOMAIN = process.env.DOMAIN;

function createToken(data, expiresIn) {
  return jwt.sign(data, SECRET_KEY, { algorithm: ALGORITHM, expiresIn });
}

async function getUserByUsername(username) { // หาตัวแปรที่ต้องใช้เหมือนกันไม่เจอ มันคือการหาผู้ใช้ในฐานข้อมูล
  const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  return result.rows[0];
}

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ detail: 'Username and password are required' }); // เช็คว่ามีการส่ง username และ password มาหรือไม่ ถ้าไม่มีจะคืนค่า HTTP 400
  }

  try {
    const user = await getUserByUsername(username);

    if (!user) {
      return res.status(404).json((new NotFoundError('User not found')));
    }

    const passwordValid = await bcrypt.compare(password, user.password); // ตรวจสอบ

    if (passwordValid) {
      const userData = { id: user.id, username: user.username };
      const accessToken = createToken(userData, `${ACCESS_TOKEN_EXPIRE_MINUTES}m`);
      const refreshToken = createToken(userData, `${REFRESH_TOKEN_EXPIRE_MINUTES}m`);

      res.cookie(`_${DOMAIN}_access_token`, accessToken, { httpOnly: true, secure: true, sameSite: 'Strict' });
      res.cookie(`_${DOMAIN}_refresh_token`, refreshToken, { httpOnly: true, secure: true, sameSite: 'Strict' });
      return res.status(200).json({ user: userData });
    } else {
      return res.status(401).json(new PasswordError());
    }
  } catch (error) {
    console.error('Error during login', error);
    return res.status(500).json(new BadRequestError('Internal server error'));
  }
});

router.post('/logout', (req, res) => { // clear cookies accesstoken and refrashtoken
  res.clearCookie(`_${DOMAIN}_access_token`);
  res.clearCookie(`_${DOMAIN}_refresh_token`);
  res.status(200).json({ detail: 'Logged out' });
});

router.post('/refresh', async (req, res) => {
  const token = req.cookies[`_${DOMAIN}_refresh_token`];

  if (!token) {
    return res.status(404).json(new NotFoundError('Refresh token not found'));
  }

  try {
    const payload = jwt.verify(token, SECRET_KEY, { algorithms: [ALGORITHM] });
    const accessToken = createToken({ id: payload.id, username: payload.username }, `${ACCESS_TOKEN_EXPIRE_MINUTES}m`);

    res.cookie(`_${DOMAIN}_access_token`, accessToken, { httpOnly: true, secure: true, sameSite: 'Strict' });
    return res.status(200).json({ detail: 'Token refreshed' });
  } catch (error) {
    // ใช้ UnauthorizedError ตรวจสอบโทเค็นไม่สำเร็จ
    return next(new UnauthorizedError('Invalid or expired refresh token'));
  }
});
    
module.exports = router;
 //เขียนอิงตามที่ทำค้างไว้ในคอมพิวเตอร์ที่จําได้ยังไม่สมบูรณ์ แต่คร่าวๆเหลือระบบAccount Lockout(จําเป็นต้องมี้มั้ยหากuserทำการลอคอินผิดหลายๆครั้งบัญชีจะถูกล็อคหรือมันคือที่อยู่ในmiddlewareที่พี่เกียร์เขียนไว้),speakeasy(2FAใช้แพกเกจนี้เพื่อสร้างและยืนยันotpผ่านSms or email etc.,Logout ทุกอุปกรณ์??ที่ไปศึกษาเพิ่มเติมมาเหมือนแอพพลิเคชั่นหลักๆจะมีพวกนี้อยู่ในขั้นตอนของsecurityแอพ)