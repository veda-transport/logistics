"use client";

import { useState } from "react";
import { siteData } from "@/data/siteData";
import { ChevronDown, MessageSquare, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="relative py-24 bg-gradient-premium border-t border-white/5 overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-1/2 right-[-10%] w-[300px] h-[300px] bg-accent/3 rounded-full filter blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Title & CTA Card */}
          <div className="lg:col-span-4 space-y-6 text-center lg:text-left">
            <div>
              <div className="inline-block px-3 py-1 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs font-semibold uppercase tracking-wider mb-4">
                Questions
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight leading-tight">
                Frequently Asked <br />
                <span className="text-gradient-accent">Questions</span>
              </h2>
              <p className="text-gray-400 mt-4 text-sm leading-relaxed">
                Can't find what you are looking for? Contact our customer support division anytime for detailed queries.
              </p>
            </div>

            {/* Quick Helper Card */}
            <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4 text-left max-w-sm mx-auto lg:mx-0">
              <h3 className="font-display font-bold text-white text-base">Still Have Queries?</h3>
              <p className="text-gray-400 text-xs leading-relaxed">
                Connect with our managers on WhatsApp or directly dial to get instant replies.
              </p>
              <div className="flex flex-col space-y-2.5 pt-2">
                <a
                  href={`tel:${siteData.contact.phoneDial}`}
                  className="flex items-center justify-center space-x-2 w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold hover:bg-white/10 hover:border-white/20 transition-all duration-300"
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
                  className="flex items-center justify-center space-x-2 w-full py-2.5 rounded-xl bg-accent text-primary font-bold text-xs hover:bg-accent-hover transition-all duration-300"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp Chat</span>
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Accordion List */}
          <div className="lg:col-span-8 space-y-4">
            {siteData.faq.map((faqItem, idx) => {
              const isOpen = openIndex === idx;

              return (
                <div
                  key={idx}
                  className="glass-panel-light rounded-2xl border border-white/5 overflow-hidden transition-all duration-300 hover:border-white/10"
                >
                  {/* Header/Question Trigger */}
                  <button
                    onClick={() => toggleAccordion(idx)}
                    className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                  >
                    <span className="font-display font-bold text-white text-base pr-4 group-hover:text-accent transition-colors duration-300">
                      {faqItem.question}
                    </span>
                    <span
                      className={`w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 shrink-0 transform transition-transform duration-300 ${
                        isOpen ? "rotate-180 text-accent border-accent/30 bg-accent/5" : ""
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </span>
                  </button>

                  {/* Body/Answer Panel */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <div className="px-6 pb-6 pt-0 border-t border-white/5 text-gray-400 text-sm leading-relaxed">
                          <p className="pt-4">{faqItem.answer}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}
