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
    const [processedFindings, setProcessedFindings] = useState({
        0: {
            "VulnerabilityID":
                "CVE-2011-3374",
            "PkgName":
                "apt",
            "InstalledVersion":
                "1.8.2.3",
            "Layer":
                {
                    "Digest":
                        "sha256:69692152171afee1fd341febc390747cfca2ff302f2881d8b394e786af605696",
                    "DiffID":
                        "sha256:02c055ef67f5904019f43a41ea5f099996d8e7633749b6e606c400526b2c4b33"
                }
            ,
            "SeveritySource":
                "debian",
            "PrimaryURL":
                "https://avd.aquasec.com/nvd/cve-2011-3374",
            "Description":
                "It was found that apt-key in apt, all versions, do not correctly validate gpg keys with the master keyring, leading to a potential man-in-the-middle attack.",
            "Severity":
                "LOW",
            "CweIDs":
                [
                    "CWE-347"
                ],
            "CVSS":
                {
                    "nvd":
                        {
                            "V2Vector":
                                "AV:N/AC:M/Au:N/C:N/I:P/A:N",
                            "V3Vector":
                                "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:N/I:L/A:N",
                            "V2Score":
                                4.3,
                            "V3Score":
                                3.7
                        }
                }
            ,
            "References":
                [
                    "https://access.redhat.com/security/cve/cve-2011-3374",
                    "https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=642480",
                    "https://people.canonical.com/~ubuntu-security/cve/2011/CVE-2011-3374.html",
                    "https://seclists.org/fulldisclosure/2011/Sep/221",
                    "https://security-tracker.debian.org/tracker/CVE-2011-3374",
                    "https://snyk.io/vuln/SNYK-LINUX-APT-116518",
                    "https://ubuntu.com/security/CVE-2011-3374"
                ],
            "PublishedDate":
                "2019-11-26T00:15:00Z",
            "LastModifiedDate":
                "2021-02-09T16:08:00Z"
        },
        1: {
            "VulnerabilityID":
                "CVE-2011-3374",
            "PkgName":
                "apt",
            "InstalledVersion":
                "1.8.2.3",
            "Layer":
                {
                    "Digest":
                        "sha256:69692152171afee1fd341febc390747cfca2ff302f2881d8b394e786af605696",
                    "DiffID":
                        "sha256:02c055ef67f5904019f43a41ea5f099996d8e7633749b6e606c400526b2c4b33"
                }
            ,
            "SeveritySource":
                "debian",
            "PrimaryURL":
                "https://avd.aquasec.com/nvd/cve-2011-3374",
            "Description":
                "It was found that apt-key in apt, all versions, do not correctly validate gpg keys with the master keyring, leading to a potential man-in-the-middle attack.",
            "Severity":
                "LOW",
            "CweIDs":
                [
                    "CWE-347"
                ],
            "CVSS":
                {
                    "nvd":
                        {
                            "V2Vector":
                                "AV:N/AC:M/Au:N/C:N/I:P/A:N",
                            "V3Vector":
                                "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:N/I:L/A:N",
                            "V2Score":
                                4.3,
                            "V3Score":
                                3.7
                        }
                }
            ,
            "References":
                [
                    "https://access.redhat.com/security/cve/cve-2011-3374",
                    "https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=642480",
                    "https://people.canonical.com/~ubuntu-security/cve/2011/CVE-2011-3374.html",
                    "https://seclists.org/fulldisclosure/2011/Sep/221",
                    "https://security-tracker.debian.org/tracker/CVE-2011-3374",
                    "https://snyk.io/vuln/SNYK-LINUX-APT-116518",
                    "https://ubuntu.com/security/CVE-2011-3374"
                ],
            "PublishedDate":
                "2019-11-26T00:15:00Z",
            "LastModifiedDate":
                "2021-02-09T16:08:00Z"
        }
    });
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
        "anchore": {
            "name": "Anchore",
            "processingFunction": (data) => {
                console.log("This data is processed by Anchore function");
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
                <Col className={"md-6"}>
                    <h3>Current collection</h3>
                    <Table className={"mt-3"} striped bordered hover responsive>
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
                                    <td>
                                        {/*<pre>*/}
                                            {JSON.stringify(finding, null, 2)}
                                        {/*</pre>*/}
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
                    {Object.keys(currentCollection).length > 0 &&
                        <Button variant={"primary"} onClick={handleSaveCollection}>Save collection</Button>
                    }
                </Col>
                <Col className={"md-6"}>
                    <h3>All findings</h3>
                    <Table className={"mt-3"} striped bordered hover responsive>
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
                                    <td>
                                        {/*<pre>*/}
                                        {/*    <code>*/}
                                                {JSON.stringify(finding, null, 2)}
                                        {/*    </code>*/}
                                        {/*</pre>*/}
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
                </Col>
            </Row>
            <Row className={"mt-4"}>
                <h3>All collections</h3>
                <Table className={"mt-3"} striped bordered hover>
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
                                <td className={"col-md-1"}>
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
            {Object.keys(savedCollections).length > 0 && <Row className={"mt-3 col-md-4 offset-4"}>
                <Button variant="success" onClick={handleDownloadCollections}>Download dataset</Button>
            </Row>}
        </>
    )
}