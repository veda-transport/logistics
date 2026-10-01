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
  AlertCircle,
  Sparkles,
  MapPin,
  Calendar,
  Truck
} from 'lucide-react';
import { supabase, getActiveOrgId, uploadFileToCloudinary, deleteFileFromStorage } from '@/lib/supabase';

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

  // Form State
  const [formData, setFormData] = useState({
    feraNumber: `FERA-${Math.floor(100000 + Math.random() * 900000)}`,
    feraDate: new Date().toISOString().split('T')[0],
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

  // File Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // If there was an earlier uploaded file before saving, clean it up
    if (formData.documentUrl) {
      deleteFileFromStorage(formData.documentUrl);
    }

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
      alert('Upload failed: ' + (err.message || 'Please check the file and try again'));
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleRemoveUploadedDoc = () => {
    if (formData.documentUrl) {
      deleteFileFromStorage(formData.documentUrl);
    }
    setFormData((prev) => ({
      ...prev,
      documentUrl: '',
      documentName: '',
    }));
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

      alert('Trip recorded successfully!');
      router.push('/admin/feras');
    } catch (err) {
      alert('Error saving trip: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-3 bg-[#0c1220]/60 rounded-3xl border border-amber-500/20">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        <p className="text-sm font-bold text-amber-200">Loading form data...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="p-4 sm:p-6 bg-[#0c1220]/95 backdrop-blur-xl border border-amber-500/30 rounded-3xl shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/feras"
            className="p-2.5 bg-[#131c33] border border-amber-500/20 rounded-2xl text-amber-300 hover:text-white hover:bg-amber-500/10 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Create New Fera (Trip)</h1>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-xs text-slate-400">Record trip dispatch, assign truck & driver, and log route expenses.</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/25 text-xs sm:text-sm transition-all hover:scale-[1.02] border border-amber-300/30 self-end sm:self-auto cursor-pointer"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />}
          <span>Save Trip / Fera</span>
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
      <div className="p-5 sm:p-6 bg-[#0c1220]/90 backdrop-blur-xl border border-amber-500/30 rounded-3xl grid grid-cols-2 lg:grid-cols-4 gap-4 shadow-xl">
        <div className="p-3 bg-[#070b14]/60 rounded-2xl border border-amber-500/15">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Party Billing</span>
          <p className="text-lg sm:text-2xl font-black text-white mt-1">₹{totalAgreed.toLocaleString('en-IN')}</p>
        </div>
        <div className="p-3 bg-[#070b14]/60 rounded-2xl border border-rose-500/20">
          <span className="text-[10px] font-extrabold text-rose-400 uppercase tracking-widest block">Total Expenses</span>
          <p className="text-lg sm:text-2xl font-black text-rose-400 mt-1">-₹{totalExpenses.toLocaleString('en-IN')}</p>
        </div>
        <div className="p-3 bg-[#070b14]/60 rounded-2xl border border-emerald-500/20">
          <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest block">Estimated Net Profit</span>
          <p className="text-lg sm:text-2xl font-black text-emerald-400 mt-1">₹{netProfit.toLocaleString('en-IN')}</p>
        </div>
        <div className="p-3 bg-[#070b14]/60 rounded-2xl border border-amber-500/20">
          <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest block">Net Margin</span>
          <p className="text-lg sm:text-2xl font-black text-amber-400 mt-1">{marginPercent}%</p>
        </div>
      </div>

      {/* 1. Trip Master Info */}
      <div className="bg-[#0c1220]/90 backdrop-blur-xl border border-amber-500/20 rounded-3xl p-5 sm:p-7 space-y-5 shadow-xl">
        <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black shadow-md shadow-amber-500/30">1</span>
          <span>Trip Dispatch Details</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <div>
            <label className="text-xs font-bold text-amber-300 mb-1.5 block">Fera Number *</label>
            <input
              type="text"
              required
              value={formData.feraNumber}
              onChange={(e) => setFormData({ ...formData, feraNumber: e.target.value })}
              className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white font-mono uppercase focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-amber-300 mb-1.5 block">Fera Date *</label>
            <input
              type="date"
              required
              value={formData.feraDate}
              onChange={(e) => setFormData({ ...formData, feraDate: e.target.value })}
              className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-amber-300 mb-1.5 block">Trip Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
            >
              <option value="in_progress">In Progress</option>
              <option value="planned">Planned</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Party */}
          <div>
            <label className="text-xs font-bold text-amber-300 mb-1.5 block">Party / Client *</label>
            <select
              required
              value={formData.partyId}
              onChange={(e) => setFormData({ ...formData, partyId: e.target.value })}
              className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
            >
              {parties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Truck */}
          <div>
            <label className="text-xs font-bold text-amber-300 mb-1.5 block">Assigned Truck *</label>
            <select
              required
              value={formData.truckId}
              onChange={(e) => setFormData({ ...formData, truckId: e.target.value })}
              className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:border-amber-400 focus:outline-none"
            >
              {trucks.map((t) => (
                <option key={t.id} value={t.id}>{t.truck_number} ({t.truck_type})</option>
              ))}
            </select>
          </div>

          {/* Driver */}
          <div>
            <label className="text-xs font-bold text-amber-300 mb-1.5 block">Assigned Driver *</label>
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
              className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
            >
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Route, Material & Revenue Details */}
      <div className="bg-[#0c1220]/90 backdrop-blur-xl border border-amber-500/20 rounded-3xl p-5 sm:p-7 space-y-5 shadow-xl">
        <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black shadow-md shadow-amber-500/30">2</span>
          <span>Route, Material & Revenue</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <div>
            <label className="text-xs font-bold text-amber-300 mb-1.5 block">From Location *</label>
            <select
              required
              value={formData.fromLocationId}
              onChange={(e) => setFormData({ ...formData, fromLocationId: e.target.value })}
              className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name} ({l.city})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-amber-300 mb-1.5 block">To Location *</label>
            <select
              required
              value={formData.toLocationId}
              onChange={(e) => setFormData({ ...formData, toLocationId: e.target.value })}
              className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name} ({l.city})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-amber-300 mb-1.5 block">Material *</label>
            <select
              required
              value={formData.materialId}
              onChange={(e) => setFormData({ ...formData, materialId: e.target.value })}
              className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
            >
              {materials.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-amber-300 mb-1.5 block">Weight (Tons) *</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="e.g. 25.5"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-black text-amber-400 mb-1.5 block">Party Agreed Billing (₹ Revenue) *</label>
            <input
              type="number"
              required
              placeholder="e.g. 50000"
              value={formData.agreedAmount}
              onChange={(e) => setFormData({ ...formData, agreedAmount: e.target.value })}
              className="w-full bg-[#070b14] border border-amber-400 rounded-xl px-4 py-2.5 text-base font-black text-white focus:ring-2 focus:ring-amber-400/50 focus:outline-none shadow-inner"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-amber-300 mb-1.5 block">Driver Commission (₹)</label>
            <input
              type="number"
              value={formData.driverCommission}
              onChange={(e) => setFormData({ ...formData, driverCommission: e.target.value })}
              className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 3. Dynamic Fera Expenses */}
      <div className="bg-[#0c1220]/90 backdrop-blur-xl border border-amber-500/20 rounded-3xl p-5 sm:p-7 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-4">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black shadow-md shadow-amber-500/30">3</span>
              <span>Trip Expenses Breakdown</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Track diesel, toll, loading, and trip route costs</p>
          </div>
          <button
            type="button"
            onClick={addExpenseRow}
            className="flex items-center gap-1.5 text-xs font-extrabold text-amber-300 hover:text-white bg-amber-500/15 hover:bg-amber-500/25 px-4 py-2.5 rounded-xl border border-amber-500/30 transition-all cursor-pointer self-start sm:self-auto shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Expense Line</span>
          </button>
        </div>

        {/* Desktop Column Header */}
        <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-2 bg-[#070b14]/90 border border-amber-500/15 rounded-xl text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
          <div className="col-span-3">Expense Type</div>
          <div className="col-span-3">Remarks / Description</div>
          <div className="col-span-2">Quantity</div>
          <div className="col-span-2">Rate (₹)</div>
          <div className="col-span-2 text-right pr-9">Amount (₹)</div>
        </div>

        <div className="space-y-3">
          {expenses.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 sm:p-4 bg-[#070b14]/90 hover:bg-[#070b14] border border-amber-500/20 hover:border-amber-500/35 rounded-2xl grid grid-cols-1 sm:grid-cols-12 gap-3 items-center transition-all shadow-md"
            >
              {/* Expense Type */}
              <div className="sm:col-span-3">
                <label className="text-[10px] font-extrabold text-amber-300 uppercase tracking-wider block mb-1 sm:hidden">
                  Expense Type
                </label>
                <select
                  value={item.expenseType}
                  onChange={(e) => handleExpenseChange(idx, 'expenseType', e.target.value)}
                  className="w-full bg-[#0d1425] border border-amber-500/30 focus:border-amber-400 rounded-xl px-3 py-2.5 text-xs font-bold text-amber-200 focus:outline-none transition-colors cursor-pointer"
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

              {/* Description */}
              <div className="sm:col-span-3">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1 sm:hidden">
                  Remarks / Description
                </label>
                <input
                  type="text"
                  placeholder="Optional remarks"
                  value={item.description}
                  onChange={(e) => handleExpenseChange(idx, 'description', e.target.value)}
                  className="w-full bg-[#0d1425] border border-amber-500/20 focus:border-amber-400 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none transition-colors"
                />
              </div>

              {/* Quantity */}
              <div className="sm:col-span-2">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1 sm:hidden">
                  Qty
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="Qty"
                  value={item.quantity || ''}
                  onChange={(e) => handleExpenseChange(idx, 'quantity', e.target.value)}
                  className="w-full bg-[#0d1425] border border-amber-500/20 focus:border-amber-400 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              {/* Rate */}
              <div className="sm:col-span-2">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1 sm:hidden">
                  Rate (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">₹</span>
                  <input
                    type="number"
                    step="any"
                    placeholder="Rate"
                    value={item.rate || ''}
                    onChange={(e) => handleExpenseChange(idx, 'rate', e.target.value)}
                    className="w-full bg-[#0d1425] border border-amber-500/20 focus:border-amber-400 rounded-xl pl-6 pr-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {/* Amount (₹) + Delete */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between gap-1.5">
                  <label className="text-[10px] font-extrabold text-rose-300 uppercase tracking-wider block sm:hidden">
                    Total Amount (₹)
                  </label>
                  <button
                    type="button"
                    onClick={() => removeExpenseRow(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer sm:hidden"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-rose-400 pointer-events-none">₹</span>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={item.amount}
                      onChange={(e) => handleExpenseChange(idx, 'amount', e.target.value)}
                      className="w-full bg-[#180d19] border border-rose-500/50 hover:border-rose-400 focus:border-rose-400 rounded-xl pl-6 pr-3 py-2.5 text-sm font-black text-rose-100 placeholder:text-rose-900/50 focus:outline-none focus:ring-1 focus:ring-rose-400/50 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-inner"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExpenseRow(idx)}
                    className="hidden sm:flex p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 rounded-xl transition-all cursor-pointer shrink-0 border border-transparent hover:border-rose-500/20"
                    title="Remove row"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Expenses Summary Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-amber-500/20 px-2 bg-[#070b14]/50 rounded-2xl p-3">
          <span className="text-xs font-bold text-slate-400">
            Active Expense Items: <strong className="text-white font-black">{expenses.filter(e => parseFloat(e.amount) > 0).length}</strong>
          </span>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-extrabold uppercase text-rose-400 tracking-wider">Total Route Expenses:</span>
            <span className="text-base sm:text-lg font-black text-rose-200 bg-rose-500/20 px-3.5 py-1 rounded-xl border border-rose-500/30">
              ₹{expenses.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>


      {/* 4. Weight Slip Upload */}
      <div className="bg-[#0c1220]/90 backdrop-blur-xl border border-amber-500/20 rounded-3xl p-5 sm:p-7 space-y-4 shadow-xl">
        <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black shadow-md shadow-amber-500/30">4</span>
          <span>Weight Slip & Digital Documents</span>
        </h2>

        <div className="border-2 border-dashed border-amber-500/30 hover:border-amber-400 rounded-3xl p-6 text-center transition-all bg-[#070b14]/50">
          {formData.documentUrl ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-emerald-400 font-bold">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>Attached: {formData.documentName || 'Weight Slip'}</span>
                <a
                  href={formData.documentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-amber-400 hover:underline bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20"
                >
                  View Slip ↗
                </a>
              </div>
              <div className="flex items-center justify-center gap-2">
                <label className="inline-block px-4 py-2 bg-[#131c33] hover:bg-slate-800 text-xs font-bold text-amber-300 rounded-xl cursor-pointer transition-all border border-amber-500/30">
                  {uploadingDoc ? 'Uploading...' : 'Replace Document'}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleRemoveUploadedDoc}
                  className="px-3.5 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-bold rounded-xl border border-rose-500/20 transition-all cursor-pointer"
                >
                  Remove Slip
                </button>
              </div>
            </div>
          ) : (
            <div>
              <UploadCloud className="w-10 h-10 mx-auto text-amber-400/80 mb-2" />
              <p className="text-sm font-bold text-slate-200">
                Upload Weight Slip / Kanta Pauti Image or PDF
              </p>
              <p className="text-xs text-slate-400 mt-1">Securely stored and attached to this trip record</p>
              <label className="mt-4 inline-block px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black rounded-xl cursor-pointer transition-all shadow-md shadow-amber-500/20 border border-amber-300/40">
                {uploadingDoc ? 'Uploading document...' : 'Choose File to Upload'}
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
