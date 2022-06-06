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

export default function Evaluate() {
    const [step, setStep] = useState(1);
    const [alert, setAlert] = useState({'variant': 'success', 'message': ""});
    const [fileData, setFileData] = useState({});
    let stepComponent;
    if (step === 1) {
        stepComponent = <UploadResults
            setStep={setStep}
            setAlert={setAlert}
            setFileData={setFileData}
        />;
    } else if (step === 2) {
        stepComponent = <ReasonResults
            fileData={fileData}
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
        'file': undefined
    });

    // --- Functions ---
    const isFormValid = () => {
        return formFields.file !== undefined;
    };
    const handleUploadForm = (event) => {
        // prevent form from submitting to server
        event.preventDefault();
        // ensure a valid tool and valid file are selected before processing
        if (isFormValid()) {
            // file will be loaded in the background
            const fileReader = new FileReader();
            // define behavior of what's to be done once the file load
            fileReader.onload = (e) => {
                // parse file data
                const fileData = JSON.parse(e.target.result);
                // ensure required fields are present
                for (const field of ["corpus", "labels", "runcases"]) {
                    if (fileData.hasOwnProperty(field)) continue;
                    props.setAlert({variant: 'danger', message: `Field '${field}' not found in results file. Please ensure it is present.`});
                    return;
                }
                // save file data for next step
                props.setFileData(fileData);
                // proceed to next step
                props.setStep(2);
            };
            // read file from upload input
            fileReader.readAsText(formFields.file);
        }
    };

    return (
        <Row className={"mt-3"}>
            <h3>Upload</h3>
            <Form onSubmit={handleUploadForm}>
                <Row className="mb-3">
                    <div className={"col-md-6 offset-3"}>
                        <Form.Group as={Col} controlId="formToolFile">
                            <Form.Label>Results file</Form.Label>
                            <Form.Control
                                type="file"
                                onChange={(e) => {setFormFields({...formFields, 'file': e.target.files[0]})}}/>
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
    const [reasons, setReasons] = useState([
        {"id": 1, "title": "This is reason 1", "description": "This is an example of using .overflow-auto on an element with set width and height dimensions. By design, this content will vertically scroll."},
        {"id": 2, "title": "This is reason 1", "description": "This is an example of using .overflow-auto on an element with set width and height dimensions. By design, this content will vertically scroll."},
        {"id": 3, "title": "This is reason 1", "description": "This is an example of using .overflow-auto on an element with set width and height dimensions. By design, this content will vertically scroll."},
        {"id": 4, "title": "This is reason 1", "description": "This is an example of using .overflow-auto on an element with set width and height dimensions. By design, this content will vertically scroll."},
        {"id": 5, "title": "This is reason 1", "description": "This is an example of using .overflow-auto on an element with set width and height dimensions. By design, this content will vertically scroll."}
    ]);
    
    const updateParentReasonsData = props.setReasonsMapping;
    useEffect(() => {
        // update reasons data in the parent component
        // create mapping { reasonId: { reasonObj } }
        updateParentReasonsData(
            reasons.reduce((finalObj, reason) => {
                finalObj[reason.id] = reason;
                return finalObj;
            }, {})
        )
    }, [reasons, updateParentReasonsData]);
    
    const [editMode, setEditMode] = useState(false);
    const [formValues, setFormValues] = useState({
        id: undefined,
        title: "",
        description: ""
    });

    const addReason = (title, description) => {
        // determine next id in series
        const latestId = Math.max(...reasons.map(reason => reason.id)) + 1;
        // save new Reason
        setReasons([...reasons, {
            id: latestId,
            title: title,
            description: description
        }])
    };
    const editReason = (id, title, description) => {
        // get index of reason to edit
        const editedReasonIdx = reasons.findIndex(r => r.id === id);
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
        // // remove reasonId from local data
        setReasons(
            reasons.filter((reason) => reason.id !== id)
        )
    };
    const clearForm = () => {
        // set variables to set form
        setFormValues({id: undefined, title: "", description: ""});
    };
    const handleEditReasonBtn = (id) => {
        // change to edit mode
        setEditMode(true);
        // retrieve object to edit
        const reason = reasons.find(r => r.id === id);
        // populate form
        setFormValues({id: reason.id, title: reason.title, description: reason.description});
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
                            <h5>List of Reasons</h5>
                            <div className="overflow-auto">
                                <ol>
                                    {reasons.length > 0 && reasons.map((reason) => {
                                        return (
                                            <li key={`reason-${reason.id}`}>
                                                <b>{reason.title}</b>
                                                <button type="button"
                                                        className="btn btn-link"
                                                        onClick={() => {handleEditReasonBtn(reason.id)}}>Edit
                                                </button>
                                                <button type="button"
                                                        className="btn btn-link"
                                                        style={{color: "red"}}
                                                        onClick={() => {handleDeleteReasonBtn(reason.id)}}>Delete
                                                </button><br />
                                                {reason.description}
                                            </li>
                                        )
                                    })}
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
}

const ReasonResults = (props) => {
    // --- State variables ---
    const corpus = props.fileData.corpus;
    const labels = props.fileData.labels;
    const runcase = props.fileData.runcases[0];  // TODO: figure out strategy for multiple runcases
    const unmatchedPredictions = runcase.evaluation.unmatched_predictions;
    const unmatchedLabels = runcase.evaluation.unmatched_labels;

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

    // const predictionsSimilarWords = unmatchedPredictions.reduce((finalObj, prediction) => {
    //     let wordCounts = {}, repeatedWords = [];
    //     for (const findingId of prediction) {
    //         const corpusText = corpus[findingId];
    //         // trim special characters to prevent mis-identification
    //         for (const specialChar of [" ", ",", ";"]) {
    //             _.trim(corpusText, specialChar);
    //         }
    //         for (const word of corpusText.split(" ")) {
    //             // wordCounts[word] ? ++wordCounts[word] : wordCounts[word] = 1;
    //             _.isObject(wordCounts[word]) ? wordCounts[word][findingId] = true : wordCounts[word] = {[findingId]: true};
    //         }
    //     }
    //     console.log(wordCounts);
    //     // for (const [word, count] of Object.entries(wordCounts)) {
    //     //     if (count >= 2) repeatedWords.push(word);
    //     // }
    //     finalObj[prediction] = repeatedWords;
    //     return finalObj;
    // }, {});

    // console.log(predictionsSimilarWords);

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
                                    {Object.keys(corpus).length > 0 && unmatchedPredictions[counter].map((findingId) => {
                                        return (
                                            <>
                                                <b>{findingId}: </b>
                                                <code>{JSON.stringify(corpus[findingId])}</code>
                                                <br /><br />
                                            </>
                                        )
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
                                                        <li key={`reason-li-${reasonId}`}>{allReasons[reasonId].title}</li>
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
                                                        <Form.Check
                                                            key={`reason-checkbox-${reasonId}`}
                                                            type="checkbox"
                                                            id={`reason-checkbox-${reasonId}`}
                                                            label={reason.title}
                                                            value={reason.id}
                                                            checked={isPredictionReasonCheckboxChecked(reasonId)}
                                                            onChange={handleReasonsCheckboxOnChangeEvent}
                                                        />
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
            />
        </>
    )
}
