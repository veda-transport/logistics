"use client";

import { useState } from "react";
import { siteData } from "@/data/siteData";
import { X, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function Gallery() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Extract unique categories from gallery data
  const categories = ["All", ...Array.from(new Set(siteData.gallery.map((item) => item.category)))];

  // Filter gallery items
  const filteredGallery =
    activeCategory === "All"
      ? siteData.gallery
      : siteData.gallery.filter((item) => item.category === activeCategory);

  const openLightbox = (index: number) => {
    // We map the filtered items to get the index in the original siteData.gallery
    const originalItem = filteredGallery[index];
    const originalIndex = siteData.gallery.findIndex((item) => item.title === originalItem.title);
    setLightboxIndex(originalIndex);
  };

  const closeLightbox = () => setLightboxIndex(null);

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex === null) return;
    const nextIdx = lightboxIndex === 0 ? siteData.gallery.length - 1 : lightboxIndex - 1;
    setLightboxIndex(nextIdx);
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex === null) return;
    const nextIdx = lightboxIndex === siteData.gallery.length - 1 ? 0 : lightboxIndex + 1;
    setLightboxIndex(nextIdx);
  };

  return (
    <section id="gallery" className="relative py-24 bg-primary border-t border-white/5">
      {/* Glow effect */}
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full filter blur-[120px] pointer-events-none" />

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
            Gallery
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-white tracking-tight"
          >
            Logistics Operations <br />
            <span className="text-gradient-accent">in Action</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-gray-400 mt-4 leading-relaxed"
          >
            Explore our daily warehouse operations, cargo loading procedures, fleet vehicles, and highway haulage across the country.
          </motion.p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                activeCategory === category
                  ? "bg-accent text-primary shadow-glow shadow-accent/25"
                  : "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredGallery.map((item, idx) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                key={item.title}
                onClick={() => openLightbox(idx)}
                className="group relative h-[250px] rounded-3xl overflow-hidden glass-panel border border-white/5 cursor-pointer shadow-premium"
              >
                {/* Photo */}
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-w-768px) 100vw, 33vw"
                  className="object-cover transform group-hover:scale-108 transition-transform duration-500"
                  loading="lazy"
                />

                {/* Dark Glass Overlay */}
                <div className="absolute inset-0 bg-primary-dark/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex flex-col justify-end p-6 border border-accent/20 rounded-3xl">
                  {/* Zoom Icon */}
                  <div className="absolute top-6 right-6 w-9 h-9 rounded-full bg-accent/90 text-primary flex items-center justify-center shadow-glow">
                    <ZoomIn className="w-4 h-4" />
                  </div>
                  
                  {/* Category tag */}
                  <span className="text-[9px] uppercase font-bold tracking-widest text-accent mb-2">
                    {item.category}
                  </span>
                  
                  {/* Photo Title */}
                  <h3 className="font-display font-extrabold text-white text-base leading-snug">
                    {item.title}
                  </h3>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
            className="fixed inset-0 bg-primary-dark/95 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-8"
          >
            {/* Modal Closer */}
            <button
              onClick={closeLightbox}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/5 border border-white/10 hover:bg-accent hover:text-primary transition-all z-50"
              aria-label="Close Lightbox"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Previous Key */}
            <button
              onClick={prevImage}
              className="absolute left-4 md:left-8 p-3 rounded-full bg-white/5 border border-white/10 hover:bg-accent hover:text-primary transition-all z-40"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Main Picture Box */}
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl h-[60vh] md:h-[75vh] flex flex-col justify-end"
            >
              <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 bg-primary-light">
                <Image
                  src={siteData.gallery[lightboxIndex].image}
                  alt={siteData.gallery[lightboxIndex].title}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              
              {/* Image Info at Bottom of Lightbox */}
              <div className="mt-4 flex items-center justify-between text-white/90">
                <div>
                  <span className="text-[10px] uppercase font-bold text-accent tracking-wider">
                    {siteData.gallery[lightboxIndex].category}
                  </span>
                  <h4 className="font-display font-bold text-lg mt-0.5">
                    {siteData.gallery[lightboxIndex].title}
                  </h4>
                </div>
                <span className="text-gray-500 text-xs font-semibold">
                  {lightboxIndex + 1} / {siteData.gallery.length}
                </span>
              </div>
            </motion.div>

            {/* Next Key */}
            <button
              onClick={nextImage}
              className="absolute right-4 md:right-8 p-3 rounded-full bg-white/5 border border-white/10 hover:bg-accent hover:text-primary transition-all z-40"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
