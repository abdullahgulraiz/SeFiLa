import {useState, useEffect} from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import Alert from 'react-bootstrap/Alert';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import mongoose from "mongoose";
import _ from "underscore";
import SecurityTools from "../security-tools";
import {ChunkString, DownloadJSONFile} from "../utils";

export default function Label() {
    const [step, setStep] = useState(1);
    const [allFindingsData, setAllFindingsData] = useState({});
    const [allFindingsMetadata, setAllFindingsMetaData] = useState([]);
    const [sessionId, setSessionId] = useState("");
    const [restoredData, setRestoredData] = useState({savedCollections: [], currentCollection: [], settings: {}});
    let stepComponent;
    if (step === 1) {
        stepComponent = <GenerateDS
            setStep={setStep}
            setAllFindings={setAllFindingsData}
            setAllFindingsMetaData={setAllFindingsMetaData}
            sessionId={sessionId}
            setSessionId={setSessionId}
            setRestoredData={setRestoredData}
        />;
    } else if (step === 2) {
        stepComponent = <LabelDS
            allFindingsData={allFindingsData}
            allFindingsMetadata={allFindingsMetadata}
            sessionId={sessionId}
            restoredData={restoredData}
        />;
    }
    return (
        <div className={"mt-5"}>
            {stepComponent}
        </div>
    )
}

const GenerateDS = (props) => {
    // --- State variables ---
    const [processedFindings, setProcessedFindings] = useState({});
    const [findingFilesData, setFindingFilesData] = useState([]);
    const [formFields, setFormFields] = useState({
        'file': undefined,
        'tool': "-1",
        'sessionId': "",
        'generatedDatasetFile': undefined
    });
    const [alert, setAlert] = useState({'variant': 'success', 'message': ""});
    const [settings, setSettings] = useState({
        nextStepButtonEnabled: true,
        progressRetrieveButtonEnabled: true,
        scrapeUrlData: false
    });
    const tools = SecurityTools;

    // --- Functions ---
    const isFormValid = (formName) => {
        switch (formName) {
            case "upload":
                // check if a valid tool and valid file are selected
                return (tools.hasOwnProperty(formFields.tool) && formFields.file !== undefined);
            case "sessionId":
                // check if session ID field is populated
                return formFields.sessionId.length > 0;
            case "generatedDataset":
                // check if a valid file is uploaded
                return formFields.generatedDatasetFile !== undefined;
            default:
                return false;
        }
    };
    const processUploadedFile = (tool, file) => {
        // file will be loaded in the background
        const fileReader = new FileReader();
        // define behavior of what's to be done once the file load
        fileReader.onload = (e) => {
            // start adding findings from after existing findings
            let startIndex = Object.keys(processedFindings).length;
            // get processed findings from the tool's specific processing function
            const {findingsTemp, endIndex} = tools[tool].processingFunction(e.target.result, startIndex);
            // append to all processed findings
            setProcessedFindings({
                ...processedFindings,
                ...findingsTemp
            });
            // keep record of indexes for every report (for deletion and display)
            setFindingFilesData([...findingFilesData, {
                "tool": tool,
                "startIndex": startIndex,
                "endIndex": endIndex - 1
            }]);
        };
        // read file from upload input
        fileReader.readAsText(file);
    };
    const handleUploadForm = (event) => {
        // prevent form from submitting to server
        event.preventDefault();
        // ensure a valid tool and valid file are selected before processing
        if (isFormValid("upload")) {
            processUploadedFile(formFields.tool, formFields.file);
        }
        // reset form
        setFormFields({...formFields, 'tool': "-1"});
    };
    const handleRestoreSessionIdProgress = (event) => {
        // prevent default button behavior
        event.preventDefault();
        // ensure session Id is a valid Object ID
        if (!mongoose.Types.ObjectId.isValid(formFields.sessionId)) {
            setAlert({...alert, variant: 'danger', message: 'Please enter a valid Session ID.'});
            return;
        }
        // disable button
        setSettings({...settings, progressRetrieveButtonEnabled: false});
        // get data from API
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_PATH}api/progress?id=${formFields.sessionId}`)
            .then((res) => {
                if(!res.ok) throw new Error(res.statusText);
                else return res.json();
            })
            .then((data) => {
                // save session Id
                props.setSessionId(formFields.sessionId);
                // populate variables in current component
                setProcessedFindings(data.allFindingsData);
                setFindingFilesData(data.allFindingsMetadata);
                // populate data for next component
                props.setRestoredData({
                    savedCollections: data.savedCollections,
                    currentCollection: data.currentCollection,
                    settings: data.settings
                });
                // inform user
                setAlert({...alert, variant: 'success', message: 'Restoring progress successful.'});
            })
            .catch((error) => {
                // inform user
                setAlert({...alert, variant: 'danger', message: `${error}`});
            })
            .finally(() => {
                // enable button
                setSettings({...settings, progressRetrieveButtonEnabled: true});
            });
    };
    const handleRestoreGeneratedDatasetProgress = (event) => {
        // prevent default button behavior
        event.preventDefault();
        if (!isFormValid("generatedDataset")) {
            setAlert({...alert, variant: 'danger', message: `Please select a valid generated dataset file.`});
            return;
        }
        // file will be loaded in the background
        const fileReader = new FileReader();
        // define behavior of what's to be done once the file load
        fileReader.onload = (e) => {
            try {
                // parse dataset file
                const data = JSON.parse(e.target.result);
                // generate allFindingsData and savedCollections from generated collections
                let allFindingsData = {}, savedCollections = [];
                for (const collectionObj of data.collections) {
                    let savedCollectionTemp = {name: collectionObj.name, collection: []};
                    for (const findingObj of collectionObj.findings) {
                        const findingId = findingObj.id;
                        savedCollectionTemp.collection.push(findingId);
                        allFindingsData[parseInt(findingId)] = findingObj.finding;
                    }
                    savedCollections.push(savedCollectionTemp);
                }
                // populate current component variables
                setFindingFilesData(data.metadata);
                setProcessedFindings(allFindingsData);
                // populate data for next component
                props.setRestoredData({
                    savedCollections: savedCollections,
                    currentCollection: [],
                    settings: {}
                });
                // inform user
                setAlert({...alert, variant: 'success', message: 'Restoring progress successful.'});
            } catch (e) {
                setAlert({...alert, variant: 'danger', message: `Could not parse generated dataset file.`});
            }
        };
        // read file from upload input
        fileReader.readAsText(formFields.generatedDatasetFile);
    };
    const delay = ms => new Promise(res => setTimeout(res, ms));
    const getSessionId = async () => {
        if (!props.sessionId) {
            let result = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_PATH}api/progress`, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    "settings": {},
                    "savedCollections": [],
                    "currentCollection": [],
                    "allFindingsData": {},
                    "allFindingsMetadata": []
                })
            });
            if (result.ok) {
                result = await result.json();
                if (result._id) {
                    props.setSessionId(result._id);
                    return result._id;
                } else {
                    setAlert({...alert, variant: 'danger', message: `Error creating a new session.`});
                }
            } else {
                setAlert({...alert, variant: 'danger', message: `Error making request for creating a new session.`});
            }
        } else {
            return props.sessionId;
        }
    };
    const handleNextStep = async () => {
        // disable button
        setSettings({...settings, nextStepButtonEnabled: false});
        // scrape url data if needed
        if (settings.scrapeUrlData) {
            for (const findingFileData of findingFilesData) {
                const tool = SecurityTools[findingFileData.tool];
                // skip if a scraping function isn't defined for the tool
                if (!tool.hasOwnProperty("scrapingFunction")) continue;
                // modify each processed finding via the scraping function to add a `scraped_description` key
                const startIndex = findingFileData.startIndex, endIndex = findingFileData.endIndex;
                for (let i = startIndex; i <= endIndex; i++) {
                    // inform user of completion status
                    const numTotalFindings = endIndex - startIndex;
                    const numProcessedFindings = i - startIndex;
                    const completePercentage = ((numProcessedFindings / numTotalFindings) * 100) | 0;
                    setAlert({...alert, variant: 'info', message: `Scraping data for ${tool.name}: ${completePercentage}%`});
                    // pass finding to scraping function for the specific tool
                    await tool.scrapingFunction(processedFindings[i]);
                }
            }
        }
        // save processed findings for the next step
        props.setAllFindings(processedFindings);
        // save meta-data for the next step
        props.setAllFindingsMetaData(findingFilesData);
        // create or get existing sessionId
        let sessionId = await getSessionId();
        // form update request body
        const requestBodyJson = {
            "allFindingsData": processedFindings,
            "allFindingsMetadata": findingFilesData
        };
        // convert Json to base64 data
        let requestBody = Buffer.from( encodeURIComponent( JSON.stringify( requestBodyJson ) ) ).toString('base64');
        // chunk data to stay within request-size limit
        requestBody = ChunkString(requestBody, 100000);
        // make requests
        let uri, completeRequests = -1;
        const numChunks = requestBody.length - 1;
        let chunkIdx = 0, requestChunk, result;
        let requestCount = 0;
        // keep attempting upload
        while(true) {
            // stop if all chunks uploaded or request limit reached
            if (chunkIdx > numChunks || ++requestCount > 1) break;
            uri = `${process.env.NEXT_PUBLIC_API_BASE_PATH}api/progress?id=${sessionId}&chunk=${chunkIdx}&total=${numChunks}&data=findings&operation=store`;
            requestChunk = requestBody[chunkIdx];
            result = await fetch(uri, {method: "PUT", body: requestChunk});
            if (result.ok) {
                result = await result.json();
                // validate right chunk was stored and show status
                if (result.data === requestChunk) {
                    const completePercentage = (((++completeRequests)/numChunks) * 100) | 0;
                    setAlert({...alert, variant: 'info', message: `Uploading dataset: ${completePercentage}%`});
                    chunkIdx++;
                    requestCount = 0;
                } else {
                    setAlert({...alert, variant: 'danger', message: `Error posting data for chunk Id ${chunkIdx}.`});
                }
            } else {
                setAlert({...alert, variant: 'danger', message: `Error making request for chunk Idx ${chunkIdx}. Trying again in 10s.`});
                await delay(10000);
            }
        }
        if (chunkIdx > numChunks) {
            // perform sanity check of all uploaded data
            setAlert({...alert, variant: 'info', message: `Performing sanity check...`});
            uri = `${process.env.NEXT_PUBLIC_API_BASE_PATH}api/progress?id=${sessionId}&data=findings&operation=fetch`;
            result = await fetch(uri, {method: "PUT"});
            if (result.ok) {
                result = await result.json();
                result = {
                    "allFindingsData": result.data.allFindingsData,
                    "allFindingsMetadata": result.data.allFindingsMetadata
                };
                // compare stored and sent object
                if (_.isEqual(result, requestBodyJson)) {
                    // proceed to the next step
                    props.setStep(2);
                    return;
                } else {
                    setAlert({...alert, variant: 'danger', message: `Sanity check failed. Please retry.`});
                }
            } else {
                setAlert({...alert, variant: 'danger', message: `Server error while performing sanity check.`});
            }
        }
        // enable button
        setSettings({...settings, nextStepButtonEnabled: true});
    };

    // --- Rendered component ---
    return (
        <>
            {alert.message.length > 0 &&
                <Alert variant={alert.variant}
                       onClose={() => {setAlert({...alert, 'message': ""})}}
                       dismissible={true}>
                    {alert.message}
                </Alert>
            }
            <h1>Generate Dataset</h1>
            <Row className={"mt-3"}>
                <h3>Restore progress</h3>
                <Form onSubmit={(e) => {e.preventDefault()}}>
                    <Row className="mb-3">
                        <Form.Group as={Col} controlId="formSessionId">
                            <Form.Label>Session ID</Form.Label>
                            <Form.Control
                                type="text"
                                onChange={(e) => {setFormFields({...formFields, 'sessionId': e.target.value})}}/>
                            <Button className={"mt-3"} onClick={handleRestoreSessionIdProgress} disabled={!isFormValid("sessionId") || !settings.progressRetrieveButtonEnabled}>Retrieve</Button>
                        </Form.Group>
                        <Form.Group as={Col} controlId="formGeneratedDatasetFile">
                            <Form.Label>Or, generated dataset</Form.Label>
                            <Form.Control
                                type="file"
                                onChange={(e) => {setFormFields({...formFields, generatedDatasetFile: e.target.files[0]})}}/>
                            <Button className={"mt-3"} onClick={handleRestoreGeneratedDatasetProgress} disabled={!isFormValid("generatedDataset")}>Upload</Button>
                        </Form.Group>
                    </Row>

                </Form>
            </Row>
            <Row className={"mt-3"}>
                <h3>Upload</h3>
                <Form onSubmit={handleUploadForm}>
                    <Row className="mb-3">
                        <Form.Group as={Col} controlId="formToolFile">
                            <Form.Label>Report file</Form.Label>
                            <Form.Control
                                type="file"
                                onChange={(e) => {setFormFields({...formFields, 'file': e.target.files[0]})}}/>
                        </Form.Group>
                        <Form.Group as={Col} controlId="formToolType">
                            <Form.Label>Tool</Form.Label>
                            <Form.Select
                                onChange={(e) => {setFormFields({...formFields, 'tool': e.target.value})}}
                                value={formFields.tool}>
                                <option key={"-1"} value="-1">---</option>
                                {Object.entries(tools).map(([tool, toolObj]) => {
                                    return (
                                        <option key={tool} value={tool}>{toolObj.name}</option>
                                    )
                                })}
                            </Form.Select>
                        </Form.Group>
                    </Row>
                    <Button type="submit" disabled={!isFormValid("upload")}>Upload</Button>
                </Form>
            </Row>
            <Row className={"mt-4"}>
                <h3>Reports</h3>
                <Table className={"mt-3"} striped bordered hover>
                    <thead>
                    <tr>
                        <th>#</th>
                        <th>Tool</th>
                        <th># of Findings</th>
                    </tr>
                    </thead>
                    <tbody>
                    {findingFilesData.length > 0 && findingFilesData.map((data, idx) => {
                        return (
                            <tr key={idx}>
                                <td className={"col-md-1"}>{idx + 1}</td>
                                <td className={"col-md-5"}>{tools[data.tool].name}</td>
                                <td className={"col-md-5"}>{data.endIndex - data.startIndex + 1}</td>
                            </tr>
                        )
                    })}
                    {findingFilesData.length === 0 &&
                        <tr>
                            <td colSpan={3} className={"text-center"}>No reports yet.</td>
                        </tr>
                    }
                    </tbody>
                </Table>
            </Row>
            {Object.keys(processedFindings).length > 0 && <>
                <Row className={"mb-4 col-md-12"}>
                    <Form.Check
                        className={"float-end"} type={"switch"} id={"custom-switch"} label="Scrape data from URLs"
                        defaultChecked={false} onChange={() => {setSettings({...settings, scrapeUrlData: !settings.scrapeUrlData})}}
                    />
                </Row>
                <Row className={"mb-5 col-md-4 offset-4"}>
                    <Button variant="success" onClick={handleNextStep} disabled={!settings.nextStepButtonEnabled} >Next step</Button>
                </Row>
            </>}
        </>
    )
}

const LabelDS = (props) => {
    // --- General constants ---
    const allFindingsData = props.allFindingsData;
    const allFindingsMetaData = props.allFindingsMetadata;
    // create a mapping of Finding ID -> Tool name for quicker retrieval for display
    const findingToolMapping = allFindingsMetaData.reduce((result, metadata) => {
        for (let i = metadata.startIndex; i <= metadata.endIndex; i++) {
            result[i] = SecurityTools[metadata.tool].name;
        }
        return result;
    }, {});
    // --- State variables ---
    const [savedCollections, setSavedCollections] = useState(props.restoredData.savedCollections);
    const [currentCollection, setCurrentCollection] = useState(props.restoredData.currentCollection);
    // determine which finding Ids have not been used to compute a pool of available finding Ids to choose from
    const initiallyUsedFindingIds = [...new Set([
        ...savedCollections.reduce((result, savedCollection) => {return [...result, ...savedCollection.collection]}, []),
        ...currentCollection
    ])];
    const [allFindings, setAllFindings] = useState(
        Object.keys(allFindingsData).filter((findingId) => !initiallyUsedFindingIds.includes(findingId))
    );
    const [settings, setSettings] = useState({
        "prettyCode": true,
        "selectedCurrentCollectionIdx": -1,
        "selectedAllFindingsIdx": 0,
        "currentCollectionName": "",
        ...props.restoredData.settings  // overwrite from settings saved previously
    });
    const [saveStatus, setSaveStatus] = useState({
        sessionId: "",
        isSaving: false,
        lastSaved: ""
    });

    // --- Function to run whenever states of specific variables change ---
    useEffect(async () => {
        // save progress to existing session
        saveProgress();
    }, [props.sessionId, savedCollections.length, currentCollection.length]);

    // --- Functions ---
    const saveProgress = async () => {
        const sessionId = props.sessionId;
        // formulate URL if new session or updating an existing session
        const uri = `${process.env.NEXT_PUBLIC_API_BASE_PATH}api/progress?id=${sessionId}&data=progress&operation=fetch`;
        // formulate request body
        const requestBody = {
            "settings": settings,
            "savedCollections": savedCollections,
            "currentCollection": currentCollection
        };
        let result = await fetch(uri, {method: "PUT", body: JSON.stringify(requestBody)});
        if (result.ok) {
            result = await result.json();
            if (_.isEqual(result.data, requestBody)) {
                setSaveStatus({...saveStatus, lastSaved: `${new Date().toLocaleString()}`});
            } else {
                // set error message
                setSaveStatus({...saveStatus, lastSaved: `(error: failed to save data.)`});
            }
        } else {
            // set error message
            setSaveStatus({...saveStatus, lastSaved: `(error: failed to contact server.)`});
        }
    };
    const handleMoveFinding = (isAddOperation) => {
        let idx;
        if (isAddOperation) {
            idx = settings.selectedAllFindingsIdx;
            // don't proceed if no entries in all findings
            if (idx <= -1) return;
            // add findingId to the current collection
            setCurrentCollection([...currentCollection, allFindings[idx]]);
            // remove findingId from all findings
            const remainingFindings = allFindings.filter((findingId, findingIdIdx) => {return findingIdIdx !== idx});
            setAllFindings(remainingFindings);
            // ensure that viewing index is not out of bounds
            if (idx >= remainingFindings.length) idx--;
            // refresh both views
            setSettings({
                ...settings,
                selectedCurrentCollectionIdx: settings.selectedCurrentCollectionIdx <= -1 ? 0 : settings.selectedCurrentCollectionIdx,
                selectedAllFindingsIdx: idx
            });
        } else {
            idx = settings.selectedCurrentCollectionIdx;
            // don't proceed if no entries in current collection
            if (idx <= -1) return;
            // add findingId to all findings
            setAllFindings([...allFindings, currentCollection[idx]]);
            // remove findingId from current collection
            const remainingCurrentCollection = currentCollection.filter((findingId, findingIdIdx) => {return findingIdIdx !== idx});
            setCurrentCollection(remainingCurrentCollection);
            // ensure that viewing index is not out of bounds
            if (idx >= remainingCurrentCollection.length) idx--;
            // refresh both views
            setSettings({
                ...settings,
                selectedAllFindingsIdx: settings.selectedAllFindingsIdx <= -1 ? 0 : settings.selectedAllFindingsIdx,
                selectedCurrentCollectionIdx: idx
            });
        }
    };
    const handleSaveCollection = () => {
        // append collection to list of already saved collections
        setSavedCollections([
            ...savedCollections,
            {"name": settings.currentCollectionName, "collection": currentCollection}
        ]);
        // reset current collections data and view
        setCurrentCollection([]);
        setSettings({
            ...settings,
            currentCollectionName: "",
            selectedCurrentCollectionIdx: -1
        });
    };
    const handleEditCollection = (idx) => {
        // prevent current collection from being lost
        setAllFindings([...allFindings, ...currentCollection]);
        // clear and populate current collection with collection being edited
        setCurrentCollection(savedCollections[idx].collection);
        // refresh both views
        setSettings({
            ...settings,
            selectedAllFindingsIdx: settings.selectedAllFindingsIdx <= -1 ? 0 : settings.selectedAllFindingsIdx,
            selectedCurrentCollectionIdx: settings.selectedCurrentCollectionIdx <= -1 ? 0: settings.selectedCurrentCollectionIdx,
            currentCollectionName: savedCollections[idx].name
        });
        // remove entry from saved collections list
        setSavedCollections(
            savedCollections.filter((item, itemIdx) => {return idx !== itemIdx})
        );
    };
    const handleDeleteCollection = (idx) => {
        // return findingIds in deleted collection back to the pool of all findingIds
        setAllFindings([...allFindings, ...savedCollections[idx].collection]);
        // refresh all findings view
        setSettings({
            ...settings,
            selectedAllFindingsIdx: settings.selectedAllFindingsIdx <= -1 ? 0 : settings.selectedAllFindingsIdx
        });
        // remove entry from saved collections list
        setSavedCollections(
            savedCollections.filter((item, itemIdx) => {return idx !== itemIdx})
        );
    };
    const handleDownloadCollections = () => {
        // format collections data in the required format
        const finalCollections = savedCollections.map((collectionObj, idx) => {
           return {
               id: idx,
               name: collectionObj.name,
               findings: collectionObj.collection.map((findingId) => {
                  return {
                      id: findingId,
                      finding: allFindingsData[findingId]
                  }
               })
           }
        });
        // add meta data and collection data to final report
        const finalDS = {"metadata": allFindingsMetaData, "collections": finalCollections};
        // use helper function to download file
        DownloadJSONFile(finalDS, `sefila-dataset`);
    };
    const getIndexCollection = (isAllFindings) => {
        // function to prevent redundancy when accessing a certain collection and its view index
        let index, collection;
        if (isAllFindings) {
            index = settings.selectedAllFindingsIdx;
            collection = allFindings;
        } else {
            index = settings.selectedCurrentCollectionIdx;
            collection = currentCollection;
        }
        return {index, collection};
    };
    const navigateCollection = (isAllFindings, isNext) => {
        // function to return the next possible view index for given collection based on available keys and desired
        // operation
        let {index, collection} = getIndexCollection(isAllFindings);
        const tempIndex = isNext ? index + 1 : index - 1;
        return (collection[tempIndex] !== undefined) ? tempIndex : index;
    };
    const isNavigationPossible = (isAllFindings, isNext) => {
        // function to enable/disable Next/Previous buttons depending on possibility to navigate through a collection
        let {index, collection} = getIndexCollection(isAllFindings);
        if (index <= -1) return false;
        return isNext ? index < (collection.length - 1) : index > 0;
    };
    const handleNavigateCollections = (isAllFindings, isNext) => {
        // get next view index for the collection based on current index and number of items in collection
        if (isAllFindings) {
            // Navigating All Findings
            setSettings({
                ...settings,
                selectedAllFindingsIdx: navigateCollection(isAllFindings, isNext)
            });
        } else {
            // Navigating Current Collection
            setSettings({
                ...settings,
                selectedCurrentCollectionIdx: navigateCollection(isAllFindings, isNext)
            });
        }
    };
    const handleNextToolJump = (isAllFindings) => {
        let {index, collection} = getIndexCollection(isAllFindings);
        // get metadata of next tool in line
        let metadata,
            findingId = parseInt(collection[index]);  // findingId to check inside metadata
        for (let i = 0; i < allFindingsMetaData.length; i++) {
            metadata = allFindingsMetaData[i];
            if (metadata.startIndex <= findingId && metadata.endIndex >= findingId) {
                // select next possible metadata object
                if (i < allFindingsMetaData.length - 1) {
                    metadata = allFindingsMetaData[i+1];
                } else {
                    metadata = allFindingsMetaData[0];
                }
                break;
            }
        }
        // get next possible index for tool of next metadata for current collection
        for (let i = 0; i < collection.length; i++) {
            findingId = parseInt(collection[i]);
            if (metadata.startIndex <= findingId && metadata.endIndex >= findingId) {
                if (isAllFindings) {
                    // Navigate All Findings
                    setSettings({
                        ...settings,
                        selectedAllFindingsIdx: i
                    });
                } else {
                    // Navigate Current Collection
                    setSettings({
                        ...settings,
                        selectedCurrentCollectionIdx: i
                    });
                }
                break;
            }
        }
    };

    // --- Rendered component ---
    return (
        <>
            <h1>Label Dataset</h1>
            <Row className={"mt-3"}>
                <Col>
                    <span>
                        Session <b>{props.sessionId}</b>, {saveStatus.lastSaved.length > 0 && <>last saved on {saveStatus.lastSaved}</>}
                    </span>
                </Col>
                <Col>
                    <Form.Check
                        className={"float-end"} type={"switch"} id={"custom-switch"} label="Pretty code" defaultChecked={true}
                        onChange={() => {setSettings({...settings, prettyCode: !settings.prettyCode})}}
                    />
                </Col>
            </Row>
            <Row className={"mt-3"}>
                <div className={"col-sm-6"}>
                    <h3>Current collection</h3>
                    <Row>
                        <div className={"col-md-5"}>
                            <p className={"mt-2"}>
                                Total {currentCollection.length} finding(s)
                            </p>
                        </div>
                        <div className={"col-md-7"}>
                            <ButtonGroup aria-label="Navigate current collection" className={"float-end  mb-3"}>
                                <Button onClick={() => {handleNavigateCollections(false, false)}}
                                        variant="secondary"
                                        disabled={!isNavigationPossible(false, false)}
                                >Previous</Button>
                                <Button onClick={() => {handleNextToolJump(false)}}
                                        variant="warning"
                                        disabled={currentCollection.length === 0}
                                >Jump tool</Button>
                                <Button onClick={() => {handleNavigateCollections(false, true)}}
                                        variant="secondary"
                                        disabled={!isNavigationPossible(false, true)}
                                >Next</Button>
                            </ButtonGroup>
                        </div>
                    </Row>
                    <div style={{maxHeight: "500px", overflow: "auto"}}>
                        <Table className={"mt-0"} striped bordered hover>
                        <thead>
                        <tr>
                            <th>
                                Finding
                                {currentCollection.length > 0 &&
                                    <>
                                        {" "}{currentCollection[settings.selectedCurrentCollectionIdx]} ({findingToolMapping[currentCollection[settings.selectedCurrentCollectionIdx]]})
                                    </>
                                }
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        {currentCollection.length > 0 &&
                            <tr>
                                <td style={{"wordWrap": "break-word", "wordBreak": "break-word"}}>
                                    {settings.prettyCode &&
                                        <pre>
                                            <code>
                                                {JSON.stringify(allFindingsData[currentCollection[settings.selectedCurrentCollectionIdx]], null, 2)}
                                            </code>
                                        </pre>
                                    }
                                    {!settings.prettyCode &&
                                        <>
                                            {JSON.stringify(allFindingsData[currentCollection[settings.selectedCurrentCollectionIdx]], null, 2)}
                                        </>
                                    }
                                </td>
                            </tr>
                        }
                        {currentCollection.length === 0 &&
                            <tr>
                                <td colSpan={2} className={"text-center"}>
                                    No findings yet.
                                </td>
                            </tr>
                        }
                        </tbody>
                    </Table>
                    </div>
                    <Row className={"mt-3"}>
                        <Col className={"col-md-8"}>
                            {currentCollection.length > 0 &&
                                <Form onSubmit={(e) => {e.preventDefault()}}>
                                    <Form.Group className="mb-3">
                                        <Form.Control
                                            type="text"
                                            value={settings.currentCollectionName}
                                            placeholder="Enter collection name"
                                            onChange={e => setSettings({...settings, currentCollectionName: e.target.value})}/>
                                        <Form.Text className="text-muted">
                                            Give your collection a name.
                                        </Form.Text>
                                    </Form.Group>
                                    <Button
                                        variant={"primary"}
                                        onClick={handleSaveCollection}
                                        disabled={settings.currentCollectionName.length <= 0}>Save collection</Button>
                                </Form>
                            }
                        </Col>
                        <div className={"col-md-4"}>
                            <Button
                                className={"float-end"}
                                variant={"secondary"}
                                onClick={() => {handleMoveFinding(false)}}
                                disabled={currentCollection.length === 0}>
                                Exclude finding →
                            </Button>
                        </div>
                    </Row>
                </div>
                <div className={"col-sm-6"}>
                    <h3>All findings</h3>
                    <Row>
                        <div className={"col-md-5"}>
                            <p className={"mt-2"}>
                                Total {allFindings.length} finding(s)
                            </p>
                        </div>
                        <div className={"col-md-7"}>
                            <ButtonGroup aria-label="Navigate all findings" className={"float-end mb-3"}>
                                <Button onClick={() => {handleNavigateCollections(true, false)}}
                                        variant="secondary"
                                        disabled={!isNavigationPossible(true, false)}
                                >Previous</Button>
                                <Button onClick={() => {handleNextToolJump(true)}}
                                        variant="warning"
                                        disabled={allFindings.length === 0}
                                >Jump tool</Button>
                                <Button onClick={() => {handleNavigateCollections(true, true)}}
                                        variant="secondary"
                                        disabled={!isNavigationPossible(true, true)}
                                >Next</Button>
                            </ButtonGroup>
                        </div>
                    </Row>
                    <div style={{maxHeight: "500px", overflow: "auto"}}>
                        <Table className={"mt-0"} striped bordered hover>
                        <thead>
                        <tr>
                            <th>
                                Finding
                                {allFindings.length > 0 &&
                                    <>
                                        {" "}{allFindings[settings.selectedAllFindingsIdx]} ({findingToolMapping[allFindings[settings.selectedAllFindingsIdx]]})
                                    </>
                                }
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        {allFindings.length > 0 &&
                            <tr>
                                <td style={{"wordWrap": "break-word", "wordBreak": "break-word"}}>
                                    {settings.prettyCode &&
                                        <pre>
                                            <code>
                                                {JSON.stringify(allFindingsData[allFindings[settings.selectedAllFindingsIdx]], null, 2)}
                                            </code>
                                        </pre>
                                    }
                                    {!settings.prettyCode &&
                                        <>
                                        {JSON.stringify(allFindingsData[allFindings[settings.selectedAllFindingsIdx]], null, 2)}
                                        </>
                                    }
                                </td>
                            </tr>
                        }
                        {allFindings.length === 0 &&
                            <tr>
                                <td colSpan={2} className={"text-center"}>
                                    No more findings.
                                </td>
                            </tr>
                        }
                        </tbody>
                    </Table>
                    </div>
                    <Row className={"mt-3"}>
                        <Col>
                            <Button
                                variant={"secondary"}
                                onClick={() => {handleMoveFinding(true)}}
                                disabled={allFindings.length === 0}>
                                ← Include finding
                            </Button>
                        </Col>
                    </Row>
                </div>
            </Row>
            <Row className={"mt-4"}>
                <h3>All collections</h3>
                <Table className={"mt-3 w-100"} striped bordered hover>
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th># Findings</th>
                        <th></th>
                    </tr>
                    </thead>
                    <tbody>
                    {savedCollections.map((collectionObj, idx) => {
                        return (
                            <tr key={idx}>
                                <td className={"col-md-1"}>{idx}</td>
                                <td className={"col-md-8"}>{collectionObj.name}</td>
                                <td className={"col-md-2"}>{collectionObj.collection.length}</td>
                                <td className={"col-md-1 text-center"}>
                                    <Button variant={"primary"} onClick={() => handleEditCollection(idx)}>✎</Button>{' '}
                                    <Button variant={"danger"} onClick={() => handleDeleteCollection(idx)}>🗑</Button>
                                </td>
                            </tr>
                        )
                    })}
                    {savedCollections.length === 0 &&
                        <tr>
                            <td colSpan={4} className={"text-center"}>
                                No collections yet.
                            </td>
                        </tr>
                    }
                    </tbody>
                </Table>
            </Row>
            {savedCollections.length > 0 && <Row className={"mt-3 mb-3 col-md-4 offset-4"}>
                <Button variant="success" onClick={handleDownloadCollections}>Download dataset</Button>
            </Row>}
        </>
    )
}