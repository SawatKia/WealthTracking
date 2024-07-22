const express = require('express');
const UserController = require('../Controller/UserControlller');
const logger = require('../logger');

const router = express.Router();
const UserCont = new UserController();

router.get('/', (req, res) => {
    logger.info('request to / endpoint');
    res.send('Hello World, from UserRoutes');
});
// Route to create a new user
router.post('/create', async (req, res) => {
    try {
        logger.info("request to /create endpoint");
        // Call the createUser function from the UserController
        const user = await UserCont.createUser(req.body);

        // Send a response to the client
        res.status(201).json({
            message: 'User created successfully',
            data: {
                id: user._id,
            }
        });
    } catch (error) {
        // Handle any errors that occur during user creation
        res.status(500).json({
            message: 'Failed to create user',
            error: error.message
        });
    }
});

module.exports = router;