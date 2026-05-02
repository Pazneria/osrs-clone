import type { LegacyScriptEntry } from "./legacy-script-entry";

declare global {
  interface Window {
    __legacyRuntimeLoaded?: boolean;
  }
}

function injectClassicScript(entry: LegacyScriptEntry): void {
  const script = document.createElement("script");
  script.type = "text/javascript";
  script.dataset.legacyScript = entry.id;
  script.text = `${entry.code}\n//# sourceURL=${entry.filename}`;
  document.head.appendChild(script);
}

export async function loadLegacyRuntime(entries: ReadonlyArray<LegacyScriptEntry>): Promise<void> {
  if (window.__legacyRuntimeLoaded || document.querySelector("script[data-legacy-script]")) {
    window.__legacyRuntimeLoaded = true;
    return;
  }
  window.__legacyRuntimeLoaded = true;
  for (let i = 0; i < entries.length; i++) {
    injectClassicScript(entries[i]);
  }
}
