'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { useState } from 'react';

const API_URL = 'https://fawran-backend.onrender.com/api/v1';

interface FormState {
  name: string;
  email: string;
  message: string;
}

interface FieldErrors {
  name?: string;
  email?: string;
  message?: string;
}

export default function Contact() {
  const t = useTranslations('contact');

  const [form, setForm] = useState<FormState>({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function validate(): FieldErrors {
    const e: FieldErrors = {};
    if (!form.name.trim()) e.name = t('error_name_required');
    else if (form.name.length > 100) e.name = t('error_name_max');

    if (!form.email.trim()) e.email = t('error_email_required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t('error_email_invalid');

    if (!form.message.trim()) e.message = t('error_message_required');
    else if (form.message.length > 2000) e.message = t('error_message_max');

    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.status === 201) {
        setSuccess(true);
      } else if (res.status === 429) {
        setSubmitError(t('error_rate_limit'));
      } else {
        setSubmitError(t('error_generic'));
      }
    } catch {
      setSubmitError(t('error_generic'));
    } finally {
      setSubmitting(false);
    }
  }

  function handleChange(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };
  }

  const inputClass = (hasError?: string) =>
    `w-full bg-[#F8F9FC] border rounded-xl px-4 py-3 text-[#0D1020] placeholder-[#9BA5BF] focus:outline-none transition-colors ${
      hasError ? 'border-red-400 focus:border-red-400' : 'border-[#E2E6F0] focus:border-[#1B6AFF]'
    }`;

  return (
    <section id="contact" className="py-24 px-4 bg-[#F8F9FC] scroll-mt-20">
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

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="card p-8"
        >
          {success ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-xl font-semibold text-[#0D1020]">{t('success_title')}</p>
              <p className="text-[#4A5270]">{t('success_body')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
              <div>
                <label className="block text-[#4A5270] text-sm mb-2 font-medium">{t('name')}</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={handleChange('name')}
                  className={inputClass(errors.name)}
                  placeholder={t('name')}
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-[#4A5270] text-sm mb-2 font-medium">{t('email')}</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={handleChange('email')}
                  className={inputClass(errors.email)}
                  placeholder={t('email')}
                />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-[#4A5270] text-sm mb-2 font-medium">{t('message')}</label>
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={handleChange('message')}
                  className={inputClass(errors.message)}
                  placeholder={t('message')}
                />
                {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message}</p>}
              </div>

              {submitError && (
                <p className="text-sm text-red-500 text-center">{submitError}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-[#1B6AFF] text-white font-semibold hover:bg-[#1455CC] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting && (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
                {submitting ? t('sending') : t('send')}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
