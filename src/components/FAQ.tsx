import { getTranslations } from 'next-intl/server';
import { ChevronDown } from 'lucide-react';

// Deliberately a server component built on <details>, unlike the animated
// client sections around it. Every answer then ships inside the initial HTML
// whether or not it is expanded, which is the whole point of the section: this
// is the page's only real body of indexable text, and gating it behind
// client-side state would hide it from the crawler that it exists to feed.
// It also costs no JavaScript, which the 3D hero already spends enough of.

// Same open-ended convention as the legal pages: questions are read until the
// keys run out, so a ninth entry is two strings per locale and no code change.
export async function faqEntries() {
  const t = await getTranslations('faq');
  const entries: { question: string; answer: string }[] = [];

  for (let n = 1; t.has(`q${n}`); n += 1) {
    entries.push({ question: t(`q${n}`), answer: t(`a${n}`) });
  }

  return entries;
}

export default async function FAQ() {
  const t = await getTranslations('faq');
  const entries = await faqEntries();

  return (
    <section id="faq" className="py-24 px-4 bg-white scroll-mt-20">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0D1020]">{t('title')}</h2>
          <p className="text-[#4A5270] mt-3">{t('subtitle')}</p>
        </div>

        <div className="divide-y divide-[#E2E6F0] border-y border-[#E2E6F0]">
          {entries.map(({ question, answer }) => (
            <details key={question} className="group py-5">
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none text-start">
                <h3 className="text-base sm:text-lg font-semibold text-[#0D1020]">
                  {question}
                </h3>
                <ChevronDown
                  aria-hidden
                  className="w-5 h-5 shrink-0 text-[#4A5270] transition-transform duration-200 group-open:rotate-180"
                />
              </summary>
              <p className="text-[#4A5270] leading-relaxed mt-3 pe-9">{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
