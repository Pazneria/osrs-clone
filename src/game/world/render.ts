import type { ServiceDescriptor } from "../contracts/world";

export function createStaticRenderPayload(services: ServiceDescriptor[]): {
  furnacesToRender: Array<Pick<ServiceDescriptor, "x" | "y" | "z" | "facingYaw" | "footprintW" | "footprintD">>;
  anvilsToRender: Array<Pick<ServiceDescriptor, "x" | "y" | "z" | "facingYaw">>;
} {
  const furnacesToRender: Array<Pick<ServiceDescriptor, "x" | "y" | "z" | "facingYaw" | "footprintW" | "footprintD">> = [];
  const anvilsToRender: Array<Pick<ServiceDescriptor, "x" | "y" | "z" | "facingYaw">> = [];

  for (let i = 0; i < services.length; i++) {
    const service = services[i];
    if (service.type === "FURNACE") {
      furnacesToRender.push({
        x: service.x,
        y: service.y,
        z: service.z,
        facingYaw: service.facingYaw,
        footprintW: service.footprintW,
        footprintD: service.footprintD
      });
    } else if (service.type === "ANVIL") {
      anvilsToRender.push({
        x: service.x,
        y: service.y,
        z: service.z,
        facingYaw: service.facingYaw
      });
    }
  }

  return { furnacesToRender, anvilsToRender };
}
