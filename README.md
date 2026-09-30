# Veda Transport & Logistics Website

A premium, highly interactive, mobile-first logistics landing page for **Veda Transport**. Optimized for search engines (SEO), fluid smooth-scrolling, and lightning-fast load times. Built with **Next.js (App Router)** and configured for automated static HTML export to **GitHub Pages**.

---

## 🚀 Tech Stack

- **Framework**: [Next.js (v16 App Router)](https://nextjs.org/)
- **Libraries**: [React (v19)](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS (v4)](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Smooth Scroll**: [Lenis](https://github.com/darkroomengineering/lenis)
- **Carousels**: [Embla Carousel](https://www.embla-carousel.com/)
- **Scrollers & Intersection**: [React CountUp](https://github.com/glennreyes/react-countup) & [React Intersection Observer](https://github.com/thewebhatesyou/react-intersection-observer)
- **Icons**: [Lucide React Icons](https://lucide.dev/)

---

## 🎨 Key Features & Design Style

1. **Premium Dark Navy Aesthetic**: Deep blue backgrounds (`#0B0F19`), white typography, orange accents (`#FF6A00`), smooth color gradients, and glassmorphic container cards.
2. **Interactive SVG Highway Parallax**: The Hero section displays a detailed cargo container truck traveling along an animated highway with spinning wheels, moving clouds, and exhaust smoke particles at a silky-smooth 60fps on mobile.
3. **Scroll-Triggered Counter Statistics**: Numbers counting up to showcase deliveries, vehicle count, and clients.
4. **Auto-Sliding Carousel**: Testimonials slider with interactive swipe support and indicator dots.
5. **Interactive Operations Gallery**: Category-filtered photography grid showing details on hover and loading a full-screen lightbox modal.
6. **Smooth Animated FAQs & Contact**: Collapsible accordions with rotating chevrons and a contact form with a dynamic thank-you popup when submitted.
7. **Production SEO & Accessibility**: Pre-configured meta tags, Twitter/OpenGraph image configurations, dynamic XML sitemaps, robots directives, and JSON-LD LocalBusiness schemas.

---

## 🗂️ Project Directory Structure

```text
├── app/
│   ├── globals.css          # Custom scrollbars, glassmorphism utilities & animation keyframes
│   ├── layout.tsx           # Fonts, layout wrapper, metadata, and JSON-LD schema
│   ├── page.tsx             # Main layout assembling section components
│   ├── robots.ts            # Dynamic robots.txt generation
│   └── sitemap.ts           # Dynamic sitemap.xml generation
├── components/
│   ├── FloatingButtons.tsx  # WhatsApp, Call, and Back To Top triggers
│   ├── Footer.tsx           # Multi-column footer information
│   ├── Navbar.tsx           # Sticky navigation header & mobile drawer
│   ├── SmoothScroll.tsx     # Client-side Lenis scroll hook
│   └── home/
│       ├── About.tsx        # Company Mission, Vision, and Values
│       ├── Contact.tsx      # Contact details, map embed & form
│       ├── FAQ.tsx          # Frequently Asked Questions accordion
│       ├── Fleet.tsx        # Capacity specs and cards of trucks
│       ├── Gallery.tsx      # Filterable photo grid with lightbox
│       ├── Hero.tsx         # Cargo truck animations and key stats
│       ├── Services.tsx     # 3x3 grids of services with illustrations
│       ├── Stats.tsx        # Large statistics scrolling count
│       ├── Testimonials.tsx # Embla sliding carousel
│       └── WhyChooseUs.tsx  # Selling propositions grid cards
├── data/
│   └── siteData.ts          # Central source of truth (ALL static copy)
├── next.config.ts           # Static HTML export & GitHub PagesBasePath configuration
└── package.json             # Build commands and deployment hooks
```

---

## ⚙️ How to Customize Site Content

Every single piece of text, phone number, address, and service description is read dynamically from a single file:

📂 **`data/siteData.ts`**

To update names, contact info, fleet specs, FAQs, or image links, **simply edit this file**. The changes will automatically propagate throughout the entire website.

---

## 🛠️ Local Development & Installation

1. **Clone the repository and install packages**:
   ```bash
   npm install
   ```

2. **Run the local dev server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

3. **Verify the static production build**:
   ```bash
   npm run build
   ```
   This will validate TypeScript, compile components, and output the static site into the `out` directory.

---

## 🚀 GitHub Pages Deployment

To deploy this site to GitHub Pages:

### 1. Configure the Repository Subfolder (Optional)

If your GitHub Pages URL has a subfolder path (e.g. `https://<username>.github.io/Veda-Transport/`):
You must pass the subfolder base path during the compilation build. We have configured the build system to read this from the `NEXT_PUBLIC_BASE_PATH` environment variable.

You can set this in your terminal or define it inside your build command.

### 2. Deploy in One Step

Run the following command in your terminal:
```bash
npm run deploy
```

**What this command does automatically:**
1. Triggers `npm run build` which runs the Next.js compiler.
2. Exports the files statically to the `out` folder.
3. Automatically creates a `.nojekyll` file inside `out/` to bypass GitHub's Jekyll compiler.
4. Uses `gh-pages` to push the static files in `out` to the `gh-pages` branch on GitHub.

After the script finishes, your updates will show up live on GitHub Pages.
