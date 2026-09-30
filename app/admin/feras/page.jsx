'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Trash2, Loader2, Truck, FileText } from 'lucide-react';
import { supabase, getActiveOrgId } from '@/lib/supabase';

export default function FerasListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [feras, setFeras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    async function loadFeras() {
      try {
        const orgId = await getActiveOrgId();
        if (!orgId || ignore) return;

        const { data, error } = await supabase
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
            from_location:locations!feras_from_location_id_fkey(name, city),
            to_location:locations!feras_to_location_id_fkey(name, city),
            fera_expenses(amount),
            fera_documents(file_url, file_name)
          `)
          .eq('organization_id', orgId)
          .order('fera_date', { ascending: false });

        if (error) throw error;
        if (!ignore) {
          setFeras(data || []);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching feras:', err);
        if (!ignore) setLoading(false);
      }
    }

    loadFeras();
    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  const handleDelete = async (id, feraNumber) => {
    if (!confirm(`Are you sure you want to delete ${feraNumber}?`)) return;
    try {
      const { error } = await supabase.from('feras').delete().eq('id', id);
      if (error) throw error;
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert('Error deleting fera: ' + err.message);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const { error } = await supabase.from('feras').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  const filteredFeras = feras.filter((item) => {
    const pName = item.parties?.name || '';
    const tNum = item.trucks?.truck_number || '';
    const dName = item.drivers?.name || '';
    const fNum = item.fera_number || '';

    const matchesSearch = 
      fNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Fera Management (Trips)</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Monitor all trip dispatches, route expenses, driver assignments, and live net profits.
          </p>
        </div>
        <Link
          href="/admin/feras/new"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 text-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Fera</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by Fera #, Party, Truck Number or Driver..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-500/50"
          >
            <option value="all">All Statuses</option>
            <option value="in_progress">In Progress</option>
            <option value="planned">Planned</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-sm">Loading trips from Supabase...</p>
        </div>
      ) : filteredFeras.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No feras / trips recorded yet</h3>
            <p className="text-xs text-slate-400 mt-1">Create your first trip dispatch to track revenue, expenses, and weight slips.</p>
          </div>
          <Link
            href="/admin/feras/new"
            className="inline-block px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all"
          >
            + Create First Fera
          </Link>
        </div>
      ) : (
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/70 text-[11px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Fera Details</th>
                  <th className="py-3.5 px-4">Party & Route</th>
                  <th className="py-3.5 px-4">Truck & Driver</th>
                  <th className="py-3.5 px-4 text-right">Agreed Revenue</th>
                  <th className="py-3.5 px-4 text-right">Trip Expenses</th>
                  <th className="py-3.5 px-4 text-right">Net Profit</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredFeras.map((item) => {
                  const revenue = parseFloat(item.agreed_amount) || 0;
                  const totalExp = (item.fera_expenses || []).reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
                  const netProfit = revenue - totalExp;
                  const doc = item.fera_documents?.[0];

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-4">
                        <span className="font-bold text-white block">{item.fera_number}</span>
                        <span className="text-xs text-slate-500">{item.fera_date}</span>
                        {doc && (
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:underline mt-1"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Slip</span>
                          </a>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-slate-200 block">{item.parties?.name || '-'}</span>
                        <span className="text-xs text-amber-400/90">
                          {item.from_location?.city || item.from_location?.name || '-'} → {item.to_location?.city || item.to_location?.name || '-'}
                        </span>
                        <span className="text-xs text-slate-400 block">{item.materials?.name} ({item.weight} {item.weight_unit})</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-medium text-slate-200 block font-mono">{item.trucks?.truck_number}</span>
                        <span className="text-xs text-slate-400">{item.drivers?.name}</span>
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-white">
                        ₹{revenue.toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-4 text-right font-medium text-rose-400">
                        -₹{totalExp.toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-extrabold text-emerald-400 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                          ₹{netProfit.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.id, e.target.value)}
                          className="bg-slate-950 border border-slate-800 text-xs font-bold rounded-lg px-2 py-1 text-slate-200"
                        >
                          <option value="in_progress">In Progress</option>
                          <option value="planned">Planned</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleDelete(item.id, item.fera_number)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
                          title="Delete Fera"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
