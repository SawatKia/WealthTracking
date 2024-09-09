const express = require('express');
const swaggerUi = require('swagger-ui-express');
const fs = require("fs")
const YAML = require('yaml')
require('dotenv').config();

const Utils = require('./utilities/Utils');
const mdw = require('./middlewares/Middlewares')
const userController = require('./controllers/UserController');

const logger = Utils.Logger('Routes');
const { formatResponse } = Utils.formatResponse;
const router = express.Router();
const UserController = new userController();
const isDev = process.env.NODE_ENV === 'development';
const file = fs.readFileSync('./swagger.yaml', 'utf8')
const swaggerDocument = YAML.parse(file)
const allowedMethods = {
    '/': ['GET'],
    '/users': ['POST'],
    '/users/:national_id': ['GET', 'PATCH', 'DELETE'],
    '/debts': ['GET', 'POST', 'PATCH', 'DELETE'],
    '/debts/:debtName': ['GET', 'PATCH', 'DELETE']
}

if (isDev) {
    allowedMethods['/users/check'] = ['POST'];
}
router.use('/docs', swaggerUi.serve);
router.get('/docs', swaggerUi.setup(swaggerDocument));

router.use((req, res, next) => {
    logger.info(`entering the routing for ${req.method} ${req.url}`);
    next();
})
router.use(mdw.methodValidator(allowedMethods));
router.get('/', (req, res) => {
    res.send('you are connect to the api/v0.2')
})
router.post('/users', UserController.registerUser);
router.post('/users/check', UserController.checkPassword);
router.use(mdw.responseHandler);
router.use(mdw.errorHandler);

module.exports = router;

