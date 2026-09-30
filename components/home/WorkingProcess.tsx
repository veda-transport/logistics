"use client";

import { siteData } from "@/data/siteData";
import { Check, ClipboardList, Package, Truck, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const processIcons = [ClipboardList, Package, Truck, ShieldCheck];

export default function WorkingProcess() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 35 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
  };

  return (
    <section id="process" className="relative py-24 bg-gradient-premium border-t border-white/5 overflow-hidden">
      {/* Background glow shape */}
      <div className="absolute top-1/2 left-[-10%] w-[300px] h-[300px] bg-accent/5 rounded-full filter blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-block px-3 py-1 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs font-semibold uppercase tracking-wider mb-4"
          >
            How it works
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-white tracking-tight"
          >
            Seamless Shifting in <br />
            <span className="text-gradient-accent">4 Simple Steps</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-gray-400 mt-4 leading-relaxed"
          >
            From your booking call to final delivery at destination, we manage your cargo with professional standard steps.
          </motion.p>
        </div>

        {/* Process Stepper Container */}
        <div className="relative">
          
          {/* Desktop Horizontal Line Connectors */}
          <div className="hidden lg:block absolute top-[52px] left-[12%] right-[12%] h-[2px] bg-neutral-800 z-0">
            <motion.div 
              initial={{ width: 0 }}
              whileInView={{ width: "100%" }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="h-full bg-gradient-to-r from-accent to-indigo-500 shadow-glow"
            />
          </div>

          {/* Stepper Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 lg:grid-cols-4 gap-12 relative z-10"
          >
            {siteData.workingProcess.map((stepData, idx) => {
              const StepIcon = processIcons[idx] || Check;

              return (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  className="flex flex-col items-center text-center group"
                >
                  
                  {/* Step Bubble Circular Element */}
                  <div className="relative mb-6">
                    {/* Pulsing Outer Glow */}
                    <div className="absolute inset-[-4px] rounded-full bg-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-[4px] animate-pulse" />
                    
                    <div className="w-24 h-24 rounded-full bg-primary-light border-2 border-white/5 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-primary group-hover:border-accent transition-all duration-300 shadow-premium">
                      <StepIcon className="w-9 h-9" />
                    </div>
                    
                    {/* Index Bubble */}
                    <div className="absolute top-0 right-0 w-7 h-7 rounded-full bg-primary border border-white/10 flex items-center justify-center text-xs font-black text-white group-hover:border-accent group-hover:text-accent transition-colors duration-300">
                      {stepData.step}
                    </div>
                  </div>

                  {/* Step Info */}
                  <h3 className="font-display font-extrabold text-xl text-white mb-3 group-hover:text-accent transition-colors duration-300">
                    {stepData.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                    {stepData.description}
                  </p>

                  {/* Mobile Down Arrow Connector (hidden on desktop) */}
                  {idx < 3 && (
                    <div className="lg:hidden my-6 text-accent animate-bounce">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <polyline points="19 12 12 19 5 12"></polyline>
                      </svg>
                    </div>
                  )}

                </motion.div>
              );
            })}
          </motion.div>

        </div>

      </div>
    </section>
  );
}
