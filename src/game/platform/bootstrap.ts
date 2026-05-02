import * as THREE from "three";

import { exposeAnimationBridge } from "./animation-bridge";
import { exposeCodexLinkBridge } from "./codex-link-bridge";
import { exposeCombatBridge } from "./combat-bridge";
import { exposeLegacyBridge } from "./legacy-bridge";
import { loadLegacyRuntime } from "./legacy-loader";
import { legacyScriptManifest } from "./legacy-script-manifest";
import { exposeLegacyWorldAdapter } from "./legacy-world-adapter";
import { exposeRenderInputBridge } from "./render-input-bridge";
import { exposeSessionBridge } from "./session-bridge";
import { exposeUiDomainBridge } from "./ui-domain-bridge";

type PlatformBridgeInitializer = () => void;

const platformBridgeInitializers: ReadonlyArray<PlatformBridgeInitializer> = [
  exposeAnimationBridge,
  exposeCombatBridge,
  exposeLegacyBridge,
  exposeRenderInputBridge,
  exposeSessionBridge,
  exposeLegacyWorldAdapter,
  exposeUiDomainBridge,
  exposeCodexLinkBridge
];

export function exposePlatformBridges(): void {
  platformBridgeInitializers.forEach((initializeBridge) => initializeBridge());
}

export async function bootstrapGamePlatform(): Promise<void> {
  window.THREE = THREE;
  exposePlatformBridges();
  await loadLegacyRuntime(legacyScriptManifest);
}
