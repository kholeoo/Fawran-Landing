'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Target, Eye } from 'lucide-react';

const NetworkScene = dynamic(() => import('./NetworkScene'), { ssr: false });

export default function About() {
  const t = useTranslations('about');

  return (
    <section id="about" className="py-24 px-4 bg-white scroll-mt-20 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="order-2 lg:order-1 rtl:lg:order-2"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0D1020] mb-4">{t('title')}</h2>
            <div className="w-16 h-1 rounded-full bg-[#1B6AFF] mb-6" />
            <p className="text-[#4A5270] leading-relaxed text-lg mb-8">{t('body')}</p>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[#EEF3FF] flex items-center justify-center">
                    <Target size={16} className="text-[#1B6AFF]" />
                  </div>
                  <h3 className="font-bold text-[#0D1020]">{t('mission_title')}</h3>
                </div>
                <p className="text-[#4A5270] text-sm leading-relaxed">{t('mission_body')}</p>
              </div>

              <div className="flex-1 card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FFF4EE] flex items-center justify-center">
                    <Eye size={16} className="text-[#FF6B1A]" />
                  </div>
                  <h3 className="font-bold text-[#0D1020]">{t('vision_title')}</h3>
                </div>
                <p className="text-[#4A5270] text-sm leading-relaxed">{t('vision_body')}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="order-1 lg:order-2 rtl:lg:order-1 h-[360px] rounded-2xl overflow-hidden bg-[#F8F9FC] border border-[#E2E6F0]"
          >
            <NetworkScene />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
