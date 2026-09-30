"use client";

import { useState } from "react";
import { siteData } from "@/data/siteData";
import { Phone, Mail, MapPin, Clock, Send, CheckCircle2, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;
    
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        service: "",
        message: "",
      });
    }, 1500);
  };

  return (
    <section id="contact" className="relative py-24 bg-primary border-t border-white/5 overflow-hidden">
      {/* Background radial glow */}
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
            Contact Us
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-white tracking-tight"
          >
            Get a Quote or <br />
            <span className="text-gradient-accent">Connect With Our Team</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-gray-400 mt-4 leading-relaxed"
          >
            Fill out the freight quotation form or use our quick dials to talk to our dispatcher. Available 24/7.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Office info & Map */}
          <div className="lg:col-span-5 space-y-8">
            {/* Quick Contacts details */}
            <div className="glass-panel p-8 rounded-3xl border border-white/5 space-y-6">
              <h3 className="font-display font-extrabold text-xl text-white">Contact Info</h3>
              
              <ul className="space-y-5">
                <li className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Office Address</span>
                    <span className="text-gray-300 text-sm mt-1 block">
                      {siteData.address.line1}, {siteData.address.line2}, {siteData.address.city},{" "}
                      {siteData.address.state} - {siteData.address.pincode}
                    </span>
                  </div>
                </li>
                <li className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0 mt-0.5">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Call Phone Line</span>
                    <a
                      href={`tel:${siteData.contact.phoneDial}`}
                      className="text-gray-300 hover:text-accent text-sm mt-1 block font-semibold transition-colors"
                    >
                      {siteData.contact.phone}
                    </a>
                  </div>
                </li>
                <li className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0 mt-0.5">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Email Support</span>
                    <a
                      href={`mailto:${siteData.contact.email}`}
                      className="text-gray-300 hover:text-accent text-sm mt-1 block font-semibold transition-colors"
                    >
                      {siteData.contact.email}
                    </a>
                  </div>
                </li>
                <li className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0 mt-0.5">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Working Hours</span>
                    <span className="text-gray-300 text-sm mt-1 block">
                      {siteData.contact.workingHours}
                    </span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Google Map Embed */}
            <div className="glass-panel p-4 rounded-3xl border border-white/5 h-[300px] relative overflow-hidden shadow-premium">
              <iframe
                title={`${siteData.company.name} Map Office Location`}
                src={siteData.map.embedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="rounded-2xl opacity-80 hover:opacity-100 transition-opacity duration-300 filter invert contrast-110"
              />
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7">
            <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-white/5 relative overflow-hidden">
              
              <AnimatePresence mode="wait">
                {!isSubmitted ? (
                  <motion.form
                    key="contact-form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-6"
                  >
                    <h3 className="font-display font-extrabold text-2xl text-white mb-6">
                      Get a Quick Quote
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Name input */}
                      <div className="space-y-2">
                        <label htmlFor="name" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="John Doe"
                          className="w-full bg-primary-light border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                        />
                      </div>

                      {/* Phone input */}
                      <div className="space-y-2">
                        <label htmlFor="phone" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          required
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+91 98765 43210"
                          className="w-full bg-primary-light border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Email input */}
                      <div className="space-y-2">
                        <label htmlFor="email" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Email Address
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="john@example.com"
                          className="w-full bg-primary-light border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                        />
                      </div>

                      {/* Service select */}
                      <div className="space-y-2">
                        <label htmlFor="service" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Required Service
                        </label>
                        <select
                          id="service"
                          name="service"
                          value={formData.service}
                          onChange={handleChange}
                          className="w-full bg-primary-light border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all appearance-none cursor-pointer"
                        >
                          <option value="" disabled className="bg-primary">Select a Service</option>
                          {siteData.services.map((service) => (
                            <option key={service.id} value={service.title} className="bg-primary">
                              {service.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Message input */}
                    <div className="space-y-2">
                      <label htmlFor="message" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Consignment Details / Message
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows={4}
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Please share load details, origin city and destination city..."
                        className="w-full bg-primary-light border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all resize-none"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center space-x-2.5 py-4 px-6 rounded-xl bg-accent text-primary hover:bg-accent-hover font-extrabold text-sm shadow-glow disabled:opacity-50 transition-all duration-300 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Request Quote</span>
                        </>
                      )}
                    </button>

                  </motion.form>
                ) : (
                  <motion.div
                    key="success-form"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-12 text-center space-y-6"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent"
                    >
                      <CheckCircle2 className="w-10 h-10" />
                    </motion.div>
                    
                    <div className="space-y-2">
                      <h3 className="font-display font-extrabold text-2xl text-white">Quote Request Received!</h3>
                      <p className="text-gray-400 text-sm max-w-sm mx-auto leading-relaxed">
                        Thank you for reaching out. Our dispatcher is calculating rates and will call you back shortly.
                      </p>
                    </div>

                    <button
                      onClick={() => setIsSubmitted(false)}
                      className="px-6 py-2.5 rounded-xl border border-white/10 text-xs font-semibold hover:bg-white/5 transition-colors"
                    >
                      Send Another Request
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
