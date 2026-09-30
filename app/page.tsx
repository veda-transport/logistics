import Navbar from "@/components/Navbar";
import Hero from "@/components/home/Hero";
import About from "@/components/home/About";
import Services from "@/components/home/Services";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import Fleet from "@/components/home/Fleet";
import WorkingProcess from "@/components/home/WorkingProcess";
import Stats from "@/components/home/Stats";
import Testimonials from "@/components/home/Testimonials";
import Gallery from "@/components/home/Gallery";
import FAQ from "@/components/home/FAQ";
import Contact from "@/components/home/Contact";
import Footer from "@/components/Footer";
import FloatingButtons from "@/components/FloatingButtons";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1 w-full flex flex-col">
        <Hero />
        <About />
        <Services />
        <WhyChooseUs />
        <Fleet />
        <WorkingProcess />
        <Stats />
        <Testimonials />
        <Gallery />
        <FAQ />
        <Contact />
      </main>
      <Footer />
      <FloatingButtons />
    </>
  );
}
