const cheerio = require("cheerio");

const scrapeDataFromUrl = async (url) => {
    if (url.includes("https://nvd.nist.gov/")) {
        // get data using nvd api
        const cveId = url.split("/").pop();
        const queryUrl = `/nvd-endpoint/${cveId}`;
        let response = await fetch(queryUrl);
        if (response.ok) {
            response = await response.json();
            let result = [], description_temp;
            for (const cveItem of response["result"]["CVE_Items"]) {
                description_temp = [];
                // multiple description objects exist, so aggregate information from them
                for(const descriptionData of cveItem["cve"]["description"]["description_data"]) {
                    description_temp.push(descriptionData["value"]);
                }
                result.push(description_temp.join(". "));
            }
            // return aggregate of all descriptions as a single sentence
            return result.join(". ");
        }
    } else if (url.includes("https://github.com/advisories/")) {
        // scrape github advisory data
        const vulnerabilityId = url.split("/").pop();
        const queryUrl = `/github-advisories-endpoint/${vulnerabilityId}`;
        let response = await fetch(queryUrl);
        if (response.ok) {
            response = await response.text();
            const $ = await cheerio.load(response);
            let result = [];
            // get all description elements
            const descriptionElements = await $("div.markdown-body.comment-body.p-0");
            for (const descriptionElement of descriptionElements) {
                const pElements = await $("p", descriptionElement);
                for (const pElement of pElements) {
                    result.push(await $(pElement).text());
                }
            }
            return result.join(" ");
        }
    }
    return "error scraping data";
};

const scrapedDescriptionKey = "scraped_description";

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
        "scrapingFunction": async (finding) => {
            finding[scrapedDescriptionKey] = await scrapeDataFromUrl(finding["url"]);
        }
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
            for (const dependency of parsedData["dependencies"]) {
                if (dependency.hasOwnProperty("vulnerabilities")) {
                    for (const vulnerability of dependency["vulnerabilities"]) {
                        findingsTemp[startIndex++] = vulnerability;
                    }
                }
            }
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