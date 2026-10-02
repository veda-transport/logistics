'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Layers, 
  Edit3, 
  Trash2, 
  Loader2, 
  X, 
  RefreshCw, 
  FileDown, 
  Calendar, 
  Building2, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Truck,
  ArrowRight,
  Boxes,
  Eye,
  Filter
} from 'lucide-react';
import { supabase, getActiveOrgId, getNextFeraGroupNumber } from '@/lib/supabase';
import { generateFeraGroupBillPDF } from '@/lib/feraPdf';

export default function FeraGroupsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [partyFilter, setPartyFilter] = useState('All');
  const [groups, setGroups] = useState([]);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [generatingPdfGroupId, setGeneratingPdfGroupId] = useState(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [saving, setSaving] = useState(false);

  const initialForm = {
    group_number: 'FG-000001',
    party_id: '',
    group_date: new Date().toISOString().split('T')[0],
    name: '',
    description: '',
    status: 'open',
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

        const [groupsRes, ferasRes, partiesRes] = await Promise.all([
          supabase
            .from('fera_groups')
            .select(`
              *,
              parties(id, name, phone, address, gst_number)
            `)
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false }),
          supabase
            .from('feras')
            .select(`
              id,
              fera_group_id,
              fera_number,
              fera_date,
              status,
              weight,
              weight_unit,
              agreed_amount,
              rate_unit,
              advance_amount,
              extra_charges,
              deduction_amount,
              paid_amount,
              received_amount,
              materials(id, name, unit)
            `)
            .eq('organization_id', orgId),
          supabase
            .from('parties')
            .select('*')
            .eq('organization_id', orgId)
            .order('name', { ascending: true })
        ]);

        if (groupsRes.error) throw groupsRes.error;

        const ferasByGroup = {};
        (ferasRes.data || []).forEach((f) => {
          if (f.fera_group_id) {
            if (!ferasByGroup[f.fera_group_id]) ferasByGroup[f.fera_group_id] = [];
            ferasByGroup[f.fera_group_id].push(f);
          }
        });

        const combinedGroups = (groupsRes.data || []).map((g) => ({
          ...g,
          feras: ferasByGroup[g.id] || []
        }));

        if (!ignore) {
          setGroups(combinedGroups);
          setParties(partiesRes.data || []);
        }
      } catch (err) {
        console.error('Error fetching fera groups:', err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadData();
    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  const handleOpenAddModal = async () => {
    setEditingGroup(null);
    let nextNum = 'FG-000001';
    let partyList = parties;

    try {
      const orgId = await getActiveOrgId();
      if (orgId) {
        nextNum = await getNextFeraGroupNumber(orgId);
        if (partyList.length === 0) {
          const { data: pData } = await supabase
            .from('parties')
            .select('*')
            .eq('organization_id', orgId)
            .order('name', { ascending: true });
          if (pData && pData.length > 0) {
            partyList = pData;
            setParties(pData);
          }
        }
      }
    } catch (e) {
      console.warn('Next group number error:', e);
    }

    setForm({
      ...initialForm,
      group_number: nextNum,
      party_id: partyList[0]?.id || '',
      group_date: new Date().toISOString().split('T')[0],
    });
    setShowModal(true);
  };

  const handleOpenEditModal = async (group) => {
    setEditingGroup(group);
    if (parties.length === 0) {
      try {
        const orgId = await getActiveOrgId();
        if (orgId) {
          const { data: pData } = await supabase
            .from('parties')
            .select('*')
            .eq('organization_id', orgId)
            .order('name', { ascending: true });
          if (pData && pData.length > 0) {
            setParties(pData);
          }
        }
      } catch (e) {
        console.warn('Error fetching parties for edit modal:', e);
      }
    }

    setForm({
      group_number: group.group_number || '',
      party_id: group.party_id || '',
      group_date: group.group_date || new Date().toISOString().split('T')[0],
      name: group.name || '',
      description: group.description || '',
      status: group.status || 'open',
      notes: group.notes || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.group_number.trim() || !form.party_id) {
      alert('Please provide Group Number and select a Party.');
      return;
    }

    setSaving(true);
    try {
      const orgId = await getActiveOrgId();
      if (editingGroup) {
        const { error } = await supabase
          .from('fera_groups')
          .update({
            group_number: form.group_number.trim().toUpperCase(),
            party_id: form.party_id,
            group_date: form.group_date,
            name: form.name.trim() || null,
            description: form.description.trim() || null,
            status: form.status,
            notes: form.notes.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingGroup.id)
          .eq('organization_id', orgId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('fera_groups').insert([
          {
            organization_id: orgId,
            group_number: form.group_number.trim().toUpperCase(),
            party_id: form.party_id,
            group_date: form.group_date,
            name: form.name.trim() || null,
            description: form.description.trim() || null,
            status: form.status,
            notes: form.notes.trim() || null,
          },
        ]);

        if (error) throw error;
      }

      setShowModal(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error('Error saving fera group:', err);
      alert('Error saving Fera Group: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (group) => {
    const feraCount = group.feras?.length || 0;
    const msg = feraCount > 0
      ? `This group contains ${feraCount} feras. Deleting the group will unassign these feras. Are you sure?`
      : `Are you sure you want to delete ${group.group_number}?`;

    if (!window.confirm(msg)) return;

    try {
      const orgId = await getActiveOrgId();
      // 1. Unassign feras if any
      if (feraCount > 0) {
        await supabase
          .from('feras')
          .update({ fera_group_id: null })
          .eq('fera_group_id', group.id);
      }

      // 2. Delete group
      const { error } = await supabase
        .from('fera_groups')
        .delete()
        .eq('id', group.id)
        .eq('organization_id', orgId);

      if (error) throw error;
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert('Error deleting group: ' + err.message);
    }
  };

  const handleDownloadGroupPDF = async (group) => {
    try {
      setGeneratingPdfGroupId(group.id);
      const orgId = await getActiveOrgId();
      const party = group.parties || parties.find((p) => p.id === group.party_id);

      const { data: fullFeras, error } = await supabase
        .from('feras')
        .select(`
          *,
          trucks(id, truck_number, truck_type),
          drivers(id, name),
          materials(id, name, unit),
          from_location:locations!feras_from_location_id_fkey(id, name, city),
          to_location:locations!feras_to_location_id_fkey(id, name, city),
          fera_expenses(*)
        `)
        .eq('organization_id', orgId)
        .eq('fera_group_id', group.id)
        .order('fera_date', { ascending: true });

      if (error) throw error;

      await generateFeraGroupBillPDF({
        group,
        party,
        feras: fullFeras || [],
        asOfDate: new Date(),
      });
    } catch (err) {
      console.error('Error generating group PDF:', err);
      alert('Error generating Group PDF: ' + err.message);
    } finally {
      setGeneratingPdfGroupId(null);
    }
  };

  // Filter groups
  const filteredGroups = groups.filter((g) => {
    const matchesSearch =
      (g.group_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.parties?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.description || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || g.status === statusFilter;
    const matchesParty = partyFilter === 'All' || g.party_id === partyFilter;

    return matchesSearch && matchesStatus && matchesParty;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'settled':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Settled</span>;
      case 'completed':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">Completed</span>;
      case 'in_progress':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">In Progress</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-500/20 text-slate-300 border border-slate-500/30">Open</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0c1220] via-[#111a2e] to-[#0c1220] border border-amber-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
              <Boxes className="w-3.5 h-3.5" />
              <span>Trip Batch & Order Groups</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Fera Groups <span className="text-amber-400">Management</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-xl">
              Group client dispatch requirements together (e.g. 10 Reti + 10 Kapchi feras) under unique identifiers (FG-000001). Track batch completion, material counts, and generate dedicated Group Statement PDFs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="p-3 bg-[#131c33] border border-amber-500/20 hover:border-amber-500/40 text-slate-300 hover:text-white rounded-2xl transition-all cursor-pointer shadow-lg"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-amber-500/20 hover:shadow-amber-500/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create Fera Group</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#0c1220]/80 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by group number (FG-000001), party name, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#070b14] border border-amber-500/20 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Party Filter */}
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={partyFilter}
              onChange={(e) => setPartyFilter(e.target.value)}
              className="bg-[#070b14] border border-amber-500/20 rounded-xl px-3 py-2 text-xs font-bold text-white focus:border-amber-400 focus:outline-none"
            >
              <option value="All">All Parties</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#070b14] border border-amber-500/20 rounded-xl px-3 py-2 text-xs font-bold text-white focus:border-amber-400 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="settled">Settled</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Group Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#0c1220]/50 rounded-3xl border border-amber-500/10">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin mb-3" />
          <p className="text-slate-400 text-xs font-bold">Loading Fera Groups...</p>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-[#0c1220]/50 rounded-3xl border border-amber-500/10 text-center px-4">
          <Boxes className="w-12 h-12 text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No Fera Groups Found</h3>
          <p className="text-xs text-slate-400 max-w-md mb-5">
            {searchTerm || statusFilter !== 'All' || partyFilter !== 'All'
              ? 'No groups match your active search filters.'
              : 'Create your first Fera Group (e.g. FG-000001) to bundle multiple trips for client requirements.'}
          </p>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-slate-950 font-black text-xs rounded-xl hover:bg-amber-400 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create First Fera Group</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredGroups.map((group) => {
            const feras = group.feras || [];
            const feraCount = feras.length;

            let totalFreight = 0;
            let totalAdvance = 0;
            let totalCharges = 0;
            let totalDeductions = 0;
            let totalPayments = 0;
            let totalWeight = 0;

            // Material Map
            const matMap = {};

            feras.forEach((f) => {
              const freight = parseFloat(f.agreed_amount) || 0;
              const weight = parseFloat(f.weight) || 0;
              const adv = parseFloat(f.advance_amount) || 0;
              const chg = parseFloat(f.extra_charges) || 0;
              const ded = parseFloat(f.deduction_amount) || 0;
              const paid = parseFloat(f.paid_amount) || parseFloat(f.received_amount) || 0;

              totalFreight += freight;
              totalAdvance += adv;
              totalCharges += chg;
              totalDeductions += ded;
              totalPayments += paid;
              totalWeight += weight;

              const mName = f.materials?.name || 'Material';
              matMap[mName] = (matMap[mName] || 0) + 1;
            });

            const totalDue = Math.max(0, (totalFreight + totalCharges) - (totalAdvance + totalDeductions + totalPayments));

            return (
              <div
                key={group.id}
                className="bg-[#0c1220]/90 border border-amber-500/20 hover:border-amber-500/40 rounded-3xl p-5 sm:p-6 transition-all shadow-xl hover:shadow-2xl flex flex-col justify-between gap-5 relative overflow-hidden group/card"
              >
                <div className="space-y-4">
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-base sm:text-lg font-black font-mono text-amber-400">
                          {group.group_number}
                        </span>
                        {getStatusBadge(group.status)}
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{group.parties?.name || 'Client Party'}</span>
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDownloadGroupPDF(group)}
                        disabled={generatingPdfGroupId === group.id}
                        className="p-2.5 bg-[#131c33] hover:bg-[#1e293b] border border-blue-500/30 text-blue-400 hover:text-white rounded-xl transition-all cursor-pointer"
                        title="Download Fera Group PDF"
                      >
                        {generatingPdfGroupId === group.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                        ) : (
                          <FileDown className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(group)}
                        className="p-2.5 bg-[#131c33] hover:bg-[#1e293b] border border-amber-500/20 text-slate-300 hover:text-amber-300 rounded-xl transition-all cursor-pointer"
                        title="Edit Group"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(group)}
                        className="p-2.5 bg-[#131c33] hover:bg-rose-950/40 border border-rose-500/20 text-rose-400 hover:text-rose-300 rounded-xl transition-all cursor-pointer"
                        title="Delete Group"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Description / Requirement */}
                  {group.name || group.description ? (
                    <p className="text-xs text-slate-300 bg-[#070b14] border border-amber-500/10 rounded-xl px-3 py-2">
                      <span className="font-bold text-amber-400">Order/Req:</span> {group.name || group.description}
                    </p>
                  ) : null}

                  {/* Materials Tags */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400">Materials:</span>
                    {Object.keys(matMap).length > 0 ? (
                      Object.entries(matMap).map(([mName, count]) => (
                        <span
                          key={mName}
                          className="px-2 py-0.5 rounded-lg bg-[#131c33] border border-slate-700 text-slate-200 text-[11px] font-bold"
                        >
                          {mName} <span className="text-amber-400 font-mono">({count})</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">No feras assigned yet</span>
                    )}
                  </div>

                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                    <div className="bg-[#070b14] border border-amber-500/10 rounded-xl p-2.5">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Total Feras</p>
                      <p className="text-sm font-black text-white font-mono mt-0.5">{feraCount} Trips</p>
                    </div>

                    <div className="bg-[#070b14] border border-amber-500/10 rounded-xl p-2.5">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Total Weight</p>
                      <p className="text-sm font-black text-amber-400 font-mono mt-0.5">{totalWeight.toFixed(2)} Ton</p>
                    </div>

                    <div className="bg-[#070b14] border border-amber-500/10 rounded-xl p-2.5">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Total Freight</p>
                      <p className="text-sm font-black text-emerald-400 font-mono mt-0.5">₹{totalFreight.toLocaleString('en-IN')}</p>
                    </div>

                    <div className="bg-[#070b14] border border-amber-500/10 rounded-xl p-2.5">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Outstanding</p>
                      <p className="text-sm font-black text-rose-400 font-mono mt-0.5">₹{totalDue.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Detail Link */}
                <div className="pt-3 border-t border-amber-500/10 flex items-center justify-between gap-4">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>{new Date(group.group_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </span>

                  <Link
                    href={`/admin/fera-groups/detail?id=${group.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-black text-amber-400 hover:text-white bg-amber-500/10 hover:bg-amber-500/20 px-3.5 py-1.5 rounded-xl border border-amber-500/30 transition-all"
                  >
                    <span>View Group & Feras</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create / Edit Fera Group */}
      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-[#0c1220] border border-amber-500/30 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
              <div className="flex items-center gap-2.5">
                <Boxes className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-black text-white">
                  {editingGroup ? 'Edit Fera Group' : 'Create New Fera Group'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-amber-300 mb-1.5 block">Group Number *</label>
                  <input
                    type="text"
                    required
                    value={form.group_number}
                    onChange={(e) => setForm({ ...form, group_number: e.target.value.toUpperCase() })}
                    placeholder="e.g. FG-000001"
                    className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-3.5 py-2 text-sm text-white font-mono uppercase focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-amber-300 mb-1.5 block">Group Date *</label>
                  <input
                    type="date"
                    required
                    value={form.group_date}
                    onChange={(e) => setForm({ ...form, group_date: e.target.value })}
                    className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-3.5 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-amber-300 mb-1.5 block">Client / Party *</label>
                <select
                  required
                  value={form.party_id}
                  onChange={(e) => setForm({ ...form, party_id: e.target.value })}
                  className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-3.5 py-2 text-sm text-white focus:border-amber-400 focus:outline-none cursor-pointer"
                >
                  <option value="">-- Select Party --</option>
                  {parties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.phone ? `(${p.phone})` : ''}
                    </option>
                  ))}
                </select>
                {parties.length === 0 && (
                  <p className="text-[11px] text-rose-400 mt-1">
                    No parties found in Party Master. Please add parties first.
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-amber-300 mb-1.5 block">Requirement Name / Title</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. October Material Requirement (10 Reti + 10 Kapchi)"
                  className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-3.5 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-amber-300 mb-1.5 block">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-3.5 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="settled">Settled</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1.5 block">Notes / Details</label>
                  <input
                    type="text"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Optional notes"
                    className="w-full bg-[#070b14] border border-amber-500/20 rounded-xl px-3.5 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-amber-500/20">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white bg-[#131c33] rounded-xl border border-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{editingGroup ? 'Update Group' : 'Create Group'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
