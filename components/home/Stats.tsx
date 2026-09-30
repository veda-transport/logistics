"use client";

import { siteData } from "@/data/siteData";
import { Users, Truck, CheckCircle2, History } from "lucide-react";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";

const statIcons = [Users, CheckCircle2, Truck, History];

export default function Stats() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.15,
  });

  return (
    <section ref={ref} className="relative py-20 bg-primary border-t border-white/5 overflow-hidden">
      {/* Background neon elements */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[350px] h-[350px] bg-accent/5 rounded-full filter blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Stats Glass Box Wrapper */}
        <div className="glass-panel rounded-3xl p-8 sm:p-12 shadow-premium bg-gradient-to-r from-primary-light/50 via-primary-dark/80 to-primary-light/50 border border-white/10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 divide-y sm:divide-y-0 lg:divide-x divide-white/5">
            {siteData.stats.map((stat, idx) => {
              const StatIcon = statIcons[idx] || CheckCircle2;

              return (
                <div
                  key={idx}
                  className={`text-center flex flex-col items-center justify-center ${
                    idx > 0 ? "pt-8 sm:pt-0 lg:pl-8" : ""
                  } ${idx === 1 || idx === 3 ? "sm:pt-8 md:pt-8 lg:pt-0" : ""}`}
                >
                  {/* Floating Circular Icon */}
                  <motion.div
                    whileHover={{ rotate: 10, scale: 1.05 }}
                    className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4 shadow-inner"
                  >
                    <StatIcon className="w-5.5 h-5.5" />
                  </motion.div>

                  {/* Animated Counter */}
                  <span className="block text-4xl sm:text-5xl font-display font-extrabold text-white tracking-tight leading-none">
                    {inView ? (
                      <CountUp start={0} end={stat.number} duration={3} separator="," />
                    ) : (
                      "0"
                    )}
                    <span className="text-accent ml-0.5">{stat.suffix}</span>
                  </span>

                  {/* Stat Description */}
                  <span className="block text-gray-400 text-sm font-semibold tracking-wider uppercase mt-3">
                    {stat.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
