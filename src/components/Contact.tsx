'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { MessageCircle, Share2, ThumbsUp } from 'lucide-react';

export default function Contact() {
  const t = useTranslations('contact');

  return (
    <section id="contact" className="py-24 px-4 bg-[#F8F9FC]">
      <div className="max-w-2xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0D1020]">{t('title')}</h2>
          <div className="mt-3 mx-auto w-16 h-1 rounded-full bg-[#1B6AFF]" />
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="card p-8 flex flex-col gap-5"
          onSubmit={(e) => e.preventDefault()}
        >
          <div>
            <label className="block text-[#4A5270] text-sm mb-2 font-medium">{t('name')}</label>
            <input
              type="text"
              className="w-full bg-[#F8F9FC] border border-[#E2E6F0] rounded-xl px-4 py-3 text-[#0D1020] placeholder-[#9BA5BF] focus:outline-none focus:border-[#1B6AFF] transition-colors"
              placeholder={t('name')}
            />
          </div>
          <div>
            <label className="block text-[#4A5270] text-sm mb-2 font-medium">{t('email')}</label>
            <input
              type="email"
              className="w-full bg-[#F8F9FC] border border-[#E2E6F0] rounded-xl px-4 py-3 text-[#0D1020] placeholder-[#9BA5BF] focus:outline-none focus:border-[#1B6AFF] transition-colors"
              placeholder={t('email')}
            />
          </div>
          <div>
            <label className="block text-[#4A5270] text-sm mb-2 font-medium">{t('message')}</label>
            <textarea
              rows={4}
              className="w-full bg-[#F8F9FC] border border-[#E2E6F0] rounded-xl px-4 py-3 text-[#0D1020] placeholder-[#9BA5BF] focus:outline-none focus:border-[#1B6AFF] transition-colors resize-none"
              placeholder={t('message')}
            />
          </div>
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-[#1B6AFF] text-white font-semibold hover:bg-[#1455CC] transition-all"
          >
            {t('send')}
          </button>
        </motion.form>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex justify-center gap-6 mt-8"
        >
          {[
            { Icon: MessageCircle, label: 'WhatsApp', color: '#25D366' },
            { Icon: Share2, label: 'Instagram', color: '#E1306C' },
            { Icon: ThumbsUp, label: 'Facebook', color: '#1877F2' },
          ].map(({ Icon, label, color }) => (
            <a
              key={label}
              href="#"
              aria-label={label}
              className="w-11 h-11 rounded-full card flex items-center justify-center text-[#9BA5BF] transition-all hover:scale-110"
              style={{ ['--hover-color' as string]: color }}
              onMouseEnter={(e) => (e.currentTarget.style.color = color)}
              onMouseLeave={(e) => (e.currentTarget.style.color = '')}
            >
              <Icon size={20} />
            </a>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
