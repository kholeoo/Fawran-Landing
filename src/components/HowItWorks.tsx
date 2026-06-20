'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { PackagePlus, UserCheck, Zap } from 'lucide-react';

const icons = [PackagePlus, UserCheck, Zap];

export default function HowItWorks() {
  const t = useTranslations('how');

  const steps = [
    { icon: icons[0], title: t('step1_title'), desc: t('step1_desc') },
    { icon: icons[1], title: t('step2_title'), desc: t('step2_desc') },
    { icon: icons[2], title: t('step3_title'), desc: t('step3_desc') },
  ];

  return (
    <section id="how" className="py-24 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0D1020]">{t('title')}</h2>
          <div className="mt-3 mx-auto w-16 h-1 rounded-full bg-[#1B6AFF]" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-12 inset-x-[16%] h-px bg-gradient-to-r from-transparent via-[#D4E2FF] to-transparent" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            const isOrange = i === 1;
            const accent = isOrange ? '#FF6B1A' : '#1B6AFF';
            const accentBg = isOrange ? '#FFF4EE' : '#EEF3FF';
            const accentBorder = isOrange ? '#FFD4B8' : '#D4E2FF';

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="flex flex-col items-center text-center group"
              >
                <div className="relative mb-6">
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300"
                    style={{ background: accentBg, border: `1px solid ${accentBorder}` }}
                  >
                    <Icon size={36} style={{ color: accent }} />
                  </div>
                  <span
                    className="absolute -top-2 -right-2 rtl:-left-2 rtl:right-auto w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center"
                    style={{ background: accent }}
                  >
                    {i + 1}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-[#0D1020] mb-3">{step.title}</h3>
                <p className="text-[#4A5270] leading-relaxed">{step.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
