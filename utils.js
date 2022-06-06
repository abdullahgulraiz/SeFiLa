export const ChunkString = (str, length) => {
    return str.match(new RegExp('.{1,' + length + '}', 'g'));
};

export const DownloadJSONFile = (object, prefix = "sefila-download") => {
    // dump data into a string
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(object))}`;
    // create temporary link element to enable download
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `${prefix}-${new Date().toLocaleString()}.json`;
    link.click();
    // remove temporary link element
    link.remove();
};