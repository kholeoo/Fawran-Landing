'use client';

import { useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function CustomCursor() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springX = useSpring(cursorX, { stiffness: 400, damping: 30 });
  const springY = useSpring(cursorY, { stiffness: 400, damping: 30 });

  const trailX = useSpring(cursorX, { stiffness: 80, damping: 20 });
  const trailY = useSpring(cursorY, { stiffness: 80, damping: 20 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, [cursorX, cursorY]);

  return (
    <>
      {/* Hidden on touch devices via CSS; mousemove never fires on mobile so dots stay off-screen */}
      <motion.div
        className="fixed top-0 left-0 w-3 h-3 rounded-full bg-[#1B6AFF] pointer-events-none z-[9999] [@media(hover:none)]:hidden"
        style={{ x: springX, y: springY, translateX: '-50%', translateY: '-50%' }}
      />
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 rounded-full border border-[#FF6B1A] pointer-events-none z-[9998] opacity-50 [@media(hover:none)]:hidden"
        style={{ x: trailX, y: trailY, translateX: '-50%', translateY: '-50%' }}
      />
    </>
  );
}
