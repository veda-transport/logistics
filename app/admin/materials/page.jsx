'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Loader2, 
  Package, 
  X,
  RefreshCw,
  Download,
  Search,
  CheckCircle2,
  Sparkles,
  Layers
} from 'lucide-react';
import { supabase, getActiveOrgId } from '@/lib/supabase';

export default function MaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [unitFilter, setUnitFilter] = useState('All');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingMat, setEditingMat] = useState(null);
  const [saving, setSaving] = useState(false);

  const initialForm = {
    name: '',
    unit: 'ton',
    description: '',
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
          .from('materials')
          .select('*')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (!ignore) {
          setMaterials(data || []);
        }
      } catch (err) {
        console.error('Error fetching materials:', err);
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
    if (!form.name.trim()) {
      alert('Please enter a material name.');
      return;
    }

    setSaving(true);
    try {
      const orgId = await getActiveOrgId();
      if (editingMat) {
        const { error } = await supabase
          .from('materials')
          .update({
            name: form.name.trim(),
            unit: form.unit,
            description: form.description,
            status: form.status,
          })
          .eq('id', editingMat.id)
          .eq('organization_id', orgId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('materials').insert([
          {
            organization_id: orgId,
            name: form.name.trim(),
            unit: form.unit,
            description: form.description,
            status: form.status,
          },
        ]);

        if (error) throw error;
      }

      setShowModal(false);
      setEditingMat(null);
      setForm(initialForm);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert('Error saving material: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete material ${name}?`)) return;
    try {
      const { error } = await supabase.from('materials').delete().eq('id', id);
      if (error) throw error;
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert('Error deleting material: ' + err.message);
    }
  };

  const openAdd = () => {
    setEditingMat(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const openEdit = (mat) => {
    setEditingMat(mat);
    setForm({
      name: mat.name || '',
      unit: mat.unit || 'ton',
      description: mat.description || '',
      status: mat.status || 'active',
    });
    setShowModal(true);
  };

  const handleExportCSV = () => {
    if (filteredMaterials.length === 0) {
      alert('No materials to export.');
      return;
    }

    const headers = ['Material Name', 'Measurement Unit', 'Description', 'Status'];
    const rows = filteredMaterials.map((m) => [
      `"${m.name}"`,
      m.unit,
      `"${m.description || ''}"`,
      m.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const uri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = uri;
    link.download = `Veda_Materials_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  // Stats
  const totalCount = materials.length;
  const tonCount = materials.filter((m) => m.unit === 'ton').length;
  const brassCount = materials.filter((m) => m.unit === 'brass').length;
  const otherCount = materials.filter((m) => m.unit !== 'ton' && m.unit !== 'brass').length;

  // Filter
  const filteredMaterials = materials.filter((m) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (m.name || '').toLowerCase().includes(term) ||
      (m.description || '').toLowerCase().includes(term);

    const matchesUnit = unitFilter === 'All' || m.unit === unitFilter.toLowerCase();
    return matchesSearch && matchesUnit;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl text-slate-950 shadow-md shadow-amber-500/30">
              <Package className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Materials Master</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure bulk transport cargo items (Sand, Gravel, Fly Ash, Aggregate, Cement, Coal) and measurement units.
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
            <span>+ Add Material</span>
          </button>
        </div>
      </div>

      {/* Interactive Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Materials */}
        <button
          type="button"
          onClick={() => setUnitFilter('All')}
          className={`p-4 sm:p-5 rounded-3xl border text-left transition cursor-pointer relative overflow-hidden group shadow-lg ${
            unitFilter === 'All'
              ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/80 scale-[1.02]'
              : 'bg-[#0c1220]/90 border-amber-500/20 hover:border-amber-400/50 hover:bg-amber-500/5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-extrabold text-slate-400 uppercase tracking-widest">Total Materials</span>
            {unitFilter === 'All' && (
              <span className="text-[9px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded border border-amber-300">
                Active
              </span>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono mt-1">{totalCount}</div>
        </button>

        {/* Ton Units */}
        <button
          type="button"
          onClick={() => setUnitFilter(unitFilter === 'ton' ? 'All' : 'ton')}
          className={`p-4 sm:p-5 rounded-3xl border text-left transition cursor-pointer relative overflow-hidden group shadow-lg ${
            unitFilter === 'ton'
              ? 'bg-emerald-500/15 border-emerald-400 ring-2 ring-emerald-400/80 scale-[1.02]'
              : 'bg-[#0c1220]/90 border-emerald-500/20 hover:border-emerald-400/50 hover:bg-emerald-500/5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-extrabold text-emerald-400 uppercase tracking-widest">Ton Measured</span>
            {unitFilter === 'ton' && (
              <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-400 text-slate-950 px-1.5 py-0.5 rounded border border-emerald-300">
                Active
              </span>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono mt-1">{tonCount}</div>
        </button>

        {/* Brass Units */}
        <button
          type="button"
          onClick={() => setUnitFilter(unitFilter === 'brass' ? 'All' : 'brass')}
          className={`p-4 sm:p-5 rounded-3xl border text-left transition cursor-pointer relative overflow-hidden group shadow-lg ${
            unitFilter === 'brass'
              ? 'bg-yellow-500/15 border-yellow-400 ring-2 ring-yellow-400/80 scale-[1.02]'
              : 'bg-[#0c1220]/90 border-yellow-500/20 hover:border-yellow-400/50 hover:bg-yellow-500/5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-extrabold text-yellow-400 uppercase tracking-widest">Brass Measured</span>
            {unitFilter === 'brass' && (
              <span className="text-[9px] font-black uppercase tracking-wider bg-yellow-400 text-slate-950 px-1.5 py-0.5 rounded border border-yellow-300">
                Active
              </span>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-yellow-400 font-mono mt-1">{brassCount}</div>
        </button>

        {/* Other Units */}
        <div className="p-4 sm:p-5 rounded-3xl border border-amber-500/20 bg-[#0c1220]/90 shadow-lg text-left">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-extrabold text-amber-400 uppercase tracking-widest">Trips / Bags</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">{otherCount}</div>
        </div>
      </div>

      {/* Search and Unit Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#0c1220]/90 p-3 rounded-2xl border border-amber-500/20 shadow-xl">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400/80" />
          <input
            type="text"
            placeholder="Search material name, description..."
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
          value={unitFilter}
          onChange={(e) => setUnitFilter(e.target.value)}
          className="w-full sm:w-auto bg-[#070b14] border border-amber-500/25 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-amber-300 font-bold focus:outline-none focus:border-amber-400 cursor-pointer"
        >
          <option value="All">All Units ({totalCount})</option>
          <option value="ton">Tons ({tonCount})</option>
          <option value="brass">Brass ({brassCount})</option>
          <option value="kg">Kilograms</option>
          <option value="bag">Bags</option>
          <option value="trip">Per Trip</option>
        </select>
      </div>

      {/* Content List */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-3 bg-[#0c1220]/60 rounded-3xl border border-amber-500/20">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          <p className="text-sm font-bold text-amber-200">Loading materials...</p>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="p-12 text-center bg-[#0c1220]/60 border border-dashed border-amber-500/30 rounded-3xl space-y-4">
          <Package className="w-12 h-12 mx-auto text-amber-400/80" />
          <h3 className="text-base font-black text-white">No materials found</h3>
          <button
            onClick={openAdd}
            className="inline-block px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20"
          >
            + Create First Material
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="block md:hidden space-y-3">
            {filteredMaterials.map((mat) => (
              <div
                key={mat.id}
                className="p-4 bg-[#0c1220]/95 backdrop-blur-md border border-amber-500/20 rounded-2xl shadow-xl space-y-2.5"
              >
                <div className="flex items-center justify-between border-b border-amber-500/15 pb-2">
                  <span className="text-base font-black text-white">{mat.name}</span>
                  <span className="bg-amber-500/15 text-amber-300 font-extrabold uppercase text-[10px] px-2 py-0.5 rounded-lg border border-amber-500/30">
                    Unit: {mat.unit}
                  </span>
                </div>
                {mat.description && (
                  <p className="text-xs text-slate-300">{mat.description}</p>
                )}
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-amber-500/10">
                  <button
                    onClick={() => openEdit(mat)}
                    className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(mat.id, mat.name)}
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
                    <th className="py-4 px-4">Material Name</th>
                    <th className="py-4 px-4">Default Measurement Unit</th>
                    <th className="py-4 px-4">Description / Specs</th>
                    <th className="py-4 px-4 text-center">Status</th>
                    <th className="py-4 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-500/10">
                  {filteredMaterials.map((mat) => (
                    <tr key={mat.id} className="hover:bg-[#131c33]/60 transition-colors">
                      <td className="py-4 px-4 font-black text-white">{mat.name}</td>
                      <td className="py-4 px-4">
                        <span className="capitalize bg-amber-500/10 text-amber-300 px-2.5 py-1 rounded-lg border border-amber-500/20 text-xs font-bold">
                          {mat.unit}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-300 max-w-sm truncate">{mat.description || '-'}</td>
                      <td className="py-4 px-4 text-center">
                        <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold">
                          {mat.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEdit(mat)}
                            className="p-2 text-amber-400 hover:text-white hover:bg-amber-500/20 rounded-xl transition-all cursor-pointer"
                            title="Edit Material"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(mat.id, mat.name)}
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                            title="Delete Material"
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

      {/* Modal: Add / Edit Material */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0c1220] border border-amber-500/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
              <h2 className="text-xl font-black text-white">
                {editingMat ? `Edit Material (${editingMat.name})` : 'Add New Material'}
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
                <label className="text-xs font-bold text-amber-300 block mb-1">Material Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. River Sand, Black Trap Gravel, Fly Ash"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-amber-300 block mb-1">Measurement Unit</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="ton">Ton</option>
                    <option value="brass">Brass</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="bag">Bag</option>
                    <option value="trip">Per Trip</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-amber-300 block mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-amber-300 block mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. 10mm / 20mm crushed stone aggregate"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
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
                  <span>{editingMat ? 'Update Material' : 'Save Material'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
