'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Loader2, 
  Truck, 
  FileText,
  ArrowLeft,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Download,
  IndianRupee,
  Clock,
  CheckCircle,
  MapPin,
  Calendar,
  User,
  ShieldCheck,
  TrendingUp,
  Receipt,
  FileDown,
  Printer,
  CheckSquare,
  Square,
  Boxes,
  Filter,
  RotateCcw
} from 'lucide-react';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import { supabase, getActiveOrgId, getNextFeraNumber, getNextFeraGroupNumber, uploadFileToCloudinary, deleteFileFromStorage } from '@/lib/supabase';
import { generateSingleFeraPDF, generateFilteredFerasPDF, generateMultiFeraVouchersPDF, generatePartyBillPDF, sharePartyBillOnWhatsApp } from '@/lib/feraPdf';

const initialExpenses = [
  { expenseType: 'diesel', description: 'Diesel Filling', amount: '', quantity: '', rate: '', unit: 'litres' },
  { expenseType: 'material_purchase', description: 'Material Cost', amount: '', quantity: '', rate: '', unit: 'ton' },
  { expenseType: 'weighbridge', description: 'Weighbridge / Kanta', amount: '', quantity: null, rate: null, unit: null },
  { expenseType: 'driver_commission', description: 'Driver Commission', amount: '', quantity: null, rate: null, unit: null },
  { expenseType: 'toll', description: 'Toll Tax', amount: '', quantity: null, rate: null, unit: null },
];

export default function FerasPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [partyFilter, setPartyFilter] = useState('All');
  const [groupFilter, setGroupFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [generatingFilteredPartyBill, setGeneratingFilteredPartyBill] = useState(false);
  const [sharingFilteredPartyBill, setSharingFilteredPartyBill] = useState(false);
  const [sharingSelectedPartyBill, setSharingSelectedPartyBill] = useState(false);
  const [feras, setFeras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Row Multi-selection
  const [selectedFeraIds, setSelectedFeraIds] = useState([]);

  // Masters
  const [parties, setParties] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [locations, setLocations] = useState([]);
  const [feraGroups, setFeraGroups] = useState([]);

  // Quick Group Modal State
  const [showQuickGroupModal, setShowQuickGroupModal] = useState(false);
  const [quickGroupNumber, setQuickGroupNumber] = useState('FG-000001');
  const [quickGroupName, setQuickGroupName] = useState('');
  const [quickGroupSaving, setQuickGroupSaving] = useState(false);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingFera, setEditingFera] = useState(null);

  const initialFormState = {
    feraNumber: 'FR-000001',
    feraDate: new Date().toISOString().split('T')[0],
    partyId: '',
    feraGroupId: '',
    truckId: '',
    driverId: '',
    materialId: '',
    fromLocationId: '',
    toLocationId: '',
    rateUnit: '',
    agreedAmount: '',
    weight: '',
    weightUnit: 'ton',
    driverCommission: 0,
    status: 'in_progress',
    notes: '',
    documentUrl: '',
    documentName: '',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [expenses, setExpenses] = useState(initialExpenses);

  // Fetch List and Masters
  const fetchData = async () => {
    try {
      setLoading(true);
      const orgId = await getActiveOrgId();
      if (!orgId) return;

      const [ferasRes, pRes, tRes, dRes, mRes, lRes, gRes] = await Promise.all([
        supabase
          .from('feras')
          .select(`
            *,
            parties(id, name, phone, email, address, gst_number, contact_person),
            trucks(id, truck_number, truck_type),
            drivers(id, name, commission_value),
            materials(id, name, unit),
            from_location:locations!feras_from_location_id_fkey(id, name, city),
            to_location:locations!feras_to_location_id_fkey(id, name, city),
            fera_groups(id, group_number, name, status),
            fera_expenses(*),
            fera_documents(*)
          `)
          .eq('organization_id', orgId)
          .order('fera_date', { ascending: false }),
        supabase.from('parties').select('*').eq('organization_id', orgId),
        supabase.from('trucks').select('id, truck_number, truck_type').eq('organization_id', orgId).eq('status', 'active'),
        supabase.from('drivers').select('id, name, commission_value').eq('organization_id', orgId).eq('status', 'active'),
        supabase.from('materials').select('id, name, unit').eq('organization_id', orgId),
        supabase.from('locations').select('id, name, city').eq('organization_id', orgId),
        supabase.from('fera_groups').select('id, group_number, party_id, name, status').eq('organization_id', orgId).order('created_at', { ascending: false }),
      ]);

      setFeras(ferasRes.data || []);
      setParties(pRes.data || []);
      setTrucks(tRes.data || []);
      setDrivers(dRes.data || []);
      setMaterials(mRes.data || []);
      setLocations(lRes.data || []);
      setFeraGroups(gRes.data || []);
    } catch (err) {
      console.error('Error fetching feras data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- ACTIONS ---
  const handleAddNewClick = async () => {
    setEditingFera(null);
    let nextNum = 'FR-000001';
    try {
      nextNum = await getNextFeraNumber();
    } catch (e) {
      console.warn('Next Fera number error:', e);
    }

    const defaultDriver = drivers[0];
    const defaultComm = defaultDriver?.commission_value || 0;

    setFormData({
      ...initialFormState,
      feraNumber: nextNum,
      feraDate: new Date().toISOString().split('T')[0],
      partyId: parties[0]?.id || '',
      truckId: trucks[0]?.id || '',
      driverId: defaultDriver?.id || '',
      materialId: materials[0]?.id || '',
      fromLocationId: locations[0]?.id || '',
      toLocationId: locations[1]?.id || locations[0]?.id || '',
      driverCommission: defaultComm,
    });

    setExpenses(
      initialExpenses.map((exp) =>
        exp.expenseType === 'driver_commission' && defaultComm > 0
          ? { ...exp, amount: String(defaultComm) }
          : exp
      )
    );
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditClick = (item) => {
    setEditingFera(item);
    const primaryDoc = item.fera_documents?.[0];
    const itemWeight = parseFloat(item.weight) || 0;
    const itemAgreed = parseFloat(item.agreed_amount) || 0;
    const calcRateUnit = item.rate_unit || (itemWeight > 0 && itemAgreed > 0 ? (Math.round((itemAgreed / itemWeight) * 100) / 100) : '');

    setFormData({
      feraNumber: item.fera_number || '',
      feraDate: item.fera_date || '',
      partyId: item.party_id || '',
      feraGroupId: item.fera_group_id || '',
      truckId: item.truck_id || '',
      driverId: item.driver_id || '',
      materialId: item.material_id || '',
      fromLocationId: item.from_location_id || '',
      toLocationId: item.to_location_id || '',
      rateUnit: calcRateUnit ? String(calcRateUnit) : '',
      agreedAmount: item.agreed_amount || '',
      weight: item.weight || '',
      weightUnit: item.weight_unit || 'ton',
      driverCommission: 0,
      status: item.status || 'in_progress',
      notes: item.notes || '',
      documentUrl: primaryDoc?.file_url || '',
      documentName: primaryDoc?.file_name || '',
    });

    if (item.fera_expenses && item.fera_expenses.length > 0) {
      setExpenses(
        item.fera_expenses.map((exp) => ({
          expenseType: exp.expense_type || 'other',
          description: exp.description || '',
          amount: exp.amount || '',
          quantity: exp.quantity || null,
          rate: exp.rate || null,
          unit: exp.unit || null,
        }))
      );
    } else {
      setExpenses(initialExpenses);
    }

    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingFera(null);
    setFormData(initialFormState);
    setExpenses(initialExpenses);
  };

  const handleDelete = async (id, feraNumber) => {
    if (!window.confirm(`Are you sure you want to permanently delete trip ${feraNumber}?`)) return;
    try {
      setLoading(true);
      const targetFera = feras.find((f) => f.id === id);
      const docUrls = (targetFera?.fera_documents || []).map((d) => d.file_url).filter(Boolean);

      const { error } = await supabase.from('feras').delete().eq('id', id);
      if (error) throw error;

      // Delete attached files from storage to optimize storage space
      if (docUrls.length > 0) {
        deleteFileFromStorage(docUrls);
      }

      setFeras((prev) => prev.filter((f) => f.id !== id));
      setSelectedFeraIds((prev) => prev.filter((item) => item !== id));
    } catch (err) {
      alert('Error deleting trip: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const { error } = await supabase.from('feras').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      setFeras((prev) => prev.map((f) => (f.id === id ? { ...f, status: newStatus } : f)));
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  // --- EXPENSES LOGIC ---
  const handleExpenseChange = (index, field, value) => {
    const updated = [...expenses];
    updated[index][field] = value;
    if (field === 'quantity' || field === 'rate') {
      const q = parseFloat(field === 'quantity' ? value : updated[index].quantity) || 0;
      const r = parseFloat(field === 'rate' ? value : updated[index].rate) || 0;
      if (q > 0 && r > 0) {
        updated[index].amount = (q * r).toFixed(2);
      }
    }
    setExpenses(updated);
  };

  const addExpenseRow = () => {
    setExpenses([
      ...expenses,
      { expenseType: 'other', description: '', amount: '', quantity: null, rate: null, unit: null },
    ]);
  };

  const removeExpenseRow = (index) => {
    setExpenses(expenses.filter((_, i) => i !== index));
  };

  // --- FILE UPLOAD ---
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(true);
    try {
      const uploaded = await uploadFileToCloudinary(file, 'veda_transport/weight_slips');
      setFormData((prev) => ({
        ...prev,
        documentUrl: uploaded.url,
        documentName: uploaded.fileName,
      }));
    } catch (err) {
      console.error(err);
      alert('Upload failed: ' + (err.message || 'Please check the file and try again'));
    } finally {
      setUploadingDoc(false);
    }
  };

  // --- EXPORT CSV ---
  const handleExportCSV = () => {
    if (filteredFeras.length === 0) {
      alert('No trip data matches current filter to export.');
      return;
    }

    const headers = ['Fera Number', 'Date', 'Party', 'From Location', 'To Location', 'Material', 'Weight', 'Truck', 'Driver', 'Revenue (INR)', 'Expenses (INR)', 'Net Profit (INR)', 'Status'];
    const rows = filteredFeras.map((f) => {
      const rev = parseFloat(f.agreed_amount) || 0;
      const exp = (f.fera_expenses || []).reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
      const profit = rev - exp;
      return [
        `"${f.fera_number}"`,
        `"${f.fera_date}"`,
        `"${f.parties?.name || ''}"`,
        `"${f.from_location?.city || f.from_location?.name || ''}"`,
        `"${f.to_location?.city || f.to_location?.name || ''}"`,
        `"${f.materials?.name || ''}"`,
        `"${f.weight} ${f.weight_unit}"`,
        `"${f.trucks?.truck_number || ''}"`,
        `"${f.drivers?.name || ''}"`,
        rev,
        exp,
        profit,
        f.status
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Veda_Transport_Feras_${statusFilter}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Live Math calculations
  const totalAgreed = parseFloat(formData.agreedAmount) || 0;
  const totalExpenses = expenses.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const netProfit = totalAgreed - totalExpenses;
  const marginPercent = totalAgreed > 0 ? ((netProfit / totalAgreed) * 100).toFixed(1) : 0;

  // --- SUBMIT (ADD OR EDIT) ---
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.partyId || !formData.truckId || !formData.driverId || !formData.materialId || !formData.fromLocationId || !formData.toLocationId) {
      alert('Please select Party, Truck, Driver, Material, and From/To locations.');
      return;
    }

    setSaving(true);
    try {
      const orgId = await getActiveOrgId();

      const feraPayload = {
        organization_id: orgId,
        fera_number: formData.feraNumber.trim().toUpperCase(),
        fera_date: formData.feraDate,
        party_id: formData.partyId,
        fera_group_id: formData.feraGroupId || null,
        truck_id: formData.truckId,
        driver_id: formData.driverId,
        material_id: formData.materialId,
        from_location_id: formData.fromLocationId,
        to_location_id: formData.toLocationId,
        rate_unit: parseFloat(formData.rateUnit) || null,
        agreed_amount: totalAgreed,
        weight: parseFloat(formData.weight) || 0,
        weight_unit: formData.weightUnit,
        status: formData.status,
        notes: formData.notes,
      };

      let targetFeraId = editingFera?.id;

      if (editingFera) {
        // UPDATE existing Fera
        const { error: updateError } = await supabase
          .from('feras')
          .update({
            ...feraPayload,
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetFeraId)
          .eq('organization_id', orgId);

        if (updateError) throw updateError;
      } else {
        // INSERT new Fera
        const { data: newFera, error: insertError } = await supabase
          .from('feras')
          .insert([feraPayload])
          .select('id')
          .single();

        if (insertError) throw insertError;
        targetFeraId = newFera.id;
      }

      // Re-sync Expenses
      await supabase.from('fera_expenses').delete().eq('fera_id', targetFeraId);
      const validExpenses = expenses
        .filter((exp) => parseFloat(exp.amount) > 0)
        .map((exp) => ({
          organization_id: orgId,
          fera_id: targetFeraId,
          expense_type: exp.expenseType,
          description: exp.description || null,
          amount: parseFloat(exp.amount),
          quantity: exp.quantity ? parseFloat(exp.quantity) : null,
          rate: exp.rate ? parseFloat(exp.rate) : null,
          unit: exp.unit || null,
        }));

      if (validExpenses.length > 0) {
        const { error: expError } = await supabase.from('fera_expenses').insert(validExpenses);
        if (expError) console.error('Expenses sync error:', expError);
      }

      // Re-sync Weight Slip document and manage storage
      const oldDocUrl = editingFera?.fera_documents?.[0]?.file_url;
      if (formData.documentUrl) {
        // If document was replaced, delete old file from storage
        if (oldDocUrl && oldDocUrl !== formData.documentUrl) {
          deleteFileFromStorage(oldDocUrl);
        }

        const { data: existingDocs } = await supabase
          .from('fera_documents')
          .select('id')
          .eq('fera_id', targetFeraId);

        if (existingDocs && existingDocs.length > 0) {
          await supabase
            .from('fera_documents')
            .update({
              file_url: formData.documentUrl,
              file_name: formData.documentName || 'Weight Slip',
            })
            .eq('id', existingDocs[0].id);
        } else {
          await supabase.from('fera_documents').insert([
            {
              organization_id: orgId,
              fera_id: targetFeraId,
              document_type: 'weight_slip',
              file_url: formData.documentUrl,
              file_name: formData.documentName || 'Weight Slip',
            },
          ]);
        }
      } else if (oldDocUrl) {
        // Document was removed
        deleteFileFromStorage(oldDocUrl);
        await supabase.from('fera_documents').delete().eq('fera_id', targetFeraId);
      }

      setShowForm(false);
      setEditingFera(null);
      await fetchData();
    } catch (err) {
      alert('Error saving trip: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Stats calculation
  const totalCount = feras.length;
  const inProgressCount = feras.filter((f) => f.status === 'in_progress').length;
  const plannedCount = feras.filter((f) => f.status === 'planned').length;
  const completedCount = feras.filter((f) => f.status === 'completed').length;
  const totalRevenue = feras.reduce((acc, f) => acc + (parseFloat(f.agreed_amount) || 0), 0);
  const totalAllExpenses = feras.reduce((acc, f) => {
    return acc + (f.fera_expenses || []).reduce((sum, curr) => sum + (parseFloat(curr.amount) || 0), 0);
  }, 0);
  const totalNetProfit = totalRevenue - totalAllExpenses;

  // Available Fera Groups matching currently selected party
  const availableGroupsForFilter = feraGroups.filter((g) => {
    if (partyFilter === 'All') return true;
    return g.party_id === partyFilter;
  });

  // Filtered List
  const filteredFeras = feras.filter((item) => {
    const pName = item.parties?.name || '';
    const tNum = item.trucks?.truck_number || '';
    const dName = item.drivers?.name || '';
    const fNum = item.fera_number || '';
    const gNum = item.fera_groups?.group_number || '';
    const gName = item.fera_groups?.name || '';
    const fromCity = item.from_location?.city || item.from_location?.name || '';
    const toCity = item.to_location?.city || item.to_location?.name || '';

    const matchesSearch = 
      !searchTerm.trim() ||
      fNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fromCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      toCity.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter.toLowerCase();
    const matchesParty = partyFilter === 'All' || item.party_id === partyFilter;
    const matchesGroup = groupFilter === 'All' 
      ? true 
      : groupFilter === 'none' 
        ? !item.fera_group_id 
        : item.fera_group_id === groupFilter;
    const matchesDateFrom = !dateFrom || item.fera_date >= dateFrom;
    const matchesDateTo = !dateTo || item.fera_date <= dateTo;

    return matchesSearch && matchesStatus && matchesParty && matchesGroup && matchesDateFrom && matchesDateTo;
  });

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setPartyFilter('All');
    setGroupFilter('All');
    setDateFrom('');
    setDateTo('');
    setSelectedFeraIds([]);
  };

  const isFilterActive = searchTerm || statusFilter !== 'All' || partyFilter !== 'All' || groupFilter !== 'All' || dateFrom || dateTo;

  // Selection Logic
  const toggleSelectFera = (id) => {
    setSelectedFeraIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedFeraIds.length === filteredFeras.length && filteredFeras.length > 0) {
      setSelectedFeraIds([]);
    } else {
      setSelectedFeraIds(filteredFeras.map((f) => f.id));
    }
  };

  const isAllSelected = filteredFeras.length > 0 && selectedFeraIds.length === filteredFeras.length;
  const selectedFerasList = feras.filter((f) => selectedFeraIds.includes(f.id));

  // --- PDF HANDLERS ---
  const handleDownloadFilteredPDF = () => {
    if (filteredFeras.length === 0) {
      alert('No trips match current filters to export to PDF.');
      return;
    }
    generateFilteredFerasPDF(filteredFeras, {
      status: statusFilter,
      searchTerm: searchTerm.trim(),
    });
  };

  const handleDownloadSelectedStatementPDF = () => {
    if (selectedFerasList.length === 0) {
      alert('Please select at least one trip to download PDF.');
      return;
    }
    generateFilteredFerasPDF(
      selectedFerasList,
      { status: `${selectedFerasList.length} Trips Selected`, searchTerm: '' },
      'VEDA TRANSPORT',
      'SELECTED TRIPS STATEMENT'
    );
  };

  const handleDownloadSelectedVouchersPDF = () => {
    if (selectedFerasList.length === 0) {
      alert('Please select at least one trip to download vouchers.');
      return;
    }
    generateMultiFeraVouchersPDF(selectedFerasList);
  };

  const handleDownloadPartyBillForSelected = async () => {
    if (selectedFerasList.length === 0) {
      alert('Please select at least one trip to generate party bill.');
      return;
    }

    const firstFera = selectedFerasList[0];
    const targetPartyId = firstFera?.party_id;

    // Fetch complete party record from database
    let fullParty = parties.find((p) => p.id === targetPartyId);
    if ((!fullParty || !fullParty.address) && targetPartyId) {
      const { data: pData } = await supabase.from('parties').select('*').eq('id', targetPartyId).single();
      if (pData) fullParty = pData;
    }

    if (!fullParty && firstFera?.parties) {
      fullParty = firstFera.parties;
    }

    if (!fullParty) {
      fullParty = {
        name: firstFera?.parties?.name || 'Party Client',
        phone: '',
        address: '',
        gst_number: '',
      };
    }

    await generatePartyBillPDF({
      party: fullParty,
      feras: selectedFerasList,
      asOfDate: new Date(),
    });
  };

  // Generate Party Bill PDF for currently Filtered Trips (or Selected)
  const handleDownloadPartyBillForFiltered = async () => {
    const targetList = selectedFerasList.length > 0 ? selectedFerasList : filteredFeras;
    if (targetList.length === 0) {
      alert('No trips match current filters to generate bill.');
      return;
    }

    setGeneratingFilteredPartyBill(true);
    try {
      let targetPartyId = partyFilter !== 'All' ? partyFilter : null;
      if (!targetPartyId) {
        const uniqueParties = Array.from(new Set(targetList.map((f) => f.party_id).filter(Boolean)));
        if (uniqueParties.length === 1) {
          targetPartyId = uniqueParties[0];
        } else if (uniqueParties.length > 1) {
          alert('Current view contains trips for multiple parties. Please choose a specific Party from the Party filter dropdown to generate their bill.');
          setGeneratingFilteredPartyBill(false);
          return;
        }
      }

      if (!targetPartyId) {
        targetPartyId = targetList[0]?.party_id;
      }

      let fullParty = parties.find((p) => p.id === targetPartyId);
      if ((!fullParty || !fullParty.address) && targetPartyId) {
        const { data: pData } = await supabase.from('parties').select('*').eq('id', targetPartyId).single();
        if (pData) fullParty = pData;
      }

      if (!fullParty && targetList[0]?.parties) {
        fullParty = targetList[0].parties;
      }

      if (!fullParty) {
        fullParty = {
          name: targetList[0]?.parties?.name || 'Party Client',
          phone: '',
          address: '',
          gst_number: '',
        };
      }

      await generatePartyBillPDF({
        party: fullParty,
        feras: targetList,
        asOfDate: new Date(),
      });
    } catch (err) {
      console.error('Error generating party bill:', err);
      alert('Error generating PDF bill: ' + err.message);
    } finally {
      setGeneratingFilteredPartyBill(false);
    }
  };

  // WhatsApp Share Party Bill for Selected Trips
  const handleSharePartyBillForSelectedWhatsApp = async () => {
    if (selectedFerasList.length === 0) {
      alert('Please select at least one trip to share party bill.');
      return;
    }

    setSharingSelectedPartyBill(true);
    try {
      const firstFera = selectedFerasList[0];
      const targetPartyId = firstFera?.party_id;

      let fullParty = parties.find((p) => p.id === targetPartyId);
      if ((!fullParty || !fullParty.address) && targetPartyId) {
        const { data: pData } = await supabase.from('parties').select('*').eq('id', targetPartyId).single();
        if (pData) fullParty = pData;
      }

      if (!fullParty && firstFera?.parties) {
        fullParty = firstFera.parties;
      }

      if (!fullParty) {
        fullParty = {
          name: firstFera?.parties?.name || 'Party Client',
          phone: '',
          address: '',
          gst_number: '',
        };
      }

      await sharePartyBillOnWhatsApp({
        party: fullParty,
        feras: selectedFerasList,
        asOfDate: new Date(),
      });
    } catch (err) {
      console.error('Error sharing party bill on WhatsApp:', err);
      alert('Error sharing bill on WhatsApp: ' + err.message);
    } finally {
      setSharingSelectedPartyBill(false);
    }
  };

  // WhatsApp Share Party Bill for currently Filtered Trips (or Selected)
  const handleSharePartyBillForFilteredWhatsApp = async () => {
    const targetList = selectedFerasList.length > 0 ? selectedFerasList : filteredFeras;
    if (targetList.length === 0) {
      alert('No trips match current filters to share bill.');
      return;
    }

    setSharingFilteredPartyBill(true);
    try {
      let targetPartyId = partyFilter !== 'All' ? partyFilter : null;
      if (!targetPartyId) {
        const uniqueParties = Array.from(new Set(targetList.map((f) => f.party_id).filter(Boolean)));
        if (uniqueParties.length === 1) {
          targetPartyId = uniqueParties[0];
        } else if (uniqueParties.length > 1) {
          alert('Current view contains trips for multiple parties. Please select a specific Party in the filter dropdown to share their bill on WhatsApp.');
          setSharingFilteredPartyBill(false);
          return;
        }
      }

      if (!targetPartyId) {
        targetPartyId = targetList[0]?.party_id;
      }

      let fullParty = parties.find((p) => p.id === targetPartyId);
      if ((!fullParty || !fullParty.address) && targetPartyId) {
        const { data: pData } = await supabase.from('parties').select('*').eq('id', targetPartyId).single();
        if (pData) fullParty = pData;
      }

      if (!fullParty && targetList[0]?.parties) {
        fullParty = targetList[0].parties;
      }

      if (!fullParty) {
        fullParty = {
          name: targetList[0]?.parties?.name || 'Party Client',
          phone: '',
          address: '',
          gst_number: '',
        };
      }

      await sharePartyBillOnWhatsApp({
        party: fullParty,
        feras: targetList,
        asOfDate: new Date(),
      });
    } catch (err) {
      console.error('Error sharing party bill on WhatsApp:', err);
      alert('Error sharing bill on WhatsApp: ' + err.message);
    } finally {
      setSharingFilteredPartyBill(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ----------------- FORM VIEW (ADD OR EDIT) ----------------- */}
      {showForm ? (
        <form onSubmit={handleFormSubmit} className="space-y-6 max-w-5xl mx-auto">
          {/* Top Header Card */}
          <div className="p-4 sm:p-6 bg-[#0c1220]/95 backdrop-blur-xl border border-amber-500/30 rounded-3xl shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={cancelForm}
                className="p-2.5 bg-[#131c33] border border-amber-500/20 rounded-2xl text-amber-300 hover:text-white hover:bg-amber-500/10 transition-all cursor-pointer"
                title="Back to List"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {editingFera ? `Edit Fera (${editingFera.fera_number})` : 'Create New Fera (Trip)'}
                </h1>
                <p className="text-xs text-slate-400">
                  {editingFera 
                    ? 'Update trip dispatch details, expenses, and attached documents.' 
                    : 'Record trip dispatch, assign truck & driver, and log route expenses.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-auto">
              {editingFera && (
                <button
                  type="button"
                  onClick={() => generateSingleFeraPDF(editingFera)}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#131c33] border border-amber-500/40 hover:bg-amber-500/10 text-amber-300 font-bold rounded-xl text-xs sm:text-sm transition-all cursor-pointer shadow-sm"
                  title="Download Trip Slip PDF"
                >
                  <FileDown className="w-4 h-4 text-amber-400 stroke-[2.5]" />
                  <span>PDF Slip</span>
                </button>
              )}
              <button
                type="button"
                onClick={cancelForm}
                className="px-4 py-2.5 bg-[#131c33] border border-amber-500/20 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs sm:text-sm transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 sm:px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/25 text-xs sm:text-sm transition-all cursor-pointer border border-amber-300/30"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{editingFera ? 'Update Fera' : 'Save Fera'}</span>
              </button>
            </div>
          </div>

          {/* Live Profit Preview Banner (Goverdhan Haveli Style) */}
          <div className="p-5 sm:p-6 bg-[#0c1220]/90 backdrop-blur-xl border border-amber-500/30 rounded-3xl grid grid-cols-2 lg:grid-cols-4 gap-4 shadow-xl">
            <div className="p-3 bg-[#070b14]/60 rounded-2xl border border-amber-500/15">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Party Billing</span>
              <p className="text-lg sm:text-2xl font-black text-white mt-1">₹{totalAgreed.toLocaleString('en-IN')}</p>
            </div>
            <div className="p-3 bg-[#070b14]/60 rounded-2xl border border-rose-500/20">
              <span className="text-[10px] font-extrabold text-rose-400 uppercase tracking-widest block">Trip Expenses</span>
              <p className="text-lg sm:text-2xl font-black text-rose-400 mt-1">-₹{totalExpenses.toLocaleString('en-IN')}</p>
            </div>
            <div className="p-3 bg-[#070b14]/60 rounded-2xl border border-emerald-500/20">
              <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest block">Estimated Profit</span>
              <p className="text-lg sm:text-2xl font-black text-emerald-400 mt-1">₹{netProfit.toLocaleString('en-IN')}</p>
            </div>
            <div className="p-3 bg-[#070b14]/60 rounded-2xl border border-amber-500/20">
              <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest block">Net Margin</span>
              <p className="text-lg sm:text-2xl font-black text-amber-400 mt-1">{marginPercent}%</p>
            </div>
          </div>

          {/* 1. Trip Master Info */}
          <div className="bg-[#0c1220]/90 backdrop-blur-xl border border-amber-500/20 rounded-3xl p-5 sm:p-7 space-y-5 shadow-xl">
            <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black shadow-md shadow-amber-500/30">1</span>
              <span>Trip Dispatch & Master Assignment</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              <div>
                <label className="text-xs font-bold text-amber-300 mb-1.5 block">Fera Number *</label>
                <input
                  type="text"
                  required
                  value={formData.feraNumber}
                  onChange={(e) => setFormData({ ...formData, feraNumber: e.target.value })}
                  className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white font-mono uppercase focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-amber-300 mb-1.5 block">Fera Date *</label>
                <input
                  type="date"
                  required
                  value={formData.feraDate}
                  onChange={(e) => setFormData({ ...formData, feraDate: e.target.value })}
                  className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-amber-300 mb-1.5 block">Trip Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="in_progress">In Progress</option>
                  <option value="planned">Planned</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Party */}
              <div>
                <label className="text-xs font-bold text-amber-300 mb-1.5 block">Party / Client *</label>
                <select
                  required
                  value={formData.partyId}
                  onChange={(e) => setFormData({ ...formData, partyId: e.target.value, feraGroupId: '' })}
                  className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="">Select Party</option>
                  {parties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Fera Group (Optional Batch) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-amber-300 block">Fera Group (Batch / Order)</label>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!formData.partyId) {
                        alert('Please select a party first.');
                        return;
                      }
                      let nextGNum = 'FG-000001';
                      try {
                        nextGNum = await getNextFeraGroupNumber();
                      } catch {}
                      setQuickGroupNumber(nextGNum);
                      setQuickGroupName('');
                      setShowQuickGroupModal(true);
                    }}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New Group</span>
                  </button>
                </div>
                <select
                  value={formData.feraGroupId}
                  onChange={(e) => setFormData({ ...formData, feraGroupId: e.target.value })}
                  className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="">None (Direct Individual Trip)</option>
                  {feraGroups
                    .filter((g) => !formData.partyId || g.party_id === formData.partyId)
                    .map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.group_number} {g.name ? `• ${g.name}` : ''} ({g.status})
                      </option>
                    ))}
                </select>
              </div>

              {/* Truck */}
              <div>
                <label className="text-xs font-bold text-amber-300 mb-1.5 block">Assigned Truck *</label>
                <select
                  required
                  value={formData.truckId}
                  onChange={(e) => setFormData({ ...formData, truckId: e.target.value })}
                  className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:border-amber-400 focus:outline-none"
                >
                  <option value="">Select Truck</option>
                  {trucks.map((t) => (
                    <option key={t.id} value={t.id}>{t.truck_number} ({t.truck_type})</option>
                  ))}
                </select>
              </div>

              {/* Driver */}
              <div>
                <label className="text-xs font-bold text-amber-300 mb-1.5 block">Assigned Driver *</label>
                <select
                  required
                  value={formData.driverId}
                  onChange={(e) => {
                    const sel = drivers.find((d) => d.id === e.target.value);
                    const commVal = sel ? sel.commission_value : 0;
                    setFormData({ 
                      ...formData, 
                      driverId: e.target.value,
                      driverCommission: commVal
                    });
                    if (commVal > 0) {
                      setExpenses((prev) =>
                        prev.map((exp) =>
                          exp.expenseType === 'driver_commission' && (!exp.amount || parseFloat(exp.amount) === 0)
                            ? { ...exp, amount: String(commVal) }
                            : exp
                        )
                      );
                    }
                  }}
                  className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="">Select Driver</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 2. Route, Material & Revenue Details */}
          <div className="bg-[#0c1220]/90 backdrop-blur-xl border border-amber-500/20 rounded-3xl p-5 sm:p-7 space-y-5 shadow-xl">
            <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black shadow-md shadow-amber-500/30">2</span>
              <span>Route, Material & Revenue Billing</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              <div>
                <label className="text-xs font-bold text-amber-300 mb-1.5 block">From Location *</label>
                <select
                  required
                  value={formData.fromLocationId}
                  onChange={(e) => setFormData({ ...formData, fromLocationId: e.target.value })}
                  className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="">Select Origin</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>{l.name} ({l.city})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-amber-300 mb-1.5 block">To Location *</label>
                <select
                  required
                  value={formData.toLocationId}
                  onChange={(e) => setFormData({ ...formData, toLocationId: e.target.value })}
                  className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="">Select Destination</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>{l.name} ({l.city})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-amber-300 mb-1.5 block">Material *</label>
                <select
                  required
                  value={formData.materialId}
                  onChange={(e) => setFormData({ ...formData, materialId: e.target.value })}
                  className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="">Select Material</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-amber-300 mb-1.5 block">Weight (Tons) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 25.5"
                  value={formData.weight}
                  onChange={(e) => {
                    const wVal = e.target.value;
                    const w = parseFloat(wVal) || 0;
                    const r = parseFloat(formData.rateUnit) || 0;
                    const computedAgreed = (w > 0 && r > 0) ? (Math.round(w * r * 100) / 100).toString() : formData.agreedAmount;
                    setFormData({ ...formData, weight: wVal, agreedAmount: computedAgreed });
                  }}
                  className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-amber-300 mb-1.5 block">Rate per Unit (₹ / Ton)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 430"
                  value={formData.rateUnit}
                  onChange={(e) => {
                    const rVal = e.target.value;
                    const r = parseFloat(rVal) || 0;
                    const w = parseFloat(formData.weight) || 0;
                    const computedAgreed = (w > 0 && r > 0) ? (Math.round(w * r * 100) / 100).toString() : formData.agreedAmount;
                    setFormData({ ...formData, rateUnit: rVal, agreedAmount: computedAgreed });
                  }}
                  className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-black text-amber-400 block">Party Agreed Billing (₹ Revenue) *</label>
                  {formData.rateUnit && formData.weight ? (
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">
                      {formData.rateUnit} × {formData.weight}
                    </span>
                  ) : null}
                </div>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 50000"
                  value={formData.agreedAmount}
                  onChange={(e) => {
                    const aVal = e.target.value;
                    const a = parseFloat(aVal) || 0;
                    const w = parseFloat(formData.weight) || 0;
                    const computedRate = (a > 0 && w > 0) ? (Math.round((a / w) * 100) / 100).toString() : formData.rateUnit;
                    setFormData({ ...formData, agreedAmount: aVal, rateUnit: computedRate });
                  }}
                  className="w-full bg-[#070b14] border border-amber-400 rounded-xl px-4 py-2.5 text-base font-black text-white focus:ring-2 focus:ring-amber-400/50 focus:outline-none shadow-inner"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-4">
                <label className="text-xs font-bold text-slate-400 mb-1.5 block">Notes / Trip Remarks</label>
                <input
                  type="text"
                  placeholder="Optional remarks or handling instructions"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-[#070b14] border border-amber-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 3. Dynamic Fera Expenses */}
          <div className="bg-[#0c1220]/90 backdrop-blur-xl border border-amber-500/20 rounded-3xl p-5 sm:p-7 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-4">
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black shadow-md shadow-amber-500/30">3</span>
                  <span>Trip Expenses Breakdown</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Track diesel, toll, loading, and trip route costs</p>
              </div>
              <button
                type="button"
                onClick={addExpenseRow}
                className="flex items-center gap-1.5 text-xs font-extrabold text-amber-300 hover:text-white bg-amber-500/15 hover:bg-amber-500/25 px-4 py-2.5 rounded-xl border border-amber-500/30 transition-all cursor-pointer self-start sm:self-auto shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Expense Line</span>
              </button>
            </div>

            {/* Desktop Column Header */}
            <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-2 bg-[#070b14]/90 border border-amber-500/15 rounded-xl text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
              <div className="col-span-3">Expense Type</div>
              <div className="col-span-3">Remarks / Description</div>
              <div className="col-span-2">Quantity</div>
              <div className="col-span-2">Rate (₹)</div>
              <div className="col-span-2 text-right pr-9">Amount (₹)</div>
            </div>

            <div className="space-y-3">
              {expenses.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 sm:p-4 bg-[#070b14]/90 hover:bg-[#070b14] border border-amber-500/20 hover:border-amber-500/35 rounded-2xl grid grid-cols-1 sm:grid-cols-12 gap-3 items-center transition-all shadow-md"
                >
                  {/* Expense Type */}
                  <div className="sm:col-span-3">
                    <label className="text-[10px] font-extrabold text-amber-300 uppercase tracking-wider block mb-1 sm:hidden">
                      Expense Type
                    </label>
                    <select
                      value={item.expenseType}
                      onChange={(e) => handleExpenseChange(idx, 'expenseType', e.target.value)}
                      className="w-full bg-[#0d1425] border border-amber-500/30 focus:border-amber-400 rounded-xl px-3 py-2.5 text-xs font-bold text-amber-200 focus:outline-none transition-colors cursor-pointer"
                    >
                      <option value="diesel">Diesel</option>
                      <option value="material_purchase">Material Purchase</option>
                      <option value="weighbridge">Weighbridge</option>
                      <option value="driver_commission">Driver Commission</option>
                      <option value="toll">Toll Tax</option>
                      <option value="food">Food</option>
                      <option value="tea_water">Tea / Water</option>
                      <option value="puncture">Puncture</option>
                      <option value="repair">Repair</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-3">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1 sm:hidden">
                      Remarks / Description
                    </label>
                    <input
                      type="text"
                      placeholder="Optional remarks"
                      value={item.description}
                      onChange={(e) => handleExpenseChange(idx, 'description', e.target.value)}
                      className="w-full bg-[#0d1425] border border-amber-500/20 focus:border-amber-400 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1 sm:hidden">
                      Qty
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Qty"
                      value={item.quantity || ''}
                      onChange={(e) => handleExpenseChange(idx, 'quantity', e.target.value)}
                      className="w-full bg-[#0d1425] border border-amber-500/20 focus:border-amber-400 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>

                  {/* Rate */}
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1 sm:hidden">
                      Rate (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">₹</span>
                      <input
                        type="number"
                        step="any"
                        placeholder="Rate"
                        value={item.rate || ''}
                        onChange={(e) => handleExpenseChange(idx, 'rate', e.target.value)}
                        className="w-full bg-[#0d1425] border border-amber-500/20 focus:border-amber-400 rounded-xl pl-6 pr-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>

                  {/* Amount (₹) + Delete */}
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between gap-1.5">
                      <label className="text-[10px] font-extrabold text-rose-300 uppercase tracking-wider block sm:hidden">
                        Total Amount (₹)
                      </label>
                      <button
                        type="button"
                        onClick={() => removeExpenseRow(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer sm:hidden"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-rose-400 pointer-events-none">₹</span>
                        <input
                          type="number"
                          step="any"
                          placeholder="0.00"
                          value={item.amount}
                          onChange={(e) => handleExpenseChange(idx, 'amount', e.target.value)}
                          className="w-full bg-[#180d19] border border-rose-500/50 hover:border-rose-400 focus:border-rose-400 rounded-xl pl-6 pr-3 py-2.5 text-sm font-black text-rose-100 placeholder:text-rose-900/50 focus:outline-none focus:ring-1 focus:ring-rose-400/50 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-inner"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeExpenseRow(idx)}
                        className="hidden sm:flex p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 rounded-xl transition-all cursor-pointer shrink-0 border border-transparent hover:border-rose-500/20"
                        title="Remove row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Expenses Summary Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-amber-500/20 px-2 bg-[#070b14]/50 rounded-2xl p-3">
              <span className="text-xs font-bold text-slate-400">
                Active Expense Items: <strong className="text-white font-black">{expenses.filter(e => parseFloat(e.amount) > 0).length}</strong>
              </span>
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-extrabold uppercase text-rose-400 tracking-wider">Total Route Expenses:</span>
                <span className="text-base sm:text-lg font-black text-rose-200 bg-rose-500/20 px-3.5 py-1 rounded-xl border border-rose-500/30">
                  ₹{expenses.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Weight Slip Upload */}
          <div className="bg-[#0c1220]/90 backdrop-blur-xl border border-amber-500/20 rounded-3xl p-5 sm:p-7 space-y-4 shadow-xl">
            <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black shadow-md shadow-amber-500/30">4</span>
              <span>Weight Slip & Digital Documents</span>
            </h2>

            <div className="border-2 border-dashed border-amber-500/30 hover:border-amber-400 rounded-3xl p-6 text-center transition-all bg-[#070b14]/50">
              {formData.documentUrl ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-emerald-400 font-bold">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>Attached: {formData.documentName || 'Weight Slip'}</span>
                    <a
                      href={formData.documentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-amber-400 hover:underline bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20"
                    >
                      View Slip ↗
                    </a>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <label className="inline-block px-4 py-2 bg-[#131c33] hover:bg-slate-800 text-xs font-bold text-amber-300 rounded-xl cursor-pointer transition-all border border-amber-500/30">
                      {uploadingDoc ? 'Uploading...' : 'Replace Document'}
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, documentUrl: '', documentName: '' })}
                      className="px-3.5 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-bold rounded-xl border border-rose-500/20 transition-all cursor-pointer"
                    >
                      Remove Slip
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <UploadCloud className="w-10 h-10 mx-auto text-amber-400/80 mb-2" />
                  <p className="text-sm font-bold text-slate-200">
                    Upload Weight Slip / Kanta Pauti Image or PDF
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Securely stored and attached to this trip record</p>
                  <label className="mt-4 inline-block px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black rounded-xl cursor-pointer transition-all shadow-md shadow-amber-500/20 border border-amber-300/40">
                    {uploadingDoc ? 'Uploading document...' : 'Choose File to Upload'}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        </form>
      ) : (
        /* ----------------- TABLE & MOBILE CARDS VIEW ----------------- */
        <>
          {/* Header & Quick Action Bar (Goverdhan Haveli style) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl text-slate-950 shadow-md shadow-amber-500/30">
                  <Truck className="w-5 h-5 stroke-[2.5]" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Fera Management</h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Dispatch operations, route expenses, driver assignments, and live net profits.
              </p>
            </div>

            {/* Top Right Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={fetchData}
                className="p-2.5 rounded-xl bg-[#0c1220] hover:bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="Refresh Data"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {/* PDF Report (Filtered) */}
              <button
                onClick={handleDownloadFilteredPDF}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black transition shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer border border-amber-300/40"
                title="Download Filtered Trips PDF Report"
              >
                <FileDown className="w-4 h-4 stroke-[2.5]" />
                <span>PDF Report</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-extrabold transition shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
                title="Export Filtered Trips to CSV"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={handleAddNewClick}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/25 text-xs sm:text-sm transition-all hover:scale-[1.02] active:scale-[0.98] border border-amber-300/40 flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Add New Fera</span>
              </button>
            </div>
          </div>

          {/* Interactive Stat Cards Grid (Click to filter list, matching Goverdhan Haveli style) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {/* Total Trips */}
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
                <span className="text-[10px] sm:text-xs font-extrabold text-slate-400 uppercase tracking-widest">Total Trips</span>
                {statusFilter === 'All' && (
                  <span className="text-[9px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded border border-amber-300">
                    Active
                  </span>
                )}
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono mt-1">{totalCount}</div>
            </button>

            {/* In Progress */}
            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'in_progress' ? 'All' : 'in_progress')}
              className={`p-4 sm:p-5 rounded-3xl border text-left transition cursor-pointer relative overflow-hidden group shadow-lg ${
                statusFilter === 'in_progress'
                  ? 'bg-yellow-500/15 border-yellow-400 ring-2 ring-yellow-400/80 scale-[1.02]'
                  : 'bg-[#0c1220]/90 border-yellow-500/20 hover:border-yellow-400/50 hover:bg-yellow-500/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-extrabold text-yellow-400 uppercase tracking-widest">In Progress</span>
                {statusFilter === 'in_progress' && (
                  <span className="text-[9px] font-black uppercase tracking-wider bg-yellow-400 text-slate-950 px-1.5 py-0.5 rounded border border-yellow-300">
                    Active
                  </span>
                )}
              </div>
              <div className="text-2xl sm:text-3xl font-black text-yellow-400 font-mono mt-1">{inProgressCount}</div>
            </button>

            {/* Completed Trips */}
            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'completed' ? 'All' : 'completed')}
              className={`p-4 sm:p-5 rounded-3xl border text-left transition cursor-pointer relative overflow-hidden group shadow-lg ${
                statusFilter === 'completed'
                  ? 'bg-emerald-500/15 border-emerald-400 ring-2 ring-emerald-400/80 scale-[1.02]'
                  : 'bg-[#0c1220]/90 border-emerald-500/20 hover:border-emerald-400/50 hover:bg-emerald-500/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-extrabold text-emerald-400 uppercase tracking-widest">Completed</span>
                {statusFilter === 'completed' && (
                  <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-400 text-slate-950 px-1.5 py-0.5 rounded border border-emerald-300">
                    Active
                  </span>
                )}
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono mt-1">{completedCount}</div>
            </button>

            {/* Total Net Profit */}
            <div className="p-4 sm:p-5 rounded-3xl border border-amber-500/20 bg-[#0c1220]/90 shadow-lg text-left">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-extrabold text-amber-400 uppercase tracking-widest">Total Net Profit</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-1">₹{totalNetProfit.toLocaleString('en-IN')}</div>
            </div>
          </div>

          {/* Dynamic Multi-Dimensional Filter Bar */}
          <div className="bg-[#0c1220]/95 backdrop-blur-xl border border-amber-500/20 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-amber-500/10 pb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                  Filter Trips & Generate Bill
                </h3>
                {isFilterActive && (
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    Filtered ({filteredFeras.length} of {feras.length})
                  </span>
                )}
              </div>

              {/* Primary Filter-Wise Party Bill Generator Button */}
              <div className="flex items-center gap-2 flex-wrap">
                {isFilterActive && (
                  <button
                    onClick={handleResetFilters}
                    className="px-3 py-1.5 rounded-xl bg-[#131c33] hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                    title="Reset all filters"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Filters</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSharePartyBillForFilteredWhatsApp}
                  disabled={sharingFilteredPartyBill || filteredFeras.length === 0}
                  className="px-3.5 py-2 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] font-bold text-xs sm:text-sm rounded-xl border border-[#25D366]/35 shadow-lg shadow-emerald-950/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  title="Share Party Bill via WhatsApp for currently filtered trips"
                >
                  {sharingFilteredPartyBill ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#25D366]" />
                  ) : (
                    <WhatsAppIcon className="w-4 h-4 fill-[#25D366]" />
                  )}
                  <span>WhatsApp Bill</span>
                </button>

                <button
                  onClick={handleDownloadPartyBillForFiltered}
                  disabled={generatingFilteredPartyBill || filteredFeras.length === 0}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer border border-emerald-300/40 disabled:opacity-50"
                  title="Generate Official Party Dispatch Bill for currently filtered trips"
                >
                  {generatingFilteredPartyBill ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Receipt className="w-4 h-4 stroke-[2.5]" />
                  )}
                  <span>Party Bill PDF ({filteredFeras.length})</span>
                </button>
              </div>
            </div>

            {/* Filter Controls Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
              {/* 1. Search Box */}
              <div className="lg:col-span-1">
                <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                  Search Keyword
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-amber-400/80 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Fera #, Truck, Driver..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#070b14] border border-amber-500/25 focus:border-amber-400 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Client / Party Filter */}
              <div className="lg:col-span-1">
                <label className="text-[11px] font-extrabold text-amber-400 uppercase tracking-wider block mb-1">
                  Client / Party
                </label>
                <select
                  value={partyFilter}
                  onChange={(e) => {
                    const newParty = e.target.value;
                    setPartyFilter(newParty);
                    if (newParty !== 'All' && groupFilter !== 'All' && groupFilter !== 'none') {
                      const grp = feraGroups.find((g) => g.id === groupFilter);
                      if (grp && grp.party_id !== newParty) {
                        setGroupFilter('All');
                      }
                    }
                  }}
                  className="w-full bg-[#070b14] border border-amber-500/35 focus:border-amber-400 rounded-xl px-3 py-2 text-xs font-bold text-amber-200 focus:outline-none cursor-pointer"
                >
                  <option value="All">All Parties ({parties.length})</option>
                  {parties.map((p) => {
                    const tripCount = feras.filter((f) => f.party_id === p.id).length;
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} ({tripCount} {tripCount === 1 ? 'Trip' : 'Trips'})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* 3. Fera Group Filter */}
              <div className="lg:col-span-1">
                <label className="text-[11px] font-extrabold text-indigo-300 uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <Boxes className="w-3 h-3 text-indigo-400" />
                  <span>Fera Group</span>
                </label>
                <select
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value)}
                  className="w-full bg-[#070b14] border border-indigo-500/35 focus:border-indigo-400 rounded-xl px-3 py-2 text-xs font-bold text-indigo-200 focus:outline-none cursor-pointer"
                >
                  <option value="All">All Groups ({availableGroupsForFilter.length})</option>
                  <option value="none">-- Ungrouped (Single Feras) --</option>
                  {availableGroupsForFilter.map((g) => {
                    const grpTrips = feras.filter((f) => f.fera_group_id === g.id).length;
                    return (
                      <option key={g.id} value={g.id}>
                        {g.group_number} {g.name ? `(${g.name})` : ''} - {grpTrips} Trips
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* 4. Status Filter */}
              <div className="lg:col-span-1">
                <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-[#070b14] border border-amber-500/25 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="All">All Statuses ({totalCount})</option>
                  <option value="in_progress">In Progress ({inProgressCount})</option>
                  <option value="planned">Planned ({plannedCount})</option>
                  <option value="completed">Completed ({completedCount})</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* 5. Date Range (From - To) */}
              <div className="lg:col-span-1">
                <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                  Date Range
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-1/2 bg-[#070b14] border border-amber-500/25 focus:border-amber-400 rounded-xl px-2 py-1.5 text-[11px] text-white focus:outline-none"
                    title="From Date"
                  />
                  <span className="text-xs text-slate-500">-</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-1/2 bg-[#070b14] border border-amber-500/25 focus:border-amber-400 rounded-xl px-2 py-1.5 text-[11px] text-white focus:outline-none"
                    title="To Date"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Floating / Sticky Selected Feras Action Toolbar */}
          {selectedFeraIds.length > 0 && (
            <div className="sticky top-20 z-30 p-3.5 sm:p-4 bg-[#0c1220]/95 backdrop-blur-xl border-2 border-amber-500/50 rounded-2xl shadow-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs shadow-md shadow-amber-500/30">
                  {selectedFeraIds.length}
                </span>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-white">
                    {selectedFeraIds.length} {selectedFeraIds.length === 1 ? 'Trip' : 'Trips'} Selected
                  </h4>
                  <p className="text-[11px] text-slate-400">Generate report statement or download individual/batch trip slips</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSharePartyBillForSelectedWhatsApp}
                  disabled={sharingSelectedPartyBill}
                  className="px-3.5 py-2 bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/40 text-[#25D366] font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Share Party Bill for Selected Trips on WhatsApp"
                >
                  {sharingSelectedPartyBill ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#25D366]" />
                  ) : (
                    <WhatsAppIcon className="w-3.5 h-3.5 fill-[#25D366]" />
                  )}
                  <span>WhatsApp Bill</span>
                </button>

                <button
                  onClick={handleDownloadPartyBillForSelected}
                  className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer border border-emerald-300/40"
                  title="Download Official Party Dispatch Bill / Statement (PDF)"
                >
                  <Receipt className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Party Bill PDF</span>
                </button>

                <button
                  onClick={handleDownloadSelectedStatementPDF}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer border border-amber-300/40"
                  title="Download Summary Statement Table for Selected Trips"
                >
                  <FileText className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Selected Statement PDF</span>
                </button>

                <button
                  onClick={handleDownloadSelectedVouchersPDF}
                  className="px-3.5 py-2 bg-[#131c33] hover:bg-[#1a2542] border border-amber-500/40 text-amber-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Download Multi-page Slips (1 page per selected trip)"
                >
                  <FileDown className="w-3.5 h-3.5 text-amber-400 stroke-[2.5]" />
                  <span>Selected Slips PDF ({selectedFeraIds.length})</span>
                </button>

                <button
                  onClick={() => setSelectedFeraIds([])}
                  className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 text-xs rounded-xl transition-all cursor-pointer border border-slate-700"
                  title="Clear Selection"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Content Loading & Empty States */}
          {loading ? (
            <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-3 bg-[#0c1220]/60 rounded-3xl border border-amber-500/20">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              <p className="text-sm font-semibold text-amber-200">Loading trips and records...</p>
            </div>
          ) : filteredFeras.length === 0 ? (
            <div className="p-12 text-center bg-[#0c1220]/60 border border-dashed border-amber-500/30 rounded-3xl space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                <Truck className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">No feras / trips recorded yet</h3>
                <p className="text-xs text-slate-400 mt-1">Create your first trip dispatch to track revenue, expenses, and weight slips.</p>
              </div>
              <button
                onClick={handleAddNewClick}
                className="inline-block px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black rounded-xl transition-all cursor-pointer shadow-md shadow-amber-500/20"
              >
                + Create First Fera
              </button>
            </div>
          ) : (
            <>
              {/* ----------------- MOBILE CARDS LIST (block md:hidden) ----------------- */}
              <div className="block md:hidden space-y-3">
                {filteredFeras.map((item) => {
                  const rev = parseFloat(item.agreed_amount) || 0;
                  const exp = (item.fera_expenses || []).reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
                  const profit = rev - exp;
                  const doc = item.fera_documents?.[0];
                  const isSelected = selectedFeraIds.includes(item.id);

                  return (
                    <div 
                      key={item.id}
                      className={`p-4 bg-[#0c1220]/95 backdrop-blur-md rounded-2xl shadow-xl space-y-3 transition-all ${
                        isSelected ? 'border-2 border-amber-400 ring-1 ring-amber-400/50 bg-[#131c33]/90' : 'border border-amber-500/20'
                      }`}
                    >
                      {/* Top Row: Select Checkbox, Fera Number & Status */}
                      <div className="flex items-center justify-between border-b border-amber-500/15 pb-2.5">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectFera(item.id)}
                            className="w-4 h-4 rounded border-amber-500/30 bg-[#070b14] text-amber-500 focus:ring-amber-400 cursor-pointer accent-amber-500 shrink-0"
                          />
                          <div>
                            <span className="text-sm font-black text-white font-mono block">{item.fera_number}</span>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3 text-amber-400" />
                              <span>{item.fera_date}</span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {doc && (
                            <a
                              href={doc.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Slip</span>
                            </a>
                          )}
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            item.status === 'completed' 
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : item.status === 'in_progress'
                              ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      </div>

                      {/* Route & Material */}
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{item.from_location?.city || item.from_location?.name || '-'} → {item.to_location?.city || item.to_location?.name || '-'}</span>
                        </div>
                        <div className="text-slate-300 font-medium pl-5">
                          <span className="font-semibold text-white">{item.parties?.name || '-'}</span> • {item.materials?.name} ({item.weight} {item.weight_unit})
                        </div>
                        <div className="text-slate-400 text-[11px] pl-5 font-mono">
                          {item.trucks?.truck_number} • Driver: {item.drivers?.name || '-'}
                        </div>
                      </div>

                      {/* Financials Summary */}
                      <div className="p-2.5 bg-[#070b14]/80 rounded-xl border border-amber-500/15 grid grid-cols-3 gap-2 text-center text-xs">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Billing</span>
                          <span className="font-black text-white">₹{rev.toLocaleString('en-IN')}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-rose-400 uppercase block">Expenses</span>
                          <span className="font-bold text-rose-400">-₹{exp.toLocaleString('en-IN')}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-emerald-400 uppercase block">Profit</span>
                          <span className="font-black text-emerald-400">₹{profit.toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      {/* Mobile Actions Button Group */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.id, e.target.value)}
                          className="bg-[#070b14] border border-amber-500/30 text-[11px] font-bold rounded-xl px-2.5 py-1.5 text-amber-200 focus:outline-none"
                        >
                          <option value="in_progress">In Progress</option>
                          <option value="planned">Planned</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>

                        <div className="flex items-center gap-1.5">
                          {/* Single Fera PDF Slip */}
                          <button
                            onClick={() => generateSingleFeraPDF(item)}
                            className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                            title="Download PDF Slip"
                          >
                            <FileDown className="w-3.5 h-3.5 text-amber-400 stroke-[2.5]" />
                            <span>PDF</span>
                          </button>

                          <button
                            onClick={() => handleEditClick(item)}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => handleDelete(item.id, item.fera_number)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-xl transition cursor-pointer"
                            title="Delete Fera"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ----------------- DESKTOP TABLE VIEW (hidden md:block) ----------------- */}
              <div className="hidden md:block bg-[#0c1220]/95 backdrop-blur-xl border border-amber-500/20 rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-[#070b14]/90 text-[11px] uppercase font-black text-amber-400 tracking-wider border-b border-amber-500/20">
                      <tr>
                        <th className="py-4 px-3 text-center w-10">
                          <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 rounded border-amber-500/30 bg-[#070b14] text-amber-500 focus:ring-amber-400 cursor-pointer accent-amber-500"
                            title="Select All Filtered Trips"
                          />
                        </th>
                        <th className="py-4 px-4">Fera Details</th>
                        <th className="py-4 px-4">Party & Route</th>
                        <th className="py-4 px-4">Truck & Driver</th>
                        <th className="py-4 px-4 text-right">Agreed Revenue</th>
                        <th className="py-4 px-4 text-right">Trip Expenses</th>
                        <th className="py-4 px-4 text-right">Net Profit</th>
                        <th className="py-4 px-4 text-center">Status</th>
                        <th className="py-4 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-500/10">
                      {filteredFeras.map((item) => {
                        const revenue = parseFloat(item.agreed_amount) || 0;
                        const totalExp = (item.fera_expenses || []).reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
                        const profit = revenue - totalExp;
                        const doc = item.fera_documents?.[0];
                        const isSelected = selectedFeraIds.includes(item.id);

                        return (
                          <tr 
                            key={item.id} 
                            className={`transition-colors ${
                              isSelected ? 'bg-amber-500/10 hover:bg-amber-500/15' : 'hover:bg-[#131c33]/60'
                            }`}
                          >
                            <td className="py-4 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectFera(item.id)}
                                className="w-4 h-4 rounded border-amber-500/30 bg-[#070b14] text-amber-500 focus:ring-amber-400 cursor-pointer accent-amber-500"
                              />
                            </td>
                            <td className="py-4 px-4">
                              <span className="font-extrabold text-white block">{item.fera_number}</span>
                              <span className="text-xs text-slate-400">{item.fera_date}</span>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                {item.fera_groups && (
                                  <Link
                                    href={`/admin/fera-groups/detail?id=${item.fera_group_id}`}
                                    className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 px-2 py-0.5 rounded-md border border-amber-500/30 transition-all"
                                    title={`Group: ${item.fera_groups.group_number}`}
                                  >
                                    <Boxes className="w-3 h-3 text-amber-400" />
                                    <span>{item.fera_groups.group_number}</span>
                                  </Link>
                                )}
                                {doc && (
                                  <a
                                    href={doc.file_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:underline bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20"
                                  >
                                    <FileText className="w-3 h-3" />
                                    <span>Slip</span>
                                  </a>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="font-bold text-slate-100 block">{item.parties?.name || '-'}</span>
                              <span className="text-xs text-amber-400/90 font-semibold block">
                                {item.from_location?.city || item.from_location?.name || '-'} → {item.to_location?.city || item.to_location?.name || '-'}
                              </span>
                              <span className="text-xs text-slate-400 block">{item.materials?.name} ({item.weight} {item.weight_unit})</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="font-bold text-slate-200 block font-mono">{item.trucks?.truck_number}</span>
                              <span className="text-xs text-slate-400">{item.drivers?.name}</span>
                            </td>
                            <td className="py-4 px-4 text-right font-black text-white">
                              ₹{revenue.toLocaleString('en-IN')}
                            </td>
                            <td className="py-4 px-4 text-right font-bold text-rose-400">
                              -₹{totalExp.toLocaleString('en-IN')}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <span className="font-black text-emerald-400 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                ₹{profit.toLocaleString('en-IN')}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <select
                                value={item.status}
                                onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                className="bg-[#070b14] border border-amber-500/30 text-xs font-bold rounded-xl px-2.5 py-1.5 text-amber-200 cursor-pointer focus:outline-none"
                              >
                                <option value="in_progress">In Progress</option>
                                <option value="planned">Planned</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {/* Single Fera PDF Slip */}
                                <button
                                  onClick={() => generateSingleFeraPDF(item)}
                                  className="p-2 text-amber-400 hover:text-white hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 rounded-xl transition-all cursor-pointer"
                                  title="Download Fera Trip Slip (PDF)"
                                >
                                  <FileDown className="w-4 h-4 stroke-[2.5]" />
                                </button>

                                <button
                                  onClick={() => handleEditClick(item)}
                                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 rounded-xl transition-all cursor-pointer"
                                  title="Edit Fera"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id, item.fera_number)}
                                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-xl transition-all cursor-pointer"
                                  title="Delete Fera"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Quick Group Creation Modal */}
      {showQuickGroupModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-[#0c1220] border border-amber-500/30 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">Create New Fera Group</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickGroupModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!quickGroupNumber.trim() || !formData.partyId) {
                  alert('Please provide group number and select party.');
                  return;
                }

                setQuickGroupSaving(true);
                try {
                  const orgId = await getActiveOrgId();
                  const { data, error } = await supabase
                    .from('fera_groups')
                    .insert([
                      {
                        organization_id: orgId,
                        group_number: quickGroupNumber.trim().toUpperCase(),
                        party_id: formData.partyId,
                        name: quickGroupName.trim() || null,
                        status: 'open',
                      },
                    ])
                    .select('id, group_number, party_id, name, status')
                    .single();

                  if (error) throw error;

                  setFeraGroups((prev) => [data, ...prev]);
                  setFormData((prev) => ({ ...prev, feraGroupId: data.id }));
                  setShowQuickGroupModal(false);
                } catch (err) {
                  alert('Error creating group: ' + err.message);
                } finally {
                  setQuickGroupSaving(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-bold text-amber-300 mb-1.5 block">Group Number *</label>
                <input
                  type="text"
                  required
                  value={quickGroupNumber}
                  onChange={(e) => setQuickGroupNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. FG-000001"
                  className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-3.5 py-2 text-sm text-white font-mono uppercase focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-amber-300 mb-1.5 block">Batch / Requirement Name</label>
                <input
                  type="text"
                  value={quickGroupName}
                  onChange={(e) => setQuickGroupName(e.target.value)}
                  placeholder="e.g. October Material Requirement"
                  className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-3.5 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-amber-500/20">
                <button
                  type="button"
                  onClick={() => setShowQuickGroupModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white bg-[#131c33] rounded-xl border border-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={quickGroupSaving}
                  className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer"
                >
                  {quickGroupSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Create & Select Group</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
