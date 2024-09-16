const express = require('express');
const swaggerUi = require('swagger-ui-express');
const fs = require("fs")
const YAML = require('yaml')
require('dotenv').config();

const Utils = require('./utilities/Utils');
const mdw = require('./middlewares/Middlewares')
const userController = require('./controllers/UserController');

const NODE_ENV = process.env.NODE_ENV;
const logger = Utils.Logger('Routes');
const { formatResponse } = Utils;
const router = express.Router();
const UserController = new userController();
const isDev = NODE_ENV === 'development' || NODE_ENV === 'test';

if (NODE_ENV != 'test') {
    const file = fs.readFileSync('./swagger.yaml', 'utf8');
    const swaggerDocument = YAML.parse(file)
    router.use('/docs', swaggerUi.serve);
    router.get('/docs', swaggerUi.setup(swaggerDocument));
}
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

router.use((req, res, next) => {
    logger.info(`entering the routing for ${req.method} ${req.url}`);
    next();
})
router.use(mdw.methodValidator(allowedMethods));
router.get('/', (req, res, next) => {
    req.formattedResponse = formatResponse(200, 'you are connected to the /api/v0.2', null);
    next();
})
router.post('/users', UserController.registerUser);
router.post('/users/check', UserController.checkPassword);
router.use(mdw.responseHandler);
router.use(mdw.errorHandler);

module.exports = router;

