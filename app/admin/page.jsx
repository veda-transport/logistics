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
  Truck
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
      color: 'from-amber-500/20 to-amber-600/5 text-amber-400 border-amber-500/30'
    },
    {
      title: 'Total Trip Expenses',
      value: `₹${stats.totalExpenses.toLocaleString('en-IN')}`,
      subtitle: 'Diesel, Materials, Toll & Commissions',
      icon: TrendingDown,
      color: 'from-rose-500/20 to-rose-600/5 text-rose-400 border-rose-500/30'
    },
    {
      title: 'Net Profit',
      value: `₹${stats.netProfit.toLocaleString('en-IN')}`,
      subtitle: stats.totalRevenue > 0 ? `${((stats.netProfit / stats.totalRevenue) * 100).toFixed(1)}% Net Margin` : '0% Margin',
      icon: TrendingUp,
      color: 'from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/30'
    },
    {
      title: 'Estimated Dues',
      value: `₹${stats.outstandingDues.toLocaleString('en-IN')}`,
      subtitle: 'Unsettled Party Balances',
      icon: Receipt,
      color: 'from-blue-500/20 to-blue-600/5 text-blue-400 border-blue-500/30'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Business Overview</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time fleet operations, live trip revenues, expenses and net profit calculations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/feras/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 text-sm transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>New Fera</span>
          </Link>
          <Link
            href="/admin/parties/payments"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold rounded-xl border border-slate-700 text-sm transition-all"
          >
            <Receipt className="w-4 h-4" />
            <span>Record Payment</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`p-6 rounded-2xl bg-gradient-to-br border ${kpi.color} bg-slate-900/60 backdrop-blur-sm relative overflow-hidden`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{kpi.title}</span>
                <div className="p-2 rounded-xl bg-slate-950/40 border border-slate-800">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl lg:text-3xl font-black text-white">{kpi.value}</p>
                <div className="mt-2">
                  <span className="text-xs text-slate-400">{kpi.subtitle}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Trips Section */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">Recent Feras & Trips</h2>
            <p className="text-xs text-slate-400 mt-0.5">Live trip calculations from Supabase</p>
          </div>
          <Link
            href="/admin/feras"
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 group"
          >
            View all feras
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-sm">Loading live data...</p>
          </div>
        ) : recentFeras.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-800 space-y-3">
            <Truck className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-sm text-slate-400">No trips dispatched yet. Create your first Fera to see analytics.</p>
            <Link
              href="/admin/feras/new"
              className="inline-block px-4 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-xl"
            >
              + Create Fera
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-[11px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-800">
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
              <tbody className="divide-y divide-slate-800/60">
                {recentFeras.map((fera) => {
                  const rev = parseFloat(fera.agreed_amount) || 0;
                  const exp = (fera.fera_expenses || []).reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
                  const profit = rev - exp;

                  return (
                    <tr key={fera.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-4">
                        <span className="font-bold text-white block">{fera.fera_number}</span>
                        <span className="text-xs text-slate-500">{fera.fera_date}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-slate-200 block">{fera.parties?.name || '-'}</span>
                        <span className="text-xs text-amber-400/90">
                          {fera.from_location?.city || '-'} → {fera.to_location?.city || '-'} • {fera.materials?.name}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-mono font-medium text-slate-200 block">{fera.trucks?.truck_number}</span>
                        <span className="text-xs text-slate-400">{fera.drivers?.name}</span>
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-white">
                        ₹{rev.toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-4 text-right font-semibold text-rose-400">
                        -₹{exp.toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-extrabold text-emerald-400 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                          ₹{profit.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          fera.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
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
        )}
      </div>
    </div>
  );
}
