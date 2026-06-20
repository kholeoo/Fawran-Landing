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

export default function HomePage() {
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
