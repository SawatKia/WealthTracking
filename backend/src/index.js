const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')

require('dotenv').config();

const app = express()
const PORT = process.env.PORT
const MONGO_USERNAME = process.env.MONGO_INITDB_ROOT_USERNAME
const MONGO_PASSWORD = process.env.MONGO_INITDB_ROOT_PASSWORD
const MONGO_URI = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@127.0.0.1:27017/Wealthtrack?authSource=admin`

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send('Hello World!!!!!')
})

app.listen(PORT, async () => {
    try {
        await mongoose.connect(MONGO_URI)
        console.log(`App listening on port ${PORT}`)
    } catch (error) {
        console.log(`Server failed to start: ${error.message}`)
    }
}) 