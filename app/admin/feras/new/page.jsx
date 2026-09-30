'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  UploadCloud, 
  CheckCircle2, 
  Loader2,
  AlertCircle 
} from 'lucide-react';
import { supabase, getActiveOrgId, uploadFileToCloudinary } from '@/lib/supabase';

export default function NewFeraPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Masters from Supabase
  const [parties, setParties] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [locations, setLocations] = useState([]);

  // Form State with deterministic default
  const [formData, setFormData] = useState({
    feraNumber: 'FERA-100125',
    feraDate: '2026-10-01',
    partyId: '',
    truckId: '',
    driverId: '',
    materialId: '',
    fromLocationId: '',
    toLocationId: '',
    agreedAmount: '',
    weight: '',
    weightUnit: 'ton',
    driverCommission: 0,
    status: 'in_progress',
    notes: '',
    documentUrl: '',
    documentName: '',
  });

  // Dynamic Expenses array
  const [expenses, setExpenses] = useState([
    { expenseType: 'diesel', description: 'Diesel Filling', amount: '', quantity: '', rate: '', unit: 'litres' },
    { expenseType: 'material_purchase', description: 'Material Cost', amount: '', quantity: '', rate: '', unit: 'ton' },
    { expenseType: 'weighbridge', description: 'Weighbridge / Kanta', amount: '', quantity: null, rate: null, unit: null },
    { expenseType: 'driver_commission', description: 'Driver Commission', amount: '', quantity: null, rate: null, unit: null },
    { expenseType: 'toll', description: 'Toll Tax', amount: '', quantity: null, rate: null, unit: null },
  ]);

  // Load masters on mount
  useEffect(() => {
    let isMounted = true;
    async function loadMasters() {
      try {
        const orgId = await getActiveOrgId();
        if (!orgId || !isMounted) return;

        const [pRes, tRes, dRes, mRes, lRes] = await Promise.all([
          supabase.from('parties').select('id, name').eq('organization_id', orgId),
          supabase.from('trucks').select('id, truck_number, truck_type').eq('organization_id', orgId).eq('status', 'active'),
          supabase.from('drivers').select('id, name, commission_value').eq('organization_id', orgId).eq('status', 'active'),
          supabase.from('materials').select('id, name, unit').eq('organization_id', orgId),
          supabase.from('locations').select('id, name, city').eq('organization_id', orgId),
        ]);

        if (!isMounted) return;

        const pList = pRes.data || [];
        const tList = tRes.data || [];
        const dList = dRes.data || [];
        const mList = mRes.data || [];
        const lList = lRes.data || [];

        setParties(pList);
        setTrucks(tList);
        setDrivers(dList);
        setMaterials(mList);
        setLocations(lList);

        setFormData((prev) => ({
          ...prev,
          partyId: pList[0]?.id || '',
          truckId: tList[0]?.id || '',
          driverId: dList[0]?.id || '',
          materialId: mList[0]?.id || '',
          fromLocationId: lList[0]?.id || '',
          toLocationId: lList[1]?.id || lList[0]?.id || '',
          driverCommission: dList[0]?.commission_value || 0,
        }));
      } catch (err) {
        console.error('Error loading dropdown masters:', err);
      } finally {
        if (isMounted) setDataLoading(false);
      }
    }

    loadMasters();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleExpenseChange = (index, field, value) => {
    const updated = [...expenses];
    updated[index][field] = value;
    if (field === 'quantity' || field === 'rate') {
      const q = parseFloat(field === 'quantity' ? value : updated[index].quantity) || 0;
      const r = parseFloat(field === 'rate' ? value : updated[index].rate) || 0;
      if (q > 0 && r > 0) {
        updated[index].amount = (q * r).toFixed(2);
      }
    }
    setExpenses(updated);
  };

  const addExpenseRow = () => {
    setExpenses([
      ...expenses,
      { expenseType: 'other', description: '', amount: '', quantity: null, rate: null, unit: null },
    ]);
  };

  const removeExpenseRow = (index) => {
    setExpenses(expenses.filter((_, i) => i !== index));
  };

  // Direct Cloudinary Upload from Browser
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(true);
    try {
      const uploaded = await uploadFileToCloudinary(file, 'veda_transport/weight_slips');
      setFormData((prev) => ({
        ...prev,
        documentUrl: uploaded.url,
        documentName: uploaded.fileName,
      }));
    } catch (err) {
      console.error(err);
      alert('Upload failed: ' + (err.message || 'Please check Cloudinary keys in .env'));
    } finally {
      setUploadingDoc(false);
    }
  };

  // Live Math calculations
  const totalAgreed = parseFloat(formData.agreedAmount) || 0;
  const totalExpenses = expenses.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const netProfit = totalAgreed - totalExpenses;
  const marginPercent = totalAgreed > 0 ? ((netProfit / totalAgreed) * 100).toFixed(1) : 0;

  // Submit to Supabase
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.partyId || !formData.truckId || !formData.driverId || !formData.materialId || !formData.fromLocationId || !formData.toLocationId) {
      alert('Please select Party, Truck, Driver, Material, and From/To locations.');
      return;
    }

    setLoading(true);
    try {
      const orgId = await getActiveOrgId();

      // 1. Insert Fera
      const { data: newFera, error: feraError } = await supabase
        .from('feras')
        .insert([
          {
            organization_id: orgId,
            fera_number: formData.feraNumber.trim().toUpperCase(),
            fera_date: formData.feraDate,
            party_id: formData.partyId,
            truck_id: formData.truckId,
            driver_id: formData.driverId,
            material_id: formData.materialId,
            from_location_id: formData.fromLocationId,
            to_location_id: formData.toLocationId,
            agreed_amount: totalAgreed,
            weight: parseFloat(formData.weight) || 0,
            weight_unit: formData.weightUnit,
            driver_commission: parseFloat(formData.driverCommission) || 0,
            status: formData.status,
            notes: formData.notes,
          },
        ])
        .select('id')
        .single();

      if (feraError) throw feraError;

      // 2. Insert Expenses if any
      const validExpenses = expenses
        .filter((exp) => parseFloat(exp.amount) > 0)
        .map((exp) => ({
          organization_id: orgId,
          fera_id: newFera.id,
          expense_type: exp.expenseType,
          description: exp.description || null,
          amount: parseFloat(exp.amount),
          quantity: exp.quantity ? parseFloat(exp.quantity) : null,
          rate: exp.rate ? parseFloat(exp.rate) : null,
          unit: exp.unit || null,
        }));

      if (validExpenses.length > 0) {
        const { error: expError } = await supabase.from('fera_expenses').insert(validExpenses);
        if (expError) console.error('Expense insert error:', expError);
      }

      // 3. Insert Weight Slip document if uploaded
      if (formData.documentUrl) {
        await supabase.from('fera_documents').insert([
          {
            organization_id: orgId,
            fera_id: newFera.id,
            document_type: 'weight_slip',
            file_url: formData.documentUrl,
            file_name: formData.documentName || 'Weight Slip',
          },
        ]);
      }

      alert('Fera recorded successfully in Supabase!');
      router.push('/admin/feras');
    } catch (err) {
      alert('Error saving fera: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <p className="text-sm">Loading dropdown masters from Supabase...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/feras"
            className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Create New Fera (Trip)</h1>
            <p className="text-xs text-slate-400">Record trip dispatch, assign truck & driver, and log route expenses.</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 text-sm transition-all"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>Save to Supabase</span>
        </button>
      </div>

      {/* Warning if masters are missing */}
      {(parties.length === 0 || trucks.length === 0 || drivers.length === 0 || materials.length === 0 || locations.length === 0) && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3 text-amber-300 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>
            Tip: Please ensure you have added at least 1 Party, 1 Truck, 1 Driver, 1 Material, and Locations in the Master tabs before creating a Fera.
          </span>
        </div>
      )}

      {/* Live Profit Preview Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-4 gap-4 shadow-xl">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Party Billing</span>
          <p className="text-xl font-black text-white mt-1">₹{totalAgreed.toLocaleString('en-IN')}</p>
        </div>
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Expenses</span>
          <p className="text-xl font-black text-rose-400 mt-1">-₹{totalExpenses.toLocaleString('en-IN')}</p>
        </div>
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Estimated Net Profit</span>
          <p className="text-xl font-black text-emerald-400 mt-1">₹{netProfit.toLocaleString('en-IN')}</p>
        </div>
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Net Margin</span>
          <p className="text-xl font-black text-amber-400 mt-1">{marginPercent}%</p>
        </div>
      </div>

      {/* 1. Trip Master Info */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 space-y-6">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-xs">1</span>
          Trip Dispatch Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Fera Number *</label>
            <input
              type="text"
              required
              value={formData.feraNumber}
              onChange={(e) => setFormData({ ...formData, feraNumber: e.target.value })}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono uppercase"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Fera Date *</label>
            <input
              type="date"
              required
              value={formData.feraDate}
              onChange={(e) => setFormData({ ...formData, feraDate: e.target.value })}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Trip Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
            >
              <option value="in_progress">In Progress</option>
              <option value="planned">Planned</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Party */}
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Party / Client *</label>
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

          {/* Truck */}
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Assigned Truck *</label>
            <select
              required
              value={formData.truckId}
              onChange={(e) => setFormData({ ...formData, truckId: e.target.value })}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono"
            >
              {trucks.map((t) => (
                <option key={t.id} value={t.id}>{t.truck_number} ({t.truck_type})</option>
              ))}
            </select>
          </div>

          {/* Driver */}
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Assigned Driver *</label>
            <select
              required
              value={formData.driverId}
              onChange={(e) => {
                const sel = drivers.find((d) => d.id === e.target.value);
                setFormData({ 
                  ...formData, 
                  driverId: e.target.value,
                  driverCommission: sel ? sel.commission_value : 0
                });
              }}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
            >
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Route, Material & Revenue Details */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 space-y-6">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-xs">2</span>
          Route, Material & Revenue
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">From Location *</label>
            <select
              required
              value={formData.fromLocationId}
              onChange={(e) => setFormData({ ...formData, fromLocationId: e.target.value })}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name} ({l.city})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">To Location *</label>
            <select
              required
              value={formData.toLocationId}
              onChange={(e) => setFormData({ ...formData, toLocationId: e.target.value })}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name} ({l.city})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Material *</label>
            <select
              required
              value={formData.materialId}
              onChange={(e) => setFormData({ ...formData, materialId: e.target.value })}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
            >
              {materials.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Weight (Tons) *</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="e.g. 25.5"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-amber-400 mb-1.5 block">Party Agreed Billing (₹ Revenue) *</label>
            <input
              type="number"
              required
              placeholder="e.g. 50000"
              value={formData.agreedAmount}
              onChange={(e) => setFormData({ ...formData, agreedAmount: e.target.value })}
              className="w-full bg-slate-950/80 border border-amber-500/40 rounded-xl px-4 py-2.5 text-base font-bold text-white"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Driver Commission (₹)</label>
            <input
              type="number"
              value={formData.driverCommission}
              onChange={(e) => setFormData({ ...formData, driverCommission: e.target.value })}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
            />
          </div>
        </div>
      </div>

      {/* 3. Dynamic Fera Expenses */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-xs">3</span>
            Fera Trip Expenses Breakdown
          </h2>
          <button
            type="button"
            onClick={addExpenseRow}
            className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Expense Line</span>
          </button>
        </div>

        <div className="space-y-3">
          {expenses.map((item, idx) => (
            <div key={idx} className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-3">
                <select
                  value={item.expenseType}
                  onChange={(e) => handleExpenseChange(idx, 'expenseType', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                >
                  <option value="diesel">Diesel</option>
                  <option value="material_purchase">Material Purchase</option>
                  <option value="weighbridge">Weighbridge</option>
                  <option value="driver_commission">Driver Commission</option>
                  <option value="toll">Toll Tax</option>
                  <option value="food">Food</option>
                  <option value="tea_water">Tea / Water</option>
                  <option value="puncture">Puncture</option>
                  <option value="repair">Repair</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <input
                  type="text"
                  placeholder="Description / Remarks"
                  value={item.description}
                  onChange={(e) => handleExpenseChange(idx, 'description', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                />
              </div>

              <div className="sm:col-span-2">
                <input
                  type="number"
                  placeholder="Qty (e.g. 100)"
                  value={item.quantity || ''}
                  onChange={(e) => handleExpenseChange(idx, 'quantity', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                />
              </div>

              <div className="sm:col-span-2">
                <input
                  type="number"
                  placeholder="Rate (₹)"
                  value={item.rate || ''}
                  onChange={(e) => handleExpenseChange(idx, 'rate', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                />
              </div>

              <div className="sm:col-span-1">
                <input
                  type="number"
                  placeholder="Amount ₹"
                  value={item.amount}
                  onChange={(e) => handleExpenseChange(idx, 'amount', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-bold text-rose-400"
                />
              </div>

              <div className="sm:col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeExpenseRow(idx)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Weight Slip Upload (Cloudinary Cloud Storage) */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-xs">4</span>
          Weight Slip & Documents (Cloudinary Upload)
        </h2>

        <div className="border-2 border-dashed border-slate-800 hover:border-amber-500/50 rounded-2xl p-6 text-center transition-all bg-slate-950/40">
          {formData.documentUrl ? (
            <div className="flex items-center justify-center gap-3 text-sm text-emerald-400 font-semibold">
              <CheckCircle2 className="w-5 h-5" />
              <span>Uploaded: {formData.documentName}</span>
              <a
                href={formData.documentUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-amber-400 underline ml-2"
              >
                View Document
              </a>
            </div>
          ) : (
            <div>
              <UploadCloud className="w-8 h-8 mx-auto text-slate-500 mb-2" />
              <p className="text-sm font-medium text-slate-300">
                Upload Weight Slip / Kanta Pauti Image or PDF
              </p>
              <p className="text-xs text-slate-500 mt-1">Directly uploaded to Cloudinary</p>
              <label className="mt-4 inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-xl cursor-pointer transition-all border border-slate-700">
                {uploadingDoc ? 'Uploading to Cloudinary...' : 'Choose File'}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
