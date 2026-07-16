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
import { setRequestLocale } from 'next-intl/server';

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <CustomCursor />
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <About />
        <ForCouriers />
        <Download />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
