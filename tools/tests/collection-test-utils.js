const assert = require("assert");
const { cloneJson } = require("../lib/json-file-utils");

function assertHasIds(rows, idField, expectedIds, label) {
  const ids = new Set((Array.isArray(rows) ? rows : []).map((entry) => entry && entry[idField]));
  expectedIds.forEach((id) => {
    assert(ids.has(id), `${label} missing ${id}`);
  });
}

function makeSquareGrid(size, fill = 0) {
  return Array.from({ length: size }, () => Array(size).fill(fill));
}

function approximatelyEqual(actual, expected, epsilon = 1e-9) {
  return Math.abs(actual - expected) <= epsilon;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function assertRegex(source, regex, message) {
  assert(regex.test(source), message);
}

function expectThrown(fn, expectedMessageRegex, messages = {}) {
  let thrown = null;
  try {
    fn();
  } catch (error) {
    thrown = error;
  }

  assert(!!thrown, messages.expectedFailure || "expected function to throw");
  if (expectedMessageRegex) {
    const message = String(thrown && thrown.message ? thrown.message : thrown);
    const unexpectedMessage = typeof messages.unexpectedMessage === "function"
      ? messages.unexpectedMessage(message)
      : (messages.unexpectedMessage || `unexpected error message: ${message}`);
    assert(expectedMessageRegex.test(message), unexpectedMessage);
  }

  return thrown;
}

module.exports = {
  approximatelyEqual,
  assertHasIds,
  assertRegex,
  cloneJson,
  escapeRegex,
  expectThrown,
  makeSquareGrid
};
