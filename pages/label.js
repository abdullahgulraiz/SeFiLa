import {useState} from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';

export default function Label() {
    const [step, setStep] = useState(2);
    const [allFindings, setAllFindings] = useState({
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
        },
        2: {
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
    let stepComponent;
    if (step === 1) {
        stepComponent = <GenerateDS setStep={setStep} setAllFindings={setAllFindings} />;
    } else if (step === 2) {
        stepComponent = <LabelDS setStep={setStep} allFindings={allFindings} />;
    }
    return (
        <div className={"mt-5"}>
            {stepComponent}
        </div>
    )
}

const GenerateDS = (props) => {
    const [fileNames, setFileNames] = useState(['trivy.json']);
    return (
        <>
            <h1>Generate Dataset</h1>
            <Row className={"mt-3"}>
                <h3>Upload</h3>
                <Form>
                    <Row className="mb-3">
                        <Form.Group as={Col} controlId="formGridEmail">
                            <Form.Label>Report file</Form.Label>
                            <Form.Control type="file" />
                        </Form.Group>
                        <Form.Group as={Col} controlId="formGridPassword">
                            <Form.Label>Tool</Form.Label>
                            <Form.Select aria-label="Default select example">
                                <option value="1">---</option>
                                <option value="2">Trivy</option>
                                <option value="3">Bandit</option>
                                <option value="3">Anchore</option>
                            </Form.Select>
                        </Form.Group>
                    </Row>
                    <Button type="submit">Upload</Button>
                </Form>
            </Row>
            <Row className={"mt-4"}>
                <h3>Reports</h3>
                <Table className={"mt-3"} striped bordered hover>
                    <thead>
                    <tr>
                        <th>#</th>
                        <th>Filename</th>
                        <th>Tool</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td>1</td>
                        <td>trivy.json</td>
                        <td>Trivy</td>
                        <td>Delete</td>
                    </tr>
                    <tr>
                        <td>2</td>
                        <td>bandit_small.xml</td>
                        <td>Bandit</td>
                        <td>Delete</td>
                    </tr>
                    </tbody>
                </Table>
            </Row>
            {fileNames.length > 0 && <Row className={"mt-3 col-md-4 offset-4"}>
                <Button variant="success" onClick={() => props.setStep(2)}>Next step</Button>
            </Row>}
        </>
    )
}

const LabelDS = (props) => {
    const [savedCollections, setSavedCollections] = useState({});
    const [currentCollection, setCurrentCollection] = useState({});
    const [allFindings, setAllFindings] = useState(props.allFindings);

    // --- Functions ---
    const handleMoveFinding = (isAddOperation, id) => {
        if (isAddOperation) {
            setCurrentCollection({...currentCollection, [id]: allFindings[id]});
            const {[id]: removedFinding, ...updatedFindings} = allFindings;
            setAllFindings(updatedFindings);
        } else {
            setAllFindings({...allFindings, [id]: currentCollection[id]});
            const {[id]: removedFinding, ...updatedCurrentCollection} = currentCollection;
            setCurrentCollection(updatedCurrentCollection);
        }
    };
    const handleSaveCollection = () => {
        const latestIndex = Object.keys(savedCollections).length;
        setSavedCollections({...savedCollections, [latestIndex]: currentCollection});
        setCurrentCollection({});
    };
    const handleEditCollection = (id) => {
        // prevent current collection from being lost
        const tempCurrentCollection = currentCollection;
        setAllFindings({...allFindings, tempCurrentCollection});
        // clear and populate current collection with collection being edited
        setCurrentCollection(savedCollections[id]);
        // remove entry from saved collections list
        const {[id]: removedSavedCollection, ...updatedSavedCollection} = savedCollections;
        setSavedCollections(updatedSavedCollection);
    };
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
                        <Button variant={"primary"} onClick={() => {handleSaveCollection()}}>Save collection</Button>
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
                                <tr>
                                    <td>
                                        <Button
                                            onClick={() => {handleMoveFinding(true, id)}}
                                            size={"sm"}
                                            variant="secondary">←
                                        </Button>
                                    </td>
                                    <td key={id}>
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
                        <th>Actions</th>
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
                                    <Button variant={"danger"}>🗑</Button>
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
                <Button variant="success">Download dataset</Button>
            </Row>}
        </>
    )
}