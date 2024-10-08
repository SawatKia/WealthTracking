const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.APP_SECRET_KEY;
const ALGORITHM = process.env.ALGORITHM || 'HS256';

function createToken(data, expiresIn) {
  return jwt.sign(data, SECRET_KEY, { algorithm: ALGORITHM, expiresIn });
}

module.exports = { createToken };
