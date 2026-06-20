'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const COUNT = 120;
const CONNECTIONS = 60;

function Field() {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const elapsed = useRef(0);

  const { positions, velocities, phases } = useMemo(() => {
    const seed = (n: number) => Math.sin(n * 127.1 + 311.7) * 0.5 + 0.5;
    const pos = new Float32Array(COUNT * 3);
    const vel = new Float32Array(COUNT * 3);
    const ph = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (seed(i * 3 + 1) - 0.5) * 28;
      pos[i * 3 + 1] = (seed(i * 3 + 2) - 0.5) * 12;
      pos[i * 3 + 2] = (seed(i * 3 + 3) - 0.5) * 8;
      vel[i * 3] = (seed(i * 5 + 1) - 0.5) * 0.012;
      vel[i * 3 + 1] = (seed(i * 5 + 2) - 0.5) * 0.008;
      vel[i * 3 + 2] = 0;
      ph[i] = seed(i * 7) * Math.PI * 2;
    }
    return { positions: pos, velocities: vel, phases: ph };
  }, []);

  const colors = useMemo(() => {
    const col = new Float32Array(COUNT * 3);
    const blue = new THREE.Color('#1B6AFF');
    const orange = new THREE.Color('#FF6B1A');
    for (let i = 0; i < COUNT; i++) {
      const c = i % 6 === 0 ? orange : blue;
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    return col;
  }, []);

  const linePositions = useMemo(() => new Float32Array(CONNECTIONS * 2 * 3), []);
  const lineColors = useMemo(() => new Float32Array(CONNECTIONS * 2 * 3), []);

  const pointGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return g;
  }, [positions, colors]);

  const lineGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));
    g.setDrawRange(0, 0);
    return g;
  }, [linePositions, lineColors]);

  useFrame((_, delta) => {
    elapsed.current += delta;

    // Drift particles
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] += velocities[i * 3] + Math.sin(elapsed.current * 0.3 + phases[i]) * 0.003;
      positions[i * 3 + 1] += velocities[i * 3 + 1] + Math.cos(elapsed.current * 0.2 + phases[i]) * 0.002;

      // Wrap around
      if (positions[i * 3] > 14) positions[i * 3] = -14;
      if (positions[i * 3] < -14) positions[i * 3] = 14;
      if (positions[i * 3 + 1] > 6) positions[i * 3 + 1] = -6;
      if (positions[i * 3 + 1] < -6) positions[i * 3 + 1] = 6;
    }

    if (pointsRef.current) {
      (pointGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    }

    // Build connections between nearby particles
    let lineCount = 0;
    const linePosAttr = lineGeo.attributes.position as THREE.BufferAttribute;
    const lineColAttr = lineGeo.attributes.color as THREE.BufferAttribute;
    const MAX_DIST = 4.5;

    outer:
    for (let i = 0; i < COUNT; i++) {
      for (let j = i + 1; j < COUNT; j++) {
        if (lineCount >= CONNECTIONS) break outer;
        const dx = positions[i*3] - positions[j*3];
        const dy = positions[i*3+1] - positions[j*3+1];
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < MAX_DIST) {
          const fade = (1 - dist / MAX_DIST) * 0.4;
          const ci = colors[i * 3], cg = colors[i * 3 + 1], cb = colors[i * 3 + 2];
          linePosAttr.setXYZ(lineCount * 2, positions[i*3], positions[i*3+1], positions[i*3+2]);
          linePosAttr.setXYZ(lineCount * 2 + 1, positions[j*3], positions[j*3+1], positions[j*3+2]);
          lineColAttr.setXYZ(lineCount * 2, ci * fade, cg * fade, cb * fade);
          lineColAttr.setXYZ(lineCount * 2 + 1, ci * fade * 0.3, cg * fade * 0.3, cb * fade * 0.3);
          lineCount++;
        }
      }
    }
    linePosAttr.needsUpdate = true;
    lineColAttr.needsUpdate = true;
    lineGeo.setDrawRange(0, lineCount * 2);
  });

  return (
    <>
      <points ref={pointsRef} geometry={pointGeo}>
        <pointsMaterial vertexColors size={0.12} transparent opacity={0.55} sizeAttenuation />
      </points>
      <lineSegments ref={linesRef} geometry={lineGeo}>
        <lineBasicMaterial vertexColors transparent />
      </lineSegments>
    </>
  );
}

export default function ParticleField() {
  return (
    <Canvas
      camera={{ position: [0, 0, 12], fov: 75 }}
      style={{ background: 'transparent', position: 'absolute', inset: 0 }}
      gl={{ antialias: false, alpha: true }}
    >
      <Field />
    </Canvas>
  );
}
