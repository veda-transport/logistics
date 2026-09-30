'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Receipt, 
  Edit3, 
  Trash2, 
  Loader2, 
  Users, 
  X 
} from 'lucide-react';
import { supabase, getActiveOrgId } from '@/lib/supabase';

export default function PartiesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingParty, setEditingParty] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    contact_person: '',
    gst_number: '',
    status: 'active',
    notes: '',
  });

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        const orgId = await getActiveOrgId();
        if (!orgId || ignore) return;

        const { data, error } = await supabase
          .from('parties')
          .select('*')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (!ignore) {
          setParties(data || []);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching parties:', err);
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
      if (editingParty) {
        const { error } = await supabase
          .from('parties')
          .update({
            name: form.name.trim(),
            phone: form.phone.trim(),
            email: form.email.trim() || null,
            address: form.address,
            contact_person: form.contact_person,
            gst_number: form.gst_number.trim() || null,
            status: form.status,
            notes: form.notes,
          })
          .eq('id', editingParty.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('parties').insert([
          {
            organization_id: orgId,
            name: form.name.trim(),
            phone: form.phone.trim(),
            email: form.email.trim() || null,
            address: form.address,
            contact_person: form.contact_person,
            gst_number: form.gst_number.trim() || null,
            status: form.status,
            notes: form.notes,
          },
        ]);

        if (error) throw error;
      }

      setShowModal(false);
      setEditingParty(null);
      setForm({
        name: '',
        phone: '',
        email: '',
        address: '',
        contact_person: '',
        gst_number: '',
        status: 'active',
        notes: '',
      });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert('Error saving party: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      const { error } = await supabase.from('parties').delete().eq('id', id);
      if (error) throw error;
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert('Error deleting party: ' + err.message);
    }
  };

  const openEdit = (party) => {
    setEditingParty(party);
    setForm({
      name: party.name,
      phone: party.phone,
      email: party.email || '',
      address: party.address || '',
      contact_person: party.contact_person || '',
      gst_number: party.gst_number || '',
      status: party.status,
      notes: party.notes || '',
    });
    setShowModal(true);
  };

  const filtered = parties.filter((p) =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.contact_person?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Parties & Customers</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Manage clients, billing contacts, GST details, and outstanding balances.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingParty(null);
              setForm({
                name: '',
                phone: '',
                email: '',
                address: '',
                contact_person: '',
                gst_number: '',
                status: 'active',
                notes: '',
              });
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 text-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Party</span>
          </button>
          <Link
            href="/admin/parties/payments"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold rounded-xl border border-slate-700 text-sm transition-all"
          >
            <Receipt className="w-4 h-4" />
            <span>Record Payment</span>
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search party by name or contact person..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-sm">Loading parties from Supabase...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No parties found</h3>
            <p className="text-xs text-slate-400 mt-1">Add client parties to start logging trips and payments.</p>
          </div>
          <button
            onClick={() => {
              setEditingParty(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all"
          >
            + Add First Party
          </button>
        </div>
      ) : (
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/70 text-[11px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Party Name</th>
                  <th className="py-3.5 px-4">Contact Person</th>
                  <th className="py-3.5 px-4">Phone / Email</th>
                  <th className="py-3.5 px-4">GST Number</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((party) => (
                  <tr key={party.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4">
                      <span className="font-bold text-white block">{party.name}</span>
                      <span className="text-xs text-slate-500">{party.address || 'No address'}</span>
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-200">
                      {party.contact_person || '-'}
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-mono text-xs text-amber-400 block">{party.phone}</span>
                      {party.email && <span className="text-xs text-slate-400">{party.email}</span>}
                    </td>
                    <td className="py-4 px-4 font-mono text-xs text-slate-300">
                      {party.gst_number || '-'}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        party.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {party.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(party)}
                          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-all"
                          title="Edit Party"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(party.id, party.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all"
                          title="Delete Party"
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
      )}

      {/* Modal: Add/Edit Party */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">
                {editingParty ? 'Edit Party' : 'Add New Party'}
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
                <label className="text-xs font-semibold text-slate-400 mb-1 block">Party / Business Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ABC Construction Pvt Ltd"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1 block">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +91 9876543210"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1 block">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Patel"
                    value={form.contact_person}
                    onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1 block">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="e.g. contact@abc.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1 block">GST Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 24AAAAA0000A1Z5"
                    value={form.gst_number}
                    onChange={(e) => setForm({ ...form, gst_number: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1 block">Address / City</label>
                <input
                  type="text"
                  placeholder="e.g. Ring Road, Surat"
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
                  {saving ? 'Saving...' : editingParty ? 'Update Party' : 'Add Party'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
