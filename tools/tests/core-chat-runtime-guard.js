const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function makeClassList() {
  const values = new Set();
  return {
    values,
    add(value) { values.add(value); },
    remove(value) { values.delete(value); },
    contains(value) { return values.has(value); },
    toggle(value, force) {
      const shouldAdd = typeof force === "boolean" ? force : !values.has(value);
      if (shouldAdd) values.add(value);
      else values.delete(value);
      return shouldAdd;
    }
  };
}

function makeElement(tagName) {
  let ownInnerText = "";
  const element = {
    tagName,
    className: "",
    value: "",
    scrollTop: 0,
    scrollHeight: 0,
    firstChild: null,
    children: [],
    style: {},
    classList: makeClassList(),
    attributes: {},
    listeners: {},
    appendChild(child) {
      this.children.push(child);
      this.firstChild = this.children[0] || null;
      this.scrollHeight = this.children.length * 10;
      return child;
    },
    removeChild(child) {
      const index = this.children.indexOf(child);
      if (index !== -1) this.children.splice(index, 1);
      this.firstChild = this.children[0] || null;
      this.scrollHeight = this.children.length * 10;
      return child;
    },
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
    addEventListener(type, handler) {
      this.listeners[type] = handler;
    },
    focus() {},
    select() {}
  };
  Object.defineProperty(element, "innerText", {
    get() {
      if (this.children.length) return this.children.map((child) => child.innerText || "").join("");
      return ownInnerText;
    },
    set(value) {
      ownInnerText = String(value);
    }
  });
  return element;
}

function makeDocument() {
  const elements = {
    "chat-log": makeElement("div"),
    "chat-box": makeElement("div"),
    "chat-copy-btn": makeElement("button"),
    "chat-expand-toggle": makeElement("button")
  };
  const body = makeElement("body");
  return {
    body,
    elements,
    getElementById(id) {
      return elements[id] || null;
    },
    createElement(tagName) {
      return makeElement(tagName);
    },
    execCommand(command) {
      return command === "copy";
    }
  };
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const runtimePath = path.join(root, "src", "js", "core-chat-runtime.js");
  const runtimeSource = fs.readFileSync(runtimePath, "utf8");
  const coreSource = fs.readFileSync(path.join(root, "src", "js", "core.js"), "utf8");
  const manifestSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-script-manifest.ts"), "utf8");

  assert(runtimeSource.includes("window.CoreChatRuntime"), "core chat runtime should expose a window runtime");
  assert(runtimeSource.includes("function addChatMessage"), "core chat runtime should own chat message DOM writes");
  assert(runtimeSource.includes("function copyChatLogTextToClipboard"), "core chat runtime should own chat copy behavior");
  assert(runtimeSource.includes("CHAT_EXPANDED_STORAGE_KEY"), "core chat runtime should own chat expansion persistence key");
  assert(runtimeSource.includes("function showPlayerOverheadText"), "core chat runtime should own overhead text state updates");
  assert(manifestSource.indexOf('id: "core-chat-runtime"') !== -1, "legacy manifest should include the core chat runtime");
  assert(
    manifestSource.indexOf('id: "core-chat-runtime"') < manifestSource.indexOf('id: "core"'),
    "legacy manifest should load core chat runtime before core.js"
  );
  assert(coreSource.includes("const coreChatRuntime = window.CoreChatRuntime || null;"), "core.js should resolve the core chat runtime");
  assert(coreSource.includes("coreChatRuntime.addChatMessage"), "core.js should delegate chat messages");
  assert(coreSource.includes("coreChatRuntime.initChatControls"), "core.js should delegate chat controls");
  assert(coreSource.includes("coreChatRuntime.showPlayerOverheadText"), "core.js should delegate overhead text updates");
  assert(!coreSource.includes("document.getElementById('chat-log')"), "core.js should not query the chat log DOM directly");
  assert(!coreSource.includes("line.className = `chat-line ${type}`"), "core.js should not build chat line DOM nodes");
  assert(!coreSource.includes("navigator.clipboard.writeText(chatText)"), "core.js should not own clipboard copy behavior");
  assert(!coreSource.includes("localStorage.setItem('osrsClone.chatExpanded'"), "core.js should not own chat expansion persistence");

  const sandbox = { window: {}, document: null, navigator: {}, Date, Array, Set };
  vm.createContext(sandbox);
  vm.runInContext(runtimeSource, sandbox, { filename: runtimePath });
  const runtime = sandbox.window.CoreChatRuntime;
  assert(runtime, "core chat runtime should execute in isolation");

  const documentRef = makeDocument();
  runtime.addChatMessage("Hello there", "game", { documentRef });
  runtime.addChatMessage("Careful", "warn", { documentRef });
  const chatLog = documentRef.getElementById("chat-log");
  assert(chatLog.children.length === 2, "runtime should append chat lines");
  assert(chatLog.children[0].innerText === "[Game]Hello there", "runtime should keep message text in child spans");
  assert(runtime.getChatLogCopyText({ documentRef }) === "[Game]Hello there\n[Warn]Careful", "runtime should format chat copy text from rendered lines");

  const windowRef = {
    localStorage: {
      values: {},
      getItem(key) { return this.values[key] || null; },
      setItem(key, value) { this.values[key] = value; }
    }
  };
  runtime.setChatBoxExpanded(true, { documentRef, windowRef });
  assert(documentRef.getElementById("chat-box").classList.contains("chat-expanded"), "runtime should toggle expanded chat class");
  assert(documentRef.getElementById("chat-expand-toggle").innerText === "Collapse", "runtime should update expand button text");
  assert(windowRef.localStorage.values["osrsClone.chatExpanded"] === "1", "runtime should persist expanded state");

  let copiedText = "";
  const navigatorRef = { clipboard: { writeText: async (text) => { copiedText = text; } } };
  return runtime.copyChatLogTextToClipboard({
    documentRef,
    navigatorRef,
    addChatMessage: (message, tone) => runtime.addChatMessage(message, tone, { documentRef })
  }).then((copied) => {
    assert(copied === true, "runtime should copy chat text through navigator clipboard");
    assert(copiedText === "[Game]Hello there\n[Warn]Careful", "runtime should copy the current chat transcript");

    const overhead = { text: "", expiresAt: 0 };
    runtime.showPlayerOverheadText({ playerOverheadText: overhead, text: "Yo", durationMs: 100, nowMs: 50 });
    assert(overhead.text === "Yo" && overhead.expiresAt === 150, "runtime should update overhead text state");

    console.log("Core chat runtime guard passed.");
  });
}

Promise.resolve()
  .then(run)
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
