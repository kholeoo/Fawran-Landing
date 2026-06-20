'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const ThreeScene = dynamic(() => import('./ThreeScene'), { ssr: false });

function SceneFallback() {
  return <div className="absolute inset-0 bg-gradient-to-br from-[#1B6AFF] to-[#1455CC]" />;
}

export default function Hero() {
  const t = useTranslations('hero');
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);
  const scale = useTransform(scrollY, [0, 500], [1, 0.88]);

  return (
    <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden bg-[#1B6AFF]">
      {/* Three.js background */}
      <motion.div className="absolute inset-0 z-0" style={{ opacity, scale }}>
        <Suspense fallback={<SceneFallback />}>
          <ThreeScene />
        </Suspense>
      </motion.div>

      {/* Subtle dark overlay to keep text readable against the scene */}
      <div className="absolute inset-0 z-[1] bg-[#1B6AFF]/30 pointer-events-none" />

      {/* Bottom fade into next section */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#1B6AFF] to-transparent z-[2]" />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="inline-block mb-4 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase bg-white/20 border border-white/30 text-white">
            فورًا · Fawran
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-bold text-white leading-tight mb-6"
        >
          {t('headline')}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="text-lg sm:text-xl text-white/80 mb-10 max-w-xl mx-auto"
        >
          {t('subtext')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <a
            href="#download"
            className="px-7 py-3.5 rounded-full bg-[#FF6B1A] text-white font-semibold text-base hover:bg-[#e55e0f] transition-all glow-orange"
          >
            {t('cta_primary')}
          </a>
          <a
            href="#how"
            className="px-7 py-3.5 rounded-full border border-white/50 text-white font-semibold text-base hover:bg-white/10 transition-all"
          >
            {t('cta_secondary')}
          </a>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-white/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown size={24} />
        </motion.div>
      </motion.div>
    </section>
  );
}
