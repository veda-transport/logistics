"use client";

import { useState, useEffect } from "react";
import { siteData } from "@/data/siteData";
import { Menu, X, Phone, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { name: "Home", href: "#home" },
  { name: "About", href: "#about" },
  { name: "Services", href: "#services" },
  { name: "Why Us", href: "#why-choose-us" },
  { name: "Fleet", href: "#fleet" },
  { name: "Process", href: "#process" },
  { name: "Gallery", href: "#gallery" },
  { name: "FAQs", href: "#faq" },
  { name: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      // Scroll spy logic
      const sections = navLinks.map((link) => link.href.substring(1));
      let currentSection = "home";

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          // If section is in top portion of viewport
          if (rect.top <= 120 && rect.bottom >= 120) {
            currentSection = section;
            break;
          }
        }
      }
      setActiveSection(currentSection);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Trigger initial check
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    const targetId = href.substring(1);
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      const offset = 80; // height of sticky navbar
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = targetElement.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          isScrolled
            ? "glass-nav py-4 shadow-premium shadow-black/20"
            : "bg-transparent py-6 border-b border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <a
              href="#home"
              onClick={(e) => scrollToSection(e, "#home")}
              className="flex items-center space-x-2 group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-accent to-accent-light flex items-center justify-center shadow-glow shadow-accent/20">
                <span className="font-display font-black text-primary text-xl">V</span>
              </div>
              <span className="font-display font-extrabold text-2xl tracking-tight text-white transition-colors duration-300 group-hover:text-accent">
                {siteData.company.logoText}
              </span>
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navLinks.map((link) => {
                const isActive = activeSection === link.href.substring(1);
                return (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={(e) => scrollToSection(e, link.href)}
                    className={`relative px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300 ${
                      isActive ? "text-accent" : "text-gray-300 hover:text-white"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="activeNavBackground"
                        className="absolute inset-0 bg-white/5 rounded-full border border-white/10"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    {link.name}
                  </a>
                );
              })}
            </nav>

            {/* CTA Buttons - Desktop */}
            <div className="hidden lg:flex items-center space-x-3">
              <a
                href={`tel:${siteData.contact.phoneDial}`}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm font-semibold hover:bg-white/10 hover:border-white/20 transition-all duration-300"
              >
                <Phone className="w-3.5 h-3.5 text-accent" />
                <span>Call Now</span>
              </a>
              <a
                href={`https://wa.me/${siteData.contact.whatsappDial}?text=${encodeURIComponent(
                  siteData.contact.whatsappMessage
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-accent hover:bg-accent-hover text-primary font-bold text-sm shadow-glow hover:shadow-accent/40 transition-all duration-300"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            </div>

            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-primary-light border border-white/10 hover:bg-primary-dark transition-colors duration-300"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-primary-dark/80 backdrop-blur-md z-45 lg:hidden"
            />

            {/* Side Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[300px] bg-primary border-l border-white/10 p-6 z-50 flex flex-col justify-between lg:hidden shadow-premium"
            >
              <div className="space-y-8">
                {/* Header inside drawer */}
                <div className="flex items-center justify-between pb-6 border-b border-white/5">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center">
                      <span className="font-display font-black text-primary text-base">V</span>
                    </div>
                    <span className="font-display font-bold text-lg">{siteData.company.logoText}</span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1 rounded-md bg-white/5 border border-white/10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Navigation Links inside drawer */}
                <nav className="flex flex-col space-y-3">
                  {navLinks.map((link, idx) => {
                    const isActive = activeSection === link.href.substring(1);
                    return (
                      <motion.a
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={link.name}
                        href={link.href}
                        onClick={(e) => scrollToSection(e, link.href)}
                        className={`px-4 py-3 rounded-xl text-base font-semibold transition-all duration-300 ${
                          isActive
                            ? "bg-accent/15 text-accent border border-accent/20"
                            : "text-gray-300 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {link.name}
                      </motion.a>
                    );
                  })}
                </nav>
              </div>

              {/* Bottom Quick Call inside drawer */}
              <div className="space-y-3 pt-6 border-t border-white/5">
                <a
                  href={`tel:${siteData.contact.phoneDial}`}
                  className="flex items-center justify-center space-x-2 w-full py-3 rounded-xl border border-white/10 bg-primary-light hover:bg-primary-dark transition-all duration-300 text-sm font-semibold"
                >
                  <Phone className="w-4 h-4 text-accent" />
                  <span>Call: {siteData.contact.phone}</span>
                </a>
                <a
                  href={`https://wa.me/${siteData.contact.whatsappDial}?text=${encodeURIComponent(
                    siteData.contact.whatsappMessage
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2 w-full py-3 rounded-xl bg-accent text-primary font-extrabold shadow-glow transition-all duration-300 text-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
