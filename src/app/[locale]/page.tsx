import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import HowItWorks from '@/components/HowItWorks';
import Features from '@/components/Features';
import About from '@/components/About';
import ForCouriers from '@/components/ForCouriers';
import Download from '@/components/Download';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import CustomCursor from '@/components/CustomCursor';
import FAQ, { faqEntries } from '@/components/FAQ';
import { setRequestLocale } from 'next-intl/server';

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Lives here rather than in the layout's @graph because the layout wraps the
  // legal pages too, and a FAQPage node on a page with no FAQ is a mismatch
  // between markup and content. Built from the same source as the rendered
  // section, so the two cannot drift apart.
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: (await faqEntries()).map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <CustomCursor />
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <About />
        <ForCouriers />
        <FAQ />
        <Download />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
