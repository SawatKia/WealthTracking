const mongoose = require('mongoose')

const MONGO_USERNAME = process.env.MONGO_INITDB_ROOT_USERNAME
const MONGO_PASSWORD = process.env.MONGO_INITDB_ROOT_PASSWORD
const MONGO_URI = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@127.0.0.1:27017/Wealthtrack?authSource=admin`