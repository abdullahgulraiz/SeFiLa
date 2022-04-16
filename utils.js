export const ChunkString = (str, length) => {
    return str.match(new RegExp('.{1,' + length + '}', 'g'));
};