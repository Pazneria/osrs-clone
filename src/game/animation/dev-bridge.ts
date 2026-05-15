declare const require: (specifier: string) => any;

const fs = require("fs");
const path = require("path");
import {
  ANIMATION_STUDIO_CLIPS_ROOT,
  ANIMATION_STUDIO_CLIP_ROUTE,
  ANIMATION_STUDIO_MANIFEST_ROUTE,
  ANIMATION_STUDIO_SAVE_ROUTE
} from "./persistence";
export {
  ANIMATION_STUDIO_CLIPS_ROOT,
  ANIMATION_STUDIO_CLIP_ROUTE,
  ANIMATION_STUDIO_MANIFEST_ROUTE,
  ANIMATION_STUDIO_SAVE_ROUTE
} from "./persistence";

function collectRequestBody(req: { on: (event: string, listener: (...args: any[]) => void) => void }): Promise<string> {
  return new Promise((resolve) => {
    const chunks: string[] = [];
    req.on("data", (chunk: any) => {
      chunks.push(typeof chunk === "string" ? chunk : chunk.toString("utf8"));
    });
    req.on("end", () => resolve(chunks.join("")));
  });
}

function listAnimationClipSourceFiles(projectRoot: string): string[] {
  const clipsRoot = path.resolve(projectRoot, ANIMATION_STUDIO_CLIPS_ROOT);
  if (!fs.existsSync(clipsRoot)) return [];
  const results: string[] = [];

  function walk(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (let i = 0; i < entries.length; i += 1) {
      const entry = entries[i];
      const absolutePath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(absolutePath);
        continue;
      }
      if (entry.isFile() && entry.name.endsWith(".json")) {
        results.push(path.relative(projectRoot, absolutePath).replaceAll("\\", "/"));
      }
    }
  }

  walk(clipsRoot);
  results.sort();
  return results;
}

function resolveAnimationClipWritePath(projectRoot: string, sourcePath: string): string | null {
  const clipsRoot = path.resolve(projectRoot, ANIMATION_STUDIO_CLIPS_ROOT);
  const requested = path.resolve(projectRoot, sourcePath);
  const normalizedRoot = `${clipsRoot}${path.sep}`;
  if (requested === clipsRoot || requested.startsWith(normalizedRoot)) return requested;
  return null;
}

function readAnimationClipSourcePathFromRequest(req: { url?: string }): string {
  const requestUrl = String(req.url || "");
  try {
    const parsed = new URL(requestUrl, "http://animation-studio.local");
    return typeof parsed.searchParams.get("sourcePath") === "string"
      ? String(parsed.searchParams.get("sourcePath") || "")
      : "";
  } catch (error) {
    void error;
    return "";
  }
}

export function createAnimationStudioDevMiddleware(projectRoot: string) {
  return async function animationStudioDevMiddleware(
    req: any,
    res: any,
    next: any
  ): Promise<void> {
    const requestUrl = String(req.url || "");
    if (req.method === "GET" && requestUrl.startsWith(ANIMATION_STUDIO_MANIFEST_ROUTE)) {
      const payload = JSON.stringify({
        writable: true,
        clipSourceFiles: listAnimationClipSourceFiles(projectRoot)
      });
      res.setHeader("Content-Type", "application/json");
      res.end(payload);
      return;
    }

    if (req.method === "GET" && requestUrl.startsWith(ANIMATION_STUDIO_CLIP_ROUTE)) {
      const sourcePath = readAnimationClipSourcePathFromRequest(req);
      const resolvedPath = resolveAnimationClipWritePath(projectRoot, sourcePath);
      if (!resolvedPath || !fs.existsSync(resolvedPath)) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: false, error: "clip_not_found" }));
        return;
      }
      try {
        const clip = JSON.parse(fs.readFileSync(resolvedPath, "utf8"));
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: true, sourcePath, clip }));
      } catch (error) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({
          ok: false,
          error: error instanceof Error ? error.message : "clip_read_failed"
        }));
      }
      return;
    }

    if (req.method === "POST" && requestUrl.startsWith(ANIMATION_STUDIO_SAVE_ROUTE)) {
      const rawBody = await collectRequestBody(req);
      try {
        const payload = JSON.parse(rawBody) as { sourcePath?: string; sourceText?: string };
        const sourcePath = typeof payload.sourcePath === "string" ? payload.sourcePath : "";
        const sourceText = typeof payload.sourceText === "string" ? payload.sourceText : "";
        const resolvedPath = resolveAnimationClipWritePath(projectRoot, sourcePath);
        if (!resolvedPath) {
          res.statusCode = 403;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: false, error: "sourcePath_outside_clips_root" }));
          return;
        }
        fs.writeFileSync(resolvedPath, sourceText, "utf8");
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: true }));
      } catch (error) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({
          ok: false,
          error: error instanceof Error ? error.message : "invalid_payload"
        }));
      }
      return;
    }

    next();
  };
}
