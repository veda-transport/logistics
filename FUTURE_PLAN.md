# Veda Transport — Product & Engineering Roadmap (Future Plan)

A comprehensive guide and reference document detailing potential future enhancements, high-value feature ideas, and technical architectural upgrades for the **Veda Transport** platform (Admin Panel & Public Website).

---

## 📑 Table of Contents
1. [Admin Panel Enhancements (Operations, Financials & Fleet)](#1-admin-panel-enhancements)
2. [Public Website Enhancements (Conversion, Trust & Self-Service)](#2-public-website-enhancements)
3. [Automation & Notification Workflows](#3-automation--notification-workflows)
4. [Technical & Architectural Improvements](#4-technical--architectural-improvements)
5. [Prioritized Implementation Matrix](#5-prioritized-implementation-matrix)

---

## 1. Admin Panel Enhancements

### 1.1 Automated Payment Reminders & Ageing Ledger Analysis
* **Problem**: Following up on overdue party payments manually takes significant time.
* **Solution**:
  - **Dues Ageing Buckets**: Classify outstanding party balances into `0–15 Days`, `16–30 Days`, `31–60 Days`, and `60+ Days (Overdue)`.
  - **1-Click WhatsApp Payment Reminder**: A button to send a polite, formatted ledger reminder to the party with summary breakdown and official UPI / Bank NEFT details.
  - **Payment Receipts (PDF)**: Auto-generate branded payment receipt slips when payments are recorded in `/admin/parties/payments`.

### 1.2 Driver Dispatch Slip & Fuel Advance via WhatsApp
* **Problem**: Drivers often call back asking for pickup contacts, unload locations, and advance confirmation.
* **Solution**:
  - **Driver Trip Voucher (WhatsApp / PDF)**: 1-Click trigger to send the driver their trip details:
    - LR Number & Truck Number
    - Pickup & Drop Addresses with Google Maps navigation links
    - Dispatched Diesel Amount / Cash Advance
    - Emergency contact numbers

### 1.3 Fleet Compliance, Document Expiry & Maintenance Dashboard
* **Problem**: Missing renewal dates for truck documents (PUC, Insurance, Fitness, National Permit, Road Tax) leads to heavy RTO penalties.
* **Solution**:
  - **Expiry Tracker Badge**: Color-coded badges (`Expired`, `Expiring in 7 Days`, `Expiring in 30 Days`).
  - **Maintenance Log & Service Reminders**: Track oil changes, tyre replacements, and scheduled servicing per truck.
  - **Document Vault**: Upload multi-page RC books, insurance policies, and permit PDFs to Cloudinary with secure download links.

### 1.4 Real-Time P&L Profitability Analytics per Truck & Route
* **Problem**: Difficult to immediately know which routes or trucks generate the highest net margin.
* **Solution**:
  - **Net Trip Profit Calculator**: `Net Margin = (Freight + Extra Charges) - (Diesel + Toll + Driver Comm + Maintenance)`.
  - **Visual Charts**: Interactive monthly charts for:
    - Top Profitable Routes (e.g., Surat ➔ Mumbai vs Surat ➔ Ahmedabad)
    - Highest Earning Trucks & Fuel Mileage (km/L) Metrics
    - Expense breakdown distribution (Fuel, Tolls, Commissions).

### 1.5 Multi-Party Batch Invoicing & Split Billing
* **Problem**: Shared loads carrying goods for two different parties in one truck.
* **Solution**:
  - Allow assigning multiple party consignments to a single Fera with individual rate calculations, separate LR numbers, and distinct PDF bills.

---

## 2. Public Website Enhancements

### 2.1 Instant Freight & Rate Estimator (Interactive Quote Calculator)
* **Problem**: Potential clients leave if they have to wait hours for a quotation.
* **Solution**:
  - **Interactive Quote Widget** on the homepage:
    1. Select Origin & Destination (Surat, Mumbai, Ahmedabad, Vapi, Pune, etc.)
    2. Select Cargo Type (Textiles, Industrial, FMCG, Heavy Machinery)
    3. Select Vehicle Type (Tata Ace, 14ft Eicher, 22ft Open, 32ft Container)
    4. Displays an estimated rate range with an instant **"Confirm Booking via WhatsApp"** CTA with pre-filled load specs.

### 2.2 Public Shipment Tracking Portal (`/track`)
* **Problem**: Client support channels get overloaded with routine "Where is my shipment?" queries.
* **Solution**:
  - Public `/track` search page where clients enter their **LR Number** or **Registered Mobile Number**.
  - Visual status timeline:
    - `Order Confirmed` ➔ `Truck Dispatched` ➔ `Goods Loaded` ➔ `In Transit` ➔ `Delivered`.
  - Option to view live GPS location link if enabled on the vehicle.

### 2.3 Interactive Network Coverage Map
* **Problem**: Static text lists don't convey the breadth of regular routes.
* **Solution**:
  - SVG / Mapbox interactive map highlighting regular daily container schedules, transit turnaround times (e.g. Surat to Mumbai within 12 hours), and hub locations.

### 2.4 Client Self-Service Portal (OTP Login)
* **Problem**: Clients frequently request past month invoices and ledger statements.
* **Solution**:
  - Simple mobile OTP login for registered parties.
  - Access to downloadable GST invoices, proof of deliveries (POD), and dispatch history.

### 2.5 Dynamic Social Proof & Google Reviews
* **Problem**: New industrial enterprise clients require strong social proof before booking high-value freight.
* **Solution**:
  - Google Reviews API integration with real star ratings, client testimonials, and verified partner company badges.

---

## 3. Automation & Notification Workflows

| Feature | Trigger | Channel | Content |
| :--- | :--- | :--- | :--- |
| **Trip Dispatch Alert** | Trip status changed to `in_progress` | WhatsApp / SMS | Consignment LR, Truck number, Driver phone, Estimated arrival time |
| **Delivery Confirmation** | Trip marked `completed` / POD uploaded | WhatsApp | Digital Delivery Confirmation & link to download invoice |
| **Payment Reminder** | Overdue ledger balance > 15 days | WhatsApp | Professional balance summary + Bank NEFT / UPI QR code |
| **Document Expiry Alert** | 7 days before Fitness/Insurance expiry | Email / Admin Notification | Truck number, document type, renewal link |

---

## 4. Technical & Architectural Improvements

- **PWA (Progressive Web App) Setup**:
  - Enable offline caching and "Add to Home Screen" so managers and drivers can use the admin panel like a native mobile app.
- **Role-Based Access Control (RBAC)**:
  - Separate roles: `Super Admin` (full access), `Dispatcher / Branch Manager` (trip creation only), and `Accountant` (billing & payments only).
- **Automated Database Backups & Audit Trail**:
  - Track who modified agreed freight rates, deleted trips, or edited payments for financial accountability.
- **E-Way Bill API Integration**:
  - Integrate with GST / E-Way bill APIs to automatically auto-fill consignor, consignee, and HSN codes from the 12-digit E-Way bill number.

---

## 5. Prioritized Implementation Matrix

```
High Impact, Fast Implementation (Phase 1):
├── 1. 1-Click Driver Dispatch Voucher (WhatsApp)
├── 2. Truck Document Expiry Alerts & Reminders
└── 3. WhatsApp Payment Reminder with UPI details

High Impact, Medium Implementation (Phase 2):
├── 4. Instant Freight Rate Estimator on Homepage
├── 5. Public Shipment Tracking Portal (/track)
└── 6. Real-Time Truck & Route Profitability (P&L)

Advanced Scale Features (Phase 3):
├── 7. Client Self-Service Portal (OTP Login)
├── 8. Role-Based Access Control (RBAC)
└── 9. E-Way Bill Auto-Sync & Verification
```

---

*Document created on: October 3, 2026*  
*Project: Veda Transport System*
