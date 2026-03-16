const fs = require("fs");
const path = require("path");
const { loadTsModule } = require("./ts-module-loader");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function createFakeReq(method, url, body = "") {
  return {
    method,
    url,
    on(event, listener) {
      if (event === "data" && body) listener(body);
      if (event === "end") listener();
    }
  };
}

function createFakeRes() {
  return {
    statusCode: 200,
    headers: {},
    body: "",
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end(body = "") {
      this.body = body;
    }
  };
}

async function run() {
  const root = path.resolve(__dirname, "..", "..");
  const bridge = loadTsModule(path.join(root, "src", "game", "animation", "dev-bridge.ts"));
  const projectRoot = path.join(root, "tmp", "animation-dev-bridge-project");
  const clipsDir = path.join(projectRoot, "src", "game", "animation", "clips", "player");
  fs.mkdirSync(clipsDir, { recursive: true });
  const sourcePath = "src/game/animation/clips/player/test.json";
  const clipFile = path.join(projectRoot, sourcePath);
  fs.writeFileSync(clipFile, "{\n  \"clipId\": \"test\"\n}\n", "utf8");

  const middleware = bridge.createAnimationStudioDevMiddleware(projectRoot);

  const manifestRes = createFakeRes();
  await middleware(createFakeReq("GET", bridge.ANIMATION_STUDIO_MANIFEST_ROUTE), manifestRes, () => {});
  const manifestPayload = JSON.parse(manifestRes.body);
  assert(manifestPayload.writable === true, "manifest should report writable");
  assert(manifestPayload.clipSourceFiles.includes(sourcePath), "manifest should list clip source files");

  const nextSource = "{\n  \"clipId\": \"saved\"\n}\n";
  const saveRes = createFakeRes();
  await middleware(
    createFakeReq("POST", bridge.ANIMATION_STUDIO_SAVE_ROUTE, JSON.stringify({ sourcePath, sourceText: nextSource })),
    saveRes,
    () => {}
  );
  assert(saveRes.statusCode === 200, "save should succeed");
  assert(fs.readFileSync(clipFile, "utf8") === nextSource, "save should write updated clip text");

  const blockedRes = createFakeRes();
  await middleware(
    createFakeReq("POST", bridge.ANIMATION_STUDIO_SAVE_ROUTE, JSON.stringify({
      sourcePath: "../outside.json",
      sourceText: "{}"
    })),
    blockedRes,
    () => {}
  );
  assert(blockedRes.statusCode === 403, "save should block paths outside clips root");

  console.log("Animation dev bridge tests passed.");
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

