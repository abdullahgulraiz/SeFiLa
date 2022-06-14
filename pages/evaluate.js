import {useState, useEffect} from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import Alert from 'react-bootstrap/Alert';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Modal from 'react-bootstrap/Modal';
import _ from "lodash";
import {DownloadJSONFile} from "../utils";
import SecurityTools from "../security-tools";

export default function Evaluate() {
    const [step, setStep] = useState(1);
    const [alert, setAlert] = useState({'variant': 'success', 'message': ""});
    const [datasetFileData, setDatasetFileData] = useState({});
    const [resultsFileData, setResultsFileData] = useState({});
    let stepComponent;
    if (step === 1) {
        stepComponent = <UploadResults
            setStep={setStep}
            setAlert={setAlert}
            setDatasetFileData={setDatasetFileData}
            setResultsFileData={setResultsFileData}
        />;
    } else if (step === 2) {
        stepComponent = <ReasonResults
            datasetFileData={datasetFileData}
            resultsFileData={resultsFileData}
            setAlert={setAlert}
        />;
    }
    return (
        <div className={"mt-5"}>
            {alert.message.length > 0 &&
                <Alert variant={alert.variant}
                       onClose={() => {setAlert({...alert, 'message': ""})}}
                       dismissible={true}>
                    {alert.message}
                </Alert>
            }
            <h1>Evaluate</h1>
            {stepComponent}
        </div>
    )
}

const UploadResults = (props) => {
    // --- State variables ---
    const [formFields, setFormFields] = useState({
        'resultsFile': undefined,
        'datasetFile': undefined
    });
    const [isFileLoaded, setIsFileLoaded] = useState({
        'resultsFile': false,
        'datasetFile': false
    });

    // --- Functions ---
    const isFormValid = () => {
        return formFields.resultsFile !== undefined && formFields.datasetFile !== undefined;
    };
    const handleUploadForm = (event) => {
        // prevent form from submitting to server
        event.preventDefault();
        // ensure a valid tool and valid file are selected before processing
        if (isFormValid()) {
            // file will be loaded in the background
            const datasetFileReader = new FileReader();
            const resultsFileReader = new FileReader();
            // define behavior of what's to be done once the files load
            datasetFileReader.onload = (e) => {
                // parse file data
                const fileData = JSON.parse(e.target.result);
                // ensure that dataset file is a valid file
                for (const field of ["metadata", "collections"]) {
                    // is valid
                    if (fileData.hasOwnProperty(field) && fileData[field].length > 0) continue;
                    // is invalid
                    props.setAlert({variant: 'danger', message: `Field '${field}' not found in dataset file. Please ensure it is present.`});
                    return;
                }
                // save file data for next step
                props.setDatasetFileData(fileData);
                // signal successful loading
                setIsFileLoaded({...isFileLoaded, datasetFile: true});
            };
            resultsFileReader.onload = (e) => {
                // parse file data
                const fileData = JSON.parse(e.target.result);
                // ensure required fields are present
                for (const field of ["corpus", "labels", "runcases"]) {
                    if (fileData.hasOwnProperty(field)) continue;
                    props.setAlert({variant: 'danger', message: `Field '${field}' not found in results file. Please ensure it is present.`});
                    return;
                }
                // save file data for next step
                props.setResultsFileData(fileData);
                // signal successful loading
                setIsFileLoaded({...isFileLoaded, resultsFile: true});
            };
            // read file from upload inputs
            datasetFileReader.readAsText(formFields.datasetFile);
            resultsFileReader.readAsText(formFields.resultsFile);
        }
    };

    useEffect(() => {
        // proceed to the next step
        if (isFileLoaded.datasetFile && isFileLoaded.resultsFile) props.setStep(2)
    }, [isFileLoaded, props]);

    return (
        <Row className={"mt-3"}>
            <h3>Upload</h3>
            <Form onSubmit={handleUploadForm}>
                <Row className="mb-3">
                    <div className={"col-md-6 offset-3"}>
                        <Form.Group as={Col} controlId="datasetFile">
                            <Form.Label>Dataset file</Form.Label>
                            <Form.Control
                                type="file"
                                onChange={(e) => {setFormFields({...formFields, datasetFile: e.target.files[0]})}}/>
                        </Form.Group>
                        <Form.Group as={Col} controlId="resultsFile" className={"mt-3"}>
                            <Form.Label>Results file</Form.Label>
                            <Form.Control
                                type="file"
                                onChange={(e) => {setFormFields({...formFields, resultsFile: e.target.files[0]})}}/>
                        </Form.Group>
                        <Button type="submit" disabled={!isFormValid()} className={"float-end mt-3"}>Upload</Button>
                    </div>
                </Row>
            </Form>
        </Row>
  )
};

const Reasons = (props) => {
    
    const handleClose = () => {
        props.setShow(false);
    };
    const [reasons, setReasons] = useState([]);
    const [showLoader, setShowLoader] = useState(false);
    
    const updateParentReasonsData = props.setReasonsMapping;
    const setAlert = props.setAlert;
    
    const [editMode, setEditMode] = useState(false);
    const [formValues, setFormValues] = useState({
        id: undefined,
        title: "",
        description: ""
    });

    const addReason = (title, description) => {
        // update data on server
        (async () => {
            setShowLoader(true);
            let result = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_PATH}api/reasons`, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title,
                    description: description
                })
            });
            setShowLoader(false);
            if (result.ok) {
                result = await result.json();
                // save new Reason
                setReasons([...reasons, result]);
            } else {
                setAlert({'variant': 'danger', 'message': "Failed to create new Reason on the server."});
            }
        })();
    };
    const editReason = (id, title, description) => {
        // update data on server
        (async () => {
            setShowLoader(true);
            let result = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_PATH}api/reasons?id=${id}`, {
                method: "PUT",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title,
                    description: description
                })
            });
            setShowLoader(false);
            if (!result.ok) {
                setAlert({'variant': 'danger', 'message': "Failed to update data on the server."});
            }
        })();
        // get index of reason to edit
        const editedReasonIdx = reasons.findIndex(r => r._id === id);
        // create copy of all reasons
        let editedReasons = [...reasons];
        //make edits
        editedReasons[editedReasonIdx].title = title;
        editedReasons[editedReasonIdx].description = description;
        // save changes
        setReasons(editedReasons);
    };
    const deleteReason = (id) => {
        // remove reasonId from predictions
        props.removeReasonIdFromPredictions(id);
        // update data on server
        (async () => {
            setShowLoader(true);
            let result = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_PATH}api/reasons?id=${id}`, {
                method: "DELETE",
                headers: { 'Content-Type': 'application/json' }
            });
            setShowLoader(false);
            if (result.ok) {
                // remove reasonId from local data
                setReasons(reasons.filter((reason) => reason._id !== id))
            } else {
                setAlert({'variant': 'danger', 'message': "Failed to update data on the server."});
            }
        })();
    };
    const clearForm = () => {
        // set variables to set form
        setFormValues({id: undefined, title: "", description: ""});
    };
    const handleEditReasonBtn = (id) => {
        // change to edit mode
        setEditMode(true);
        // retrieve object to edit
        const reason = reasons.find(r => r._id === id);
        // populate form
        setFormValues({id: reason._id, title: reason.title, description: reason.description});
    };
    const handleDeleteReasonBtn = (id) => {
        // delete object
        deleteReason(id)
        // change to add mode
        setEditMode(false);
        // clear form
        clearForm();
    };
    const handleFormSubmit = (e) => {
        // prevent submission to server
        e.preventDefault();
        // get values to save
        const id = formValues.id, title = formValues.title, description = formValues.description;
        if (!title || !description) return;
        switch (editMode) {
            case true:
                // --- Edit mode ---
                editReason(id, title, description);
                // enable Add mode after saving
                setEditMode(false);
                break;
            case false:
                // --- Add mode ---
                addReason(title, description);
                break;
        }
        // clear form for Add mode
        clearForm();
    }
    const handleClearFormBtn = (e) => {
        // prevent submission to server
        e.preventDefault();
        // clear form
        clearForm();
        // change to Add mode
        setEditMode(false);
    };

    // fetch all Reasons from the server
    useEffect(() => {
        (async () => {
            setShowLoader(true);
            // retrieve reasons from server
            let result = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_PATH}api/reasons`);
            setShowLoader(false);
            if (result.ok) {
                result = await result.json();
                setReasons(result);
            } else {
                setAlert({'variant': 'danger', 'message': "Failed to fetch Reasons from the server."});
            }
        })();
    }, []);

    // update reasons data in the parent component
    // create mapping { reasonId: { reasonObj } }
    useEffect(() => {
        updateParentReasonsData(
            reasons.reduce((finalObj, reason) => {
                finalObj[reason._id] = reason;
                return finalObj;
            }, {})
        )
    }, [reasons]);

    return (
        <>
            <Modal
                show={props.show}
                onHide={handleClose}
                backdrop="static"
                keyboard={false}
                size="xl">
                <Modal.Header closeButton>
                    <Modal.Title>Reasons</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row>
                        <div className={"col-md-8"}>
                            <h5>
                                List of Reasons{' '}
                                {showLoader && <div className="spinner-border spinner-border-sm" role="status"></div>}
                            </h5>
                            <div className="overflow-auto">
                                <ol>
                                    {reasons.length > 0 && reasons.map((reason) => {
                                        return (
                                            <li key={`reason-${reason._id}`}>
                                                <b>{reason.title}</b>
                                                <button type="button"
                                                        className="btn btn-link"
                                                        onClick={() => {handleEditReasonBtn(reason._id)}}>Edit
                                                </button>
                                                <button type="button"
                                                        className="btn btn-link"
                                                        style={{color: "red"}}
                                                        onClick={() => {handleDeleteReasonBtn(reason._id)}}>Delete
                                                </button><br />
                                                {reason.description}
                                            </li>
                                        )
                                    })}
                                    {reasons.length === 0 && <p className={"text-center"}>No reasons yet.</p>}
                                </ol>
                            </div>
                        </div>
                        <div className={"col-md-4"}>
                            <h5>{!editMode && "Add"}{editMode && "Edit"} Reason</h5>
                            <Form onSubmit={handleFormSubmit}>
                                <Form.Group className="mb-3" controlId="reasonTitle">
                                    <Form.Label>Title</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Title"
                                        onChange={(e) => {setFormValues({...formValues, 'title': e.target.value})}}
                                        value={formValues.title}/>
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="reasonDescription">
                                    <Form.Label>Description</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        placeholder="Description"
                                        rows={5}
                                        onChange={(e) => {setFormValues({...formValues, 'description': e.target.value})}}
                                        value={formValues.description}/>
                                </Form.Group>
                                <Button variant="primary"
                                        type="submit">Save
                                </Button>
                                <Button variant="link"
                                        onClick={handleClearFormBtn}>Clear
                                </Button>
                            </Form>
                        </div>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary"
                            onClick={handleClose}>Done
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

const FindingDetail = (props) => {
    const handleClose = () => {
        props.setShow(false);
    };
    return (
        <>
            <Modal
                show={props.show}
                onHide={handleClose}
                keyboard={false}
                size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{props.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row>
                        <Col>
                            <b>Tool: </b>{props.tool}<br />
                            <b>Collection: </b>{props.collection}<br />
                            <Table className={"mt-2"} striped bordered hover responsive>
                                <tbody>
                                <tr>
                                    <td>
                                        <pre>
                                            <code>
                                                {JSON.stringify(props.finding, null, 2)}
                                            </code>
                                        </pre>
                                    </td>
                                </tr>
                                </tbody>
                            </Table>
                        </Col>
                    </Row>
                </Modal.Body>
            </Modal>
        </>
    );
};

const ReasonResults = (props) => {
    // --- State variables ---
    const corpus = props.resultsFileData.corpus;
    const labels = props.resultsFileData.labels;
    const runcase = props.resultsFileData.runcases[0];  // TODO: figure out strategy for multiple runcases
    const unmatchedPredictions = runcase.evaluation.unmatched_predictions;
    const unmatchedLabels = runcase.evaluation.unmatched_labels;
    const datasetMetaData = props.datasetFileData.metadata;
    const datasetCollections = props.datasetFileData.collections;

    const relatedLabels = unmatchedPredictions.reduce((finalObj, prediction) => {
        let relatedLabels = [];
        for (const findingId of prediction) {
            for (const label of unmatchedLabels) {
                if (label.includes(findingId) && !relatedLabels.includes(label)) {
                    relatedLabels.push(label);
                }
            }
        }
        finalObj[prediction] = relatedLabels;
        return finalObj;
    }, {});
    const toolsByFindingId = datasetMetaData.reduce((toolsByFindingIdTemp, metadata) => {
        for (let i = metadata.startIndex; i <= metadata.endIndex; i++) {
            toolsByFindingIdTemp[i] = metadata.tool;
        }
        return toolsByFindingIdTemp;
    }, {});
    const findingJsonByFindingId = datasetCollections.reduce((findingJsonByFindingIdTemp, collection) => {
        for (const finding of collection.findings) {
            findingJsonByFindingIdTemp[finding.id] = {collection: collection.name, finding: finding.finding};
        }
        return findingJsonByFindingIdTemp;
    }, {});

    const [counter, setCounter] = useState(0);
    const [settings, setSettings] = useState({
        reasonsEditView: false
    });
    const [showReasonsModal, setShowReasonsModal] = useState(false);
    const [allReasons, setAllReasons] = useState({});
    const [predictionReasons, setPredictionReasons] = useState(unmatchedPredictions.reduce((finalObj, prediction) => {
        finalObj[prediction] = [];
        return finalObj;
    }, {}))

    const [showFindingModal, setShowFindingModal] = useState(false);
    const [findingModalData, setFindingModalData] = useState({
        title: "Finding Detail",
        collection: "Please select a finding from the Evaluation page.",
        tool: "Please select a finding from the Evaluation page.",
        finding: {}
    });

    // --- Functions ---
    const handleReasonsCheckboxOnChangeEvent = (e) => {
        let predictionReasonsTemp = {...predictionReasons},
            predictionReasonsList = predictionReasonsTemp[ unmatchedPredictions[counter] ];
        const idValueInList = predictionReasonsList.includes(e.target.value), idCheckboxChecked = e.target.checked;
        if (idValueInList && !idCheckboxChecked) {
            // remove reasonId value from list of reasons for current prediction
            predictionReasonsTemp[ unmatchedPredictions[counter] ] = predictionReasonsList.filter(id => id !== e.target.value);
        } else if (!idValueInList && idCheckboxChecked) {
            // add reasonId value to list of reasons for current prediction
            predictionReasonsList.push(e.target.value);
        }
        // save results
        setPredictionReasons(predictionReasonsTemp);
    };
    const handleDownloadEvaluation = (e) => {
        // gather all required variables in object
        const jsonFileObj = {
            corpus: corpus,
            runcase: runcase,
            relatedLabels: relatedLabels,
            reasons: allReasons,
            predictionReasons: predictionReasons
        };
        // use helper function to download file
        DownloadJSONFile(jsonFileObj, `sefila-evaluation`)
    };
    const isPredictionReasonCheckboxChecked = (reasonId) => {
        // check if reasonId value exists in list of reasons for current prediction
        return predictionReasons[unmatchedPredictions[counter]].includes(reasonId);
    };
    const removeReasonIdFromPredictions = (reasonId) => {
        if (_.isNumber(reasonId)) reasonId = reasonId.toString();
        // copy item to locally mutate
        let predictionReasonsTemp = {...predictionReasons};
        // check for all predictions
        for (const [prediction, listOfReasonIds] of Object.entries(predictionReasonsTemp)) {
            // remove reasonId from list if present
            predictionReasonsTemp[prediction] = listOfReasonIds.filter(id => id !== reasonId);
        }
        // update state variable
        setPredictionReasons(predictionReasonsTemp);
    };
    const showFindingInModal = (findingId) => {
        const findingJson = findingJsonByFindingId[findingId];
        setFindingModalData({
            title: `Finding ${findingId}`,
            tool: SecurityTools[toolsByFindingId[findingId]].name,
            collection: findingJson.collection,
            finding: findingJson.finding
        })
        setShowFindingModal(true);
    }

    // --- Rendered component ---
    return (
        <>
            <Row className={"mt-4"}>
                <h4 className={"text-center mb-4"}>{ runcase.title }</h4>
                <Row>
                    <div className={"col-md-3"}>
                        <Button variant="warning"
                                className={"float-start mt-4"}
                                onClick={() => {setShowReasonsModal(true)}}
                        >Reasons</Button>
                    </div>
                    <div className={"col-md-9"}>
                        <p className={"text-end mb-2"}>
                            Prediction {counter + 1} of {unmatchedPredictions.length}
                        </p>
                        <ButtonGroup aria-label="Navigate all findings" className={"float-end mb-1"}>
                            <Button onClick={() => {setCounter(counter - 1);}}
                                    variant="secondary"
                                    disabled={counter <= 0}
                            >Previous</Button>
                            <Button onClick={() => {setCounter(counter + 1)}}
                                    variant="secondary"
                                    disabled={counter >= unmatchedPredictions.length - 1}
                            >Next</Button>
                        </ButtonGroup>
                    </div>
                </Row>
                <Row>
                    <div className={"col-md-7"}>
                        <Table className={"mt-3"} striped bordered hover>
                            <thead>
                            <tr>
                                <th>
                                    Prediction: {JSON.stringify(unmatchedPredictions[counter])}<br />
                                    Related labels: {JSON.stringify(relatedLabels[unmatchedPredictions[counter]])}
                                </th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr>
                                <td>
                                    {Object.keys(corpus).length > 0 && relatedLabels[unmatchedPredictions[counter]].map((findingIdCluster) => {
                                        return findingIdCluster.map(findingId => {
                                            return (
                                                <>
                                                    <b>
                                                        <a href={"#"}
                                                           onClick={(e) => {e.preventDefault(); showFindingInModal(findingId)}}
                                                        >{findingId}:
                                                        </a>{" "}
                                                    </b>
                                                    <code>{JSON.stringify(corpus[findingId])}</code>
                                                    <br /><br />
                                                </>
                                            )
                                        })
                                    })}
                                </td>
                            </tr>
                            </tbody>
                        </Table>
                    </div>
                    <div className={"col-md-5"}>
                        <Table className={"mt-3"} striped bordered hover>
                            <thead>
                            <tr>
                                <th>
                                    Reasons
                                    <span className={"float-end"}>
                                {!settings.reasonsEditView &&
                                    <Button variant="primary"
                                            onClick={() => {setSettings({...settings, reasonsEditView: true})}}
                                            size="sm">Edit</Button>
                                }
                                {settings.reasonsEditView &&
                                    <Button variant="primary"
                                         onClick={() => {setSettings({...settings, reasonsEditView: false})}}
                                         size="sm">Save</Button>}
                            </span>
                                </th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr>
                                <td>
                                    <ul>
                                        {!settings.reasonsEditView &&
                                            <>
                                                {predictionReasons[ unmatchedPredictions[counter] ].map(reasonId => {
                                                    return (
                                                        <li key={`reason-li-${reasonId}`}>
                                                            <b>{allReasons[reasonId].title}</b><br />
                                                            <span>{allReasons[reasonId].description}</span>
                                                        </li>
                                                    )
                                                })}
                                                {predictionReasons[ unmatchedPredictions[counter] ].length === 0 &&
                                                    <p className="text-center">No reasons specified.</p>
                                                }
                                            </>
                                        }
                                        {settings.reasonsEditView &&
                                            <Form>
                                                {Object.entries(allReasons).map(([reasonId, reason]) => {
                                                    return (
                                                        <>
                                                            <b><Form.Check
                                                                key={`reason-checkbox-${reasonId}`}
                                                                type="checkbox"
                                                                id={`reason-checkbox-${reasonId}`}
                                                                label={reason.title}
                                                                value={reason._id}
                                                                checked={isPredictionReasonCheckboxChecked(reasonId)}
                                                                onChange={handleReasonsCheckboxOnChangeEvent}
                                                            /></b>
                                                            <span>
                                                                {reason.description}
                                                            </span>
                                                        </>
                                                    )
                                                })}
                                            </Form>
                                        }
                                    </ul>
                                </td>
                            </tr>
                            </tbody>
                        </Table>
                    </div>
                </Row>
                <Row className={"mt-3 mb-3 col-md-4 offset-4"}>
                    <Button variant="success" onClick={handleDownloadEvaluation}>Download Evaluation</Button>
                </Row>
            </Row>
            <Reasons
                show={showReasonsModal}
                setShow={setShowReasonsModal}
                setReasonsMapping={setAllReasons}
                removeReasonIdFromPredictions={removeReasonIdFromPredictions}
                setAlert={props.setAlert}
            />
            <FindingDetail
                show={showFindingModal}
                setShow={setShowFindingModal}
                title={findingModalData.title}
                collection={findingModalData.collection}
                tool={findingModalData.tool}
                finding={findingModalData.finding}
            />
        </>
    )
}
