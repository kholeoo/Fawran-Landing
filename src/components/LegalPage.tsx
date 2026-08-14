import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

type Section = {
  title: string;
  body: string;
};

type Props = {
  title: string;
  updated?: string;
  intro?: string;
  sections: Section[];
  footerNote?: string;
  cta?: {
    href: string;
    label: string;
  };
};

export default function LegalPage({
  title,
  updated,
  intro,
  sections,
  footerNote,
  cta,
}: Props) {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <article className="max-w-2xl mx-auto">
          <header className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#0D1020] text-start">
              {title}
            </h1>
            <div className="w-16 h-1 rounded-full bg-[#1B6AFF] mt-4" />
            {updated ? (
              <p className="text-[#9BA5BF] text-sm mt-4">{updated}</p>
            ) : null}
            {intro ? (
              <p className="text-[#4A5270] leading-relaxed mt-6">{intro}</p>
            ) : null}
          </header>

          <div className="space-y-8">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-lg font-bold text-[#0D1020] mb-2">
                  {section.title}
                </h2>
                <p className="text-[#4A5270] leading-relaxed">{section.body}</p>
              </section>
            ))}
          </div>

          {cta ? (
            <a
              href={cta.href}
              className="inline-flex mt-10 px-5 py-3 rounded-full bg-[#1B6AFF] text-white text-sm font-semibold hover:bg-[#1455CC] transition-colors"
            >
              {cta.label}
            </a>
          ) : null}

          {footerNote ? (
            <p className="text-[#9BA5BF] text-sm mt-10">{footerNote}</p>
          ) : null}
        </article>
      </main>
      <Footer />
    </>
  );
}
