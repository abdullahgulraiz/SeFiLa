const mongoose = require('mongoose');
import {connectToDb, getValidIdMiddlewareFn} from "./utils";

// define model schemas
const reasonSchema = new mongoose.Schema({
  title: {type: mongoose.Schema.Types.String},
  description: {type: mongoose.Schema.Types.String}
});

// fetch or compile mongoose models
const Reason = mongoose.models.Reason || mongoose.model('Reason', reasonSchema);

// connect to db
connectToDb();

// middleware to ensure valid Id parameter is passed in request
const validIdMiddleware = getValidIdMiddlewareFn(Reason);

// request handler function
export default async function handler(req, res) {
  const { method } = req;
  let result;
  switch (method) {
    case "GET":
      // check if an id was passed
      const { query: { id }} = req;
      if (id) {
        // validate id and get related object
        result = await validIdMiddleware(req, res);
        if (!result) return;
      } else {
        // return all objects
        result = await Reason.find({});
      }
      // return response with record
      await res.status(200).json(result);
      break;
    case "POST":
      // create new Reason object
      result = new Reason(req.body);
      result = await result.save();
      // return created record
      await res.status(200).json(result);
      break;
    case "PUT":
      // call middleware
      result = await validIdMiddleware(req, res);
      if (!result) return;
      result = await Reason.findByIdAndUpdate(result.id, req.body, {new: true});
      // return response with record
      await res.status(200).json(result);
      break;
    case "DELETE":
      // call middleware
      result = await validIdMiddleware(req, res);
      if (!result) return;
      await Reason.findOneAndRemove({id: result.id}).exec();
      // return response with record
      await res.status(200).json({"message": "Deleted record successfully."});
      break;
    default:
      await res.status(405).json({"error": "Method not allowed."});
  }
}
