function makeClassList(initial = []) {
  const values = new Set(initial);
  return {
    values,
    add(value) {
      values.add(value);
    },
    remove(value) {
      values.delete(value);
    },
    contains(value) {
      return values.has(value);
    },
    toggle(value, force) {
      const shouldAdd = typeof force === "boolean" ? force : !values.has(value);
      if (shouldAdd) values.add(value);
      else values.delete(value);
      return shouldAdd;
    }
  };
}

function makeClassNameList(element) {
  const readTokens = () => String(element.className || "")
    .split(/\s+/)
    .map((value) => value.trim())
    .filter(Boolean);
  const writeTokens = (tokens) => {
    element.className = tokens.join(" ");
  };

  return {
    get values() {
      return new Set(readTokens());
    },
    add(...classes) {
      const values = new Set(readTokens());
      classes.forEach((className) => {
        if (className) values.add(className);
      });
      writeTokens(Array.from(values));
    },
    remove(...classes) {
      const removeValues = new Set(classes.filter(Boolean));
      writeTokens(readTokens().filter((className) => !removeValues.has(className)));
    },
    contains(className) {
      return readTokens().includes(className);
    },
    toggle(className, force) {
      const values = new Set(readTokens());
      const shouldAdd = typeof force === "boolean" ? force : !values.has(className);
      if (shouldAdd) values.add(className);
      else values.delete(className);
      writeTokens(Array.from(values));
      return shouldAdd;
    }
  };
}

module.exports = {
  makeClassNameList,
  makeClassList
};
