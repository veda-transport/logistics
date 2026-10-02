'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Truck, 
  Users, 
  MapPin, 
  Package, 
  CreditCard, 
  DollarSign, 
  LayoutDashboard, 
  LogOut, 
  Menu, 
  X, 
  PlusCircle, 
  ShieldCheck, 
  Sparkles,
  Building2
} from 'lucide-react';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Current session info
  const [currentUser] = useState({
    name: 'Ronak Patel',
    role: 'Owner & Admin',
    orgName: 'Veda Transport',
  });

  const navItems = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Feras (Trips)', href: '/admin/feras', icon: Truck },
    { label: 'Parties & Ledger', href: '/admin/parties', icon: DollarSign },
    { label: 'Party Payments', href: '/admin/parties/payments', icon: CreditCard },
    { label: 'Trucks & Fleet', href: '/admin/trucks', icon: ShieldCheck },
    { label: 'Drivers & Payroll', href: '/admin/drivers', icon: Users },
    { label: 'Materials Master', href: '/admin/materials', icon: Package },
    { label: 'Locations Master', href: '/admin/locations', icon: MapPin },
    { label: 'Company Profile', href: '/admin/settings', icon: Building2 },
  ];

  return (
    <div className="flex min-h-screen bg-[#070b14] text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0c1220]/95 backdrop-blur-xl border-b border-amber-500/20 px-4 py-3 flex items-center justify-between shadow-lg shadow-black/40">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl text-slate-950 shadow-md shadow-amber-500/30">
            <Truck className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-extrabold text-white text-base tracking-tight block">Veda Transport</span>
            <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider block -mt-0.5">Fleet Admin</span>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl bg-slate-900 border border-amber-500/20 text-amber-400 hover:text-white transition-all cursor-pointer"
          aria-label="Toggle Navigation"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Sidebar Desktop & Mobile */}
      <aside
        className={`fixed lg:sticky top-0 bottom-0 left-0 z-40 w-72 h-screen bg-[#0a0f1d]/95 backdrop-blur-2xl border-r border-amber-500/20 flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-2xl ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="overflow-y-auto">
          {/* Logo Brand Header */}
          <div className="p-5 border-b border-amber-500/15 flex items-center justify-between bg-gradient-to-b from-amber-500/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl text-slate-950 shadow-lg shadow-amber-500/30 border border-amber-300/40">
                <Truck className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="font-black text-base text-white tracking-tight">{currentUser.orgName}</h1>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Logistics & ERP Suite</p>
              </div>
            </div>
          </div>

          {/* Quick Create CTA */}
          <div className="p-4 pb-2">
            <Link
              href="/admin/feras"
              onClick={() => setMobileOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] border border-amber-300/40"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span>+ Record New Trip / Fera</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <div className="px-3 pt-2 pb-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
              Core Operations
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold shadow-lg shadow-amber-500/20 scale-[1.01]'
                      : 'text-slate-300 hover:text-white hover:bg-[#131c33] border border-transparent hover:border-amber-500/20'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950 stroke-[2.5]' : 'text-amber-400/80'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-amber-500/15 bg-[#070b14]/80">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse"></span>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-400">
                  {currentUser.role}
                </span>
              </div>
            </div>
            <button
              onClick={() => router.push('/')}
              title="Return to Public Site"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-500/20"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 pt-16 lg:pt-0 overflow-y-auto relative z-10">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}
