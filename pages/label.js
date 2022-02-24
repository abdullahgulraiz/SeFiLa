import {useState} from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import ButtonGroup from 'react-bootstrap/ButtonGroup';

export default function Label() {
    const [step, setStep] = useState(1);
    const [allFindings, setAllFindings] = useState({});
    const [allFindingsMetadata, setAllFindingsMetaData] = useState({});
    let stepComponent;
    if (step === 1) {
        stepComponent = <GenerateDS
            setStep={setStep} setAllFindings={setAllFindings} setAllFindingsMetaData={setAllFindingsMetaData} />;
    } else if (step === 2) {
        stepComponent = <LabelDS allFindings={allFindings} allFindingsMetadata={allFindingsMetadata} />;
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
        // save meta-data for the next step
        props.setAllFindingsMetaData(findingFilesData);
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
                                <td className={"col-md-5"}>{data.endIndex - data.startIndex + 1}</td>
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
    // --- General constants ---
    const allFindingsData = props.allFindings;
    const allFindingsMetaData = props.allFindingsMetadata;
    // --- State variables ---
    const [savedCollections, setSavedCollections] = useState([]);
    const [currentCollection, setCurrentCollection] = useState([]);
    const [allFindings, setAllFindings] = useState(Object.keys(props.allFindings));
    const [settings, setSettings] = useState({
        "prettyCode": true,
        "selectedCurrentCollectionIdx": -1,
        "selectedAllFindingsIdx": 0,
        "currentCollectionName": ""
    });

    // --- Functions ---
    const handleMoveFinding = (isAddOperation) => {
        let idx;
        if (isAddOperation) {
            idx = settings.selectedAllFindingsIdx;
            // don't proceed if no entries in all findings
            if (idx <= -1) return;
            // add findingId to the current collection
            setCurrentCollection([...currentCollection, allFindings[idx]]);
            // remove finding from all findings
            const remainingFindings = allFindings.filter((findingId, findingIdIdx) => {return findingIdIdx !== idx});
            setAllFindings(remainingFindings);
            // determine next sane idx
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
            // remove finding from current collection
            const remainingCurrentCollection = currentCollection.filter((findingId, findingIdIdx) => {return findingIdIdx !== idx});
            setCurrentCollection(remainingCurrentCollection);
            // determine next sane idx
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
        // add new collection with id next to the id of total existing saved collections
        setSavedCollections([
            ...savedCollections,
            {"name": settings.currentCollectionName, "collection": currentCollection}
        ]);
        // reset current collections
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
        // save all findings in the original pool of findings
        setAllFindings([...allFindings, ...savedCollections[idx].collection]);
        // refresh view
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
        // format data in the required format
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
        const finalDS = {"metadata": allFindingsMetaData, "collections": finalCollections};
        // dump data into a string
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(finalDS))}`;
        // create temporary link element to enable download
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = "labeled-dataset.json";
        link.click();
        // remove temporary link element
        link.remove();
    };
    const getIndexCollection = (isAllFindings) => {
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
        // function returns the next possible key for given collection based on available keys and desired operation
        let {index, collection} = getIndexCollection(isAllFindings);
        const tempIndex = isNext ? index + 1 : index - 1;
        return (collection[tempIndex] !== undefined) ? tempIndex : index;
    };
    const isNavigationPossible = (isAllFindings, isNext) => {
        let {index, collection} = getIndexCollection(isAllFindings);
        if (index <= -1) return false;
        return isNext ? index < (collection.length - 1) : index > 0;
    };
    const handleNavigateCollections = (isAllFindings, isNext) => {
        // get next key for the collection based on current key and available keys
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

    // --- Rendered component ---
    return (
        <>
            <h1>Label Dataset</h1>
            <Row className={"mt-3"}>
                <Col>
                    <Form.Check
                        className={"float-end"} type={"switch"} id={"custom-switch"} label="Pretty code" defaultChecked={true}
                        onChange={(e) => {setSettings({...settings, prettyCode: !settings.prettyCode})}}
                    />
                </Col>
            </Row>
            <Row className={"mt-3"}>
                <div className={"col-sm-6"}>
                    <h3>Current collection</h3>
                    <Row>
                        <Col>
                            <p className={"mt-2"}>
                                Total {currentCollection.length} finding(s)
                                {currentCollection.length > 0 &&
                                    <>
                                        , current finding {currentCollection[settings.selectedCurrentCollectionIdx]}
                                    </>
                                }
                            </p>
                        </Col>
                        <Col>
                            <ButtonGroup aria-label="Navigate current collection" className={"float-end mb-3"}>
                                <Button onClick={() => {handleNavigateCollections(false, false)}}
                                        variant="secondary"
                                        disabled={!isNavigationPossible(false, false)}
                                >Previous</Button>
                                <Button onClick={() => {handleNavigateCollections(false, true)}}
                                        variant="secondary"
                                        disabled={!isNavigationPossible(false, true)}
                                >Next</Button>
                            </ButtonGroup>
                        </Col>
                    </Row>
                    <div style={{"max-height": "500px", "overflow": "auto"}}>
                        <Table className={"mt-0"} striped bordered hover>
                        <thead>
                        <tr>
                            <th>Finding</th>
                        </tr>
                        </thead>
                        <tbody>
                        {currentCollection.length > 0 &&
                            <tr>
                                <td style={{"word-wrap": "break-word", "word-break": "break-word"}}>
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
                        <Col>
                            <p className={"mt-2"}>
                                Total {allFindings.length} finding(s)
                                {allFindings.length > 0 &&
                                    <>
                                        , current finding {allFindings[settings.selectedAllFindingsIdx]}
                                    </>
                                }
                            </p>
                        </Col>
                        <Col>
                            <ButtonGroup aria-label="Navigate all findings" className={"float-end mb-3"}>
                                <Button onClick={() => {handleNavigateCollections(true, false)}}
                                        variant="secondary"
                                        disabled={!isNavigationPossible(true, false)}
                                >Previous</Button>
                                <Button onClick={() => {handleNavigateCollections(true, true)}}
                                        variant="secondary"
                                        disabled={!isNavigationPossible(true, true)}
                                >Next</Button>
                            </ButtonGroup>
                        </Col>
                    </Row>
                    <div style={{"max-height": "500px", "overflow": "auto"}}>
                        <Table className={"mt-0"} striped bordered hover>
                        <thead>
                        <tr>
                            <th>Finding</th>
                        </tr>
                        </thead>
                        <tbody>
                        {allFindings.length > 0 &&
                            <tr>
                                <td style={{"word-wrap": "break-word", "word-break": "break-word"}}>
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
                            <td colSpan={3} className={"text-center"}>
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