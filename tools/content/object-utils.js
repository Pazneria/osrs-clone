function isObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function sortKeysDeep(value) {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (!isObject(value)) return value;

  const out = {};
  const keys = Object.keys(value).sort();
  for (const key of keys) out[key] = sortKeysDeep(value[key]);
  return out;
}

module.exports = {
  isObject,
  sortKeysDeep
};
