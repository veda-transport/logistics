'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Loader2, 
  Truck,
  X,
  RefreshCw,
  Download,
  Search,
  CheckCircle2,
  Wrench,
  Fuel,
  ShieldAlert,
  Sparkles,
  Calendar,
  IndianRupee
} from 'lucide-react';
import { supabase, getActiveOrgId, deleteFileFromStorage } from '@/lib/supabase';

export default function TrucksPage() {
  const [activeTab, setActiveTab] = useState('fleet'); // 'fleet' | 'expenses'
  const [trucks, setTrucks] = useState([]);
  const [truckExpenses, setTruckExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal States
  const [showTruckModal, setShowTruckModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingTruck, setEditingTruck] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form States
  const initialTruckForm = {
    truck_number: '',
    truck_type: '10 Wheeler Tipper',
    capacity_tons: 25,
    owner_type: 'company',
    status: 'active',
    notes: '',
  };

  const [truckForm, setTruckForm] = useState(initialTruckForm);

  const initialExpenseForm = {
    truck_id: '',
    expense_date: new Date().toISOString().split('T')[0],
    expense_type: 'service',
    amount: '',
    description: '',
  };

  const [expenseForm, setExpenseForm] = useState(initialExpenseForm);

  // Fetch Data from Supabase
  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        setLoading(true);
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
        }
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
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
    if (!truckForm.truck_number.trim()) {
      alert('Please enter a truck number.');
      return;
    }

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
          .eq('id', editingTruck.id)
          .eq('organization_id', orgId);

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
      setTruckForm(initialTruckForm);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert('Error saving truck: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete Truck
  const handleDeleteTruck = async (id, truckNumber) => {
    if (!window.confirm(`Are you sure you want to permanently delete truck ${truckNumber}?`)) return;
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
    if (!expenseForm.truck_id || parseFloat(expenseForm.amount) <= 0) {
      alert('Please select a truck and enter an amount.');
      return;
    }

    setSaving(true);
    try {
      const orgId = await getActiveOrgId();
      const { error } = await supabase
        .from('truck_expenses')
        .insert([
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
        ...initialExpenseForm,
        truck_id: trucks[0]?.id || '',
      });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert('Error saving truck expense: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this maintenance expense record?')) return;
    try {
      const exp = truckExpenses.find((e) => e.id === id);
      const { error } = await supabase.from('truck_expenses').delete().eq('id', id);
      if (error) throw error;
      if (exp?.attachment_url) {
        deleteFileFromStorage(exp.attachment_url);
      }
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert('Error deleting expense: ' + err.message);
    }
  };

  const openEditTruck = (truck) => {
    setEditingTruck(truck);
    setTruckForm({
      truck_number: truck.truck_number || '',
      truck_type: truck.truck_type || '10 Wheeler Tipper',
      capacity_tons: truck.capacity_tons || 25,
      owner_type: truck.owner_type || 'company',
      status: truck.status || 'active',
      notes: truck.notes || '',
    });
    setShowTruckModal(true);
  };

  const openAddTruck = () => {
    setEditingTruck(null);
    setTruckForm(initialTruckForm);
    setShowTruckModal(true);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (activeTab === 'fleet') {
      const headers = ['Truck Number', 'Type', 'Capacity (Tons)', 'Ownership', 'Status', 'Notes'];
      const rows = filteredTrucks.map((t) => [
        `"${t.truck_number}"`,
        `"${t.truck_type}"`,
        t.capacity_tons,
        t.owner_type,
        t.status,
        `"${t.notes || ''}"`
      ]);
      const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const uri = encodeURI(csv);
      const link = document.createElement('a');
      link.href = uri;
      link.download = `Veda_Fleet_Trucks_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
    } else {
      const headers = ['Date', 'Truck Number', 'Expense Type', 'Amount (INR)', 'Description'];
      const rows = truckExpenses.map((exp) => [
        exp.expense_date,
        `"${exp.trucks?.truck_number || ''}"`,
        exp.expense_type,
        exp.amount,
        `"${exp.description || ''}"`
      ]);
      const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const uri = encodeURI(csv);
      const link = document.createElement('a');
      link.href = uri;
      link.download = `Veda_Truck_Expenses_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
    }
  };

  // Stats
  const totalFleetCount = trucks.length;
  const activeFleetCount = trucks.filter((t) => t.status === 'active').length;
  const maintenanceCount = trucks.filter((t) => t.status === 'maintenance').length;
  const totalMaintenanceCost = truckExpenses.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  // Filtered Trucks
  const filteredTrucks = trucks.filter((t) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (t.truck_number || '').toLowerCase().includes(term) ||
      (t.truck_type || '').toLowerCase().includes(term) ||
      (t.owner_type || '').toLowerCase().includes(term);

    const matchesStatus = statusFilter === 'All' || t.status === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl text-slate-950 shadow-md shadow-amber-500/30">
              <Truck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Fleet & Trucks Master</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage company tippers, trailers, market trucks, and track vehicle maintenance logs.
          </p>
        </div>

        {/* Action Buttons & Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tab Switcher (Goverdhan Haveli style) */}
          <div className="flex bg-[#0c1220] p-1 rounded-2xl border border-amber-500/20 mr-1">
            <button
              onClick={() => setActiveTab('fleet')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'fleet'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                  : 'text-amber-300 hover:text-white'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Fleet List ({totalFleetCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'expenses'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                  : 'text-amber-300 hover:text-white'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Maintenance Logs</span>
            </button>
          </div>

          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="p-2.5 rounded-xl bg-[#0c1220] hover:bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-extrabold transition shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
            title="Export CSV"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Export CSV</span>
          </button>

          {activeTab === 'fleet' ? (
            <button
              onClick={openAddTruck}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/25 text-xs sm:text-sm transition-all hover:scale-[1.02] border border-amber-300/40 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Add Truck</span>
            </button>
          ) : (
            <button
              onClick={() => setShowExpenseModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/25 text-xs sm:text-sm transition-all hover:scale-[1.02] border border-amber-300/40 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Log Maintenance</span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Fleet */}
        <button
          type="button"
          onClick={() => setStatusFilter('All')}
          className={`p-4 sm:p-5 rounded-3xl border text-left transition cursor-pointer relative overflow-hidden group shadow-lg ${
            statusFilter === 'All'
              ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/80 scale-[1.02]'
              : 'bg-[#0c1220]/90 border-amber-500/20 hover:border-amber-400/50 hover:bg-amber-500/5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-extrabold text-slate-400 uppercase tracking-widest">Total Fleet</span>
            {statusFilter === 'All' && (
              <span className="text-[9px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded border border-amber-300">
                Active
              </span>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono mt-1">{totalFleetCount}</div>
        </button>

        {/* Active Trucks */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'active' ? 'All' : 'active')}
          className={`p-4 sm:p-5 rounded-3xl border text-left transition cursor-pointer relative overflow-hidden group shadow-lg ${
            statusFilter === 'active'
              ? 'bg-emerald-500/15 border-emerald-400 ring-2 ring-emerald-400/80 scale-[1.02]'
              : 'bg-[#0c1220]/90 border-emerald-500/20 hover:border-emerald-400/50 hover:bg-emerald-500/5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-extrabold text-emerald-400 uppercase tracking-widest">Active Fleet</span>
            {statusFilter === 'active' && (
              <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-400 text-slate-950 px-1.5 py-0.5 rounded border border-emerald-300">
                Active
              </span>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono mt-1">{activeFleetCount}</div>
        </button>

        {/* In Maintenance */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'maintenance' ? 'All' : 'maintenance')}
          className={`p-4 sm:p-5 rounded-3xl border text-left transition cursor-pointer relative overflow-hidden group shadow-lg ${
            statusFilter === 'maintenance'
              ? 'bg-rose-500/15 border-rose-400 ring-2 ring-rose-400/80 scale-[1.02]'
              : 'bg-[#0c1220]/90 border-rose-500/20 hover:border-rose-400/50 hover:bg-rose-500/5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-extrabold text-rose-400 uppercase tracking-widest">In Workshop</span>
            {statusFilter === 'maintenance' && (
              <span className="text-[9px] font-black uppercase tracking-wider bg-rose-400 text-slate-950 px-1.5 py-0.5 rounded border border-rose-300">
                Active
              </span>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-400 font-mono mt-1">{maintenanceCount}</div>
        </button>

        {/* Maintenance Cost */}
        <div className="p-4 sm:p-5 rounded-3xl border border-amber-500/20 bg-[#0c1220]/90 shadow-lg text-left">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-extrabold text-amber-400 uppercase tracking-widest">Workshop Total</span>
            <Wrench className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono mt-1">₹{totalMaintenanceCost.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* ----------------- TAB 1: FLEET LIST ----------------- */}
      {activeTab === 'fleet' && (
        <div className="space-y-4">
          {/* Search & Status Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#0c1220]/90 p-3 rounded-2xl border border-amber-500/20 shadow-xl">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400/80" />
              <input
                type="text"
                placeholder="Search by truck number, truck type, ownership..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#070b14] border border-amber-500/25 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto bg-[#070b14] border border-amber-500/25 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-amber-300 font-bold focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="All">All Statuses ({totalFleetCount})</option>
              <option value="active">Active ({activeFleetCount})</option>
              <option value="maintenance">Maintenance ({maintenanceCount})</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {loading ? (
            <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-3 bg-[#0c1220]/60 rounded-3xl border border-amber-500/20">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              <p className="text-sm font-bold text-amber-200">Loading trucks and fleet...</p>
            </div>
          ) : filteredTrucks.length === 0 ? (
            <div className="p-12 text-center bg-[#0c1220]/60 border border-dashed border-amber-500/30 rounded-3xl space-y-4">
              <Truck className="w-12 h-12 mx-auto text-amber-400/80" />
              <h3 className="text-base font-black text-white">No trucks found</h3>
              <button
                onClick={openAddTruck}
                className="inline-block px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20"
              >
                + Register First Truck
              </button>
            </div>
          ) : (
            <>
              {/* Mobile Cards View */}
              <div className="block md:hidden space-y-3">
                {filteredTrucks.map((truck) => (
                  <div
                    key={truck.id}
                    className="p-4 bg-[#0c1220]/95 backdrop-blur-md border border-amber-500/20 rounded-2xl shadow-xl space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-amber-500/15 pb-2.5">
                      <div>
                        <span className="text-base font-black text-white font-mono block">{truck.truck_number}</span>
                        <span className="text-xs text-amber-400/90 font-semibold">{truck.truck_type}</span>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          truck.status === 'active'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : truck.status === 'maintenance'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {truck.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-[#070b14]/70 rounded-xl border border-amber-500/10">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Capacity</span>
                        <span className="font-extrabold text-white">{truck.capacity_tons} Tons</span>
                      </div>
                      <div className="p-2 bg-[#070b14]/70 rounded-xl border border-amber-500/10">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Ownership</span>
                        <span className="font-extrabold text-amber-300 capitalize">{truck.owner_type}</span>
                      </div>
                    </div>

                    {truck.notes && (
                      <div className="text-[11px] text-slate-400 italic bg-[#070b14]/40 p-2 rounded-lg">
                        {truck.notes}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-500/10">
                      <button
                        onClick={() => openEditTruck(truck)}
                        className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteTruck(truck.id, truck.truck_number)}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-xl transition cursor-pointer"
                        title="Delete Truck"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block bg-[#0c1220]/95 backdrop-blur-xl border border-amber-500/20 rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-[#070b14]/90 text-[11px] uppercase font-black text-amber-400 tracking-wider border-b border-amber-500/20">
                      <tr>
                        <th className="py-4 px-4">Truck Number</th>
                        <th className="py-4 px-4">Type & Capacity</th>
                        <th className="py-4 px-4">Ownership</th>
                        <th className="py-4 px-4">Notes</th>
                        <th className="py-4 px-4 text-center">Status</th>
                        <th className="py-4 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-500/10">
                      {filteredTrucks.map((truck) => (
                        <tr key={truck.id} className="hover:bg-[#131c33]/60 transition-colors">
                          <td className="py-4 px-4">
                            <span className="font-mono font-black text-white text-base block">{truck.truck_number}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-bold text-slate-200 block">{truck.truck_type}</span>
                            <span className="text-xs text-amber-400 font-semibold">{truck.capacity_tons} Tons Gross</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="capitalize font-semibold text-slate-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-xs">
                              {truck.owner_type}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-xs text-slate-400 max-w-xs truncate">
                            {truck.notes || '-'}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                truck.status === 'active'
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : truck.status === 'maintenance'
                                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              {truck.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => openEditTruck(truck)}
                                className="p-2 text-amber-400 hover:text-white hover:bg-amber-500/20 rounded-xl transition-all cursor-pointer"
                                title="Edit Truck"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTruck(truck.id, truck.truck_number)}
                                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                                title="Delete Truck"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ----------------- TAB 2: TRUCK EXPENSES / WORKSHOP ----------------- */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          {truckExpenses.length === 0 ? (
            <div className="p-12 text-center bg-[#0c1220]/60 border border-dashed border-amber-500/30 rounded-3xl space-y-4">
              <Wrench className="w-12 h-12 mx-auto text-amber-400/80" />
              <h3 className="text-base font-black text-white">No maintenance logs recorded yet</h3>
              <button
                onClick={() => setShowExpenseModal(true)}
                className="inline-block px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20"
              >
                + Log First Maintenance
              </button>
            </div>
          ) : (
            <div className="bg-[#0c1220]/95 backdrop-blur-xl border border-amber-500/20 rounded-3xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-[#070b14]/90 text-[11px] uppercase font-black text-amber-400 tracking-wider border-b border-amber-500/20">
                    <tr>
                      <th className="py-4 px-4">Date</th>
                      <th className="py-4 px-4">Truck #</th>
                      <th className="py-4 px-4">Service Type</th>
                      <th className="py-4 px-4 text-right">Cost (₹)</th>
                      <th className="py-4 px-4">Description / Workshop</th>
                      <th className="py-4 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-500/10">
                    {truckExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-[#131c33]/60 transition-colors">
                        <td className="py-4 px-4 text-xs font-semibold text-slate-300">{exp.expense_date}</td>
                        <td className="py-4 px-4 font-mono font-bold text-white">{exp.trucks?.truck_number || '-'}</td>
                        <td className="py-4 px-4">
                          <span className="capitalize bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/20 text-xs font-bold">
                            {exp.expense_type}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right font-black text-rose-400 font-mono">
                          ₹{parseFloat(exp.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="py-4 px-4 text-xs text-slate-400">{exp.description || '-'}</td>
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Add / Edit Truck */}
      {showTruckModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0c1220] border border-amber-500/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
              <h2 className="text-xl font-black text-white">
                {editingTruck ? `Edit Truck (${editingTruck.truck_number})` : 'Add New Truck / Tipper'}
              </h2>
              <button
                onClick={() => setShowTruckModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-[#131c33] border border-amber-500/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTruck} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-amber-300 block mb-1">Truck Registration Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GJ 01 AB 1234"
                  value={truckForm.truck_number}
                  onChange={(e) => setTruckForm({ ...truckForm, truck_number: e.target.value.toUpperCase() })}
                  className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white font-mono uppercase focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-amber-300 block mb-1">Vehicle Type</label>
                  <select
                    value={truckForm.truck_type}
                    onChange={(e) => setTruckForm({ ...truckForm, truck_type: e.target.value })}
                    className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="10 Wheeler Tipper">10 Wheeler Tipper</option>
                    <option value="12 Wheeler Tipper">12 Wheeler Tipper</option>
                    <option value="14 Wheeler Tipper">14 Wheeler Tipper</option>
                    <option value="Trailer 40ft">Trailer 40ft</option>
                    <option value="Dumper">Dumper</option>
                    <option value="6 Wheeler">6 Wheeler</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-amber-300 block mb-1">Capacity (Tons) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={truckForm.capacity_tons}
                    onChange={(e) => setTruckForm({ ...truckForm, capacity_tons: e.target.value })}
                    className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-amber-300 block mb-1">Ownership</label>
                  <select
                    value={truckForm.owner_type}
                    onChange={(e) => setTruckForm({ ...truckForm, owner_type: e.target.value })}
                    className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="company">Company Owned</option>
                    <option value="market">Market / Attached</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-amber-300 block mb-1">Status</label>
                  <select
                    value={truckForm.status}
                    onChange={(e) => setTruckForm({ ...truckForm, status: e.target.value })}
                    className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="active">Active</option>
                    <option value="maintenance">In Maintenance</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-amber-300 block mb-1">Notes / Insurance / Permit Info</label>
                <textarea
                  rows={2}
                  placeholder="Permit valid till, Insurance policy number..."
                  value={truckForm.notes}
                  onChange={(e) => setTruckForm({ ...truckForm, notes: e.target.value })}
                  className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-amber-500/20">
                <button
                  type="button"
                  onClick={() => setShowTruckModal(false)}
                  className="px-4 py-2.5 bg-[#131c33] border border-amber-500/20 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/25 text-xs sm:text-sm cursor-pointer border border-amber-300/30"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{editingTruck ? 'Update Truck' : 'Save Truck'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Log Truck Expense */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0c1220] border border-amber-500/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
              <h2 className="text-xl font-black text-white">Log Fleet Maintenance</h2>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-[#131c33] border border-amber-500/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-amber-300 block mb-1">Select Truck *</label>
                <select
                  required
                  value={expenseForm.truck_id}
                  onChange={(e) => setExpenseForm({ ...expenseForm, truck_id: e.target.value })}
                  className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                >
                  {trucks.map((t) => (
                    <option key={t.id} value={t.id}>{t.truck_number} ({t.truck_type})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-amber-300 block mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={expenseForm.expense_date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                    className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-amber-300 block mb-1">Service Type</label>
                  <select
                    value={expenseForm.expense_type}
                    onChange={(e) => setExpenseForm({ ...expenseForm, expense_type: e.target.value })}
                    className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="service">Routine Service / Oil</option>
                    <option value="tyre">Tyre Replacement / Retreading</option>
                    <option value="insurance">Insurance Renewal</option>
                    <option value="fitness_permit">Fitness / Road Tax / Permit</option>
                    <option value="major_repair">Major Engine / Body Repair</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-rose-400 block mb-1">Amount (₹ Cost) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 15000"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  className="w-full bg-[#070b14] border border-rose-500/40 rounded-xl px-4 py-2.5 text-base font-black text-rose-400 focus:outline-none focus:border-rose-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-amber-300 block mb-1">Description / Workshop Name / Bill No</label>
                <textarea
                  rows={2}
                  placeholder="Replaced 2 rear tyres at National Tyres, Bill #9842"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-amber-500/20">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2.5 bg-[#131c33] border border-amber-500/20 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/25 text-xs sm:text-sm cursor-pointer border border-amber-300/30"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Save Maintenance Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
