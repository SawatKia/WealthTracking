const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const Pool = require('pg-pool'); // PostgreSQL client
const UserModel = require("../Models/UserModel");
const { BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError, PasswordError, UserDuplicateError } = require('../utils/error');



dotenv.config();

const router = express.Router();
router.use(cookieParser());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const ACCESS_TOKEN_EXPIRE_MINUTES = parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES);
const REFRESH_TOKEN_EXPIRE_MINUTES = parseInt(process.env.REFRESH_TOKEN_EXPIRE_MINUTES);
const SECRET_KEY = process.env.APP_SECRET_KEY;

function createToken(data, expiresIn) {
  return jwt.sign(data, SECRET_KEY, { algorithm: ALGORITHM, expiresIn });
}

/*async function getUserByUsername(username) {
  const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  return result.rows[0];
}*/

/*router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ detail:  });
  }

  try {
    const user = await getUserByUsername(username);

    if (user && user.password === password) {
      const userData = { id: user.id, username: user.username };
      const accessToken = createToken(userData, `${ACCESS_TOKEN_EXPIRE_MINUTES}m`);
      const refreshToken = createToken(userData, `${REFRESH_TOKEN_EXPIRE_MINUTES}m`);

      res.cookie(`_${DOMAIN}_access_token`, accessToken, { httpOnly: true, secure: true, sameSite: 'Strict' });
      res.cookie(`_${DOMAIN}_refresh_token`, refreshToken, { httpOnly: true, secure: true, sameSite: 'Strict' });
      return res.status(200).json({ user: userData });
    } else {
      return res.status(401).json({ detail:  });
    }
  } catch (error) {
    console.error(  , error);
    return res.status(500).json({ detail:  });
  }
});

router.post('/logout', (req, res) => {
  // Remove the cookie-clear lines
  res.status(200).json({ detail:  });
});

router.post('/refresh', async (req, res) => {
  const token = req.cookies[`_${DOMAIN}_refresh_token`];

  if (!token) {
    return res.status(401).json({ detail: NotFoundError });
  }

  try {
    const payload = jwt.verify(token, SECRET_KEY, { algorithms: [ALGORITHM] });
    const accessToken = createToken({ id: payload.id, username: payload.username }, `${ACCESS_TOKEN_EXPIRE_MINUTES}m`);
    
    res.cookie(`_${DOMAIN}_access_token`, accessToken, { httpOnly: true, secure: true, sameSite: 'Strict' });
    res.status(200).json({ detail: 'Token refreshed' });
  } catch (error) {
    console.error( , error);
    return res.status(401).json({ detail:  });
  }
});

module.exports = router;*/