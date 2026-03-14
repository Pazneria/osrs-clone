import * as THREE from "three";

import { exposeCombatBridge } from "./game/platform/combat-bridge";
import { exposeLegacyBridge } from "./game/platform/legacy-bridge";
import { loadLegacyRuntime } from "./game/platform/legacy-loader";
import { legacyScriptManifest } from "./game/platform/legacy-script-manifest";
import { exposeLegacyWorldAdapter } from "./game/platform/legacy-world-adapter";
import { exposeRenderInputBridge } from "./game/platform/render-input-bridge";
import { exposeSessionBridge } from "./game/platform/session-bridge";
import { exposeUiDomainBridge } from "./game/platform/ui-domain-bridge";
import { exposeWikiLinkBridge } from "./game/platform/wiki-link-bridge";

async function bootstrap(): Promise<void> {
  window.THREE = THREE;
  exposeCombatBridge();
  exposeLegacyBridge();
  exposeRenderInputBridge();
  exposeSessionBridge();
  exposeLegacyWorldAdapter();
  exposeUiDomainBridge();
  exposeWikiLinkBridge();
  await loadLegacyRuntime(legacyScriptManifest);
}

void bootstrap();
