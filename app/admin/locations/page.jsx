'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Loader2, 
  MapPin, 
  X,
  RefreshCw,
  Download,
  Search,
  CheckCircle2,
  Building,
  Navigation
} from 'lucide-react';
import { supabase, getActiveOrgId } from '@/lib/supabase';

export default function LocationsPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingLoc, setEditingLoc] = useState(null);
  const [saving, setSaving] = useState(false);

  const initialForm = {
    name: '',
    city: 'Bodeli',
    state: 'Gujarat',
    address: '',
    status: 'active',
  };

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        setLoading(true);
        const orgId = await getActiveOrgId();
        if (!orgId || ignore) return;

        const { data, error } = await supabase
          .from('locations')
          .select('*')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (!ignore) {
          setLocations(data || []);
        }
      } catch (err) {
        console.error('Error fetching locations:', err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadData();
    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.city.trim()) {
      alert('Please enter location name and city.');
      return;
    }

    setSaving(true);
    try {
      const orgId = await getActiveOrgId();
      if (editingLoc) {
        const { error } = await supabase
          .from('locations')
          .update({
            name: form.name.trim(),
            city: form.city.trim(),
            state: form.state.trim(),
            address: form.address,
            status: form.status,
          })
          .eq('id', editingLoc.id)
          .eq('organization_id', orgId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('locations').insert([
          {
            organization_id: orgId,
            name: form.name.trim(),
            city: form.city.trim(),
            state: form.state.trim(),
            address: form.address,
            status: form.status,
          },
        ]);

        if (error) throw error;
      }

      setShowModal(false);
      setEditingLoc(null);
      setForm(initialForm);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert('Error saving location: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete location ${name}?`)) return;
    try {
      const { error } = await supabase.from('locations').delete().eq('id', id);
      if (error) throw error;
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert('Error deleting location: ' + err.message);
    }
  };

  const openAdd = () => {
    setEditingLoc(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const openEdit = (loc) => {
    setEditingLoc(loc);
    setForm({
      name: loc.name || '',
      city: loc.city || 'Bodeli',
      state: loc.state || 'Gujarat',
      address: loc.address || '',
      status: loc.status || 'active',
    });
    setShowModal(true);
  };

  const handleExportCSV = () => {
    if (filteredLocations.length === 0) {
      alert('No locations to export.');
      return;
    }

    const headers = ['Location Name', 'City', 'State', 'Full Address', 'Status'];
    const rows = filteredLocations.map((l) => [
      `"${l.name}"`,
      `"${l.city}"`,
      `"${l.state}"`,
      `"${(l.address || '').replace(/"/g, '""')}"`,
      l.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const uri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = uri;
    link.download = `Veda_Locations_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  // Stats
  const totalCount = locations.length;
  const activeCount = locations.filter((l) => l.status === 'active').length;
  const citiesCount = new Set(locations.map((l) => l.city)).size;

  // Filter
  const filteredLocations = locations.filter((loc) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (loc.name || '').toLowerCase().includes(term) ||
      (loc.city || '').toLowerCase().includes(term) ||
      (loc.state || '').toLowerCase().includes(term) ||
      (loc.address || '').toLowerCase().includes(term);

    const matchesStatus = statusFilter === 'All' || loc.status === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl text-slate-950 shadow-md shadow-amber-500/30">
              <MapPin className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Locations & Routes Master</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure loading mines, plant hubs, destination sites, weighbridges, and city routes.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
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

          <button
            onClick={openAdd}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/25 text-xs sm:text-sm transition-all hover:scale-[1.02] border border-amber-300/40 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Add Location</span>
          </button>
        </div>
      </div>

      {/* Interactive Stat Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Locations */}
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
            <span className="text-[10px] sm:text-xs font-extrabold text-slate-400 uppercase tracking-widest">Total Hubs</span>
            {statusFilter === 'All' && (
              <span className="text-[9px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded border border-amber-300">
                Active
              </span>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono mt-1">{totalCount}</div>
        </button>

        {/* Active Locations */}
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
            <span className="text-[10px] sm:text-xs font-extrabold text-emerald-400 uppercase tracking-widest">Active Hubs</span>
            {statusFilter === 'active' && (
              <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-400 text-slate-950 px-1.5 py-0.5 rounded border border-emerald-300">
                Active
              </span>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono mt-1">{activeCount}</div>
        </button>

        {/* Cities Count */}
        <div className="p-4 sm:p-5 rounded-3xl border border-amber-500/20 bg-[#0c1220]/90 shadow-lg text-left col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-extrabold text-amber-400 uppercase tracking-widest">Operating Cities</span>
            <Navigation className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">{citiesCount}</div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#0c1220]/90 p-3 rounded-2xl border border-amber-500/20 shadow-xl">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400/80" />
          <input
            type="text"
            placeholder="Search loading mine, plant, city or state..."
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
          <option value="All">All Statuses ({totalCount})</option>
          <option value="active">Active ({activeCount})</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Content List */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-3 bg-[#0c1220]/60 rounded-3xl border border-amber-500/20">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          <p className="text-sm font-bold text-amber-200">Loading locations...</p>
        </div>
      ) : filteredLocations.length === 0 ? (
        <div className="p-12 text-center bg-[#0c1220]/60 border border-dashed border-amber-500/30 rounded-3xl space-y-4">
          <MapPin className="w-12 h-12 mx-auto text-amber-400/80" />
          <h3 className="text-base font-black text-white">No locations found</h3>
          <button
            onClick={openAdd}
            className="inline-block px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20"
          >
            + Create First Location
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="block md:hidden space-y-3">
            {filteredLocations.map((loc) => (
              <div
                key={loc.id}
                className="p-4 bg-[#0c1220]/95 backdrop-blur-md border border-amber-500/20 rounded-2xl shadow-xl space-y-2.5"
              >
                <div className="flex items-center justify-between border-b border-amber-500/15 pb-2">
                  <div>
                    <span className="text-base font-black text-white block">{loc.name}</span>
                    <span className="text-xs text-amber-400 font-semibold">{loc.city}, {loc.state}</span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      loc.status === 'active'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {loc.status}
                  </span>
                </div>

                {loc.address && (
                  <p className="text-xs text-slate-300">{loc.address}</p>
                )}

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-amber-500/10">
                  <button
                    onClick={() => openEdit(loc)}
                    className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(loc.id, loc.name)}
                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-xl transition cursor-pointer"
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
                    <th className="py-4 px-4">Location Name</th>
                    <th className="py-4 px-4">City</th>
                    <th className="py-4 px-4">State</th>
                    <th className="py-4 px-4">Full Address / Landmark</th>
                    <th className="py-4 px-4 text-center">Status</th>
                    <th className="py-4 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-500/10">
                  {filteredLocations.map((loc) => (
                    <tr key={loc.id} className="hover:bg-[#131c33]/60 transition-colors">
                      <td className="py-4 px-4 font-black text-white">{loc.name}</td>
                      <td className="py-4 px-4 font-bold text-amber-300">{loc.city}</td>
                      <td className="py-4 px-4 text-slate-300">{loc.state}</td>
                      <td className="py-4 px-4 text-xs text-slate-400 max-w-sm truncate">{loc.address || '-'}</td>
                      <td className="py-4 px-4 text-center">
                        <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold">
                          {loc.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEdit(loc)}
                            className="p-2 text-amber-400 hover:text-white hover:bg-amber-500/20 rounded-xl transition-all cursor-pointer"
                            title="Edit Location"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(loc.id, loc.name)}
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                            title="Delete Location"
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

      {/* Modal: Add / Edit Location */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0c1220] border border-amber-500/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
              <h2 className="text-xl font-black text-white">
                {editingLoc ? `Edit Location (${editingLoc.name})` : 'Add New Location / Hub'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-[#131c33] border border-amber-500/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-amber-300 block mb-1">Hub / Plant / Mine Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UltraTech Cement Plant, Orsang River Bed"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-amber-300 block mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bodeli, Vadodara, Surat"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-amber-300 block mb-1">State</label>
                  <input
                    type="text"
                    placeholder="Gujarat"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-amber-300 block mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-amber-300 block mb-1">Full Address / Landmark Details</label>
                <textarea
                  rows={2}
                  placeholder="Near Highway 56, GIDC Area..."
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-amber-500/20">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
                  <span>{editingLoc ? 'Update Location' : 'Save Location'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
