const mongoose = require('mongoose');
import _ from "underscore";
import {connectToDb, getValidIdMiddlewareFn} from "./utils";

// define model schemas
const progressSchema = new mongoose.Schema({
  settings: {type: mongoose.Schema.Types.Mixed, default: {}},
  savedCollections: {type: [mongoose.Schema.Types.Mixed], default: []},
  currentCollection: {type: [mongoose.Schema.Types.String], default: []},
  allFindingsData: {type: mongoose.Schema.Types.Mixed, default: {}},
  allFindingsMetadata: {type: [mongoose.Schema.Types.Mixed], default: []},
});
const progressCacheSchema = new mongoose.Schema({
  progressId: {type: mongoose.Schema.Types.ObjectId, required: true, unique: true},
  data: {type: mongoose.Schema.Types.Mixed, default: {}},
});

// fetch or compile mongoose models
const Progress = mongoose.models.Progress || mongoose.model('Progress', progressSchema);
const ProgressCache = mongoose.models.ProgressCache || mongoose.model('ProgressCache', progressCacheSchema);

// connect to db
connectToDb();

const saveToCache = async (progressId, currentPosition, maxPosition, data) => {
  // fetch related record
  let cache = await ProgressCache.findOne({progressId: progressId}).exec();
  // reset cache if position is 0
  if (currentPosition === 0) cache.data = {};
  // add entry to cache
  cache.data[currentPosition] = data;
  cache.markModified('data');
  await cache.save();
  return data;
};

const retrieveFromCache = async (progressId) => {
  // fetch related record
  const cache = await ProgressCache.findOne({progressId: progressId}).exec();
  const maxPosition = Object.keys(cache.data).length - 1;
  // concatenate base64 chunks in order
  let jsonTemp = [];
  for (let i = 0; i <= maxPosition; i++) {
    jsonTemp.push(cache.data[i]);
  }
  // decode to string from base64
  jsonTemp = decodeURIComponent( Buffer.from( jsonTemp.join(""), 'base64').toString('utf-8') );
  // parse to JSON
  const jsonParsed = JSON.parse(jsonTemp);
  // remove entry from cache
  // await ProgressCache.findOneAndRemove({progressId: progressId}).exec();
  return jsonParsed;
};

// middleware to ensure valid Id parameter is passed in request
const validIdMiddleware = getValidIdMiddlewareFn(Progress);

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
      const { query: { chunk, total, data, operation }} = req;
      if (!operation) {
        await res.status(400).json({"error": "Please provide a valid `operation` query parameter."});
        return null;
      }
      if (operation === "store") {
        if (!chunk || !total || (parseInt(chunk) > parseInt(total))) {
          await res.status(400).json({"error": "Please provide valid `chunk` and `total` query parameters."});
          return null;
        }
        const savedData = await saveToCache(result.id, parseInt(chunk), parseInt(total), req.body);
        if (savedData) {
          await res.status(200).json({"message": `Saved chunk ${chunk} of ${total}.`, data: savedData});
        } else {
          await res.status(500).json({"error": `Could not process ${chunk} of ${total}.`});
        }
        return null;
      } else {
        if (!data) {
          await res.status(400).json({"error": "Please provide a valid `data` query parameter."});
          return null;
        }
        // save data selectively
        let progressObj;
        switch (data) {
          case "findings":
            // get progress data from stored chunks in db
            progressObj = await retrieveFromCache(result.id, parseInt(total));
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
            // get progress data from request body
            progressObj = req.body;
            // save fields relevant to the progress
            const {settings, savedCollections, currentCollection} = JSON.parse(progressObj);
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
            // pick only required fields from result
            result = _.pick(result, ['settings', 'savedCollections', 'currentCollection']);
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
