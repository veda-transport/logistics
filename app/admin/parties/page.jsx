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
  X, 
  RefreshCw, 
  Download, 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle2, 
  FileText, 
  Building2, 
  Sparkles,
  FileDown
} from 'lucide-react';
import { supabase, getActiveOrgId } from '@/lib/supabase';
import { generatePartyBillPDF } from '@/lib/feraPdf';

export default function PartiesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [generatingBillPartyId, setGeneratingBillPartyId] = useState(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingParty, setEditingParty] = useState(null);
  const [saving, setSaving] = useState(false);

  const initialForm = {
    name: '',
    phone: '',
    email: '',
    address: '',
    contact_person: '',
    gst_number: '',
    status: 'active',
    notes: '',
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
          .from('parties')
          .select('*')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (!ignore) {
          setParties(data || []);
        }
      } catch (err) {
        console.error('Error fetching parties:', err);
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
    if (!form.name.trim() || !form.phone.trim()) {
      alert('Please enter party name and contact phone.');
      return;
    }

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
          .eq('id', editingParty.id)
          .eq('organization_id', orgId);

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
      setForm(initialForm);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert('Error saving party: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${name}?`)) return;
    try {
      const { error } = await supabase.from('parties').delete().eq('id', id);
      if (error) throw error;
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert('Error deleting party: ' + err.message);
    }
  };

  const openAdd = () => {
    setEditingParty(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const openEdit = (party) => {
    setEditingParty(party);
    setForm({
      name: party.name || '',
      phone: party.phone || '',
      email: party.email || '',
      address: party.address || '',
      contact_person: party.contact_person || '',
      gst_number: party.gst_number || '',
      status: party.status || 'active',
      notes: party.notes || '',
    });
    setShowModal(true);
  };

  const handleDownloadPartyBill = async (party) => {
    try {
      setGeneratingBillPartyId(party.id);
      const orgId = await getActiveOrgId();
      if (!orgId) return;

      const { data: partyFeras, error } = await supabase
        .from('feras')
        .select(`
          *,
          from_location:locations!feras_from_location_id_fkey(id, name, city),
          to_location:locations!feras_to_location_id_fkey(id, name, city),
          trucks(id, truck_number, truck_type),
          materials(id, name, unit)
        `)
        .eq('organization_id', orgId)
        .eq('party_id', party.id)
        .order('fera_date', { ascending: false });

      if (error) throw error;

      if (!partyFeras || partyFeras.length === 0) {
        alert(`No trip records found for ${party.name}.`);
        return;
      }

      await generatePartyBillPDF({
        party,
        feras: partyFeras,
        asOfDate: new Date(),
      });
    } catch (err) {
      console.error('Error generating party bill:', err);
      alert('Error generating PDF bill: ' + err.message);
    } finally {
      setGeneratingBillPartyId(null);
    }
  };

  const handleExportCSV = () => {
    if (filteredParties.length === 0) {
      alert('No parties match filter to export.');
      return;
    }

    const headers = ['Party Name', 'Phone', 'Email', 'Contact Person', 'GST Number', 'Address', 'Status', 'Created Date'];
    const rows = filteredParties.map((p) => [
      `"${p.name || ''}"`,
      `"${p.phone || ''}"`,
      `"${p.email || ''}"`,
      `"${p.contact_person || ''}"`,
      `"${p.gst_number || ''}"`,
      `"${(p.address || '').replace(/"/g, '""')}"`,
      p.status,
      new Date(p.created_at).toLocaleDateString()
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Veda_Transport_Parties_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Stats
  const totalCount = parties.length;
  const activeCount = parties.filter((p) => p.status === 'active').length;
  const inactiveCount = parties.filter((p) => p.status === 'inactive').length;

  // Filter
  const filteredParties = parties.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (p.name || '').toLowerCase().includes(term) ||
      (p.phone || '').toLowerCase().includes(term) ||
      (p.email || '').toLowerCase().includes(term) ||
      (p.gst_number || '').toLowerCase().includes(term) ||
      (p.contact_person || '').toLowerCase().includes(term);

    const matchesStatus = statusFilter === 'All' || p.status === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl text-slate-950 shadow-md shadow-amber-500/30">
              <Building2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Party Master & Clients</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage client billing profiles, GST information, contact details, and account ledgers.
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
            title="Export Parties to CSV"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Export CSV</span>
          </button>

          <Link
            href="/admin/parties/payments"
            className="px-3.5 py-2 rounded-xl bg-[#0c1220] hover:bg-[#131c33] border border-amber-500/25 text-amber-300 text-xs font-bold transition flex items-center gap-1.5"
          >
            <Receipt className="w-4 h-4" />
            <span>View Payments</span>
          </Link>

          <button
            onClick={openAdd}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/25 text-xs sm:text-sm transition-all hover:scale-[1.02] active:scale-[0.98] border border-amber-300/40 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Add New Party</span>
          </button>
        </div>
      </div>

      {/* Interactive Stat Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Parties */}
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
            <span className="text-[10px] sm:text-xs font-extrabold text-slate-400 uppercase tracking-widest">Total Clients</span>
            {statusFilter === 'All' && (
              <span className="text-[9px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded border border-amber-300">
                Active
              </span>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono mt-1">{totalCount}</div>
        </button>

        {/* Active Parties */}
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
            <span className="text-[10px] sm:text-xs font-extrabold text-emerald-400 uppercase tracking-widest">Active Accounts</span>
            {statusFilter === 'active' && (
              <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-400 text-slate-950 px-1.5 py-0.5 rounded border border-emerald-300">
                Active
              </span>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono mt-1">{activeCount}</div>
        </button>

        {/* Inactive Parties */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'inactive' ? 'All' : 'inactive')}
          className={`p-4 sm:p-5 rounded-3xl border text-left transition cursor-pointer relative overflow-hidden group shadow-lg col-span-2 sm:col-span-1 ${
            statusFilter === 'inactive'
              ? 'bg-rose-500/15 border-rose-400 ring-2 ring-rose-400/80 scale-[1.02]'
              : 'bg-[#0c1220]/90 border-rose-500/20 hover:border-rose-400/50 hover:bg-rose-500/5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-extrabold text-rose-400 uppercase tracking-widest">Inactive Accounts</span>
            {statusFilter === 'inactive' && (
              <span className="text-[9px] font-black uppercase tracking-wider bg-rose-400 text-slate-950 px-1.5 py-0.5 rounded border border-rose-300">
                Active
              </span>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-400 font-mono mt-1">{inactiveCount}</div>
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#0c1220]/90 p-3 rounded-2xl border border-amber-500/20 shadow-xl">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400/80" />
          <input
            type="text"
            placeholder="Search by party name, phone, GST, contact person..."
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
          <option value="inactive">Inactive ({inactiveCount})</option>
        </select>
      </div>

      {/* Content List */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-3 bg-[#0c1220]/60 rounded-3xl border border-amber-500/20">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          <p className="text-sm font-bold text-amber-200">Loading parties and clients...</p>
        </div>
      ) : filteredParties.length === 0 ? (
        <div className="p-12 text-center bg-[#0c1220]/60 border border-dashed border-amber-500/30 rounded-3xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">No parties found</h3>
            <p className="text-xs text-slate-400 mt-1">Add your client profiles to record dispatches and track billing.</p>
          </div>
          <button
            onClick={openAdd}
            className="inline-block px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black rounded-xl transition-all cursor-pointer shadow-md shadow-amber-500/20"
          >
            + Create First Party
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Cards View */}
          <div className="block md:hidden space-y-3">
            {filteredParties.map((party) => (
              <div
                key={party.id}
                className="p-4 bg-[#0c1220]/95 backdrop-blur-md border border-amber-500/20 rounded-2xl shadow-xl space-y-3"
              >
                <div className="flex items-center justify-between border-b border-amber-500/15 pb-2.5">
                  <div>
                    <span className="text-sm font-black text-white block">{party.name}</span>
                    {party.contact_person && (
                      <span className="text-[11px] text-amber-400/90 font-medium">
                        Contact: {party.contact_person}
                      </span>
                    )}
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      party.status === 'active'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {party.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{party.phone}</span>
                  </div>
                  {party.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{party.email}</span>
                    </div>
                  )}
                  {party.gst_number && (
                    <div className="text-[11px] font-mono text-amber-300/80 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 inline-block">
                      GST: {party.gst_number}
                    </div>
                  )}
                  {party.address && (
                    <div className="flex items-start gap-2 text-slate-400 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{party.address}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-500/10">
                  <button
                    onClick={() => handleDownloadPartyBill(party)}
                    disabled={generatingBillPartyId === party.id}
                    className="px-2.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    title="Download Party Bill / Statement (PDF)"
                  >
                    {generatingBillPartyId === party.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    ) : (
                      <FileDown className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                    )}
                    <span>Bill PDF</span>
                  </button>
                  <button
                    onClick={() => openEdit(party)}
                    className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(party.id, party.name)}
                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-xl transition cursor-pointer"
                    title="Delete Party"
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
                    <th className="py-4 px-4">Party / Client</th>
                    <th className="py-4 px-4">Contact Info</th>
                    <th className="py-4 px-4">GST Number</th>
                    <th className="py-4 px-4">Address / City</th>
                    <th className="py-4 px-4 text-center">Status</th>
                    <th className="py-4 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-500/10">
                  {filteredParties.map((party) => (
                    <tr key={party.id} className="hover:bg-[#131c33]/60 transition-colors">
                      <td className="py-4 px-4">
                        <span className="font-extrabold text-white block">{party.name}</span>
                        {party.contact_person && (
                          <span className="text-xs text-amber-400/90 font-medium">
                            Attn: {party.contact_person}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-mono text-slate-200 block">{party.phone}</span>
                        {party.email && <span className="text-xs text-slate-400 block">{party.email}</span>}
                      </td>
                      <td className="py-4 px-4 font-mono text-xs">
                        {party.gst_number ? (
                          <span className="bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/20">
                            {party.gst_number}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-300 max-w-xs truncate">
                        {party.address || '-'}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            party.status === 'active'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {party.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleDownloadPartyBill(party)}
                            disabled={generatingBillPartyId === party.id}
                            className="p-2 text-emerald-400 hover:text-white hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl transition-all cursor-pointer"
                            title="Download Party Bill / Statement (PDF)"
                          >
                            {generatingBillPartyId === party.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                            ) : (
                              <FileDown className="w-4 h-4 stroke-[2.5]" />
                            )}
                          </button>
                          <button
                            onClick={() => openEdit(party)}
                            className="p-2 text-amber-400 hover:text-white hover:bg-amber-500/20 rounded-xl transition-all cursor-pointer"
                            title="Edit Party"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(party.id, party.name)}
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
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
        </>
      )}

      {/* Modal for Add / Edit Party */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0c1220] border border-amber-500/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
              <h2 className="text-xl font-black text-white">
                {editingParty ? 'Edit Party Profile' : 'Add New Client / Party'}
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
                <label className="text-xs font-bold text-amber-300 block mb-1">Company / Party Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UltraTech Cement Ltd"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-amber-300 block mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-amber-300 block mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Sharma"
                    value={form.contact_person}
                    onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                    className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-amber-300 block mb-1">GST Number</label>
                  <input
                    type="text"
                    placeholder="24AAAAA0000A1Z5"
                    value={form.gst_number}
                    onChange={(e) => setForm({ ...form, gst_number: e.target.value.toUpperCase() })}
                    className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white font-mono uppercase focus:outline-none focus:border-amber-400"
                  />
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
              </div>

              <div>
                <label className="text-xs font-bold text-amber-300 block mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="billing@company.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-amber-300 block mb-1">Billing Address & Notes</label>
                <textarea
                  rows={2}
                  placeholder="City, State, Pin Code..."
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
                  <span>{editingParty ? 'Update Party' : 'Save Party'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
