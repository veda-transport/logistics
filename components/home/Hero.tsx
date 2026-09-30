"use client";

import { siteData } from "@/data/siteData";
import { Phone, MessageSquare, ShieldCheck, Milestone } from "lucide-react";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";

export default function Hero() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section
      id="home"
      className="relative min-h-screen pt-28 pb-16 flex items-center overflow-hidden grid-bg bg-primary"
    >
      {/* Radial glow background lights */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent/10 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full filter blur-[120px] pointer-events-none animate-pulse-slow" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Copy & Actions */}
          <div className="lg:col-span-6 space-y-8 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border border-accent/20 bg-accent/10 text-accent text-xs font-semibold uppercase tracking-wider"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Double-Verified Transport Logistics Partner</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-white tracking-tight leading-[1.1] text-gradient"
            >
              Fast, Safe & Reliable <br />
              <span className="text-gradient-accent">Transport Solutions</span> <br />
              Across India
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-gray-400 text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              {siteData.hero.subtitle}
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <a
                href={`tel:${siteData.contact.phoneDial}`}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-4 rounded-xl border border-white/10 bg-white/5 font-semibold hover:bg-white/10 hover:border-white/20 transition-all duration-300 group"
              >
                <Phone className="w-5 h-5 text-accent group-hover:scale-110 transition-transform" />
                <span>{siteData.hero.ctaCall}</span>
              </a>
              <a
                href={`https://wa.me/${siteData.contact.whatsappDial}?text=${encodeURIComponent(
                  siteData.contact.whatsappMessage
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-4 rounded-xl bg-accent hover:bg-accent-hover text-primary font-extrabold shadow-glow hover:shadow-accent/40 transition-all duration-300"
              >
                <MessageSquare className="w-5 h-5" />
                <span>{siteData.hero.ctaWhatsapp}</span>
              </a>
            </motion.div>

            {/* Quick Hero Statistics */}
            <div ref={ref} className="pt-8 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto lg:mx-0">
              {siteData.stats.map((stat, idx) => (
                <div key={idx} className="text-center lg:text-left">
                  <span className="block text-2xl sm:text-3xl font-display font-extrabold text-accent">
                    {inView ? (
                      <CountUp start={0} end={stat.number} duration={2.5} separator="," />
                    ) : (
                      "0"
                    )}
                    {stat.suffix}
                  </span>
                  <span className="block text-gray-400 text-xs mt-1 font-medium">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Premium Truck Animation */}
          <div className="lg:col-span-6 flex items-center justify-center relative w-full h-[320px] sm:h-[400px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative w-full h-full glass-panel rounded-3xl overflow-hidden shadow-premium flex flex-col justify-end"
            >
              {/* Sky Background with Moon and Clouds */}
              <div className="absolute inset-0 bg-gradient-to-b from-primary-dark via-primary-light to-primary-dark z-0" />
              
              {/* Stars & Grid lines representing digital logistics */}
              <div className="absolute inset-0 grid-bg opacity-30 z-0" />
              
              {/* Floating Moon */}
              <div className="absolute top-8 right-12 w-10 h-10 rounded-full bg-white/20 blur-[1px] shadow-inner shadow-white/40" />

              {/* Moving Clouds */}
              <div className="absolute top-12 left-0 w-24 h-4 bg-white/5 rounded-full filter blur-[4px] animate-cloud-move" style={{ animationDuration: '20s' }} />
              <div className="absolute top-20 left-1/2 w-32 h-6 bg-white/5 rounded-full filter blur-[6px] animate-cloud-move" style={{ animationDuration: '14s' }} />

              {/* Parallax Mountains background silhouettes */}
              <svg className="absolute bottom-[80px] left-0 w-full h-[60px] text-primary-dark/80 z-1" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polygon points="0,100 20,40 40,70 65,30 85,80 100,50 100,100" fill="currentColor" />
              </svg>
              <svg className="absolute bottom-[60px] left-0 w-full h-[85px] text-primary-light/50 z-2" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polygon points="0,100 15,60 30,80 50,45 75,70 90,50 100,100" fill="currentColor" />
              </svg>

              {/* Parallax Highway Road */}
              <div className="w-full h-[80px] bg-neutral-900 border-t border-neutral-700/50 z-3 relative flex items-center overflow-hidden">
                {/* Moving Lane Dividers */}
                <div 
                  className="w-[200%] h-[3px] absolute left-0 z-1 opacity-60"
                  style={{
                    backgroundImage: 'linear-gradient(to right, #ff6a00 60px, transparent 60px)',
                    backgroundSize: '120px 100%',
                    animation: 'roadMove 1.2s linear infinite'
                  }}
                />
                {/* Asphalt highway lines */}
                <div className="w-full h-full absolute top-0 left-0 bg-neutral-950/20" />
              </div>

              {/* Cargo Truck Vector Container */}
              <div className="absolute bottom-[35px] left-[15%] sm:left-[20%] w-[280px] h-[130px] z-10 select-none pointer-events-none">
                {/* Custom engine vibration animation block */}
                <div className="w-full h-full relative animate-float" style={{ animationDuration: '4s' }}>
                  
                  {/* Exhaust smoke particles */}
                  <div className="absolute left-[-25px] bottom-[25px] flex flex-col space-y-1 z-0">
                    <motion.div 
                      animate={{ scale: [1, 2.5, 0], x: [-10, -50], y: [-5, -20], opacity: [0.6, 0.8, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                      className="w-2.5 h-2.5 rounded-full bg-white/20 blur-[1px]"
                    />
                    <motion.div 
                      animate={{ scale: [1, 2, 0], x: [-15, -40], y: [0, -10], opacity: [0.5, 0.7, 0] }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: "easeOut", delay: 0.4 }}
                      className="w-2 h-2 rounded-full bg-white/10 blur-[1px]"
                    />
                  </div>

                  {/* Truck Container / Cargo Box */}
                  <div className="absolute bottom-[20px] left-[5px] w-[180px] h-[85px] bg-gradient-to-r from-accent-light to-accent rounded-lg flex flex-col justify-between p-4 shadow-lg border border-accent-light/20">
                    {/* Metal cargo corrugated details */}
                    <div className="absolute inset-0 flex justify-between px-6 py-1 opacity-20 pointer-events-none">
                      <div className="w-[1px] h-full bg-primary" />
                      <div className="w-[1px] h-full bg-primary" />
                      <div className="w-[1px] h-full bg-primary" />
                      <div className="w-[1px] h-full bg-primary" />
                      <div className="w-[1px] h-full bg-primary" />
                      <div className="w-[1px] h-full bg-primary" />
                    </div>
                    {/* Cargo Text Logo */}
                    <div className="z-1 flex flex-col justify-center h-full">
                      <span className="font-display font-black text-primary text-xl leading-none italic tracking-tight">VEDA</span>
                      <span className="font-sans font-bold text-[8px] text-primary/80 tracking-widest leading-none mt-1 uppercase">Logistics</span>
                    </div>
                  </div>

                  {/* Truck Driver Cabin */}
                  <div className="absolute bottom-[20px] left-[184px] w-[80px] h-[80px] bg-primary-light border-y border-r border-white/10 rounded-r-xl rounded-l-md flex flex-col justify-between shadow-lg">
                    {/* Windshield window */}
                    <div className="w-[45px] h-[32px] bg-sky-400/30 border border-sky-400/40 rounded-tr-lg rounded-bl-sm mt-3 ml-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-[20px] h-[50px] bg-white/20 rotate-[30deg] transform -translate-y-4" />
                    </div>
                    {/* Headlights and grille */}
                    <div className="flex items-center justify-between px-3 pb-2">
                      <div className="w-1.5 h-3 bg-neutral-700 rounded-sm" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-glow animate-pulse" />
                    </div>
                  </div>

                  {/* Dynamic rotating wheels */}
                  {/* Front Wheel */}
                  <div className="absolute bottom-[8px] left-[225px] w-[26px] h-[26px] rounded-full bg-neutral-900 border-[3px] border-neutral-700 shadow-md flex items-center justify-center animate-wheel-spin">
                    {/* Rims and spokes */}
                    <div className="w-2 h-2 rounded-full bg-neutral-500 relative">
                      <div className="w-[2px] h-[8px] bg-neutral-300 absolute top-[-3px] left-[3px]" />
                      <div className="w-[8px] h-[2px] bg-neutral-300 absolute top-[3px] left-[-3px]" />
                    </div>
                  </div>
                  {/* Rear Wheels */}
                  <div className="absolute bottom-[8px] left-[35px] w-[26px] h-[26px] rounded-full bg-neutral-900 border-[3px] border-neutral-700 shadow-md flex items-center justify-center animate-wheel-spin">
                    <div className="w-2 h-2 rounded-full bg-neutral-500 relative">
                      <div className="w-[2px] h-[8px] bg-neutral-300 absolute top-[-3px] left-[3px]" />
                      <div className="w-[8px] h-[2px] bg-neutral-300 absolute top-[3px] left-[-3px]" />
                    </div>
                  </div>
                  <div className="absolute bottom-[8px] left-[135px] w-[26px] h-[26px] rounded-full bg-neutral-900 border-[3px] border-neutral-700 shadow-md flex items-center justify-center animate-wheel-spin">
                    <div className="w-2 h-2 rounded-full bg-neutral-500 relative">
                      <div className="w-[2px] h-[8px] bg-neutral-300 absolute top-[-3px] left-[3px]" />
                      <div className="w-[8px] h-[2px] bg-neutral-300 absolute top-[3px] left-[-3px]" />
                    </div>
                  </div>

                </div>
              </div>

              {/* Glowing Route Overlays (Modern Tech Overlay) */}
              <div className="absolute top-4 left-6 z-10 bg-primary-dark/80 px-4 py-2 rounded-xl border border-white/5 flex items-center space-x-2 text-xs font-semibold">
                <Milestone className="w-4 h-4 text-accent" />
                <span className="text-gray-300">Live Router: Delhi ➔ Mumbai</span>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
