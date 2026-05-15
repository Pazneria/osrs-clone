function createSequenceRng(values) {
  const queue = Array.isArray(values) ? values.slice() : [];
  return () => {
    if (queue.length === 0) return 0;
    return queue.shift();
  };
}

module.exports = {
  createSequenceRng
};
