const mongoose = require('mongoose');

// define Progress schema
const savedFields = ["settings", "savedCollections", "currentCollection", "allFindings", "allFindingsMetadata"];
const progressSchema = new mongoose.Schema({
  settings: {type: mongoose.Schema.Types.Mixed, required: true},
  savedCollections: {type: [mongoose.Schema.Types.Mixed], required: true},
  currentCollection: {type: [mongoose.Schema.Types.Mixed], required: true},
  allFindings: {type: mongoose.Schema.Types.Mixed, required: true},
  allFindingsMetadata: {type: [mongoose.Schema.Types.Mixed], required: true},
});

// fetch or compile Progress model
const Progress = mongoose.models.Progress || mongoose.model('Progress', progressSchema);

// connect to db
mongoose.connect(`mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_URL}?retryWrites=true&w=majority`);

// validator function to check valid Progress object
const validateProgressObj = async (progressObj) => {
  return savedFields.every(field => { return field in progressObj });
};

// middleware tp ensure valid Id parameter is passed in request
const validIdMiddleware = async (req, res) => {
  // get parameters and method
  const { query: { id }} = req;
  // validate request parameters
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    await res.status(400).json({"error": "Please provide a valid `id` parameter."});
    return null;
  }
  // fetch related record
  const progressObj = await Progress.findById(id).exec();
  // ensure record exists
  if (!progressObj) await res.status(404).json({"error": "Not found."});
  // return record
  return progressObj;
};

// request handler function
export default async function handler(req, res) {
  const { method } = req;
  let result;
  switch (method) {
    case "GET":
      // call middleware
      result = await validIdMiddleware(req, res);
      if (!result) return;
      // return response with record
      await res.status(200).json(result);
      break;
    case "POST":
      // ensure all required properties exist
      if (!await validateProgressObj(req.body)) {
        await res.status(422).json({"error": "Invalid structure of Progress object."});
        return null;
      }
      // add record to db
      result = new Progress(req.body);
      result = await result.save();
      // return created record
      await res.status(200).json(result);
      break;
    case "PUT":
      // call middleware
      result = await validIdMiddleware(req, res);
      if (!result) return;
      // ensure all required properties exist
      if (!await validateProgressObj(req.body)) {
        await res.status(422).json({"error": "Invalid structure of Progress object."});
        return null;
      }
      // update record in db
      result = await Progress.findByIdAndUpdate(result.id, req.body, {new: true});
      // return created record
      await res.status(200).json(result);
      break;
    default:
      await res.status(405).json({"error": "Method not allowed."});
  }
}
