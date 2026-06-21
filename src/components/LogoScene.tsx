'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import FawranLogoAnimated from './FawranLogoAnimated';

const ORBIT_COUNT = 60;
const ACCENT_COUNT = 12;

function LogoAnimation() {
  const orbitRef = useRef<THREE.Points>(null);
  const accentRef = useRef<THREE.Points>(null);
  const ring1Ref = useRef<THREE.Line>(null);
  const ring2Ref = useRef<THREE.Line>(null);
  const elapsed = useRef(0);

  // Orbit particles on elliptical paths
  const orbitData = useMemo(() =>
    Array.from({ length: ORBIT_COUNT }, (_, i) => ({
      angle: (i / ORBIT_COUNT) * Math.PI * 2,
      rx: 3.2 + (i % 3) * 0.4,
      ry: 1.1 + (i % 2) * 0.3,
      tilt: (i % 5) * 0.22,
      speed: 0.18 + (i % 4) * 0.06,
    })),
  []);

  const orbitPos = useMemo(() => new Float32Array(ORBIT_COUNT * 3), []);
  const orbitGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(orbitPos, 3));
    return g;
  }, [orbitPos]);

  // Accent orange particles — slower, further out
  const accentData = useMemo(() =>
    Array.from({ length: ACCENT_COUNT }, (_, i) => ({
      angle: (i / ACCENT_COUNT) * Math.PI * 2,
      rx: 4.2 + (i % 3) * 0.6,
      ry: 0.6,
      tilt: (i * 0.5),
      speed: 0.07 + (i % 3) * 0.03,
    })),
  []);

  const accentPos = useMemo(() => new Float32Array(ACCENT_COUNT * 3), []);
  const accentGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(accentPos, 3));
    return g;
  }, [accentPos]);

  // Two subtle ring geometries
  const ringGeo1 = useMemo(() => {
    const pts = Array.from({ length: 65 }, (_, i) => {
      const a = (i / 64) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(a) * 3.0, Math.sin(a) * 1.0, 0);
    });
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  const ringGeo2 = useMemo(() => {
    const pts = Array.from({ length: 65 }, (_, i) => {
      const a = (i / 64) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(a) * 4.0, Math.sin(a) * 0.55, 0);
    });
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  useFrame((_, delta) => {
    elapsed.current += delta;
    const t = elapsed.current;

    // Update orbit particles
    const oa = orbitGeo.attributes.position as THREE.BufferAttribute;
    orbitData.forEach((d, i) => {
      const a = d.angle + t * d.speed;
      const x = Math.cos(a) * d.rx;
      const y = Math.sin(a) * d.ry;
      const xr = x;
      const yr = y * Math.cos(d.tilt);
      const zr = y * Math.sin(d.tilt);
      oa.setXYZ(i, xr, yr, zr);
    });
    oa.needsUpdate = true;

    // Update accent particles
    const aa = accentGeo.attributes.position as THREE.BufferAttribute;
    accentData.forEach((d, i) => {
      const a = d.angle + t * d.speed;
      const x = Math.cos(a) * d.rx;
      const y = Math.sin(a) * d.ry;
      const xr = x;
      const yr = y * Math.cos(d.tilt);
      const zr = y * Math.sin(d.tilt);
      aa.setXYZ(i, xr, yr, zr);
    });
    aa.needsUpdate = true;

    // Slowly tilt the rings
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = Math.sin(t * 0.15) * 0.5 + 0.4;
      ring1Ref.current.rotation.y = t * 0.08;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = Math.cos(t * 0.12) * 0.4 + 0.6;
      ring2Ref.current.rotation.y = -t * 0.06;
    }
  });

  return (
    <>
      {/* Orbit particles */}
      <points ref={orbitRef} geometry={orbitGeo}>
        <pointsMaterial color="#1B6AFF" size={0.1} transparent opacity={0.7} sizeAttenuation />
      </points>

      {/* Accent orange particles */}
      <points ref={accentRef} geometry={accentGeo}>
        <pointsMaterial color="#FF6B1A" size={0.18} transparent opacity={0.85} sizeAttenuation />
      </points>

      {/* Ring 1 */}
      {/* @ts-expect-error – line is valid R3F primitive */}
      <line ref={ring1Ref} geometry={ringGeo1}>
        <lineBasicMaterial color="#1B6AFF" transparent opacity={0.15} />
      </line>

      {/* Ring 2 */}
      {/* @ts-expect-error – line is valid R3F primitive */}
      <line ref={ring2Ref} geometry={ringGeo2}>
        <lineBasicMaterial color="#1B6AFF" transparent opacity={0.1} />
      </line>
    </>
  );
}

export default function LogoScene() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Three.js animation layer */}
      <Canvas
        camera={{ position: [0, 0, 8], fov: 55 }}
        style={{ position: 'absolute', inset: 0, background: 'transparent' }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.6} />
        <LogoAnimation />
      </Canvas>

      {/* Logo centered on top */}
      <div className="relative z-10 flex items-center justify-center">
        <FawranLogoAnimated width={320} />
      </div>
    </div>
  );
}
