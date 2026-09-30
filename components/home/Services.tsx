"use client";

import { siteData } from "@/data/siteData";
import * as Icons from "lucide-react";
import { motion } from "framer-motion";

export default function Services() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
  };

  return (
    <section id="services" className="relative py-24 bg-primary border-t border-white/5">
      {/* Background neon lights */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/5 rounded-full filter blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-block px-3 py-1 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs font-semibold uppercase tracking-wider mb-4"
          >
            What We Do
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-white tracking-tight"
          >
            Smarter Freight & <br />
            <span className="text-gradient-accent">Logistics Services</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-gray-400 mt-4 leading-relaxed"
          >
            We manage your entire cargo process from point of origin to final mile, offering flexible configurations to save time and reduce shipping cost.
          </motion.p>
        </div>

        {/* Services Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {siteData.services.map((service, idx) => {
            // Resolve Lucide icon component dynamically
            const LucideIcon = (Icons as any)[service.icon] || Icons.HelpCircle;

            return (
              <motion.div
                key={service.id}
                variants={cardVariants}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative glass-panel p-8 rounded-3xl overflow-hidden hover:border-accent/30 hover:shadow-glow hover:shadow-accent/10 transition-all duration-300 flex flex-col justify-between"
              >
                {/* Decorative Abstract Background Illustration */}
                <div className="absolute right-[-20px] bottom-[-20px] w-32 h-32 text-white/[0.02] group-hover:text-accent/[0.04] transition-colors duration-500 pointer-events-none select-none">
                  {service.id === "ftl" || service.id === "tempo" || service.id === "intercity" ? (
                    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10,80 L90,80" strokeDasharray="4 4" />
                      <rect x="20" y="40" width="50" height="30" rx="3" />
                      <circle cx="30" cy="70" r="8" />
                      <circle cx="60" cy="70" r="8" />
                    </svg>
                  ) : service.id === "warehousing" || service.id === "packers-movers" ? (
                    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="50,15 90,45 10,45" />
                      <rect x="20" y="45" width="60" height="40" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="50" cy="50" r="40" strokeDasharray="3 3" />
                      <path d="M50,10 L50,90 M10,50 L90,50" />
                    </svg>
                  )}
                </div>

                <div>
                  {/* Top card bar: Icon & Tag */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-primary-light border border-white/5 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-primary transition-all duration-300 shadow-inner">
                      <LucideIcon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full group-hover:text-accent group-hover:border-accent/25 transition-all duration-300">
                      {service.tag}
                    </span>
                  </div>

                  {/* Service Title */}
                  <h3 className="font-display font-extrabold text-xl text-white mb-3 group-hover:text-accent transition-colors duration-300">
                    {service.title}
                  </h3>

                  {/* Service Description */}
                  <p className="text-gray-400 text-sm leading-relaxed mb-6">
                    {service.description}
                  </p>
                </div>

                {/* Card CTA Action Line */}
                <div className="flex items-center space-x-1.5 text-xs font-bold text-accent group-hover:text-white transition-colors duration-300">
                  <span>Learn More & Quote</span>
                  <Icons.ArrowUpRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </motion.div>
            );
          })}
        </motion.div>

      </div>
    </section>
  );
}
