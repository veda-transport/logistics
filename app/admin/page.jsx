'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ArrowUpRight, 
  Plus,
  Receipt,
  Loader2,
  Truck,
  Sparkles,
  Calendar,
  MapPin
} from 'lucide-react';
import { supabase, getActiveOrgId } from '@/lib/supabase';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    completedFerasCount: 0,
    outstandingDues: 0,
  });
  const [recentFeras, setRecentFeras] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const orgId = await getActiveOrgId();
        if (!orgId) return;

        // Fetch Feras with relations
        const { data: ferasData } = await supabase
          .from('feras')
          .select(`
            id,
            fera_number,
            fera_date,
            agreed_amount,
            weight,
            weight_unit,
            status,
            parties(name),
            trucks(truck_number),
            drivers(name),
            materials(name),
            from_location:locations!feras_from_location_id_fkey(city),
            to_location:locations!feras_to_location_id_fkey(city),
            fera_expenses(amount)
          `)
          .eq('organization_id', orgId)
          .order('fera_date', { ascending: false });

        const feras = ferasData || [];

        let rev = 0;
        let exp = 0;
        let completed = 0;

        feras.forEach((f) => {
          const agreed = parseFloat(f.agreed_amount) || 0;
          const feraExp = (f.fera_expenses || []).reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
          rev += agreed;
          exp += feraExp;
          if (f.status === 'completed') completed++;
        });

        // Fetch Payments
        const { data: payData } = await supabase
          .from('party_payments')
          .select('amount')
          .eq('organization_id', orgId);

        const totalReceived = (payData || []).reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
        const dues = Math.max(0, rev - totalReceived);

        setStats({
          totalRevenue: rev,
          totalExpenses: exp,
          netProfit: rev - exp,
          completedFerasCount: completed,
          outstandingDues: dues,
        });

        setRecentFeras(feras.slice(0, 5));
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const kpis = [
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`,
      subtitle: `${stats.completedFerasCount} Completed Trips`,
      icon: DollarSign,
      color: 'border-amber-500/30 bg-[#0c1220]/95 shadow-amber-500/5',
      iconColor: 'text-amber-400 bg-amber-500/15 border-amber-500/30'
    },
    {
      title: 'Total Trip Expenses',
      value: `₹${stats.totalExpenses.toLocaleString('en-IN')}`,
      subtitle: 'Diesel, Materials, Toll & Commissions',
      icon: TrendingDown,
      color: 'border-rose-500/30 bg-[#0c1220]/95 shadow-rose-500/5',
      iconColor: 'text-rose-400 bg-rose-500/15 border-rose-500/30'
    },
    {
      title: 'Net Profit',
      value: `₹${stats.netProfit.toLocaleString('en-IN')}`,
      subtitle: stats.totalRevenue > 0 ? `${((stats.netProfit / stats.totalRevenue) * 100).toFixed(1)}% Net Margin` : '0% Margin',
      icon: TrendingUp,
      color: 'border-emerald-500/30 bg-[#0c1220]/95 shadow-emerald-500/5',
      iconColor: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
    },
    {
      title: 'Estimated Dues',
      value: `₹${stats.outstandingDues.toLocaleString('en-IN')}`,
      subtitle: 'Unsettled Party Balances',
      icon: Receipt,
      color: 'border-sky-500/30 bg-[#0c1220]/95 shadow-sky-500/5',
      iconColor: 'text-sky-400 bg-sky-500/15 border-sky-500/30'
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Executive Dashboard</h1>
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time fleet performance, live trip billing, and net profit ledger.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/feras"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 text-xs sm:text-sm transition-all hover:scale-[1.02] border border-amber-300/30"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ New Trip (Fera)</span>
          </Link>
          <Link
            href="/admin/parties/payments"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0c1220] hover:bg-[#131c33] text-amber-300 font-bold rounded-xl border border-amber-500/25 text-xs sm:text-sm transition-all"
          >
            <Receipt className="w-4 h-4" />
            <span>Record Payment</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid (Goverdhan Haveli Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`p-5 sm:p-6 rounded-3xl border ${kpi.color} backdrop-blur-xl relative overflow-hidden shadow-xl transition-all hover:scale-[1.01]`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-400">{kpi.title}</span>
                <div className={`p-2 rounded-2xl border ${kpi.iconColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl sm:text-3xl font-black text-white font-mono">{kpi.value}</p>
                <div className="mt-1.5">
                  <span className="text-xs font-semibold text-slate-400">{kpi.subtitle}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Trips Section */}
      <div className="bg-[#0c1220]/95 border border-amber-500/20 rounded-3xl p-5 sm:p-7 backdrop-blur-xl shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-amber-500/15 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white">Recent Feras & Trips</h2>
            <p className="text-xs text-slate-400 mt-0.5">Live trip records & dispatches</p>
          </div>
          <Link
            href="/admin/feras"
            className="text-xs font-extrabold text-amber-400 hover:text-amber-300 flex items-center gap-1 group bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20"
          >
            <span>View All Trips</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            <p className="text-sm font-bold text-amber-200">Loading live data...</p>
          </div>
        ) : recentFeras.length === 0 ? (
          <div className="p-8 text-center bg-[#070b14]/60 rounded-2xl border border-dashed border-amber-500/20 space-y-3">
            <Truck className="w-8 h-8 mx-auto text-amber-500/40" />
            <p className="text-sm text-slate-400">No trips dispatched yet. Create your first Fera to see analytics.</p>
            <Link
              href="/admin/feras"
              className="inline-block px-4 py-2 bg-amber-500 text-slate-950 text-xs font-black rounded-xl"
            >
              + Create Fera
            </Link>
          </div>
        ) : (
          <>
            {/* Mobile Cards for Recent Feras */}
            <div className="block md:hidden space-y-3">
              {recentFeras.map((fera) => {
                const rev = parseFloat(fera.agreed_amount) || 0;
                const exp = (fera.fera_expenses || []).reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
                const profit = rev - exp;

                return (
                  <div key={fera.id} className="p-4 bg-[#070b14]/80 border border-amber-500/15 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white font-mono text-sm block">{fera.fera_number}</span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-amber-400" />
                          <span>{fera.fera_date}</span>
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                        fera.status === 'completed'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
                      }`}>
                        {fera.status}
                      </span>
                    </div>

                    <div className="text-xs space-y-1">
                      <div className="text-amber-300 font-bold flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        <span>{fera.from_location?.city || '-'} → {fera.to_location?.city || '-'}</span>
                      </div>
                      <div className="text-slate-300 pl-4 font-semibold">{fera.parties?.name || '-'} • {fera.materials?.name}</div>
                    </div>

                    <div className="p-2 bg-[#0c1220] rounded-xl border border-amber-500/10 grid grid-cols-3 gap-1 text-center text-xs">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Billing</span>
                        <span className="font-bold text-white">₹{rev.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-rose-400 uppercase block">Exp</span>
                        <span className="font-bold text-rose-400">-₹{exp.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-emerald-400 uppercase block">Profit</span>
                        <span className="font-black text-emerald-400">₹{profit.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table for Recent Feras */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-[#070b14]/90 text-[11px] uppercase font-black text-amber-400 tracking-wider border-b border-amber-500/20">
                  <tr>
                    <th className="py-3.5 px-4">Fera # / Date</th>
                    <th className="py-3.5 px-4">Party & Route</th>
                    <th className="py-3.5 px-4">Truck & Driver</th>
                    <th className="py-3.5 px-4 text-right">Revenue</th>
                    <th className="py-3.5 px-4 text-right">Expenses</th>
                    <th className="py-3.5 px-4 text-right">Net Profit</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-500/10">
                  {recentFeras.map((fera) => {
                    const rev = parseFloat(fera.agreed_amount) || 0;
                    const exp = (fera.fera_expenses || []).reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
                    const profit = rev - exp;

                    return (
                      <tr key={fera.id} className="hover:bg-[#131c33]/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-white block font-mono">{fera.fera_number}</span>
                          <span className="text-xs text-slate-400">{fera.fera_date}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-200 block">{fera.parties?.name || '-'}</span>
                          <span className="text-xs text-amber-400/90 font-medium">
                            {fera.from_location?.city || '-'} → {fera.to_location?.city || '-'} • {fera.materials?.name}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-medium text-slate-200 block">{fera.trucks?.truck_number}</span>
                          <span className="text-xs text-slate-400">{fera.drivers?.name}</span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-white">
                          ₹{rev.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-rose-400">
                          -₹{exp.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="font-black text-emerald-400 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                            ₹{profit.toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            fera.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                          }`}>
                            {fera.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
