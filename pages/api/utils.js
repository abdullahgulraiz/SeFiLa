const mongoose = require('mongoose');

export const connectToDb = () => {
    mongoose.connect(`mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_URL}?retryWrites=true&w=majority`);
};

export const validateIdFormat = (objectId) => {
    return objectId && mongoose.Types.ObjectId.isValid(objectId);
};

export const getValidIdMiddlewareFn = (model) => {
    // middleware to ensure valid Id parameter is passed in request
    return async (req, res) => {
        // get parameters and method
        const { query: { id }} = req;
        // validate request parameters
        if (!validateIdFormat(id)) {
            await res.status(400).json({"error": "Please provide a valid `id` parameter."});
            return null;
        }
        // fetch related record
        const modelObj = await model.findById(id).exec();
        // ensure record exists
        if (!modelObj) await res.status(404).json({"error": "Not found."});
        // return record
        return modelObj;
    };
};

