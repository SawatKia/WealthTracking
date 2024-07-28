// models/MongoObject.js
const mongoose = require('mongoose');
const { BadRequestError } = require('../utils/error');

class MongoObject {
    static toObjectId(stringId) {
        if (!mongoose.Types.ObjectId.isValid(stringId)) {
            throw new BadRequestError("Invalid 'ObjectId' format");
        }
        return mongoose.Types.ObjectId(stringId);
    }
    static toStringId(objectId) {
        if (!(objectId instanceof mongoose.Types.ObjectId)) {
            throw new BadRequestError("Invalid ObjectId instance");
        }
        return objectId.toString();
    }

    static toObject(result) {
        return result ? result.toObject() : null;
    }

    static toObjects(results) {
        return results.map(result => result.toObject());
    }
}

module.exports = MongoObject;
