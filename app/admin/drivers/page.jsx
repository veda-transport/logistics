'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Loader2, 
  Users, 
  X 
} from 'lucide-react';
import { supabase, getActiveOrgId } from '@/lib/supabase';

export default function DriversPage() {
  const [activeTab, setActiveTab] = useState('drivers'); // 'drivers' | 'payroll'
  const [drivers, setDrivers] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal States
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form States
  const [driverForm, setDriverForm] = useState({
    name: '',
    phone: '',
    address: '',
    joining_date: '2026-01-15',
    salary_type: 'monthly',
    monthly_salary: 25000,
    commission_type: 'fixed_per_fera',
    commission_value: 2000,
    status: 'active',
    notes: '',
  });

  const [salaryForm, setSalaryForm] = useState({
    driver_id: '',
    salary_month: '2026-09',
    basic_salary: 25000,
    incentive_amount: 0,
    deduction_amount: 0,
    advance_amount: 0,
    paid_amount: 0,
    status: 'paid',
    notes: '',
  });

  // Fetch Drivers and Salaries
  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
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
              basic_salary: dList[0].monthly_salary
            }));
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

  // Save / Update Driver
  const handleSaveDriver = async (e) => {
    e.preventDefault();
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
          .eq('id', editingDriver.id);

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
      setDriverForm({
        name: '',
        phone: '',
        address: '',
        joining_date: '2026-01-15',
        salary_type: 'monthly',
        monthly_salary: 25000,
        commission_type: 'fixed_per_fera',
        commission_value: 2000,
        status: 'active',
        notes: '',
      });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert('Error saving driver: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete Driver
  const handleDeleteDriver = async (id, name) => {
    if (!confirm(`Are you sure you want to delete driver ${name}?`)) return;
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
    setSaving(true);
    try {
      const orgId = await getActiveOrgId();
      const basic = parseFloat(salaryForm.basic_salary) || 0;
      const incentive = parseFloat(salaryForm.incentive_amount) || 0;
      const deduction = parseFloat(salaryForm.deduction_amount) || 0;
      const advance = parseFloat(salaryForm.advance_amount) || 0;
      const net = basic + incentive - deduction - advance;

      const { error } = await supabase.from('driver_salary_records').insert([
        {
          organization_id: orgId,
          driver_id: salaryForm.driver_id,
          salary_month: salaryForm.salary_month,
          basic_salary: basic,
          incentive_amount: incentive,
          deduction_amount: deduction,
          advance_amount: advance,
          net_amount: net,
          paid_amount: parseFloat(salaryForm.paid_amount) || 0,
          status: salaryForm.status,
          notes: salaryForm.notes,
        },
      ]);

      if (error) throw error;

      setShowSalaryModal(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert('Error saving salary record: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete Salary
  const handleDeleteSalary = async (id) => {
    if (!confirm('Are you sure you want to delete this salary record?')) return;
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
      name: driver.name,
      phone: driver.phone,
      address: driver.address || '',
      joining_date: driver.joining_date,
      salary_type: driver.salary_type,
      monthly_salary: driver.monthly_salary,
      commission_type: driver.commission_type,
      commission_value: driver.commission_value,
      status: driver.status,
      notes: driver.notes || '',
    });
    setShowDriverModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Driver Master & Payroll</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Manage driver profiles, trip commission rules, and monthly payroll records.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'drivers' ? (
            <button
              onClick={() => {
                setEditingDriver(null);
                setDriverForm({
                  name: '',
                  phone: '',
                  address: '',
                  joining_date: '2026-01-15',
                  salary_type: 'monthly',
                  monthly_salary: 25000,
                  commission_type: 'fixed_per_fera',
                  commission_value: 2000,
                  status: 'active',
                  notes: '',
                });
                setShowDriverModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 text-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Driver</span>
            </button>
          ) : (
            <button
              onClick={() => setShowSalaryModal(true)}
              disabled={drivers.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 text-sm transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Generate Salary Record</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('drivers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'drivers'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          Drivers List ({drivers.length})
        </button>
        <button
          onClick={() => setActiveTab('payroll')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'payroll'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          Monthly Payroll Records ({payroll.length})
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-sm">Loading drivers from Supabase...</p>
        </div>
      ) : activeTab === 'drivers' ? (
        drivers.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">No drivers found</h3>
              <p className="text-xs text-slate-400 mt-1">Add drivers to assign them to trips and track commissions.</p>
            </div>
            <button
              onClick={() => {
                setEditingDriver(null);
                setShowDriverModal(true);
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all"
            >
              + Add Driver
            </button>
          </div>
        ) : (
          /* Drivers Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drivers.map((d) => (
              <div
                key={d.id}
                className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md space-y-4 hover:border-slate-700 transition-all shadow-xl relative group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">{d.name}</h3>
                    <p className="text-xs text-slate-400">{d.phone}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    d.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {d.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/60 text-xs">
                  <div>
                    <span className="text-slate-500 block">Base Salary</span>
                    <span className="font-bold text-white text-sm">₹{parseFloat(d.monthly_salary).toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Commission</span>
                    <span className="font-bold text-amber-400 text-sm">
                      ₹{parseFloat(d.commission_value).toLocaleString('en-IN')} / {d.commission_type.replace('_', ' ')}
                    </span>
                  </div>
                  {d.address && (
                    <div className="col-span-2 text-slate-400">
                      <span className="text-slate-500 block">Address:</span>
                      <span>{d.address}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-800/60 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEditDriver(d)}
                    className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-all"
                    title="Edit Driver"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteDriver(d.id, d.name)}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all"
                    title="Delete Driver"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Payroll Table */
        payroll.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
            <p className="text-sm text-slate-400">No salary records generated yet.</p>
          </div>
        ) : (
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/70 text-[11px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Driver</th>
                  <th className="py-3.5 px-4">Month</th>
                  <th className="py-3.5 px-4 text-right">Basic</th>
                  <th className="py-3.5 px-4 text-right">Incentive</th>
                  <th className="py-3.5 px-4 text-right">Advance/Deductions</th>
                  <th className="py-3.5 px-4 text-right">Net Payable</th>
                  <th className="py-3.5 px-4 text-right">Paid</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {payroll.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4 font-bold text-white">{p.drivers?.name || '-'}</td>
                    <td className="py-4 px-4 text-xs font-mono text-slate-400">{p.salary_month}</td>
                    <td className="py-4 px-4 text-right">₹{parseFloat(p.basic_salary).toLocaleString('en-IN')}</td>
                    <td className="py-4 px-4 text-right text-emerald-400 font-semibold">+₹{parseFloat(p.incentive_amount).toLocaleString('en-IN')}</td>
                    <td className="py-4 px-4 text-right text-rose-400 font-semibold">
                      -₹{(parseFloat(p.advance_amount) + parseFloat(p.deduction_amount)).toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-4 text-right font-extrabold text-white">₹{parseFloat(p.net_amount).toLocaleString('en-IN')}</td>
                    <td className="py-4 px-4 text-right font-semibold text-emerald-400">₹{parseFloat(p.paid_amount).toLocaleString('en-IN')}</td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        p.status === 'paid'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleDeleteSalary(p.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
                        title="Delete Record"
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

      {/* Modal: Add/Edit Driver */}
      {showDriverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">
                {editingDriver ? 'Edit Driver' : 'Add New Driver'}
              </h3>
              <button
                onClick={() => setShowDriverModal(false)}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDriver} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1 block">Driver Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Patel"
                    value={driverForm.name}
                    onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1 block">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +91 9876543210"
                    value={driverForm.phone}
                    onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1 block">Monthly Salary (₹)</label>
                  <input
                    type="number"
                    value={driverForm.monthly_salary}
                    onChange={(e) => setDriverForm({ ...driverForm, monthly_salary: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1 block">Joining Date</label>
                  <input
                    type="date"
                    required
                    value={driverForm.joining_date}
                    onChange={(e) => setDriverForm({ ...driverForm, joining_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1 block">Commission Type</label>
                  <select
                    value={driverForm.commission_type}
                    onChange={(e) => setDriverForm({ ...driverForm, commission_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                  >
                    <option value="fixed_per_fera">Fixed per Fera</option>
                    <option value="per_ton">Per Ton</option>
                    <option value="percentage">Percentage (%)</option>
                    <option value="manual">Manual Entry</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-amber-400 mb-1 block">Commission Value (₹)</label>
                  <input
                    type="number"
                    value={driverForm.commission_value}
                    onChange={(e) => setDriverForm({ ...driverForm, commission_value: e.target.value })}
                    className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-4 py-2.5 text-sm font-bold text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1 block">Address</label>
                <input
                  type="text"
                  placeholder="e.g. Village Bodeli, Vadodara"
                  value={driverForm.address}
                  onChange={(e) => setDriverForm({ ...driverForm, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDriverModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all"
                >
                  {saving ? 'Saving...' : editingDriver ? 'Update Driver' : 'Add Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Generate Salary Record */}
      {showSalaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Generate Monthly Salary</h3>
              <button
                onClick={() => setShowSalaryModal(false)}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSalary} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1 block">Select Driver *</label>
                <select
                  value={salaryForm.driver_id}
                  onChange={(e) => {
                    const sel = drivers.find((d) => d.id === e.target.value);
                    setSalaryForm({ 
                      ...salaryForm, 
                      driver_id: e.target.value,
                      basic_salary: sel ? sel.monthly_salary : 25000
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                >
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.phone})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1 block">Salary Month (YYYY-MM)</label>
                  <input
                    type="month"
                    required
                    value={salaryForm.salary_month}
                    onChange={(e) => setSalaryForm({ ...salaryForm, salary_month: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1 block">Basic Salary (₹)</label>
                  <input
                    type="number"
                    required
                    value={salaryForm.basic_salary}
                    onChange={(e) => setSalaryForm({ ...salaryForm, basic_salary: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-emerald-400 mb-1 block">Trip Incentive (₹)</label>
                  <input
                    type="number"
                    value={salaryForm.incentive_amount}
                    onChange={(e) => setSalaryForm({ ...salaryForm, incentive_amount: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-rose-400 mb-1 block">Advance/Deduction (₹)</label>
                  <input
                    type="number"
                    value={salaryForm.advance_amount}
                    onChange={(e) => setSalaryForm({ ...salaryForm, advance_amount: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-amber-400 mb-1 block">Amount Paid (₹)</label>
                  <input
                    type="number"
                    value={salaryForm.paid_amount}
                    onChange={(e) => setSalaryForm({ ...salaryForm, paid_amount: e.target.value })}
                    className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-4 py-2.5 text-sm font-bold text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1 block">Payment Status</label>
                  <select
                    value={salaryForm.status}
                    onChange={(e) => setSalaryForm({ ...salaryForm, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                  >
                    <option value="paid">Paid</option>
                    <option value="partially_paid">Partially Paid</option>
                    <option value="calculated">Calculated / Unpaid</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSalaryModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all"
                >
                  {saving ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
