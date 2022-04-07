const mongoose = require('mongoose');

// define model schemas
const progressSchema = new mongoose.Schema({
  settings: {type: mongoose.Schema.Types.Mixed, required: true},
  savedCollections: {type: [mongoose.Schema.Types.Mixed], required: true},
  currentCollection: {type: [mongoose.Schema.Types.String], required: true},
  allFindingsData: {type: mongoose.Schema.Types.Mixed, required: true},
  allFindingsMetadata: {type: [mongoose.Schema.Types.Mixed], required: true},
});
const progressCacheSchema = new mongoose.Schema({
  progressId: {type: mongoose.Schema.Types.ObjectId, required: true, unique: true},
  data: {type: mongoose.Schema.Types.Mixed, default: {}},
});

// fetch or compile mongoose models
const Progress = mongoose.models.Progress || mongoose.model('Progress', progressSchema);
const ProgressCache = mongoose.models.ProgressCache || mongoose.model('ProgressCache', progressCacheSchema);

// connect to db
mongoose.connect(`mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_URL}?retryWrites=true&w=majority`);

const validateIdFormat = (objectId) => {
  return objectId && mongoose.Types.ObjectId.isValid(objectId);
};

const saveToCache = async (progressId, currentPosition, maxPosition, data) => {
  // fetch related record
  let cache = await ProgressCache.findOne({progressId: progressId}).exec();
  // add entry to cache
  cache.data[currentPosition] = data;
  cache.markModified('data');
  cache = await cache.save();
  // return whether complete object was received in cache
  const receivedChunks = Object.keys(cache.data).length;
  console.log("saveToCache(), received: ", receivedChunks, "total: ", maxPosition);
  return receivedChunks < maxPosition;
};

const retrieveFromCache = async (progressId, maxPosition) => {
  // fetch related record
  let cache = await ProgressCache.findOne({progressId: progressId}).exec();
  // concatenate base64 chunks in order
  let jsonTemp = [];
  for (let i = 0; i <= maxPosition; i++) {
    jsonTemp.push(cache.data[i]);
  }
  // decode to string from base64
  jsonTemp = Buffer.from(jsonTemp.join(""), 'base64').toString('ascii');
  // parse to JSON
  const jsonParsed = JSON.parse(jsonTemp);
  // remove entry from cache
  // await ProgressCache.findOneAndRemove({progressId: progressId}).exec();
  return jsonParsed;
};

// middleware tp ensure valid Id parameter is passed in request
const validIdMiddleware = async (req, res) => {
  // get parameters and method
  const { query: { id }} = req;
  // validate request parameters
  if (!validateIdFormat(id)) {
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
      // create empty Progress object
      result = new Progress(req.body);
      result = await result.save();
      // create empty Progress Cache object to prevent future race conditions
      let progressCache = new ProgressCache({progressId: result.id});
      await progressCache.save();
      // return created record
      await res.status(200).json(result);
      break;
    case "PUT":
      // call middleware
      result = await validIdMiddleware(req, res);
      if (!result) return;
      // save incoming data to cache
      const { query: { chunk, total, data }} = req;
      if (!chunk || !total || (parseInt(chunk) > parseInt(total))) {
        await res.status(400).json({"error": "Please provide valid `chunk` and `total` parameters."});
        return null;
      }
      if (await saveToCache(result.id, parseInt(chunk), parseInt(total), req.body)) {
        await res.status(200).json({"message": `Saved chunk ${chunk} of ${total}.`, data: {}});
        return null;
      } else {
        // if we're here, means all data has been received, and we can process it
        const progressObj = await retrieveFromCache(result.id, parseInt(total));
        console.log("Check Backend A", progressObj);
        // save data selectively
        switch (data) {
          case "findings":
            // save fields relevant to findings dataset
            const {allFindingsData, allFindingsMetadata} = progressObj;
            // validate
            if (!allFindingsData || !allFindingsMetadata) {
              await res.status(422).json(
                  {"error": "Please provide valid data for fields `allFindingsData` and `allFindingsMetadata`."}
              );
              return null;
            }
            // assign
            result.allFindingsData = allFindingsData;
            result.allFindingsMetadata = allFindingsMetadata;
            result.markModified('allFindingsData');
            result.markModified('allFindingsMetadata');
            // save
            result = await result.save();
            break;
          case "progress":
            // save fields relevant to the progress
            const {settings, savedCollections, currentCollection} = progressObj;
            // validate
            if (!settings || !savedCollections || !currentCollection) {
              await res.status(422).json(
                  {"error": "Please provide valid data for fields `settings`, `savedCollections` and `currentCollection`."}
              );
              return null;
            }
            result.settings = settings;
            result.savedCollections = savedCollections;
            result.currentCollection = currentCollection;
            result.markModified('settings');
            result.markModified('savedCollections');
            result.markModified('currentCollection');
            result = await result.save();
            break;
          default:
            // save entire object
            result = await Progress.findByIdAndUpdate(result.id, progressObj, {new: true});
            break;
        }
        // return created record
        await res.status(200).json({"message": "Updated record successfully.", data: result});
        break;
      }
    default:
      await res.status(405).json({"error": "Method not allowed."});
  }
}
