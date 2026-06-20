'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import FawranWordmark from './FawranWordmark';

export default function Download() {
  const t = useTranslations('download');

  return (
    <section id="download" className="py-24 px-4 bg-[#1B6AFF] scroll-mt-20">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="flex justify-center mb-6">
            <FawranWordmark variant="white" width={160} />
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">{t('title')}</h2>
          <p className="text-white/80 text-lg mb-10">{t('subtitle')}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-4"
        >
          {/* Google Play */}
          <a
            href="#"
            className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-white text-[#0D1020] hover:bg-blue-50 transition-all shadow-lg"
          >
            <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
              <path
                className="text-[#0D1020]"
                d="M3.18 23.76c.37.21.8.22 1.18.03l13.79-7.71-2.95-2.96-12.02 10.64zM.5 1.7C.19 2.1 0 2.67 0 3.4v17.2c0 .73.19 1.3.51 1.7l.09.09L9.78 13.2v-.42L.59 1.61.5 1.7zM20.8 10.7l-2.74-1.54-3.31 3.31 3.31 3.31 2.75-1.53c.78-.44.78-1.11-.01-1.55zM4.36.24L18.15 7.95 15.2 10.9 3.18.26A1.24 1.24 0 014.36.24z"
              />
            </svg>
            <div className="text-start rtl:text-end">
              <div className="text-[#4A5270] text-xs">Get it on</div>
              <div className="text-[#0D1020] font-semibold text-base leading-tight">Google Play</div>
            </div>
          </a>

          {/* App Store */}
          <a
            href="#"
            className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-white text-[#0D1020] hover:bg-blue-50 transition-all shadow-lg"
          >
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#0D1020]" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            <div className="text-start rtl:text-end">
              <div className="text-[#4A5270] text-xs">Download on the</div>
              <div className="text-[#0D1020] font-semibold text-base leading-tight">App Store</div>
            </div>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
