"use client";

import { siteData } from "@/data/siteData";
import { Phone, Mail, MapPin, Clock, ArrowRight } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const targetId = href.substring(1);
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = targetElement.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <footer className="relative bg-primary-dark border-t border-white/5 pt-16 pb-8 overflow-hidden z-10">
      {/* Background ambient glowing shapes */}
      <div className="absolute top-0 right-1/4 w-[300px] h-[300px] bg-accent/5 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-indigo-600/5 rounded-full filter blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Column 1: Company Profile */}
          <div className="space-y-6">
            <a href="#home" className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
                <span className="font-display font-black text-primary text-lg">V</span>
              </div>
              <span className="font-display font-extrabold text-xl tracking-tight text-white">
                {siteData.company.name}
              </span>
            </a>
            <p className="text-gray-400 text-sm leading-relaxed">
              {siteData.company.description}
            </p>
            {/* Social Links */}
            <div className="flex items-center space-x-4 pt-2">
              {siteData.social.facebook && (
                <a
                  href={siteData.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-accent hover:text-primary transition-all duration-300"
                  aria-label="Facebook"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </a>
              )}
              {siteData.social.instagram && (
                <a
                  href={siteData.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-accent hover:text-primary transition-all duration-300"
                  aria-label="Instagram"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
              )}
              {siteData.social.linkedin && (
                <a
                  href={siteData.social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-accent hover:text-primary transition-all duration-300"
                  aria-label="LinkedIn"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect x="2" y="9" width="4" height="12" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                </a>
              )}
              {siteData.social.youtube && (
                <a
                  href={siteData.social.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-accent hover:text-primary transition-all duration-300"
                  aria-label="YouTube"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                  </svg>
                </a>
              )}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="font-display font-bold text-white text-base mb-6 uppercase tracking-wider relative after:content-[''] after:absolute after:bottom-[-8px] after:left-0 after:w-8 after:h-[2px] after:bg-accent">
              Quick Links
            </h3>
            <ul className="space-y-3.5">
              {[
                { name: "Home", href: "#home" },
                { name: "About Us", href: "#about" },
                { name: "Services Offered", href: "#services" },
                { name: "Why Choose Us", href: "#why-choose-us" },
                { name: "Our Fleet", href: "#fleet" },
                { name: "Contact Us", href: "#contact" },
              ].map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    onClick={(e) => handleLinkClick(e, link.href)}
                    className="group flex items-center text-gray-400 hover:text-white text-sm transition-colors duration-300"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-accent mr-2 transform group-hover:translate-x-1 transition-transform duration-300" />
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Logistics Services */}
          <div>
            <h3 className="font-display font-bold text-white text-base mb-6 uppercase tracking-wider relative after:content-[''] after:absolute after:bottom-[-8px] after:left-0 after:w-8 after:h-[2px] after:bg-accent">
              Services
            </h3>
            <ul className="space-y-3.5">
              {siteData.services.slice(0, 6).map((service) => (
                <li key={service.title}>
                  <a
                    href="#services"
                    onClick={(e) => handleLinkClick(e, "#services")}
                    className="group flex items-center text-gray-400 hover:text-white text-sm transition-colors duration-300"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mr-3 group-hover:scale-150 transition-all duration-300" />
                    {service.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact & Office Info */}
          <div className="space-y-5">
            <h3 className="font-display font-bold text-white text-base mb-6 uppercase tracking-wider relative after:content-[''] after:absolute after:bottom-[-8px] after:left-0 after:w-8 after:h-[2px] after:bg-accent">
              Head Office
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3.5 text-sm text-gray-400">
                <MapPin className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <span>
                  {siteData.address.line1}, {siteData.address.line2}, {siteData.address.city},{" "}
                  {siteData.address.state} - {siteData.address.pincode}
                </span>
              </li>
              <li className="flex items-center space-x-3.5 text-sm text-gray-400">
                <Phone className="w-5 h-5 text-accent shrink-0" />
                <a href={`tel:${siteData.contact.phoneDial}`} className="hover:text-white transition-colors duration-300">
                  {siteData.contact.phone}
                </a>
              </li>
              <li className="flex items-center space-x-3.5 text-sm text-gray-400">
                <Mail className="w-5 h-5 text-accent shrink-0" />
                <a href={`mailto:${siteData.contact.email}`} className="hover:text-white transition-colors duration-300">
                  {siteData.contact.email}
                </a>
              </li>
              <li className="flex items-start space-x-3.5 text-sm text-gray-400">
                <Clock className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <span>{siteData.contact.workingHours}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center">
          <p className="text-gray-500 text-xs">
            © {currentYear} {siteData.company.name}. All Rights Reserved.
          </p>
          <p className="text-gray-500 text-xs">
            Designed for Premium Performance & Fast Delivery.
          </p>
        </div>
      </div>
    </footer>
  );
}
