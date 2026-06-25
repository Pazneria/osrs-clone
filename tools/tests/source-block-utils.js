function readBlockBody(source, bodyStart) {
  if (bodyStart === -1) return "";
  let depth = 0;
  for (let i = bodyStart; i < source.length; i++) {
    const char = source[i];
    if (char === "{") depth += 1;
    else if (char === "}") depth -= 1;
    if (depth === 0) return source.slice(bodyStart + 1, i);
  }
  return "";
}

function getFunctionBody(source, functionName) {
  const startToken = `function ${functionName}(`;
  const startIndex = source.indexOf(startToken);
  if (startIndex === -1) return "";
  const paramsEnd = source.indexOf(")", startIndex);
  const bodyStart = paramsEnd === -1 ? -1 : source.indexOf("{", paramsEnd);
  return readBlockBody(source, bodyStart);
}

function getBlockBody(source, startToken) {
  const startIndex = source.indexOf(startToken);
  if (startIndex === -1) return "";
  return readBlockBody(source, source.indexOf("{", startIndex));
}

function countOccurrences(source, pattern) {
  return source.split(pattern).length - 1;
}

module.exports = {
  countOccurrences,
  getBlockBody,
  getFunctionBody
};
