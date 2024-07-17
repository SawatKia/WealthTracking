const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')

require('dotenv').config();

const app = express()
const PORT = process.env.PORT
const MONGO_USERNAME = process.env.MONGO_INITDB_ROOT_USERNAME
const MONGO_PASSWORD = process.env.MONGO_INITDB_ROOT_PASSWORD
const DB_NAME = process.env.DB_NAME
const MONGO_HOST = process.env.MONGO_HOST || 'localhost';
const MONGO_URI = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOST}:27017/${DB_NAME}?authSource=admin`

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send('Hello World!!!!!')
})

app.get("/api/v1", (req, res) => {
    res.send('you are on the api/v1 route')
})

console.log('Starting server...');
app.listen(PORT, '0.0.0.0', async () => {
    try {
        await mongoose.connect(MONGO_URI)
        console.log(`App listening on port ${PORT}`)
    } catch (error) {
        if (error.name === 'MongooseServerSelectionError') {
            console.log(`Server is starting at ${PORT} but MongoDB error with the error: ${error.message}`)
        } else {
            console.log(`Server failed to start: ${error.message}`)
        }
    }
}) 