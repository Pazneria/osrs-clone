import * as THREE from "three";

import { exposeCombatBridge } from "./game/platform/combat-bridge";
import { exposeAnimationBridge } from "./game/platform/animation-bridge";
import { exposeLegacyBridge } from "./game/platform/legacy-bridge";
import { loadLegacyRuntime } from "./game/platform/legacy-loader";
import { legacyScriptManifest } from "./game/platform/legacy-script-manifest";
import { exposeLegacyWorldAdapter } from "./game/platform/legacy-world-adapter";
import { exposeRenderInputBridge } from "./game/platform/render-input-bridge";
import { exposeSessionBridge } from "./game/platform/session-bridge";
import { exposeUiDomainBridge } from "./game/platform/ui-domain-bridge";
import { exposeCodexLinkBridge } from "./game/platform/codex-link-bridge";

async function bootstrap(): Promise<void> {
  window.THREE = THREE;
  exposeAnimationBridge();
  exposeCombatBridge();
  exposeLegacyBridge();
  exposeRenderInputBridge();
  exposeSessionBridge();
  exposeLegacyWorldAdapter();
  exposeUiDomainBridge();
  exposeCodexLinkBridge();
  await loadLegacyRuntime(legacyScriptManifest);
}

void bootstrap();
