'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Loader2, 
  Receipt, 
  CreditCard, 
  Calendar, 
  Building2, 
  DollarSign, 
  CheckCircle,
  Truck,
  Sparkles
} from 'lucide-react';
import { supabase, getActiveOrgId } from '@/lib/supabase';

export default function PartyPaymentsPage() {
  const router = useRouter();
  const [parties, setParties] = useState([]);
  const [unsettledFeras, setUnsettledFeras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    partyId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    amount: '',
    paymentMethod: 'bank_transfer',
    referenceNumber: '',
    notes: '',
  });

  const [allocations, setAllocations] = useState({});

  useEffect(() => {
    let isMounted = true;
    async function fetchParties() {
      try {
        const orgId = await getActiveOrgId();
        if (!orgId || !isMounted) return;

        const { data } = await supabase
          .from('parties')
          .select('id, name')
          .eq('organization_id', orgId)
          .eq('status', 'active');

        if (isMounted && data && data.length > 0) {
          setParties(data);
          setFormData((prev) => ({ ...prev, partyId: data[0].id }));
        }
      } catch (err) {
        console.error('Error fetching parties:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchParties();
    return () => {
      isMounted = false;
    };
  }, []);

  // When party changes, fetch their active feras
  useEffect(() => {
    if (!formData.partyId) return;
    let isMounted = true;

    async function fetchFeras() {
      const orgId = await getActiveOrgId();
      const { data } = await supabase
        .from('feras')
        .select('id, fera_number, fera_date, agreed_amount, status')
        .eq('organization_id', orgId)
        .eq('party_id', formData.partyId)
        .neq('status', 'cancelled')
        .order('fera_date', { ascending: false });

      if (isMounted) {
        setUnsettledFeras(data || []);
        setAllocations({});
      }
    }

    fetchFeras();
    return () => {
      isMounted = false;
    };
  }, [formData.partyId]);

  const handleAllocationChange = (feraId, value) => {
    setAllocations((prev) => ({
      ...prev,
      [feraId]: parseFloat(value) || 0,
    }));
  };

  const totalPayment = parseFloat(formData.amount) || 0;
  const totalAllocated = Object.values(allocations).reduce((acc, curr) => acc + (parseFloat(curr) || 0), 0);
  const unallocatedAdvance = Math.max(0, totalPayment - totalAllocated);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.partyId || totalPayment <= 0) {
      alert('Please select a party and enter a valid payment amount.');
      return;
    }

    setSaving(true);
    try {
      const orgId = await getActiveOrgId();

      // 1. Insert Party Payment
      const { data: newPayment, error: payError } = await supabase
        .from('party_payments')
        .insert([
          {
            organization_id: orgId,
            party_id: formData.partyId,
            payment_date: formData.paymentDate,
            amount: totalPayment,
            payment_method: formData.paymentMethod,
            reference_number: formData.referenceNumber.trim() || null,
            notes: formData.notes.trim() || null,
          },
        ])
        .select('id')
        .single();

      if (payError) throw payError;

      // 2. Insert Allocations if any
      const allocRows = Object.entries(allocations)
        .filter(([, amount]) => amount > 0)
        .map(([feraId, amount]) => ({
          organization_id: orgId,
          payment_id: newPayment.id,
          fera_id: feraId,
          amount: amount,
        }));

      if (allocRows.length > 0) {
        const { error: allocError } = await supabase.from('party_payment_allocations').insert(allocRows);
        if (allocError) console.error('Alloc error:', allocError);
      }

      alert('Payment and allocations recorded successfully!');
      router.push('/admin/parties');
    } catch (err) {
      alert('Error recording payment: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-3 bg-[#0c1220]/60 rounded-3xl border border-amber-500/20">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        <p className="text-sm font-bold text-amber-200">Loading party accounts and ledgers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="p-4 sm:p-6 bg-[#0c1220]/95 backdrop-blur-xl border border-amber-500/30 rounded-3xl shadow-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/parties"
            className="p-2.5 bg-[#131c33] border border-amber-500/20 rounded-2xl text-amber-300 hover:text-white hover:bg-amber-500/10 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Record Party Payment</h1>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-xs text-slate-400">
              Log client receipts, advance credit, and allocate against trip billings.
            </p>
          </div>
        </div>
      </div>

      {parties.length === 0 ? (
        <div className="p-12 text-center bg-[#0c1220]/60 border border-dashed border-amber-500/30 rounded-3xl space-y-4">
          <Building2 className="w-10 h-10 mx-auto text-amber-400/80" />
          <p className="text-sm text-slate-300">No active parties found. Please add a client party profile first.</p>
          <Link
            href="/admin/parties"
            className="inline-block px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20"
          >
            Go to Parties
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payment Summary Box (Goverdhan Haveli Style) */}
          <div className="p-5 sm:p-6 bg-[#0c1220]/90 backdrop-blur-xl border border-amber-500/30 rounded-3xl grid grid-cols-1 sm:grid-cols-3 gap-4 shadow-xl">
            <div className="p-3.5 bg-[#070b14]/60 rounded-2xl border border-emerald-500/20">
              <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest block">Payment Received</span>
              <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-1 font-mono">₹{totalPayment.toLocaleString('en-IN')}</p>
            </div>
            <div className="p-3.5 bg-[#070b14]/60 rounded-2xl border border-amber-500/20">
              <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest block">Allocated to Feras</span>
              <p className="text-xl sm:text-2xl font-black text-amber-400 mt-1 font-mono">₹{totalAllocated.toLocaleString('en-IN')}</p>
            </div>
            <div className="p-3.5 bg-[#070b14]/60 rounded-2xl border border-sky-500/20">
              <span className="text-[10px] font-extrabold text-sky-400 uppercase tracking-widest block">Remaining Advance</span>
              <p className="text-xl sm:text-2xl font-black text-sky-400 mt-1 font-mono">₹{unallocatedAdvance.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* 1. Payment Details */}
          <div className="bg-[#0c1220]/90 backdrop-blur-xl border border-amber-500/20 rounded-3xl p-5 sm:p-7 space-y-5 shadow-xl">
            <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black shadow-md shadow-amber-500/30">1</span>
              <span>Payment Receipt Details</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="text-xs font-bold text-amber-300 mb-1.5 block">Client / Party *</label>
                <select
                  required
                  value={formData.partyId}
                  onChange={(e) => setFormData({ ...formData, partyId: e.target.value })}
                  className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                >
                  {parties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-amber-300 mb-1.5 block">Payment Date *</label>
                <input
                  type="date"
                  required
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-black text-amber-400 mb-1.5 block">Received Amount (₹) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 50000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full bg-[#070b14] border border-amber-400 rounded-xl px-4 py-2.5 text-base font-black text-white focus:ring-2 focus:ring-amber-400/50 focus:outline-none shadow-inner"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-amber-300 mb-1.5 block">Payment Mode</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="bank_transfer">Bank Transfer (NEFT / RTGS / IMPS)</option>
                  <option value="upi">UPI (GPay / PhonePe / QR)</option>
                  <option value="cheque">Cheque</option>
                  <option value="cash">Cash</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-amber-300 mb-1.5 block">Reference / UTR / Cheque Number</label>
                <input
                  type="text"
                  placeholder="e.g. UTR12345678, CHQ-998811"
                  value={formData.referenceNumber}
                  onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                  className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white font-mono uppercase focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* 2. Allocation Table */}
          <div className="bg-[#0c1220]/90 backdrop-blur-xl border border-amber-500/20 rounded-3xl p-5 sm:p-7 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/15 pb-4">
              <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black shadow-md shadow-amber-500/30">2</span>
                <span>Allocate Against Client Trips</span>
              </h2>
              <span className="text-xs text-amber-300/80">Leave 0 to keep as unallocated advance credit</span>
            </div>

            {unsettledFeras.length === 0 ? (
              <p className="text-xs text-slate-400 italic p-4 bg-[#070b14]/50 rounded-2xl border border-amber-500/10">
                No active trips found for this party. Total payment will be stored as advance credit.
              </p>
            ) : (
              <div className="space-y-3">
                {unsettledFeras.map((fera) => (
                  <div 
                    key={fera.id} 
                    className="p-4 bg-[#070b14]/80 border border-amber-500/15 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white text-sm font-mono">{fera.fera_number}</span>
                        <span className="text-xs text-slate-400">({fera.fera_date})</span>
                      </div>
                      <div className="text-xs text-amber-400/90 font-medium mt-1">
                        Trip Revenue: ₹{parseFloat(fera.agreed_amount).toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <span className="text-xs font-bold text-slate-400">Allocate ₹</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={allocations[fera.id] || ''}
                        onChange={(e) => handleAllocationChange(fera.id, e.target.value)}
                        className="w-32 bg-[#0c1220] border border-amber-500/40 rounded-xl px-3 py-2 text-sm font-black text-amber-300 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-2xl shadow-xl shadow-amber-500/25 text-sm transition-all hover:scale-[1.01] active:scale-[0.99] border border-amber-300/40 cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />}
            <span>Confirm Payment & Save</span>
          </button>
        </form>
      )}
    </div>
  );
}
