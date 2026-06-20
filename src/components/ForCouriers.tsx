'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { MapPin, UserPlus, Zap } from 'lucide-react';

export default function ForCouriers() {
  const t = useTranslations('clients');

  const benefits = [
    { icon: Zap, label: t('benefit1') },
    { icon: MapPin, label: t('benefit2') },
    { icon: UserPlus, label: t('benefit3') },
  ];

  return (
    <section className="py-24 px-4 bg-[#FF6B1A]">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-10">{t('title')}</h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="flex flex-wrap justify-center gap-4 mb-12"
        >
          {benefits.map(({ icon: Icon, label }, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 px-5 py-3 rounded-full bg-white/20 border border-white/30 text-white font-medium"
            >
              <Icon size={18} className="text-white" />
              {label}
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <a
            href="#download"
            className="inline-flex items-center px-8 py-4 rounded-full bg-white text-[#FF6B1A] font-bold text-lg hover:bg-orange-50 transition-all"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
          >
            {t('cta')}
          </a>
        </motion.div>
      </div>
    </section>
  );
}
