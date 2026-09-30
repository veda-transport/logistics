"use client";

import { siteData } from "@/data/siteData";
import * as Icons from "lucide-react";
import { motion } from "framer-motion";

export default function WhyChooseUs() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
  };

  return (
    <section id="why-choose-us" className="relative py-24 bg-gradient-premium border-t border-white/5 overflow-hidden">
      {/* Decorative background shape */}
      <div className="absolute bottom-[-10%] left-[-10%] w-[350px] h-[350px] bg-accent/3 rounded-full filter blur-[100px] pointer-events-none" />

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
            Why Choose Us
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-white tracking-tight"
          >
            Features That Set Us <br />
            <span className="text-gradient-accent">Ahead of the Rest</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-gray-400 mt-4 leading-relaxed"
          >
            We combine logistics infrastructure, safety protocols, and real-time tracking systems to guarantee peace of mind for every shipment.
          </motion.p>
        </div>

        {/* Feature Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {siteData.whyChooseUs.map((feature, idx) => {
            const LucideIcon = (Icons as any)[feature.icon] || Icons.CheckCircle;

            return (
              <motion.div
                key={idx}
                variants={itemVariants}
                whileHover={{ scale: 1.03, y: -4 }}
                className="group glass-panel p-8 rounded-3xl border border-white/5 hover:border-accent/25 hover:bg-white/5 transition-all duration-300 flex flex-col items-start"
              >
                {/* Icon wrapper */}
                <div className="w-12 h-12 rounded-2xl bg-primary-light border border-white/5 flex items-center justify-center text-accent group-hover:text-primary group-hover:bg-accent transition-all duration-300 shadow-inner mb-6">
                  <LucideIcon className="w-5.5 h-5.5" />
                </div>

                {/* Content */}
                <h3 className="font-display font-extrabold text-lg text-white mb-3 group-hover:text-accent transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

      </div>
    </section>
  );
}
