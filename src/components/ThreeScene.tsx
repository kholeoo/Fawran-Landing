'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

// ─── Constants ───────────────────────────────────────────────────────────────
const COLS = 14;
const ROWS = 9;
const CELL = 1.05;
const TRAIL_LEN = 38;
const COURIER_COUNT = 8;
const C_PRIMARY = '#1B6AFF';
const C_ORANGE = '#FF6B1A';
const C_WHITE = '#ffffff';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function gw(col: number, row: number) {
  return new THREE.Vector3((col - COLS / 2) * CELL, 0, (row - ROWS / 2) * CELL);
}
function ri(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function lPath(fc: number, fr: number, tc: number, tr: number) {
  return [gw(fc, fr), gw(tc, fr), gw(tc, tr)];
}

// ─── Street Grid ─────────────────────────────────────────────────────────────
function StreetGrid() {
  const geo = useMemo(() => {
    const v: number[] = [];
    for (let r = 0; r <= ROWS; r++) {
      const a = gw(0, r), b = gw(COLS, r);
      v.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
    for (let c = 0; c <= COLS; c++) {
      const a = gw(c, 0), b = gw(c, ROWS);
      v.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    return g;
  }, []);

  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial color={C_PRIMARY} transparent opacity={0.18} />
    </lineSegments>
  );
}

// ─── Intersection Nodes ───────────────────────────────────────────────────────
function Nodes() {
  const ref = useRef<THREE.Points>(null);
  const elapsed = useRef(0);

  const geo = useMemo(() => {
    const pos: number[] = [], col: number[] = [];
    const blue = new THREE.Color(C_PRIMARY);
    const orange = new THREE.Color(C_ORANGE);
    const white = new THREE.Color(C_WHITE);
    for (let r = 0; r <= ROWS; r++) {
      for (let c = 0; c <= COLS; c++) {
        const p = gw(c, r);
        pos.push(p.x, p.y, p.z);
        const isHub = c % 4 === 0 && r % 4 === 0;
        const isMid = c % 2 === 0 && r % 2 === 0 && !isHub;
        const color = isHub ? orange : isMid ? white : blue;
        col.push(color.r, color.g, color.b);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    return g;
  }, []);

  useFrame((_, delta) => {
    elapsed.current += delta;
    if (ref.current) {
      (ref.current.material as THREE.PointsMaterial).opacity =
        0.55 + Math.sin(elapsed.current * 1.8) * 0.2;
    }
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial vertexColors size={0.065} transparent sizeAttenuation />
    </points>
  );
}

// ─── Hub Pulse Rings ─────────────────────────────────────────────────────────
function HubPulses() {
  const rings = useMemo(() => {
    const hubs: [number, number][] = [];
    for (let r = 0; r <= ROWS; r += 4)
      for (let c = 0; c <= COLS; c += 4)
        hubs.push([c, r]);
    return hubs;
  }, []);

  return (
    <>
      {rings.map(([c, r], i) => (
        <PulseRing key={i} position={gw(c, r)} phase={i * 0.7} />
      ))}
    </>
  );
}

function PulseRing({ position, phase }: { position: THREE.Vector3; phase: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const t = useRef(phase % (Math.PI * 2));

  useFrame((_, delta) => {
    t.current += delta * 0.9;
    const s = 1 + (Math.sin(t.current) * 0.5 + 0.5) * 1.2;
    const op = 0.6 - (Math.sin(t.current) * 0.5 + 0.5) * 0.55;
    if (ref.current) {
      ref.current.scale.setScalar(s);
      (ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, op);
    }
  });

  return (
    <mesh
      ref={ref}
      position={[position.x, position.y + 0.02, position.z]}
    >
      <ringGeometry args={[0.12, 0.18, 16]} />
      <meshBasicMaterial color={C_ORANGE} transparent side={THREE.DoubleSide} />
    </mesh>
  );
}

// ─── Courier ─────────────────────────────────────────────────────────────────
function Courier({ isOrange, startPhase }: { isOrange: boolean; startPhase: number }) {
  const dotRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const lineRef = useRef<THREE.Line>(null);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const c3 = useMemo(() => new THREE.Color(isOrange ? C_ORANGE : C_PRIMARY), [isOrange]);
  const col = isOrange ? C_ORANGE : C_PRIMARY;

  const trailGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TRAIL_LEN * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(TRAIL_LEN * 3), 3));
    g.setDrawRange(0, 0);
    return g;
  }, []);

  const state = useRef({
    fc: ri(0, COLS), fr: ri(0, ROWS),
    tc: 0, tr: 0,
    path: [] as THREE.Vector3[],
    seg: 0,
    t: startPhase,
    speed: 0.32 + Math.random() * 0.42,
    trailLen: 0,
  });

  useEffect(() => {
    const s = state.current;
    s.tc = ri(0, COLS);
    s.tr = ri(0, ROWS);
    s.path = lPath(s.fc, s.fr, s.tc, s.tr);
  }, []);

  useFrame((_, delta) => {
    const s = state.current;
    if (s.path.length < 2) return;

    s.t += delta * s.speed;

    if (s.t > 1) {
      s.t -= 1;
      s.seg++;
      if (s.seg >= s.path.length - 1) {
        s.fc = s.tc; s.fr = s.tr;
        let attempts = 0;
        do {
          s.tc = ri(0, COLS); s.tr = ri(0, ROWS);
          attempts++;
        } while (s.tc === s.fc && s.tr === s.fr && attempts < 10);
        s.path = lPath(s.fc, s.fr, s.tc, s.tr);
        s.seg = 0;
        s.trailLen = 0;
      }
    }
    if (s.seg >= s.path.length - 1) return;

    tmp.lerpVectors(s.path[s.seg], s.path[s.seg + 1], s.t);
    tmp.y = 0.05;

    if (dotRef.current) dotRef.current.position.copy(tmp);
    if (glowRef.current) {
      glowRef.current.position.copy(tmp);
      const pulse = 1 + Math.sin(Date.now() * 0.005) * 0.35;
      glowRef.current.scale.setScalar(pulse);
    }

    // Trail
    const tLen = Math.min(s.trailLen + 1, TRAIL_LEN);
    s.trailLen = tLen;

    const posAttr = trailGeo.attributes.position as THREE.BufferAttribute;
    const colAttr = trailGeo.attributes.color as THREE.BufferAttribute;

    for (let i = tLen - 1; i > 0; i--) {
      posAttr.setXYZ(i, posAttr.getX(i - 1), posAttr.getY(i - 1), posAttr.getZ(i - 1));
    }
    posAttr.setXYZ(0, tmp.x, tmp.y, tmp.z);

    for (let i = 0; i < tLen; i++) {
      const fade = Math.pow(1 - i / tLen, 1.6);
      colAttr.setXYZ(i, c3.r * fade, c3.g * fade, c3.b * fade);
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    trailGeo.setDrawRange(0, tLen);
  });

  return (
    <group>
      <mesh ref={dotRef}>
        <sphereGeometry args={[0.09, 10, 10]} />
        <meshBasicMaterial color={col} />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.22, 10, 10]} />
        <meshBasicMaterial color={col} transparent opacity={0.22} />
      </mesh>
      {/* @ts-expect-error – line is a valid R3F primitive */}
      <line ref={lineRef} geometry={trailGeo}>
        <lineBasicMaterial vertexColors transparent opacity={0.85} />
      </line>
    </group>
  );
}

// ─── Floating Activity Badges ────────────────────────────────────────────────
const BADGE_EVENTS = [
  { text: 'طلب جديد', icon: '📦', color: '#1B6AFF', bg: '#EEF3FF' },
  { text: 'تم الاستلام', icon: '📍', color: '#FF6B1A', bg: '#FFF0E8' },
  { text: 'تم التسليم', icon: '✅', color: '#16A34A', bg: '#F0FDF4' },
  { text: 'طيار قبل الطلب', icon: '🏍️', color: '#7C3AED', bg: '#F5F3FF' },
  { text: 'طلب جديد', icon: '📦', color: '#1B6AFF', bg: '#EEF3FF' },
  { text: 'تم التسليم', icon: '✅', color: '#16A34A', bg: '#F0FDF4' },
  { text: 'تم الاستلام', icon: '📍', color: '#FF6B1A', bg: '#FFF0E8' },
  { text: 'طيار قبل الطلب', icon: '🏍️', color: '#7C3AED', bg: '#F5F3FF' },
  { text: 'طلب جديد', icon: '📦', color: '#1B6AFF', bg: '#EEF3FF' },
  { text: 'تم التسليم', icon: '✅', color: '#16A34A', bg: '#F0FDF4' },
];

const BADGE_POSITIONS: [number, number, number][] = [
  [-5.5, 0.4, -3.5],
  [4.5, 0.4, -3],
  [-3, 0.4, -1.5],
  [5.5, 0.4, 1],
  [0, 0.4, -4],
  [-6, 0.4, 2],
  [3, 0.4, 3],
  [-2, 0.4, 3.5],
  [6, 0.4, -1],
  [-4, 0.4, 0.5],
];

function FloatingBadge({
  position, event, offset,
}: {
  position: [number, number, number];
  event: typeof BADGE_EVENTS[0];
  offset: number;
}) {
  const [visible, setVisible] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(event);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    let alive = true;

    const cycle = (delay: number) => {
      timerRef.current = setTimeout(() => {
        if (!alive) return;
        const next = BADGE_EVENTS[Math.floor(Math.random() * BADGE_EVENTS.length)];
        setCurrentEvent(next);
        setVisible(true);
        setTimeout(() => { if (alive) setVisible(false); }, 2800);
        cycle(2800 + 2000 + Math.random() * 2500);
      }, delay);
    };

    cycle(offset);
    return () => { alive = false; clearTimeout(timerRef.current); };
  }, [offset]);

  return (
    <Html position={position} center distanceFactor={10} zIndexRange={[10, 20]}>
      <div
        dir="rtl"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(6px) scale(0.92)',
          transition: 'opacity 0.45s ease, transform 0.45s ease',
          background: currentEvent.bg,
          color: currentEvent.color,
          border: `1.5px solid ${currentEvent.color}40`,
          borderRadius: '999px',
          padding: '6px 14px',
          fontSize: '13px',
          fontFamily: 'Cairo, sans-serif',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          boxShadow: `0 4px 16px ${currentEvent.color}25, 0 1px 4px rgba(0,0,0,0.08)`,
          pointerEvents: 'none',
          userSelect: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span style={{ fontSize: '14px', lineHeight: 1 }}>{currentEvent.icon}</span>
        <span>{currentEvent.text}</span>
      </div>
    </Html>
  );
}

function FloatingBadges() {
  return (
    <>
      {BADGE_POSITIONS.map((pos, i) => (
        <FloatingBadge
          key={i}
          position={pos}
          event={BADGE_EVENTS[i % BADGE_EVENTS.length]}
          offset={i * 600 + 400}
        />
      ))}
    </>
  );
}

// ─── Scene Root ───────────────────────────────────────────────────────────────
function DeliveryScene({ mouse }: { mouse: { x: number; y: number } }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.rotation.x += (mouse.y * 0.14 - groupRef.current.rotation.x) * 0.035;
    groupRef.current.rotation.y += (mouse.x * 0.22 - groupRef.current.rotation.y) * 0.035;
  });

  return (
    <group ref={groupRef} rotation={[0.58, 0, 0]}>
      <StreetGrid />
      <Nodes />
      <HubPulses />
      {Array.from({ length: COURIER_COUNT }, (_, i) => (
        <Courier key={i} isOrange={i % 5 === 3} startPhase={i / COURIER_COUNT} />
      ))}
      <FloatingBadges />
    </group>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
export default function ThreeScene() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const h = (e: MouseEvent) =>
      setMouse({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -((e.clientY / window.innerHeight) * 2 - 1),
      });
    window.addEventListener('mousemove', h);
    return () => window.removeEventListener('mousemove', h);
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 2.2, 6], fov: 95 }}
      style={{ background: 'transparent' }}
      gl={{ antialias: true, alpha: true }}
    >
      <fog attach="fog" args={['#E8F0FF', 10, 20]} />
      <ambientLight intensity={0.5} />
      <DeliveryScene mouse={mouse} />
    </Canvas>
  );
}
