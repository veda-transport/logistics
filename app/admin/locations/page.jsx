'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Loader2, MapPin, X } from 'lucide-react';
import { supabase, getActiveOrgId } from '@/lib/supabase';

export default function LocationsPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingLoc, setEditingLoc] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    city: 'Bodeli',
    state: 'Gujarat',
    address: '',
    status: 'active',
  });

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
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
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching locations:', err);
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
          .eq('id', editingLoc.id);

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
      setForm({ name: '', city: 'Bodeli', state: 'Gujarat', address: '', status: 'active' });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert('Error saving location: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete location ${name}?`)) return;
    try {
      const { error } = await supabase.from('locations').delete().eq('id', id);
      if (error) throw error;
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert('Error deleting location: ' + err.message);
    }
  };

  const openEdit = (loc) => {
    setEditingLoc(loc);
    setForm({
      name: loc.name,
      city: loc.city,
      state: loc.state,
      address: loc.address || '',
      status: loc.status,
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Locations Master</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage trip source (From) and destination (To) locations.</p>
        </div>
        <button
          onClick={() => {
            setEditingLoc(null);
            setForm({ name: '', city: 'Bodeli', state: 'Gujarat', address: '', status: 'active' });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 text-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Location</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-sm">Loading locations...</p>
        </div>
      ) : locations.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No locations added yet</h3>
            <p className="text-xs text-slate-400 mt-1">Add locations like Bodeli, Surat, Vadodara, Bharuch.</p>
          </div>
          <button
            onClick={() => {
              setEditingLoc(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all"
          >
            + Add First Location
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {locations.map((loc) => (
            <div key={loc.id} className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl flex items-start justify-between gap-3 relative group">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 shrink-0 mt-0.5">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{loc.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{loc.city}, {loc.state}</p>
                  {loc.address && <p className="text-xs text-slate-500 mt-1">{loc.address}</p>}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => openEdit(loc)}
                  className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-all"
                  title="Edit Location"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(loc.id, loc.name)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all"
                  title="Delete Location"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add/Edit Location */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">
                {editingLoc ? 'Edit Location' : 'Add New Location'}
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
                <label className="text-xs font-semibold text-slate-400 mb-1 block">Location Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bodeli Quarry Depot"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1 block">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bodeli"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1 block">State</label>
                  <input
                    type="text"
                    required
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1 block">Address / Highway Landmark</label>
                <input
                  type="text"
                  placeholder="e.g. Near Toll Plaza, NH 48"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
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
                  {saving ? 'Saving...' : editingLoc ? 'Update Location' : 'Add Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
