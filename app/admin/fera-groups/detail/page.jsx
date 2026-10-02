'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Boxes, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  Edit3, 
  FileDown, 
  Loader2, 
  Plus, 
  Printer, 
  Trash2, 
  Truck, 
  User, 
  Layers, 
  Coins, 
  DollarSign, 
  TrendingUp, 
  FileText,
  MapPin,
  X,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { supabase, getActiveOrgId } from '@/lib/supabase';
import { generateFeraGroupBillPDF, generateSingleFeraPDF } from '@/lib/feraPdf';

function FeraGroupDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const groupId = searchParams.get('id');

  const [group, setGroup] = useState(null);
  const [party, setParty] = useState(null);
  const [feras, setFeras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Modal to assign existing unassigned feras to this group
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [unassignedFeras, setUnassignedFeras] = useState([]);
  const [selectedToAssign, setSelectedToAssign] = useState([]);
  const [assigning, setAssigning] = useState(false);

  const fetchGroupDetails = async () => {
    if (!groupId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const orgId = await getActiveOrgId();
      if (!orgId) return;

      // 1. Fetch group
      const { data: gData, error: gError } = await supabase
        .from('fera_groups')
        .select(`
          *,
          parties(*)
        `)
        .eq('id', groupId)
        .eq('organization_id', orgId)
        .single();

      if (gError) throw gError;
      setGroup(gData);
      setParty(gData.parties);

      // 2. Fetch all feras belonging to this group
      const { data: fData, error: fError } = await supabase
        .from('feras')
        .select(`
          *,
          trucks(id, truck_number, truck_type),
          drivers(id, name),
          materials(id, name, unit),
          from_location:locations!feras_from_location_id_fkey(id, name, city),
          to_location:locations!feras_to_location_id_fkey(id, name, city),
          fera_expenses(*),
          fera_documents(*)
        `)
        .eq('organization_id', orgId)
        .eq('fera_group_id', groupId)
        .order('fera_date', { ascending: true });

      if (fError) throw fError;
      setFeras(fData || []);
    } catch (err) {
      console.error('Error loading group detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupDetails();
  }, [groupId]);

  // Handle Quick Status Change
  const handleStatusChange = async (newStatus) => {
    try {
      setStatusUpdating(true);
      const orgId = await getActiveOrgId();
      const { error } = await supabase
        .from('fera_groups')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', groupId)
        .eq('organization_id', orgId);

      if (error) throw error;
      setGroup((prev) => ({ ...prev, status: newStatus }));
    } catch (err) {
      alert('Error updating status: ' + err.message);
    } finally {
      setStatusUpdating(false);
    }
  };

  // Open Assign Unassigned Feras Modal
  const handleOpenAssignModal = async () => {
    try {
      const orgId = await getActiveOrgId();
      if (!group?.party_id) return;

      const { data, error } = await supabase
        .from('feras')
        .select(`
          id,
          fera_number,
          fera_date,
          agreed_amount,
          weight,
          materials(name),
          trucks(truck_number)
        `)
        .eq('organization_id', orgId)
        .eq('party_id', group.party_id)
        .is('fera_group_id', null)
        .order('fera_date', { ascending: false });

      if (error) throw error;
      setUnassignedFeras(data || []);
      setSelectedToAssign([]);
      setShowAssignModal(true);
    } catch (err) {
      alert('Error fetching unassigned feras: ' + err.message);
    }
  };

  const handleAssignFerasSubmit = async (e) => {
    e.preventDefault();
    if (selectedToAssign.length === 0) {
      alert('Please select at least one Fera to assign.');
      return;
    }

    setAssigning(true);
    try {
      const orgId = await getActiveOrgId();
      const { error } = await supabase
        .from('feras')
        .update({ fera_group_id: groupId })
        .in('id', selectedToAssign)
        .eq('organization_id', orgId);

      if (error) throw error;
      setShowAssignModal(false);
      fetchGroupDetails();
    } catch (err) {
      alert('Error assigning feras: ' + err.message);
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassignFera = async (feraId, feraNo) => {
    if (!window.confirm(`Unassign trip ${feraNo} from group ${group.group_number}?`)) return;
    try {
      const orgId = await getActiveOrgId();
      const { error } = await supabase
        .from('feras')
        .update({ fera_group_id: null })
        .eq('id', feraId)
        .eq('organization_id', orgId);

      if (error) throw error;
      setFeras((prev) => prev.filter((f) => f.id !== feraId));
    } catch (err) {
      alert('Error unassigning trip: ' + err.message);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setGeneratingPdf(true);
      await generateFeraGroupBillPDF({
        group,
        party,
        feras,
        asOfDate: new Date(),
      });
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Error generating PDF: ' + err.message);
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        <p className="text-slate-400 text-xs font-bold">Loading Fera Group Details...</p>
      </div>
    );
  }

  if (!groupId || !group) {
    return (
      <div className="p-8 text-center space-y-4 bg-[#0c1220]/80 rounded-3xl border border-amber-500/20 max-w-lg mx-auto mt-12">
        <Boxes className="w-12 h-12 text-slate-500 mx-auto" />
        <p className="text-white text-base font-bold">Fera Group Not Found</p>
        <p className="text-slate-400 text-xs">Please select a valid Fera Group from the management list.</p>
        <Link 
          href="/admin/fera-groups" 
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-slate-950 font-black rounded-xl text-xs hover:bg-amber-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Fera Groups</span>
        </Link>
      </div>
    );
  }

  // Financial and Operational Calculations
  const totalFerasCount = feras.length;
  let totalWeight = 0;
  let totalFreight = 0;
  let totalAdvance = 0;
  let totalCharges = 0;
  let totalDeductions = 0;
  let totalPayments = 0;
  let totalExpenses = 0;

  const matMap = {};

  feras.forEach((f) => {
    const freight = parseFloat(f.agreed_amount) || 0;
    const weight = parseFloat(f.weight) || 0;
    const adv = parseFloat(f.advance_amount) || 0;
    const chg = parseFloat(f.extra_charges) || 0;
    const ded = parseFloat(f.deduction_amount) || 0;
    const paid = parseFloat(f.paid_amount) || parseFloat(f.received_amount) || 0;

    const tripExp = (f.fera_expenses || []).reduce((acc, exp) => acc + (parseFloat(exp.amount) || 0), 0);

    totalWeight += weight;
    totalFreight += freight;
    totalAdvance += adv;
    totalCharges += chg;
    totalDeductions += ded;
    totalPayments += paid;
    totalExpenses += tripExp;

    const mName = f.materials?.name || 'Material';
    if (!matMap[mName]) {
      matMap[mName] = { count: 0, weight: 0 };
    }
    matMap[mName].count += 1;
    matMap[mName].weight += weight;
  });

  const totalOutstanding = Math.max(0, (totalFreight + totalCharges) - (totalAdvance + totalDeductions + totalPayments));
  const netProfit = totalFreight - totalExpenses;
  const profitMargin = totalFreight > 0 ? ((netProfit / totalFreight) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6 pb-16">
      {/* Top Bar Navigation & Header */}
      <div className="bg-[#0c1220]/95 backdrop-blur-xl border border-amber-500/20 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/fera-groups"
              className="p-2.5 bg-[#131c33] border border-amber-500/20 rounded-2xl text-amber-300 hover:text-white hover:bg-amber-500/10 transition-all cursor-pointer shadow-md"
              title="Back to Groups"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xl sm:text-2xl font-black font-mono text-amber-400">
                  {group.group_number}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700">
                  {totalFerasCount} Trips
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 mt-0.5">
                <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{party?.name || 'Client Party'}</span>
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Selector */}
            <div className="flex items-center gap-2 bg-[#070b14] border border-amber-500/20 rounded-2xl px-3 py-1.5 shadow-inner">
              <span className="text-xs font-bold text-slate-400">Status:</span>
              <select
                value={group.status}
                disabled={statusUpdating}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="bg-transparent text-xs font-black text-amber-400 focus:outline-none cursor-pointer"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="settled">Settled</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPDF}
              disabled={generatingPdf || feras.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {generatingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4 stroke-[2.5]" />
              )}
              <span>Group Bill PDF</span>
            </button>

            {/* Add Fera to Group Button */}
            <Link
              href={`/admin/feras/new?group_id=${group.id}&party_id=${group.party_id}`}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>New Fera in Group</span>
            </Link>

            {/* Assign Existing */}
            <button
              onClick={handleOpenAssignModal}
              className="px-3.5 py-2.5 bg-[#131c33] border border-amber-500/20 hover:border-amber-500/40 text-slate-300 hover:text-white rounded-2xl text-xs font-bold transition-all cursor-pointer"
              title="Attach existing unassigned feras to this group"
            >
              Attach Existing Trips
            </button>
          </div>
        </div>

        {/* Group Description & Date Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-amber-500/10 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Group Date: <strong className="text-white font-mono">{new Date(group.group_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></span>
          </div>

          <div className="sm:col-span-2 flex items-center gap-2 text-slate-300">
            <FileText className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Requirement: <strong className="text-white">{group.name || group.description || 'General Order Batch'}</strong></span>
          </div>
        </div>
      </div>

      {/* Financial Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-[#0c1220]/90 border border-amber-500/20 rounded-2xl p-4 shadow-xl">
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Total Feras</p>
          <p className="text-xl font-black text-white font-mono mt-1">{totalFerasCount}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Trips in batch</p>
        </div>

        <div className="bg-[#0c1220]/90 border border-amber-500/20 rounded-2xl p-4 shadow-xl">
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Total Weight</p>
          <p className="text-xl font-black text-amber-400 font-mono mt-1">{totalWeight.toFixed(2)}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Metric Tons</p>
        </div>

        <div className="bg-[#0c1220]/90 border border-amber-500/20 rounded-2xl p-4 shadow-xl">
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Total Freight (Rev)</p>
          <p className="text-xl font-black text-emerald-400 font-mono mt-1">₹{totalFreight.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Billed revenue</p>
        </div>

        <div className="bg-[#0c1220]/90 border border-amber-500/20 rounded-2xl p-4 shadow-xl">
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Route Expenses</p>
          <p className="text-xl font-black text-rose-400 font-mono mt-1">₹{totalExpenses.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Diesel & trip costs</p>
        </div>

        <div className="bg-[#0c1220]/90 border border-amber-500/20 rounded-2xl p-4 shadow-xl">
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Est. Net Profit</p>
          <p className="text-xl font-black text-teal-300 font-mono mt-1">₹{netProfit.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-teal-400/80 mt-0.5">{profitMargin}% margin</p>
        </div>

        <div className="bg-[#0c1220]/90 border border-rose-500/30 rounded-2xl p-4 shadow-xl bg-gradient-to-b from-rose-950/10 to-transparent">
          <p className="text-[10px] uppercase tracking-wider font-bold text-rose-300">Outstanding Due</p>
          <p className="text-xl font-black text-rose-400 font-mono mt-1">₹{totalOutstanding.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Total pending balance</p>
        </div>
      </div>

      {/* Material Breakdown Card */}
      <div className="bg-[#0c1220]/90 border border-amber-500/20 rounded-2xl p-5 shadow-xl space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <Layers className="w-4 h-4" />
          <span>Material Distribution in this Group</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.keys(matMap).length > 0 ? (
            Object.entries(matMap).map(([mName, item]) => (
              <div key={mName} className="bg-[#070b14] border border-amber-500/10 rounded-xl p-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-white">{mName}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{item.weight.toFixed(2)} Tons</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 text-xs font-black font-mono">
                  {item.count} Feras
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 italic col-span-full">No feras assigned to this group yet.</p>
          )}
        </div>
      </div>

      {/* Itemized Feras Table */}
      <div className="bg-[#0c1220]/90 border border-amber-500/20 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-400" />
              <span>Individual Trips ({feras.length})</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">All Feras/LRs recorded under {group.group_number}</p>
          </div>

          <button
            onClick={fetchGroupDetails}
            className="p-2 bg-[#131c33] border border-amber-500/20 hover:border-amber-500/40 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer self-start sm:self-auto"
            title="Refresh trips"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {feras.length === 0 ? (
          <div className="py-16 text-center space-y-4 px-4">
            <Truck className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No trips are currently assigned to this group. Click &quot;New Fera in Group&quot; or &quot;Attach Existing Trips&quot; to add feras.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-[#070b14] text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-3 text-center">#</th>
                  <th className="py-3.5 px-3">Fera / LR No</th>
                  <th className="py-3.5 px-3">Date</th>
                  <th className="py-3.5 px-3">Truck</th>
                  <th className="py-3.5 px-3">Driver</th>
                  <th className="py-3.5 px-3">Material</th>
                  <th className="py-3.5 px-3">Route</th>
                  <th className="py-3.5 px-3 text-right">Weight</th>
                  <th className="py-3.5 px-3 text-right">Rate</th>
                  <th className="py-3.5 px-3 text-right">Freight</th>
                  <th className="py-3.5 px-3 text-right">Paid</th>
                  <th className="py-3.5 px-3 text-right">Outstanding</th>
                  <th className="py-3.5 px-3 text-center">Status</th>
                  <th className="py-3.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {feras.map((f, idx) => {
                  const freight = parseFloat(f.agreed_amount) || 0;
                  const weight = parseFloat(f.weight) || 0;
                  const adv = parseFloat(f.advance_amount) || 0;
                  const chg = parseFloat(f.extra_charges) || 0;
                  const ded = parseFloat(f.deduction_amount) || 0;
                  const paid = parseFloat(f.paid_amount) || parseFloat(f.received_amount) || 0;
                  const rowDue = Math.max(0, (freight + chg) - (adv + ded + paid));

                  const rateVal = parseFloat(f.rate_unit) || (weight > 0 ? (freight / weight) : 0);

                  return (
                    <tr key={f.id} className="hover:bg-[#131c33]/40 transition-colors">
                      <td className="py-3.5 px-3 text-center text-slate-500 font-mono">{idx + 1}</td>
                      <td className="py-3.5 px-3 font-mono font-bold text-amber-400">
                        {f.fera_number}
                      </td>
                      <td className="py-3.5 px-3 text-slate-300 font-mono">
                        {new Date(f.fera_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-white">
                        {f.trucks?.truck_number || '-'}
                      </td>
                      <td className="py-3.5 px-3 text-slate-300">
                        {f.drivers?.name || '-'}
                      </td>
                      <td className="py-3.5 px-3 text-slate-200 font-medium">
                        {f.materials?.name || '-'}
                      </td>
                      <td className="py-3.5 px-3 text-slate-400 text-[11px]">
                        {f.from_location?.city || '-'} → {f.to_location?.city || '-'}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-white">
                        {weight.toFixed(2)} {f.weight_unit || 'ton'}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-slate-300">
                        ₹{rateVal > 0 ? rateVal.toFixed(2) : '-'}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-400">
                        ₹{freight.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-slate-300">
                        ₹{paid.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-rose-400">
                        ₹{rowDue.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          f.status === 'completed'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : f.status === 'in_progress'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                        }`}>
                          {f.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => generateSingleFeraPDF(f)}
                            className="p-1.5 bg-[#131c33] hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-all cursor-pointer"
                            title="Download Voucher Slip"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUnassignFera(f.id, f.fera_number)}
                            className="p-1.5 bg-[#131c33] hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 rounded-lg transition-all cursor-pointer"
                            title="Unassign from this group"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#070b14] border-t-2 border-slate-700 font-bold text-white text-xs">
                  <td colSpan={7} className="py-3.5 px-3 text-right font-black uppercase text-amber-400">
                    TOTALS ({totalFerasCount} Trips)
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-amber-300">
                    {totalWeight.toFixed(2)} Ton
                  </td>
                  <td className="py-3.5 px-3"></td>
                  <td className="py-3.5 px-3 text-right font-mono font-black text-emerald-400">
                    ₹{totalFreight.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-slate-300">
                    ₹{totalPayments.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono font-black text-rose-400">
                    ₹{totalOutstanding.toLocaleString('en-IN')}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Attach Existing Unassigned Feras */}
      {showAssignModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-[#0c1220] border border-amber-500/30 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
              <div>
                <h3 className="text-base font-black text-white">Attach Trips to {group.group_number}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Select existing unassigned trips of {party?.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {unassignedFeras.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No unassigned feras found for {party?.name}.
              </div>
            ) : (
              <form onSubmit={handleAssignFerasSubmit} className="space-y-4">
                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {unassignedFeras.map((f) => {
                    const isChecked = selectedToAssign.includes(f.id);
                    return (
                      <label
                        key={f.id}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-amber-500/10 border-amber-500/40 text-white'
                            : 'bg-[#070b14] border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedToAssign((prev) => [...prev, f.id]);
                              } else {
                                setSelectedToAssign((prev) => prev.filter((id) => id !== f.id));
                              }
                            }}
                            className="rounded accent-amber-500 w-4 h-4 cursor-pointer"
                          />
                          <div>
                            <p className="text-xs font-bold font-mono text-amber-400">{f.fera_number}</p>
                            <p className="text-[11px] text-slate-400">
                              {new Date(f.fera_date).toLocaleDateString()} • {f.materials?.name || 'Material'} • {f.trucks?.truck_number || ''}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          ₹{parseFloat(f.agreed_amount || 0).toLocaleString('en-IN')}
                        </span>
                      </label>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-amber-500/20">
                  <span className="text-xs text-slate-400">
                    Selected: <strong className="text-white">{selectedToAssign.length}</strong> trips
                  </span>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAssignModal(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white bg-[#131c33] rounded-xl border border-slate-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={assigning || selectedToAssign.length === 0}
                      className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
                    >
                      {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      <span>Attach to Group</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function FeraGroupDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        <p className="text-slate-400 text-xs font-bold">Loading Fera Group Details...</p>
      </div>
    }>
      <FeraGroupDetailContent />
    </Suspense>
  );
}
