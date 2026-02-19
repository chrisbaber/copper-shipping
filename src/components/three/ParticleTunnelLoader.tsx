"use client";

import dynamic from "next/dynamic";

const ParticleTunnel = dynamic(
  () => import("@/components/three/ParticleTunnel").then((mod) => mod.ParticleTunnel),
  { ssr: false }
);

export function ParticleTunnelLoader() {
  return <ParticleTunnel />;
}
