'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Loader2, 
  Users, 
  X,
  RefreshCw,
  Download,
  Search,
  CheckCircle2,
  Phone,
  DollarSign,
  Calendar,
  Sparkles,
  CreditCard,
  UserCheck
} from 'lucide-react';
import { supabase, getActiveOrgId } from '@/lib/supabase';

export default function DriversPage() {
  const [activeTab, setActiveTab] = useState('drivers'); // 'drivers' | 'payroll'
  const [drivers, setDrivers] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal States
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form States
  const initialDriverForm = {
    name: '',
    phone: '',
    address: '',
    joining_date: new Date().toISOString().split('T')[0],
    salary_type: 'monthly',
    monthly_salary: 25000,
    commission_type: 'fixed_per_fera',
    commission_value: 2000,
    status: 'active',
    notes: '',
  };

  const [driverForm, setDriverForm] = useState(initialDriverForm);

  const initialSalaryForm = {
    driver_id: '',
    salary_month: new Date().toISOString().slice(0, 7),
    basic_salary: 25000,
    incentive_amount: 0,
    deduction_amount: 0,
    advance_amount: 0,
    paid_amount: 25000,
    status: 'paid',
    notes: '',
  };

  const [salaryForm, setSalaryForm] = useState(initialSalaryForm);

  // Fetch Drivers and Salaries
  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        setLoading(true);
        const orgId = await getActiveOrgId();
        if (!orgId || ignore) return;

        const [driversRes, salaryRes] = await Promise.all([
          supabase.from('drivers').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }),
          supabase.from('driver_salary_records').select('*, drivers(name)').eq('organization_id', orgId).order('salary_month', { ascending: false }),
        ]);

        if (!ignore) {
          const dList = driversRes.data || [];
          setDrivers(dList);
          setPayroll(salaryRes.data || []);
          if (dList.length > 0) {
            setSalaryForm((prev) => ({ 
              ...prev, 
              driver_id: dList[0].id,
              basic_salary: dList[0].monthly_salary || 25000,
              paid_amount: dList[0].monthly_salary || 25000
            }));
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

  // Save / Update Driver
  const handleSaveDriver = async (e) => {
    e.preventDefault();
    if (!driverForm.name.trim() || !driverForm.phone.trim()) {
      alert('Please enter driver name and phone number.');
      return;
    }

    setSaving(true);
    try {
      const orgId = await getActiveOrgId();
      if (editingDriver) {
        const { error } = await supabase
          .from('drivers')
          .update({
            name: driverForm.name.trim(),
            phone: driverForm.phone.trim(),
            address: driverForm.address,
            joining_date: driverForm.joining_date,
            salary_type: driverForm.salary_type,
            monthly_salary: parseFloat(driverForm.monthly_salary) || 0,
            commission_type: driverForm.commission_type,
            commission_value: parseFloat(driverForm.commission_value) || 0,
            status: driverForm.status,
            notes: driverForm.notes,
          })
          .eq('id', editingDriver.id)
          .eq('organization_id', orgId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('drivers')
          .insert([
            {
              organization_id: orgId,
              name: driverForm.name.trim(),
              phone: driverForm.phone.trim(),
              address: driverForm.address,
              joining_date: driverForm.joining_date,
              salary_type: driverForm.salary_type,
              monthly_salary: parseFloat(driverForm.monthly_salary) || 0,
              commission_type: driverForm.commission_type,
              commission_value: parseFloat(driverForm.commission_value) || 0,
              status: driverForm.status,
              notes: driverForm.notes,
            },
          ]);

        if (error) throw error;
      }

      setShowDriverModal(false);
      setEditingDriver(null);
      setDriverForm(initialDriverForm);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert('Error saving driver: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete Driver
  const handleDeleteDriver = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete driver ${name}?`)) return;
    try {
      const { error } = await supabase.from('drivers').delete().eq('id', id);
      if (error) throw error;
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert('Error deleting driver: ' + err.message);
    }
  };

  // Save Salary Record
  const handleSaveSalary = async (e) => {
    e.preventDefault();
    if (!salaryForm.driver_id || parseFloat(salaryForm.paid_amount) <= 0) {
      alert('Please select a driver and enter paid amount.');
      return;
    }

    setSaving(true);
    try {
      const orgId = await getActiveOrgId();
      const { error } = await supabase
        .from('driver_salary_records')
        .insert([
          {
            organization_id: orgId,
            driver_id: salaryForm.driver_id,
            salary_month: salaryForm.salary_month,
            basic_salary: parseFloat(salaryForm.basic_salary) || 0,
            incentive_amount: parseFloat(salaryForm.incentive_amount) || 0,
            deduction_amount: parseFloat(salaryForm.deduction_amount) || 0,
            advance_amount: parseFloat(salaryForm.advance_amount) || 0,
            paid_amount: parseFloat(salaryForm.paid_amount) || 0,
            status: salaryForm.status,
            notes: salaryForm.notes,
          },
        ]);

      if (error) throw error;

      setShowSalaryModal(false);
      setSalaryForm(initialSalaryForm);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert('Error recording salary: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSalary = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payroll transaction?')) return;
    try {
      const { error } = await supabase.from('driver_salary_records').delete().eq('id', id);
      if (error) throw error;
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert('Error deleting salary record: ' + err.message);
    }
  };

  const openEditDriver = (driver) => {
    setEditingDriver(driver);
    setDriverForm({
      name: driver.name || '',
      phone: driver.phone || '',
      address: driver.address || '',
      joining_date: driver.joining_date || new Date().toISOString().split('T')[0],
      salary_type: driver.salary_type || 'monthly',
      monthly_salary: driver.monthly_salary || 25000,
      commission_type: driver.commission_type || 'fixed_per_fera',
      commission_value: driver.commission_value || 2000,
      status: driver.status || 'active',
      notes: driver.notes || '',
    });
    setShowDriverModal(true);
  };

  const openAddDriver = () => {
    setEditingDriver(null);
    setDriverForm(initialDriverForm);
    setShowDriverModal(true);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (activeTab === 'drivers') {
      const headers = ['Driver Name', 'Phone', 'Joining Date', 'Salary Type', 'Monthly Salary (INR)', 'Commission (INR)', 'Status'];
      const rows = filteredDrivers.map((d) => [
        `"${d.name}"`,
        `"${d.phone}"`,
        d.joining_date,
        d.salary_type,
        d.monthly_salary,
        d.commission_value,
        d.status
      ]);
      const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const uri = encodeURI(csv);
      const link = document.createElement('a');
      link.href = uri;
      link.download = `Veda_Drivers_Master_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
    } else {
      const headers = ['Month', 'Driver Name', 'Basic (INR)', 'Incentive (INR)', 'Deductions (INR)', 'Paid (INR)', 'Status'];
      const rows = payroll.map((p) => [
        p.salary_month,
        `"${p.drivers?.name || ''}"`,
        p.basic_salary,
        p.incentive_amount,
        p.deduction_amount,
        p.paid_amount,
        p.status
      ]);
      const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const uri = encodeURI(csv);
      const link = document.createElement('a');
      link.href = uri;
      link.download = `Veda_Driver_Payroll_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
    }
  };

  // Stats
  const totalDriversCount = drivers.length;
  const activeDriversCount = drivers.filter((d) => d.status === 'active').length;
  const inactiveDriversCount = drivers.filter((d) => d.status === 'inactive').length;
  const totalPayrollPaid = payroll.reduce((acc, curr) => acc + (parseFloat(curr.paid_amount) || 0), 0);

  // Filtered Drivers
  const filteredDrivers = drivers.filter((d) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (d.name || '').toLowerCase().includes(term) ||
      (d.phone || '').toLowerCase().includes(term);

    const matchesStatus = statusFilter === 'All' || d.status === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl text-slate-950 shadow-md shadow-amber-500/30">
              <Users className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Drivers & Payroll Management</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage driver master files, trip commission rules, and monthly payroll disbursement.
          </p>
        </div>

        {/* Action Buttons & Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tab Switcher */}
          <div className="flex bg-[#0c1220] p-1 rounded-2xl border border-amber-500/20 mr-1">
            <button
              onClick={() => setActiveTab('drivers')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'drivers'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                  : 'text-amber-300 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Drivers ({totalDriversCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('payroll')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'payroll'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                  : 'text-amber-300 hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Salary Ledger</span>
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

          {activeTab === 'drivers' ? (
            <button
              onClick={openAddDriver}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/25 text-xs sm:text-sm transition-all hover:scale-[1.02] border border-amber-300/40 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Add Driver</span>
            </button>
          ) : (
            <button
              onClick={() => setShowSalaryModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/25 text-xs sm:text-sm transition-all hover:scale-[1.02] border border-amber-300/40 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Record Salary</span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Drivers */}
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
            <span className="text-[10px] sm:text-xs font-extrabold text-slate-400 uppercase tracking-widest">Total Drivers</span>
            {statusFilter === 'All' && (
              <span className="text-[9px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded border border-amber-300">
                Active
              </span>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono mt-1">{totalDriversCount}</div>
        </button>

        {/* Active Drivers */}
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
            <span className="text-[10px] sm:text-xs font-extrabold text-emerald-400 uppercase tracking-widest">On Duty</span>
            {statusFilter === 'active' && (
              <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-400 text-slate-950 px-1.5 py-0.5 rounded border border-emerald-300">
                Active
              </span>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono mt-1">{activeDriversCount}</div>
        </button>

        {/* Inactive */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'inactive' ? 'All' : 'inactive')}
          className={`p-4 sm:p-5 rounded-3xl border text-left transition cursor-pointer relative overflow-hidden group shadow-lg ${
            statusFilter === 'inactive'
              ? 'bg-rose-500/15 border-rose-400 ring-2 ring-rose-400/80 scale-[1.02]'
              : 'bg-[#0c1220]/90 border-rose-500/20 hover:border-rose-400/50 hover:bg-rose-500/5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-extrabold text-rose-400 uppercase tracking-widest">Inactive</span>
            {statusFilter === 'inactive' && (
              <span className="text-[9px] font-black uppercase tracking-wider bg-rose-400 text-slate-950 px-1.5 py-0.5 rounded border border-rose-300">
                Active
              </span>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-400 font-mono mt-1">{inactiveDriversCount}</div>
        </button>

        {/* Payroll Disbursed */}
        <div className="p-4 sm:p-5 rounded-3xl border border-amber-500/20 bg-[#0c1220]/90 shadow-lg text-left">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-extrabold text-amber-400 uppercase tracking-widest">Payroll Paid</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-1">₹{totalPayrollPaid.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* ----------------- TAB 1: DRIVERS LIST ----------------- */}
      {activeTab === 'drivers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#0c1220]/90 p-3 rounded-2xl border border-amber-500/20 shadow-xl">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400/80" />
              <input
                type="text"
                placeholder="Search driver by name, phone..."
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
              <option value="All">All Statuses ({totalDriversCount})</option>
              <option value="active">Active ({activeDriversCount})</option>
              <option value="inactive">Inactive ({inactiveDriversCount})</option>
            </select>
          </div>

          {loading ? (
            <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-3 bg-[#0c1220]/60 rounded-3xl border border-amber-500/20">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              <p className="text-sm font-bold text-amber-200">Loading drivers and staff...</p>
            </div>
          ) : filteredDrivers.length === 0 ? (
            <div className="p-12 text-center bg-[#0c1220]/60 border border-dashed border-amber-500/30 rounded-3xl space-y-4">
              <Users className="w-12 h-12 mx-auto text-amber-400/80" />
              <h3 className="text-base font-black text-white">No drivers found</h3>
              <button
                onClick={openAddDriver}
                className="inline-block px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20"
              >
                + Register First Driver
              </button>
            </div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="block md:hidden space-y-3">
                {filteredDrivers.map((driver) => (
                  <div
                    key={driver.id}
                    className="p-4 bg-[#0c1220]/95 backdrop-blur-md border border-amber-500/20 rounded-2xl shadow-xl space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-amber-500/15 pb-2.5">
                      <div>
                        <span className="text-base font-black text-white block">{driver.name}</span>
                        <span className="text-xs text-amber-400 font-mono">{driver.phone}</span>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          driver.status === 'active'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {driver.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-[#070b14]/70 rounded-xl border border-amber-500/10">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Monthly Salary</span>
                        <span className="font-extrabold text-white">₹{parseFloat(driver.monthly_salary || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="p-2 bg-[#070b14]/70 rounded-xl border border-amber-500/10">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Trip Commission</span>
                        <span className="font-extrabold text-amber-300">₹{driver.commission_value || 0} / trip</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-500/10">
                      <button
                        onClick={() => openEditDriver(driver)}
                        className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteDriver(driver.id, driver.name)}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-xl transition cursor-pointer"
                        title="Delete Driver"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block bg-[#0c1220]/95 backdrop-blur-xl border border-amber-500/20 rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-[#070b14]/90 text-[11px] uppercase font-black text-amber-400 tracking-wider border-b border-amber-500/20">
                      <tr>
                        <th className="py-4 px-4">Driver Name</th>
                        <th className="py-4 px-4">Phone Number</th>
                        <th className="py-4 px-4 text-right">Fixed Monthly Salary</th>
                        <th className="py-4 px-4 text-right">Trip Commission</th>
                        <th className="py-4 px-4">Joined Date</th>
                        <th className="py-4 px-4 text-center">Status</th>
                        <th className="py-4 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-500/10">
                      {filteredDrivers.map((driver) => (
                        <tr key={driver.id} className="hover:bg-[#131c33]/60 transition-colors">
                          <td className="py-4 px-4 font-bold text-white">{driver.name}</td>
                          <td className="py-4 px-4 font-mono text-xs">{driver.phone}</td>
                          <td className="py-4 px-4 text-right font-bold text-slate-200">
                            ₹{parseFloat(driver.monthly_salary || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-4 px-4 text-right font-black text-amber-300">
                            ₹{driver.commission_value || 0}
                          </td>
                          <td className="py-4 px-4 text-xs text-slate-400">{driver.joining_date || '-'}</td>
                          <td className="py-4 px-4 text-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                driver.status === 'active'
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {driver.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => openEditDriver(driver)}
                                className="p-2 text-amber-400 hover:text-white hover:bg-amber-500/20 rounded-xl transition-all cursor-pointer"
                                title="Edit Driver"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteDriver(driver.id, driver.name)}
                                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                                title="Delete Driver"
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

      {/* ----------------- TAB 2: PAYROLL LEDGER ----------------- */}
      {activeTab === 'payroll' && (
        <div className="space-y-4">
          {payroll.length === 0 ? (
            <div className="p-12 text-center bg-[#0c1220]/60 border border-dashed border-amber-500/30 rounded-3xl space-y-4">
              <CreditCard className="w-12 h-12 mx-auto text-amber-400/80" />
              <h3 className="text-base font-black text-white">No salary records disbursed yet</h3>
              <button
                onClick={() => setShowSalaryModal(true)}
                className="inline-block px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20"
              >
                + Record First Salary
              </button>
            </div>
          ) : (
            <div className="bg-[#0c1220]/95 backdrop-blur-xl border border-amber-500/20 rounded-3xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-[#070b14]/90 text-[11px] uppercase font-black text-amber-400 tracking-wider border-b border-amber-500/20">
                    <tr>
                      <th className="py-4 px-4">Month</th>
                      <th className="py-4 px-4">Driver Name</th>
                      <th className="py-4 px-4 text-right">Basic (₹)</th>
                      <th className="py-4 px-4 text-right">Incentives (₹)</th>
                      <th className="py-4 px-4 text-right">Deductions (₹)</th>
                      <th className="py-4 px-4 text-right">Paid Amount (₹)</th>
                      <th className="py-4 px-4 text-center">Status</th>
                      <th className="py-4 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-500/10">
                    {payroll.map((pay) => (
                      <tr key={pay.id} className="hover:bg-[#131c33]/60 transition-colors">
                        <td className="py-4 px-4 font-mono font-bold text-amber-300">{pay.salary_month}</td>
                        <td className="py-4 px-4 font-bold text-white">{pay.drivers?.name || '-'}</td>
                        <td className="py-4 px-4 text-right">₹{parseFloat(pay.basic_salary).toLocaleString('en-IN')}</td>
                        <td className="py-4 px-4 text-right text-emerald-400 font-semibold">+₹{parseFloat(pay.incentive_amount || 0).toLocaleString('en-IN')}</td>
                        <td className="py-4 px-4 text-right text-rose-400 font-semibold">-₹{parseFloat(pay.deduction_amount || 0).toLocaleString('en-IN')}</td>
                        <td className="py-4 px-4 text-right font-black text-white font-mono">
                          ₹{parseFloat(pay.paid_amount).toLocaleString('en-IN')}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold">
                            {pay.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => handleDeleteSalary(pay.id)}
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

      {/* Modal: Add / Edit Driver */}
      {showDriverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0c1220] border border-amber-500/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
              <h2 className="text-xl font-black text-white">
                {editingDriver ? `Edit Driver (${editingDriver.name})` : 'Add New Driver'}
              </h2>
              <button
                onClick={() => setShowDriverModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-[#131c33] border border-amber-500/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDriver} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-amber-300 block mb-1">Driver Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Bhai"
                    value={driverForm.name}
                    onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                    className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-amber-300 block mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={driverForm.phone}
                    onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                    className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-amber-300 block mb-1">Monthly Salary (₹)</label>
                  <input
                    type="number"
                    value={driverForm.monthly_salary}
                    onChange={(e) => setDriverForm({ ...driverForm, monthly_salary: e.target.value })}
                    className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-amber-300 block mb-1">Commission per Trip (₹)</label>
                  <input
                    type="number"
                    value={driverForm.commission_value}
                    onChange={(e) => setDriverForm({ ...driverForm, commission_value: e.target.value })}
                    className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-amber-300 block mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={driverForm.joining_date}
                    onChange={(e) => setDriverForm({ ...driverForm, joining_date: e.target.value })}
                    className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-amber-300 block mb-1">Status</label>
                  <select
                    value={driverForm.status}
                    onChange={(e) => setDriverForm({ ...driverForm, status: e.target.value })}
                    className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="active">Active / On Duty</option>
                    <option value="inactive">Inactive / Resigned</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-amber-300 block mb-1">Address & License Details</label>
                <textarea
                  rows={2}
                  placeholder="Driving License number, home address..."
                  value={driverForm.address}
                  onChange={(e) => setDriverForm({ ...driverForm, address: e.target.value })}
                  className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-amber-500/20">
                <button
                  type="button"
                  onClick={() => setShowDriverModal(false)}
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
                  <span>{editingDriver ? 'Update Driver' : 'Save Driver'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Salary */}
      {showSalaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0c1220] border border-amber-500/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
              <h2 className="text-xl font-black text-white">Record Driver Salary Disbursement</h2>
              <button
                onClick={() => setShowSalaryModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-[#131c33] border border-amber-500/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSalary} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-amber-300 block mb-1">Select Driver *</label>
                  <select
                    required
                    value={salaryForm.driver_id}
                    onChange={(e) => {
                      const sel = drivers.find((d) => d.id === e.target.value);
                      const base = sel ? (sel.monthly_salary || 25000) : 25000;
                      setSalaryForm({ 
                        ...salaryForm, 
                        driver_id: e.target.value,
                        basic_salary: base,
                        paid_amount: base
                      });
                    }}
                    className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  >
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-amber-300 block mb-1">Salary Month *</label>
                  <input
                    type="month"
                    required
                    value={salaryForm.salary_month}
                    onChange={(e) => setSalaryForm({ ...salaryForm, salary_month: e.target.value })}
                    className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Basic Salary (₹)</label>
                  <input
                    type="number"
                    value={salaryForm.basic_salary}
                    onChange={(e) => setSalaryForm({ ...salaryForm, basic_salary: e.target.value })}
                    className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-emerald-400 block mb-1">Incentive (+₹)</label>
                  <input
                    type="number"
                    value={salaryForm.incentive_amount}
                    onChange={(e) => setSalaryForm({ ...salaryForm, incentive_amount: e.target.value })}
                    className="w-full bg-[#070b14] border border-emerald-500/30 rounded-xl px-3 py-2 text-sm text-emerald-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-rose-400 block mb-1">Deductions (-₹)</label>
                  <input
                    type="number"
                    value={salaryForm.deduction_amount}
                    onChange={(e) => setSalaryForm({ ...salaryForm, deduction_amount: e.target.value })}
                    className="w-full bg-[#070b14] border border-rose-500/30 rounded-xl px-3 py-2 text-sm text-rose-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-amber-400 block mb-1">Net Paid Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={salaryForm.paid_amount}
                  onChange={(e) => setSalaryForm({ ...salaryForm, paid_amount: e.target.value })}
                  className="w-full bg-[#070b14] border border-amber-400 rounded-xl px-4 py-2.5 text-base font-black text-white focus:outline-none shadow-inner"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-amber-300 block mb-1">Payment Remarks</label>
                <input
                  type="text"
                  placeholder="GPay / Cash given by Ronak"
                  value={salaryForm.notes}
                  onChange={(e) => setSalaryForm({ ...salaryForm, notes: e.target.value })}
                  className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-amber-500/20">
                <button
                  type="button"
                  onClick={() => setShowSalaryModal(false)}
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
                  <span>Save Salary Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
