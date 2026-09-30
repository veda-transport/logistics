"use client";

import { siteData } from "@/data/siteData";
import { Truck, Weight, Move } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

export default function Fleet() {
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
    <section id="fleet" className="relative py-24 bg-primary border-t border-white/5">
      {/* Background decoration blur */}
      <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-accent/3 rounded-full filter blur-[120px] pointer-events-none" />

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
            Our Fleet
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-white tracking-tight"
          >
            Versatile Fleet for <br />
            <span className="text-gradient-accent">Every Shipment Size</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-gray-400 mt-4 leading-relaxed"
          >
            Choose from our multi-ton commercial trucks, container lines, or local tempo vans, all double-verified, weather-proof, and GPS-monitored.
          </motion.p>
        </div>

        {/* Fleet Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {siteData.fleet.map((vehicle, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              whileHover={{ y: -8 }}
              className="group glass-panel rounded-3xl overflow-hidden hover:border-accent/30 transition-all duration-300 flex flex-col justify-between"
            >
              
              {/* Vehicle Image Container */}
              <div className="relative w-full h-[220px] overflow-hidden bg-primary-dark">
                {/* Image Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary-dark to-transparent z-10 opacity-60" />
                <Image
                  src={vehicle.image}
                  alt={vehicle.name}
                  fill
                  sizes="(max-w-768px) 100vw, 33vw"
                  className="object-cover transform group-hover:scale-108 transition-transform duration-500 z-0"
                  loading="lazy"
                />
                
                {/* Capacity Badge */}
                <div className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-xl bg-primary/80 border border-white/5 text-[10px] font-bold text-accent tracking-widest uppercase flex items-center space-x-1.5 backdrop-blur-md">
                  <Weight className="w-3.5 h-3.5" />
                  <span>Payload: {vehicle.capacity}</span>
                </div>

                {/* Tag Badge */}
                <div className="absolute top-4 right-4 z-20 px-2.5 py-1 rounded-lg bg-accent text-primary text-[9px] font-extrabold uppercase tracking-wider">
                  {vehicle.tag}
                </div>
              </div>

              {/* Vehicle Content */}
              <div className="p-6 space-y-4">
                <h3 className="font-display font-extrabold text-xl text-white group-hover:text-accent transition-colors duration-300">
                  {vehicle.name}
                </h3>
                
                {/* Specifications List */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="flex items-center text-xs text-gray-400">
                    <Move className="w-4 h-4 text-accent/80 mr-2.5 shrink-0" />
                    <span className="font-semibold text-gray-300 mr-1.5">Dimensions:</span>
                    <span>{vehicle.dimensions}</span>
                  </div>
                  <div className="flex items-start text-xs text-gray-400">
                    <Truck className="w-4 h-4 text-accent/80 mr-2.5 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-300 mr-1.5">Best For:</span>
                      <span>{vehicle.bestFor}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Quote Button */}
              <div className="px-6 pb-6 pt-2">
                <a
                  href="#contact"
                  className="flex items-center justify-center space-x-2 w-full py-3 rounded-xl border border-white/5 bg-white/5 text-xs font-semibold hover:bg-accent hover:text-primary hover:border-accent transition-all duration-300 font-sans"
                >
                  <span>Request Booking Quote</span>
                </a>
              </div>

            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
