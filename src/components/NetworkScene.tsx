'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const NODE_COUNT = 42;
const MAX_EDGE_DIST = 3.2;
const PULSE_COUNT = 14;
const RADIUS = 3.8;

function NetworkContent() {
  const groupRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Points>(null);
  const elapsed = useRef(0);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  // Nodes distributed on a sphere via golden ratio spiral
  const nodes = useMemo(() =>
    Array.from({ length: NODE_COUNT }, (_, i) => {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / NODE_COUNT);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      return new THREE.Vector3(
        RADIUS * Math.sin(phi) * Math.cos(theta),
        RADIUS * Math.sin(phi) * Math.sin(theta),
        RADIUS * Math.cos(phi),
      );
    }),
  []);

  // Edges between close nodes
  const edges = useMemo(() => {
    const e: [number, number][] = [];
    for (let i = 0; i < NODE_COUNT; i++)
      for (let j = i + 1; j < NODE_COUNT; j++)
        if (nodes[i].distanceTo(nodes[j]) < MAX_EDGE_DIST)
          e.push([i, j]);
    return e;
  }, [nodes]);

  // Edge geometry
  const edgeGeo = useMemo(() => {
    const v: number[] = [];
    edges.forEach(([i, j]) => {
      const a = nodes[i], b = nodes[j];
      v.push(a.x, a.y, a.z, b.x, b.y, b.z);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    return g;
  }, [edges, nodes]);

  // Node geometry with colors
  const nodeGeo = useMemo(() => {
    const pos: number[] = [], col: number[] = [];
    const blue = new THREE.Color('#1B6AFF');
    const orange = new THREE.Color('#FF6B1A');
    nodes.forEach((n, i) => {
      pos.push(n.x, n.y, n.z);
      const c = i % 7 === 0 ? orange : blue;
      col.push(c.r, c.g, c.b);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    return g;
  }, [nodes]);

  // Pulse state
  const pulseState = useMemo(() =>
    Array.from({ length: PULSE_COUNT }, (_, i) => ({
      edgeIdx: (i * 3) % edges.length,
      t: i / PULSE_COUNT,
      speed: 0.28 + Math.random() * 0.35,
    })),
  [edges]);

  const pulsePosArray = useMemo(() => new Float32Array(PULSE_COUNT * 3), []);
  const pulseGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pulsePosArray, 3));
    return g;
  }, [pulsePosArray]);

  useFrame((_, delta) => {
    elapsed.current += delta;

    // Slow auto-rotate
    if (groupRef.current) {
      groupRef.current.rotation.y = elapsed.current * 0.18;
      groupRef.current.rotation.x = Math.sin(elapsed.current * 0.12) * 0.25;
    }

    // Animate pulses along edges
    if (pulseRef.current && edges.length > 0) {
      const posAttr = pulseGeo.attributes.position as THREE.BufferAttribute;
      pulseState.forEach((p, i) => {
        p.t += delta * p.speed;
        if (p.t > 1) {
          p.t -= 1;
          p.edgeIdx = Math.floor(Math.random() * edges.length);
        }
        const [ai, bi] = edges[p.edgeIdx];
        tmp.lerpVectors(nodes[ai], nodes[bi], p.t);
        posAttr.setXYZ(i, tmp.x, tmp.y, tmp.z);
      });
      posAttr.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Edge network */}
      <lineSegments geometry={edgeGeo}>
        <lineBasicMaterial color="#1B6AFF" transparent opacity={0.18} />
      </lineSegments>

      {/* Nodes */}
      <points geometry={nodeGeo}>
        <pointsMaterial vertexColors size={0.16} transparent opacity={0.85} sizeAttenuation />
      </points>

      {/* Traveling delivery pulses */}
      <points ref={pulseRef} geometry={pulseGeo}>
        <pointsMaterial color="#FF6B1A" size={0.26} transparent opacity={0.95} sizeAttenuation />
      </points>
    </group>
  );
}

export default function NetworkScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 9], fov: 52 }}
      style={{ background: 'transparent' }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={1.5} color="#1B6AFF" />
      <pointLight position={[-5, -3, 3]} intensity={1} color="#FF6B1A" />
      <NetworkContent />
    </Canvas>
  );
}
