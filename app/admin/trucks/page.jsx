'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Loader2, 
  Truck,
  X
} from 'lucide-react';
import { supabase, getActiveOrgId } from '@/lib/supabase';

export default function TrucksPage() {
  const [activeTab, setActiveTab] = useState('fleet'); // 'fleet' | 'expenses'
  const [trucks, setTrucks] = useState([]);
  const [truckExpenses, setTruckExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal States
  const [showTruckModal, setShowTruckModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingTruck, setEditingTruck] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form States
  const [truckForm, setTruckForm] = useState({
    truck_number: '',
    truck_type: '10 Wheeler Tipper',
    capacity_tons: 25,
    owner_type: 'company',
    status: 'active',
    notes: '',
  });

  const [expenseForm, setExpenseForm] = useState({
    truck_id: '',
    expense_date: '2026-10-01',
    expense_type: 'service',
    amount: '',
    description: '',
  });

  // Fetch Data from Supabase
  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        const orgId = await getActiveOrgId();
        if (!orgId || ignore) return;

        const [trucksRes, expRes] = await Promise.all([
          supabase.from('trucks').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }),
          supabase.from('truck_expenses').select('*, trucks(truck_number)').eq('organization_id', orgId).order('expense_date', { ascending: false }),
        ]);

        if (!ignore) {
          const tList = trucksRes.data || [];
          setTrucks(tList);
          setTruckExpenses(expRes.data || []);
          if (tList.length > 0) {
            setExpenseForm((prev) => ({ ...prev, truck_id: tList[0].id }));
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        if (!ignore) setLoading(false);
      }
    }

    loadData();
    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  // Save / Update Truck
  const handleSaveTruck = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const orgId = await getActiveOrgId();
      if (editingTruck) {
        const { error } = await supabase
          .from('trucks')
          .update({
            truck_number: truckForm.truck_number.trim().toUpperCase(),
            truck_type: truckForm.truck_type,
            capacity_tons: parseFloat(truckForm.capacity_tons),
            owner_type: truckForm.owner_type,
            status: truckForm.status,
            notes: truckForm.notes,
          })
          .eq('id', editingTruck.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('trucks')
          .insert([
            {
              organization_id: orgId,
              truck_number: truckForm.truck_number.trim().toUpperCase(),
              truck_type: truckForm.truck_type,
              capacity_tons: parseFloat(truckForm.capacity_tons),
              owner_type: truckForm.owner_type,
              status: truckForm.status,
              notes: truckForm.notes,
            },
          ]);

        if (error) throw error;
      }

      setShowTruckModal(false);
      setEditingTruck(null);
      setTruckForm({
        truck_number: '',
        truck_type: '10 Wheeler Tipper',
        capacity_tons: 25,
        owner_type: 'company',
        status: 'active',
        notes: '',
      });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert('Error saving truck: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete Truck
  const handleDeleteTruck = async (id, truckNumber) => {
    if (!confirm(`Are you sure you want to delete truck ${truckNumber}?`)) return;
    try {
      const { error } = await supabase.from('trucks').delete().eq('id', id);
      if (error) throw error;
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert('Error deleting truck: ' + err.message);
    }
  };

  // Save Truck Expense
  const handleSaveExpense = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const orgId = await getActiveOrgId();
      const { error } = await supabase.from('truck_expenses').insert([
        {
          organization_id: orgId,
          truck_id: expenseForm.truck_id,
          expense_date: expenseForm.expense_date,
          expense_type: expenseForm.expense_type,
          amount: parseFloat(expenseForm.amount),
          description: expenseForm.description,
        },
      ]);

      if (error) throw error;

      setShowExpenseModal(false);
      setExpenseForm({
        truck_id: trucks[0]?.id || '',
        expense_date: '2026-10-01',
        expense_type: 'service',
        amount: '',
        description: '',
      });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert('Error saving expense: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete Expense
  const handleDeleteExpense = async (id) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      const { error } = await supabase.from('truck_expenses').delete().eq('id', id);
      if (error) throw error;
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert('Error deleting expense: ' + err.message);
    }
  };

  const openEditTruck = (truck) => {
    setEditingTruck(truck);
    setTruckForm({
      truck_number: truck.truck_number,
      truck_type: truck.truck_type,
      capacity_tons: truck.capacity_tons,
      owner_type: truck.owner_type,
      status: truck.status,
      notes: truck.notes || '',
    });
    setShowTruckModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Trucks & Fleet Master</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Manage company fleet vehicles, capacity, and maintenance records.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'fleet' ? (
            <button
              onClick={() => {
                setEditingTruck(null);
                setTruckForm({
                  truck_number: '',
                  truck_type: '10 Wheeler Tipper',
                  capacity_tons: 25,
                  owner_type: 'company',
                  status: 'active',
                  notes: '',
                });
                setShowTruckModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 text-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Truck</span>
            </button>
          ) : (
            <button
              onClick={() => setShowExpenseModal(true)}
              disabled={trucks.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 text-sm transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Add Maintenance Expense</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('fleet')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'fleet'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          Fleet Vehicles ({trucks.length})
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'expenses'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          Truck Maintenance & Expenses ({truckExpenses.length})
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-sm">Loading fleet from Supabase...</p>
        </div>
      ) : activeTab === 'fleet' ? (
        trucks.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">No trucks found</h3>
              <p className="text-xs text-slate-400 mt-1">Get started by adding your first vehicle to the fleet.</p>
            </div>
            <button
              onClick={() => {
                setEditingTruck(null);
                setShowTruckModal(true);
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all"
            >
              + Add Truck
            </button>
          </div>
        ) : (
          /* Trucks Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trucks.map((t) => (
              <div
                key={t.id}
                className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md space-y-4 hover:border-slate-700 transition-all shadow-xl relative group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-white font-mono tracking-wide">{t.truck_number}</h3>
                    <p className="text-xs text-slate-400">{t.truck_type} • {t.capacity_tons} Ton</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    t.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {t.status}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-800/60 text-xs text-slate-400">
                  <span className="block text-slate-500">Ownership:</span>
                  <span className="font-semibold text-slate-200 uppercase">{t.owner_type}</span>
                  {t.notes && <p className="mt-2 text-slate-300 italic">{t.notes}</p>}
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-800/60 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEditTruck(t)}
                    className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-all"
                    title="Edit Truck"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTruck(t.id, t.truck_number)}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all"
                    title="Delete Truck"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Expenses Table */
        truckExpenses.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
            <p className="text-sm text-slate-400">No maintenance expenses recorded yet.</p>
          </div>
        ) : (
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/70 text-[11px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Truck Number</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {truckExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4 text-slate-400 text-xs">{exp.expense_date}</td>
                    <td className="py-4 px-4 font-mono font-bold text-white">{exp.trucks?.truck_number || '-'}</td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase">
                        {exp.expense_type}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-300">{exp.description}</td>
                    <td className="py-4 px-4 text-right font-bold text-rose-400">
                      ₹{parseFloat(exp.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
                        title="Delete Expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Modal: Add/Edit Truck */}
      {showTruckModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">
                {editingTruck ? 'Edit Truck' : 'Add New Truck'}
              </h3>
              <button
                onClick={() => setShowTruckModal(false)}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTruck} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1 block">Truck Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GJ05AB1234"
                  value={truckForm.truck_number}
                  onChange={(e) => setTruckForm({ ...truckForm, truck_number: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1 block">Truck Type</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10 Wheeler Tipper"
                    value={truckForm.truck_type}
                    onChange={(e) => setTruckForm({ ...truckForm, truck_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1 block">Capacity (Tons)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={truckForm.capacity_tons}
                    onChange={(e) => setTruckForm({ ...truckForm, capacity_tons: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1 block">Status</label>
                  <select
                    value={truckForm.status}
                    onChange={(e) => setTruckForm({ ...truckForm, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                  >
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1 block">Ownership</label>
                  <select
                    value={truckForm.owner_type}
                    onChange={(e) => setTruckForm({ ...truckForm, owner_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                  >
                    <option value="company">Company Owned</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1 block">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Fastag ID, Chassis details"
                  value={truckForm.notes}
                  onChange={(e) => setTruckForm({ ...truckForm, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTruckModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all"
                >
                  {saving ? 'Saving...' : editingTruck ? 'Update Truck' : 'Add Truck'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Maintenance Expense */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Record Truck Expense</h3>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1 block">Select Truck *</label>
                <select
                  value={expenseForm.truck_id}
                  onChange={(e) => setExpenseForm({ ...expenseForm, truck_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                >
                  {trucks.map((t) => (
                    <option key={t.id} value={t.id}>{t.truck_number} ({t.truck_type})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1 block">Expense Date</label>
                  <input
                    type="date"
                    required
                    value={expenseForm.expense_date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1 block">Expense Type</label>
                  <select
                    value={expenseForm.expense_type}
                    onChange={(e) => setExpenseForm({ ...expenseForm, expense_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                  >
                    <option value="service">Service & Oil</option>
                    <option value="tyre">Tyre</option>
                    <option value="battery">Battery</option>
                    <option value="puncture">Puncture</option>
                    <option value="repair">Repair</option>
                    <option value="maintenance">General Maintenance</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-amber-400 mb-1 block">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 15000"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-4 py-2.5 text-sm font-bold text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1 block">Description</label>
                <input
                  type="text"
                  placeholder="e.g. MRF 2 Tyres replaced"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all"
                >
                  {saving ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
