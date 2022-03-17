const SecurityTools = {
    "trivy": {
        "name": "Trivy",
        "processingFunction": (data, startIndex) => {
            const parsedData = JSON.parse(data);
            let findingsTemp = {};
            for (const target of Object.values(parsedData)) {
                if (!target.hasOwnProperty("Vulnerabilities")) continue;
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
    "anchore": {
        "name": "Anchore",
        "processingFunction": (data, startIndex) => {
            const parsedData = JSON.parse(data);
            let findingsTemp = {};
            for (const vulnerability of Object.values(parsedData["vulnerabilities"])) {
                findingsTemp[startIndex++] = vulnerability;
            }
            return {
                "findingsTemp": findingsTemp,
                "endIndex": startIndex
            }
        },
    },
    "codeql": {
        "name": "CodeQL",
        "processingFunction": (data, startIndex) => {
            const parsedData = JSON.parse(data);
            let findingsTemp = {};
            for (const run of parsedData["runs"]) {
                for (const result of run["results"]) {
                    findingsTemp[startIndex++] = result;
                }
            }
            return {
                "findingsTemp": findingsTemp,
                "endIndex": startIndex
            }
        },
    },
    "semgrep": {
        "name": "Semgrep",
        "processingFunction": (data, startIndex) => {
            const parsedData = JSON.parse(data);
            let findingsTemp = {};
            for (const finding of parsedData) {
                findingsTemp[startIndex++] = finding;
            }
            return {
                "findingsTemp": findingsTemp,
                "endIndex": startIndex
            }
        },
    },
    "horusec": {
        "name": "Horusec",
        "processingFunction": (data, startIndex) => {
            const parsedData = JSON.parse(data);
            let findingsTemp = {};
            for (const finding of parsedData["analysisVulnerabilities"]) {
                findingsTemp[startIndex++] = finding;
            }
            return {
                "findingsTemp": findingsTemp,
                "endIndex": startIndex
            }
        },
    },
    "gitleaks": {
        "name": "Gitleaks",
        "processingFunction": (data, startIndex) => {
            const parsedData = JSON.parse(data);
            let findingsTemp = {};
            for (const finding of parsedData) {
                findingsTemp[startIndex++] = finding;
            }
            return {
                "findingsTemp": findingsTemp,
                "endIndex": startIndex
            }
        },
    },
    "sonarqube": {
        "name": "SonarQube",
        "processingFunction": (data, startIndex) => {
            const parsedData = JSON.parse(data);
            let findingsTemp = {};
            for (const issue of parsedData["issues"]) {
                findingsTemp[startIndex++] = issue;
            }
            return {
                "findingsTemp": findingsTemp,
                "endIndex": startIndex
            }
        },
    },
    "dependency_checker": {
        "name": "Dependency Checker",
        "processingFunction": (data, startIndex) => {
            const parsedData = JSON.parse(data);
            let findingsTemp = {};
            for (const exception of parsedData["scanInfo"]["analysisExceptions"]) {
                findingsTemp[startIndex++] = exception;
            }
            return {
                "findingsTemp": findingsTemp,
                "endIndex": startIndex
            }
        },
    },
};
export default SecurityTools;