"use client";

import { useState, useEffect } from "react";
import { siteData } from "@/data/siteData";
import { Phone, MessageSquare, ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FloatingButtons() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener("scroll", checkScroll);
    return () => window.removeEventListener("scroll", checkScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-center space-y-4">
      {/* Back To Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            className="p-3 rounded-full bg-primary-light border border-white/10 text-white shadow-premium hover:bg-accent hover:text-primary hover:border-accent transition-all duration-300 focus:outline-none"
            aria-label="Back to top"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Floating Call Button - Mobile Only */}
      <motion.a
        href={`tel:${siteData.contact.phoneDial}`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="lg:hidden p-4 rounded-full bg-gradient-to-tr from-accent to-accent-light text-primary font-black shadow-glow shadow-accent/40 flex items-center justify-center focus:outline-none"
        aria-label="Call Now"
      >
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <Phone className="w-6 h-6" />
        </motion.div>
      </motion.a>

      {/* Floating WhatsApp Button */}
      <motion.a
        href={`https://wa.me/${siteData.contact.whatsappDial}?text=${encodeURIComponent(
          siteData.contact.whatsappMessage
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="p-4 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-premium shadow-emerald-500/20 flex items-center justify-center focus:outline-none"
        aria-label="Chat on WhatsApp"
      >
        <motion.div
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.5 }}
        >
          {/* Custom WhatsApp Icon using Lucide MessageSquare */}
          <MessageSquare className="w-6 h-6" />
        </motion.div>
      </motion.a>
    </div>
  );
}
