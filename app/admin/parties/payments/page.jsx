'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
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
          .eq('organization_id', orgId);

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

      alert('Payment and allocations recorded successfully in Supabase!');
      router.push('/admin/parties');
    } catch (err) {
      alert('Error recording payment: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <p className="text-sm">Loading party data from Supabase...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/parties"
          className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-white">Record Party Payment & Allocation</h1>
          <p className="text-xs text-slate-400">
            Accept advance payments, partial settlements, or allocate lumpsum payments across multiple trips.
          </p>
        </div>
      </div>

      {parties.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl space-y-3">
          <p className="text-sm text-slate-400">No parties found. Please create a party first.</p>
          <Link
            href="/admin/parties"
            className="inline-block px-4 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-xl"
          >
            Go to Parties
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payment Summary Box */}
          <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Payment Received</span>
              <p className="text-xl font-black text-emerald-400 mt-1">₹{totalPayment.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Allocated to Feras</span>
              <p className="text-xl font-black text-amber-400 mt-1">₹{totalAllocated.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Remaining as Advance</span>
              <p className="text-xl font-black text-blue-400 mt-1">₹{unallocatedAdvance.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* 1. Payment Details */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-xs">1</span>
              Receipt Info
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Party *</label>
                <select
                  required
                  value={formData.partyId}
                  onChange={(e) => setFormData({ ...formData, partyId: e.target.value })}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                >
                  {parties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Payment Date *</label>
                <input
                  type="date"
                  required
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-amber-400 mb-1.5 block">Received Amount (₹) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 50000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full bg-slate-950/80 border border-amber-500/40 rounded-xl px-4 py-2.5 text-base font-bold text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                >
                  <option value="bank_transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                  <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="cheque">Cheque</option>
                  <option value="cash">Cash</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Reference / UTR / Cheque Number</label>
                <input
                  type="text"
                  placeholder="e.g. UTR Number, Cheque No"
                  value={formData.referenceNumber}
                  onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* 2. Allocation Table */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-xs">2</span>
                Allocate Payment to Party Trips
              </h2>
              <span className="text-xs text-slate-400">Leave 0 to keep as unallocated advance</span>
            </div>

            {unsettledFeras.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No trips found for this party. Total payment will be stored as advance credit.</p>
            ) : (
              <div className="space-y-3">
                {unsettledFeras.map((fera) => (
                  <div key={fera.id} className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="font-bold text-white text-sm">{fera.fera_number}</span>
                      <span className="text-xs text-slate-500 ml-2">({fera.fera_date})</span>
                      <div className="text-xs text-slate-400 mt-1">
                        Trip Revenue: ₹{parseFloat(fera.agreed_amount).toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400">Allocate ₹</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={allocations[fera.id] || ''}
                        onChange={(e) => handleAllocationChange(fera.id, e.target.value)}
                        className="w-32 bg-slate-900 border border-amber-500/40 rounded-lg px-3 py-1.5 text-sm font-bold text-amber-400"
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
            className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 text-sm transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>Confirm Payment & Save</span>
          </button>
        </form>
      )}
    </div>
  );
}
