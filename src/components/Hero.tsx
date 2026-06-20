'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const ThreeScene = dynamic(() => import('./ThreeScene'), { ssr: false });

function SceneFallback() {
  return <div className="w-full h-full bg-gradient-to-br from-[#EEF3FF] to-[#E8F0FF]" />;
}

export default function Hero() {
  const t = useTranslations('hero');
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);

  return (
    <section className="relative min-h-[100svh] flex flex-col md:flex-row overflow-hidden bg-[#E8F0FF]">

      {/* ── Left: content (40%) ── */}
      <div className="relative z-10 flex flex-col justify-center px-8 md:px-12 lg:px-16 py-28 md:py-0 w-full md:w-[40%] shrink-0">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <span className="inline-block mb-5 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase bg-[#EEF3FF] border border-[#D4E2FF] text-[#1B6AFF]">
            فورًا · Fawran
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0D1020] leading-tight mb-5"
        >
          <span className="text-[#FF6B1A]">{t('headline_accent')}</span>{' '}
          {t('headline_rest')}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="text-base sm:text-lg text-[#4A5270] mb-8"
        >
          {t('subtext')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap gap-3"
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

      {/* ── Right: scene (60%) ── */}
      <motion.div
        className="relative w-full md:w-[60%] h-[55vw] md:h-auto min-h-[340px]"
        style={{ opacity }}
      >
        {/* Bottom fade on mobile (into content below) */}
        <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-[#E8F0FF] to-transparent z-10 md:hidden pointer-events-none" />
        {/* Left fade blending into content panel on desktop */}
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#E8F0FF] to-transparent z-10 pointer-events-none hidden md:block" />
        <Suspense fallback={<SceneFallback />}>
          <ThreeScene />
        </Suspense>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 text-[#9BA5BF]"
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
