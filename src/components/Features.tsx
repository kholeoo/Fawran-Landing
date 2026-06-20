'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { MapPin, Layers, Coins, Star, Bell, HeadphonesIcon } from 'lucide-react';

const ParticleField = dynamic(() => import('./ParticleField'), { ssr: false });

const icons = [MapPin, Layers, Coins, Star, Bell, HeadphonesIcon];

export default function Features() {
  const t = useTranslations('features');

  const cards = [
    { Icon: icons[0], title: t('f1_title'), desc: t('f1_desc') },
    { Icon: icons[1], title: t('f2_title'), desc: t('f2_desc') },
    { Icon: icons[2], title: t('f3_title'), desc: t('f3_desc') },
    { Icon: icons[3], title: t('f4_title'), desc: t('f4_desc') },
    { Icon: icons[4], title: t('f5_title'), desc: t('f5_desc') },
    { Icon: icons[5], title: t('f6_title'), desc: t('f6_desc') },
  ];

  return (
    <section id="features" className="py-24 px-4 bg-[#F8F9FC] relative overflow-hidden">
      {/* Particle network background */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <ParticleField />
      </div>
      <div className="max-w-6xl mx-auto relative z-10">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map(({ Icon, title, desc }, i) => {
            const isOrange = i === 2 || i === 4;
            const accent = isOrange ? '#FF6B1A' : '#1B6AFF';
            const accentBg = isOrange ? '#FFF4EE' : '#EEF3FF';

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="card p-6 hover:shadow-md transition-all duration-300 group"
                style={{ ['--accent' as string]: accent }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors"
                  style={{ background: accentBg }}
                >
                  <Icon size={22} style={{ color: accent }} />
                </div>
                <h3 className="text-lg font-bold text-[#0D1020] mb-2">{title}</h3>
                <p className="text-[#4A5270] text-sm leading-relaxed">{desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
