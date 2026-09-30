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
  ShieldCheck
} from 'lucide-react';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Current session info
  const [currentUser] = useState({
    name: 'Ronak Patel',
    role: 'owner',
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
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500">
            <Truck className="w-5 h-5" />
          </div>
          <span className="font-bold text-white text-base">Veda Transport</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-slate-400 hover:text-white"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Desktop & Mobile */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-64 bg-slate-900/90 backdrop-blur-xl border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 rounded-xl text-amber-400 shadow-inner">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-extrabold text-lg text-white tracking-tight">{currentUser.orgName}</h1>
                <p className="text-[11px] font-medium text-amber-500/90 uppercase tracking-wider">Multi-Tenant Admin</p>
              </div>
            </div>
          </div>

          {/* Quick Create CTA */}
          <div className="p-4 pb-2">
            <Link
              href="/admin/feras/new"
              onClick={() => setMobileOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Fera</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="text-sm font-semibold text-slate-200 truncate">{currentUser.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[11px] uppercase tracking-wider font-bold text-amber-400/90">
                  {currentUser.role}
                </span>
              </div>
            </div>
            <button
              onClick={() => router.push('/')}
              title="Return to Public Site"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 pt-16 lg:pt-0 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
