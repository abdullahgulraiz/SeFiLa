import {useState} from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';

export default function Label() {
    const [step, setStep] = useState(1);
    const [allFindings, setAllFindings] = useState({});
    let stepComponent;
    if (step === 1) {
        stepComponent = <GenerateDS setStep={setStep} setAllFindings={setAllFindings} />;
    } else if (step === 2) {
        stepComponent = <LabelDS allFindings={allFindings} />;
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
    const [formFields, setFormFields] = useState({'file': undefined, 'tool': "-1"});
    const tools = {
        "trivy": {
            "name": "Trivy",
            "processingFunction": (data, startIndex) => {
                const parsedData = JSON.parse(data);
                let findingsTemp = {};
                for (const target of Object.values(parsedData)) {
                    for (const vulnerability of Object.values(target["Vulnerabilities"])) {
                        findingsTemp[startIndex++] = vulnerability;
                    }
                }
                return {
                    "findingsTemp": findingsTemp,
                    "endIndex": startIndex
                }
            },
        },
        "bandit": {
            "name": "Bandit",
            "processingFunction": (data, startIndex) => {
                const parser = new DOMParser();
                const parsedData = parser.parseFromString(data, "text/xml");
                const findings = parsedData.getElementsByTagName("testcase");
                const serializer = new XMLSerializer();
                let findingsTemp = {};
                for (const finding of findings){
                    findingsTemp[startIndex++] = {"testcase": serializer.serializeToString(finding)};
                }
                return {
                    "findingsTemp": findingsTemp,
                    "endIndex": startIndex
                }
            },
        },
        "zap": {
            "name": "ZAP",
            "processingFunction": (data, startIndex) => {
                const parsedData = JSON.parse(data);
                let findingsTemp = {};
                for (const site of Object.values(parsedData["site"])) {
                    for (const alert of Object.values(site["alerts"])) {
                        findingsTemp[startIndex++] = alert;
                    }
                }
                return {
                    "findingsTemp": findingsTemp,
                    "endIndex": startIndex
                }
            },
        },
        "arachni": {
            "name": "Arachni",
            "processingFunction": (data, startIndex) => {
                const parsedData = JSON.parse(data);
                let findingsTemp = {};
                for (const issue of Object.values(parsedData["issues"])) {
                    findingsTemp[startIndex++] = issue;
                }
                return {
                    "findingsTemp": findingsTemp,
                    "endIndex": startIndex
                }
            },
        },
    };

    // --- Functions ---
    const isFormValid = () => {
        // check if a valid tool and valid file are selected
        return (tools.hasOwnProperty(formFields.tool) && formFields.file !== undefined);
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
                "endIndex": endIndex
            }]);
        };
        // read file from upload input
        fileReader.readAsText(file);
    };
    const handleUploadForm = (event) => {
        // prevent form from submitting to server
        event.preventDefault();
        // ensure a valid tool and valid file are selected before processing
        if (isFormValid()) {
            processUploadedFile(formFields.tool, formFields.file);
        }
        // reset form
        setFormFields({...formFields, 'tool': "-1"});
    };
    const handleDeleteReport = (id) => {
        // TODO: implement. NOTE: consider starting index in processedFindings which depends on length of entries.
        //  Use information from objects in findingFilesData state variable
        console.log("Deleting entry ", id);
    };
    const handleNextStep = () => {
        // save processed findings for the next step
        props.setAllFindings(processedFindings);
        // proceed to the next step
        props.setStep(2);
    };

    // --- Rendered component ---
    return (
        <>
            <h1>Generate Dataset</h1>
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
                    <Button type="submit" disabled={!isFormValid()}>Upload</Button>
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
                        <th></th>
                    </tr>
                    </thead>
                    <tbody>
                    {findingFilesData.length > 0 && findingFilesData.map((data, idx) => {
                        return (
                            <tr key={idx}>
                                <td className={"col-md-1"}>{idx + 1}</td>
                                <td className={"col-md-5"}>{tools[data.tool].name}</td>
                                <td className={"col-md-5"}>{data.endIndex - data.startIndex}</td>
                                <td className={"col-md-1 text-center"}>
                                    <Button onClick={() => {handleDeleteReport(idx)}} variant={"danger"}>🗑</Button>
                                </td>
                            </tr>
                        )
                    })}
                    {findingFilesData.length === 0 &&
                        <tr>
                            <td colSpan={4} className={"text-center"}>No reports yet.</td>
                        </tr>
                    }
                    </tbody>
                </Table>
            </Row>
            {Object.keys(processedFindings).length > 0 && <Row className={"mt-3 col-md-4 offset-4"}>
                <Button variant="success" onClick={handleNextStep}>Next step</Button>
            </Row>}
        </>
    )
}

const LabelDS = (props) => {
    // --- State variables ---
    const [savedCollections, setSavedCollections] = useState({});
    const [currentCollection, setCurrentCollection] = useState({});
    const [allFindings, setAllFindings] = useState(props.allFindings);
    const [settings, setSettings] = useState({
       "prettyCode": false,
    });

    // --- Functions ---
    const handleMoveFinding = (isAddOperation, id) => {
        if (isAddOperation) {
            // add finding to the current collection
            setCurrentCollection({...currentCollection, [id]: allFindings[id]});
            // remove finding from all findings
            const {[id]: removedFinding, ...updatedFindings} = allFindings;
            setAllFindings(updatedFindings);
        } else {
            // add finding to all findings
            setAllFindings({...allFindings, [id]: currentCollection[id]});
            // remove finding from current collection
            const {[id]: removedFinding, ...updatedCurrentCollection} = currentCollection;
            setCurrentCollection(updatedCurrentCollection);
        }
    };
    const handleSaveCollection = () => {
        // add new collection with id next to the id of total existing saved collections
        const latestIndex = Object.keys(savedCollections).length;
        setSavedCollections({...savedCollections, [latestIndex]: currentCollection});
        setCurrentCollection({});
    };
    const updateSavedCollectionIds = (savedCollection) => {
        // re-assign numerical Ids of saved collections and return the updated object
        let newSavedCollectionId = 0, updatedKeySavedCollection = {};
        for (const key of Object.keys(savedCollection)) {
            updatedKeySavedCollection[newSavedCollectionId++] = savedCollection[key];
        }
        return updatedKeySavedCollection;
    }
    const handleEditCollection = (id) => {
        // prevent current collection from being lost
        setAllFindings({...allFindings, ...currentCollection});
        // clear and populate current collection with collection being edited
        setCurrentCollection(savedCollections[id]);
        // remove entry from saved collections list
        let {[id]: removedSavedCollection, ...updatedSavedCollection} = savedCollections;
        // update Ids of saved collections
        updatedSavedCollection = updateSavedCollectionIds(updatedSavedCollection);
        setSavedCollections(updatedSavedCollection);
    };
    const handleDeleteCollection = (id) => {
        // save all findings in the original pool of findings
        setAllFindings({...allFindings, ...savedCollections[id]});
        // remove entry from saved collections list
        let {[id]: removedSavedCollection, ...updatedSavedCollection} = savedCollections;
        // update Ids of saved collections
        updatedSavedCollection = updateSavedCollectionIds(updatedSavedCollection);
        setSavedCollections(updatedSavedCollection);
    };
    const handleDownloadCollections = () => {
        // dump data into a string
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(savedCollections))}`;
        // create temporary link element to enable download
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = "labeled-dataset.json";
        link.click();
        // remove temporary link element
        link.remove();
    };

    // --- Rendered component ---
    return (
        <>
            <h1>Label Dataset</h1>
            <Row className={"mt-3"}>
                <Col>
                    <Form.Check
                        className={"float-end"} type={"switch"} id={"custom-switch"} label="Pretty code"
                        onChange={(e) => {setSettings({...settings, prettyCode: !settings.prettyCode})}}
                    />
                </Col>
            </Row>
            <Row className={"mt-3"}>
                <div className={"col-sm-6"}>
                    <h3>Current collection</h3>
                    <p className={"mt-1"}>{Object.keys(currentCollection).length} findings</p>
                    <div style={{"max-height": "500px", "overflow": "auto"}}>
                        <Table className={"mt-0"} striped bordered hover>
                        <thead>
                        <tr>
                            <th>Findings</th>
                            <th></th>
                        </tr>
                        </thead>
                        <tbody>
                        {Object.entries(currentCollection).map(([id, finding]) => {
                            return (
                                <tr key={id}>
                                    <td style={{"word-wrap": "break-word", "word-break": "break-word"}}>
                                        {settings.prettyCode &&
                                            <pre>
                                                <code>
                                                    {JSON.stringify(finding, null, 2)}
                                                </code>
                                            </pre>
                                        }
                                        {!settings.prettyCode &&
                                            <>
                                                {JSON.stringify(finding, null, 2)}
                                            </>
                                        }
                                    </td>
                                    <td>
                                        <Button
                                            onClick={() => {handleMoveFinding(false, id)}}
                                            size={"sm"}
                                            variant="secondary">→
                                        </Button>
                                    </td>
                                </tr>
                            )
                        })}
                        {Object.keys(currentCollection).length === 0 &&
                            <tr>
                                <td colSpan={2} className={"text-center"}>
                                    No findings yet.
                                </td>
                            </tr>
                        }
                        </tbody>
                    </Table>
                    </div>
                    {Object.keys(currentCollection).length > 0 &&
                        <Button variant={"primary"} className={"mt-3"} onClick={handleSaveCollection}>Save collection</Button>
                    }
                </div>
                <div className={"col-sm-6"}>
                    <h3>All findings</h3>
                    <p className={"mt-1"}>{Object.keys(allFindings).length} findings</p>
                    <div style={{"max-height": "500px", "overflow": "auto"}}>
                        <Table className={"mt-0"} striped bordered hover>
                        <thead>
                        <tr>
                            <th></th>
                            <th>Findings</th>
                        </tr>
                        </thead>
                        <tbody>
                        {Object.entries(allFindings).map(([id, finding]) => {
                            return (
                                <tr key={id}>
                                    <td>
                                        <Button
                                            onClick={() => {handleMoveFinding(true, id)}}
                                            size={"sm"}
                                            variant="secondary">←
                                        </Button>
                                    </td>
                                    <td style={{"word-wrap": "break-word", "word-break": "break-word"}}>
                                        {settings.prettyCode &&
                                            <pre>
                                                <code>
                                                    {JSON.stringify(finding, null, 2)}
                                                </code>
                                            </pre>
                                        }
                                        {!settings.prettyCode &&
                                            <>
                                            {JSON.stringify(finding, null, 2)}
                                            </>
                                        }
                                    </td>
                                </tr>
                            )
                        })}
                        {Object.keys(allFindings).length === 0 &&
                            <tr>
                                <td colSpan={2} className={"text-center"}>
                                    No more findings.
                                </td>
                            </tr>
                        }
                        </tbody>
                    </Table>
                    </div>
                </div>
            </Row>
            <Row className={"mt-4"}>
                <h3>All collections</h3>
                <Table className={"mt-3 w-100"} striped bordered hover>
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th># Findings</th>
                        <th></th>
                    </tr>
                    </thead>
                    <tbody>
                    {Object.entries(savedCollections).map(([id, collection]) => {
                        return (
                            <tr key={id}>
                                <td className={"col-md-5"}>{id}</td>
                                <td className={"col-md-5"}>{Object.keys(collection).length}</td>
                                <td className={"col-md-1 text-center"}>
                                    <Button variant={"primary"} onClick={() => handleEditCollection(id)}>✎</Button>{' '}
                                    <Button variant={"danger"} onClick={() => handleDeleteCollection(id)}>🗑</Button>
                                </td>
                            </tr>
                        )
                    })}
                    {Object.keys(savedCollections).length === 0 &&
                        <tr>
                            <td colSpan={3} className={"text-center"}>
                                No collections yet.
                            </td>
                        </tr>
                    }
                    </tbody>
                </Table>
            </Row>
            {Object.keys(savedCollections).length > 0 && <Row className={"mt-3 mb-3 col-md-4 offset-4"}>
                <Button variant="success" onClick={handleDownloadCollections}>Download dataset</Button>
            </Row>}
        </>
    )
}