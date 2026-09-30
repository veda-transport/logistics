"use client";

import { useState, useEffect, useCallback } from "react";
import { siteData } from "@/data/siteData";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { motion } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";

export default function Testimonials() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "center" });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", onSelect);

    // Custom lightweight Autoplay
    const autoplay = setInterval(() => {
      emblaApi.scrollNext();
    }, 4500);

    return () => {
      clearInterval(autoplay);
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section id="testimonials" className="relative py-24 bg-gradient-premium border-t border-white/5 overflow-hidden">
      {/* Background glow shadow */}
      <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-accent/5 rounded-full filter blur-[100px] pointer-events-none" />

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
            Testimonials
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-white tracking-tight"
          >
            What Our Valued <br />
            <span className="text-gradient-accent">Clients Say About Us</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-gray-400 mt-4 leading-relaxed"
          >
            We take pride in providing top notch customer service. Read the experiences of major corporate managers, retail distributors and shop owners.
          </motion.p>
        </div>

        {/* Carousel Viewport */}
        <div className="relative max-w-4xl mx-auto">
          
          {/* Embla slider frame */}
          <div className="overflow-hidden cursor-grab active:cursor-grabbing" ref={emblaRef}>
            <div className="flex">
              {siteData.testimonials.map((t, idx) => (
                <div key={idx} className="flex-[0_0_100%] min-w-0 px-4">
                  <div className="glass-panel p-8 md:p-12 rounded-3xl border border-white/10 relative shadow-premium flex flex-col justify-between h-full bg-gradient-to-tr from-primary-light/40 to-primary-dark/40">
                    
                    {/* Quotation mark in background */}
                    <Quote className="absolute right-8 top-8 w-20 h-20 text-white/5 pointer-events-none select-none" />

                    <div>
                      {/* Rating stars */}
                      <div className="flex items-center space-x-1 text-amber-400 mb-6">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 fill-current" />
                        ))}
                      </div>

                      {/* Review Copy */}
                      <p className="text-gray-300 text-base md:text-lg leading-relaxed italic mb-8 relative z-10">
                        "{t.review}"
                      </p>
                    </div>

                    {/* Author block */}
                    <div className="flex items-center space-x-4 border-t border-white/5 pt-6">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white/15 bg-primary-dark">
                        <Image
                          src={t.avatar}
                          alt={t.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <span className="block font-display font-bold text-white text-base leading-none">
                          {t.name}
                        </span>
                        <span className="block text-gray-500 text-xs mt-1.5 font-medium">
                          {t.role}, <span className="text-accent">{t.company}</span>
                        </span>
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation buttons */}
          <button
            onClick={scrollPrev}
            className="absolute left-[-20px] md:left-[-60px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-white/10 bg-primary-light hover:bg-accent hover:text-primary hover:border-accent flex items-center justify-center transition-all duration-300 z-20"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-[-20px] md:right-[-60px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-white/10 bg-primary-light hover:bg-accent hover:text-primary hover:border-accent flex items-center justify-center transition-all duration-300 z-20"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Carousel navigation dots */}
        <div className="flex items-center justify-center space-x-2.5 mt-8">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === selectedIndex ? "w-8 bg-accent" : "w-2 bg-neutral-700 hover:bg-neutral-600"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
