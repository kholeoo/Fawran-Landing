'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const ThreeScene = dynamic(() => import('./ThreeScene'), { ssr: false });

function SceneFallback() {
  return <div className="absolute inset-0 bg-gradient-to-br from-[#EEF3FF] to-[#F8F9FC]" />;
}

export default function Hero() {
  const t = useTranslations('hero');
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);
  const scale = useTransform(scrollY, [0, 500], [1, 0.88]);

  return (
    <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden bg-[#F8F9FC]">
      {/* Three.js background */}
      <motion.div className="absolute inset-0 z-0" style={{ opacity, scale }}>
        <Suspense fallback={<SceneFallback />}>
          <ThreeScene />
        </Suspense>
      </motion.div>

      {/* Soft radial wash so text is readable */}
      <div className="absolute inset-0 z-[1] bg-gradient-radial from-white/60 via-white/30 to-transparent pointer-events-none" />

      {/* Bottom fade into next section */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#F8F9FC] to-transparent z-[2]" />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="inline-block mb-4 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase bg-[#EEF3FF] border border-[#D4E2FF] text-[#1B6AFF]">
            فورًا · Fawran
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-bold text-[#0D1020] leading-tight mb-6"
        >
          {t('headline')}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="text-lg sm:text-xl text-[#4A5270] mb-10 max-w-xl mx-auto"
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
            className="px-7 py-3.5 rounded-full bg-[#1B6AFF] text-white font-semibold text-base hover:bg-[#1455CC] transition-all glow-blue"
          >
            {t('cta_primary')}
          </a>
          <a
            href="#how"
            className="px-7 py-3.5 rounded-full border border-[#C8CEDF] text-[#4A5270] font-semibold text-base hover:border-[#FF6B1A] hover:text-[#FF6B1A] transition-all"
          >
            {t('cta_secondary')}
          </a>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-[#9BA5BF]"
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
