const express = require('express');
const { rateLimit } = require('express-rate-limit')
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const isDev = process.env.NODE_ENV === 'development';
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: 'Too many requests from this IP, please try again later.',

    handler: (req, res, next, options) => {
        logger.warn(`Rate limit exceeded for IP ${req.ip}`);
        res.status(options.statusCode).json(formatResponse(options.statusCode, options.message));
    },
})
!isDev && app.use(limiter);
app.use(express.json());
app.disable('x-powered-by');
app.get('/', (req, res) => {
    res.send('Hello World!!!!!');
})

app.listen(PORT, () => console.log(`Server started on port ${PORT}`))