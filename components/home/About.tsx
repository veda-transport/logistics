"use client";

import { siteData } from "@/data/siteData";
import { Shield, Eye, Award, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function About() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
  };

  return (
    <section id="about" className="relative py-24 bg-gradient-premium overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/3 left-10 w-[300px] h-[300px] bg-accent/3 rounded-full filter blur-[100px] pointer-events-none" />

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
            Who We Are
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-white tracking-tight"
          >
            Reliable Transport Partner for <br />
            <span className="text-gradient-accent">Your Cargo Demands</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-gray-400 mt-4 leading-relaxed"
          >
            {siteData.about.intro}
          </motion.p>
        </div>

        {/* Mission & Vision Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          
          {/* Mission Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="glass-panel p-8 rounded-3xl relative overflow-hidden group hover:border-accent/20 transition-all duration-500"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-bl-[100px] flex items-center justify-center transition-all duration-500 group-hover:bg-accent/10">
              <Award className="w-8 h-8 text-accent transform -translate-y-2 translate-x-2" />
            </div>
            <h3 className="font-display font-extrabold text-2xl text-white mb-4">Our Mission</h3>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              {siteData.about.mission}
            </p>
          </motion.div>

          {/* Vision Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="glass-panel p-8 rounded-3xl relative overflow-hidden group hover:border-indigo-500/20 transition-all duration-500"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-[100px] flex items-center justify-center transition-all duration-500 group-hover:bg-indigo-500/10">
              <Eye className="w-8 h-8 text-indigo-400 transform -translate-y-2 translate-x-2" />
            </div>
            <h3 className="font-display font-extrabold text-2xl text-white mb-4">Our Vision</h3>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              {siteData.about.vision}
            </p>
          </motion.div>

        </div>

        {/* Company Values Section */}
        <div>
          <h3 className="font-display font-extrabold text-2xl text-center text-white mb-12">
            Our Core Values
          </h3>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {siteData.about.values.map((value, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                whileHover={{ y: -6, scale: 1.02 }}
                className="glass-panel-light p-6 rounded-2xl border border-white/5 hover:border-accent/10 hover:bg-white/5 transition-all duration-300 flex flex-col items-start"
              >
                <div className="w-11 h-11 rounded-lg bg-accent/10 flex items-center justify-center text-accent mb-5 shadow-inner">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <h4 className="font-display font-bold text-lg text-white mb-2">{value.title}</h4>
                <p className="text-gray-400 text-xs leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

      </div>
    </section>
  );
}
