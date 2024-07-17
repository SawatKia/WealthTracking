const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World!!!!!');
});

app.get("/api/v1", (req, res) => {
    res.send('you are on the api/v1 route')
})

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`App listening on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

console.log('Starting server...');
startServer();