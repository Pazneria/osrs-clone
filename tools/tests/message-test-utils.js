function getContextMessages(context) {
  return context && Array.isArray(context._messages) ? context._messages : [];
}

function countMessages(context, expectedText) {
  return getContextMessages(context).filter((entry) => entry && entry.message === expectedText).length;
}

function expectMessage(context, expectedText, testName) {
  if (countMessages(context, expectedText) === 0) throw new Error(testName + ': expected message "' + expectedText + '"');
}

function expectMessageContaining(context, expectedFragment, testName) {
  const hasMessage = getContextMessages(context).some(
    (entry) => entry && typeof entry.message === "string" && entry.message.includes(expectedFragment)
  );
  if (!hasMessage) throw new Error(testName + ': expected message containing "' + expectedFragment + '"');
}

function expectMessageTone(context, expectedText, expectedTone, testName) {
  const hasTone = getContextMessages(context).some(
    (entry) => entry && entry.message === expectedText && entry.tone === expectedTone
  );
  if (!hasTone) throw new Error(testName + ': expected "' + expectedText + '" with tone "' + expectedTone + '"');
}

module.exports = {
  countMessages,
  expectMessage,
  expectMessageContaining,
  expectMessageTone
};
