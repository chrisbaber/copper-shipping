"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function Particles({ count = 3000 }) {
  const mesh = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Distribute particles in a cylinder that narrows into a tunnel
      const angle = Math.random() * Math.PI * 2;
      const z = (Math.random() - 0.3) * 12; // depth: -3.6 to 8.4
      // Radius shrinks as z increases (tunnel narrows toward the right)
      const maxRadius = 3.5 - z * 0.2;
      const radius = Math.max(0.1, maxRadius) * (0.3 + Math.random() * 0.7);
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = Math.sin(angle) * radius;
      pos[i * 3 + 2] = z;
    }
    return pos;
  }, [count]);

  const sizes = useMemo(() => {
    const s = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      s[i] = Math.random() * 2 + 0.5;
    }
    return s;
  }, [count]);

  useFrame((state) => {
    if (!mesh.current) return;
    const time = state.clock.elapsedTime;
    const posArray = mesh.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const x = posArray[i3];
      const y = posArray[i3 + 1];
      const z = posArray[i3 + 2];

      // Rotate particles around z-axis (spiral effect)
      const angle = Math.atan2(y, x);
      const radius = Math.sqrt(x * x + y * y);
      const speed = 0.15 + (1 / (radius + 0.5)) * 0.1;
      const newAngle = angle + speed * 0.016;

      posArray[i3] = Math.cos(newAngle) * radius;
      posArray[i3 + 1] = Math.sin(newAngle) * radius;

      // Slowly pull particles toward the tunnel center
      posArray[i3 + 2] = z + 0.005;

      // Reset particles that go too deep
      if (posArray[i3 + 2] > 10) {
        const resetAngle = Math.random() * Math.PI * 2;
        const resetRadius = 2 + Math.random() * 2;
        posArray[i3] = Math.cos(resetAngle) * resetRadius;
        posArray[i3 + 1] = Math.sin(resetAngle) * resetRadius;
        posArray[i3 + 2] = -4 + Math.random() * 2;
      }
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;
    // Gentle overall rotation
    mesh.current.rotation.z = time * 0.02;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#4488ff"
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function GridRings({ count = 8 }) {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.z = state.clock.elapsedTime * 0.03;
  });

  const rings = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const z = i * 1.2 - 2;
      const radius = Math.max(0.5, 3.5 - z * 0.22);
      return { z, radius, key: i };
    });
  }, [count]);

  return (
    <group ref={group}>
      {rings.map((ring) => (
        <mesh key={ring.key} position={[0, 0, ring.z]}>
          <ringGeometry args={[ring.radius - 0.01, ring.radius, 64]} />
          <meshBasicMaterial
            color="#2255aa"
            transparent
            opacity={0.08}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

export function ParticleTunnel() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, -2], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Particles count={2500} />
        <GridRings count={10} />
      </Canvas>
      {/* Gradient overlay to fade edges */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f] via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-l from-[#0a0a0f]/80 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-[#0a0a0f]/60 pointer-events-none" />
    </div>
  );
}
