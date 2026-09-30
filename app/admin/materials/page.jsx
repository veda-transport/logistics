'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Loader2, Package, X } from 'lucide-react';
import { supabase, getActiveOrgId } from '@/lib/supabase';

export default function MaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingMat, setEditingMat] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    unit: 'ton',
    description: '',
    status: 'active',
  });

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
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
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching materials:', err);
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
          .eq('id', editingMat.id);

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
      setForm({ name: '', unit: 'ton', description: '', status: 'active' });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert('Error saving material: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      const { error } = await supabase.from('materials').delete().eq('id', id);
      if (error) throw error;
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert('Error deleting material: ' + err.message);
    }
  };

  const openEdit = (mat) => {
    setEditingMat(mat);
    setForm({
      name: mat.name,
      unit: mat.unit,
      description: mat.description || '',
      status: mat.status,
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Materials Master</h1>
          <p className="text-sm text-slate-400 mt-0.5">Define transport materials and default billing units.</p>
        </div>
        <button
          onClick={() => {
            setEditingMat(null);
            setForm({ name: '', unit: 'ton', description: '', status: 'active' });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 text-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Material</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-sm">Loading materials...</p>
        </div>
      ) : materials.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No materials created yet</h3>
            <p className="text-xs text-slate-400 mt-1">Add materials like Reti, Kapchi, Stone, or Cement.</p>
          </div>
          <button
            onClick={() => {
              setEditingMat(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all"
          >
            + Add First Material
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {materials.map((m) => (
            <div key={m.id} className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-3 relative group">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">{m.name}</h3>
                <span className="text-[11px] font-bold text-amber-400 uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Unit: {m.unit}
                </span>
              </div>
              <p className="text-xs text-slate-400 min-h-[32px]">{m.description || 'No description added'}</p>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  onClick={() => openEdit(m)}
                  className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-all"
                  title="Edit Material"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(m.id, m.name)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all"
                  title="Delete Material"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add/Edit Material */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">
                {editingMat ? 'Edit Material' : 'Add New Material'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1 block">Material Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Reti (River Sand)"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1 block">Measurement Unit</label>
                <select
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                >
                  <option value="ton">Ton</option>
                  <option value="kg">Kg</option>
                  <option value="piece">Piece</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1 block">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Fine river sand from Bodeli quarry"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all"
                >
                  {saving ? 'Saving...' : editingMat ? 'Update Material' : 'Add Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
