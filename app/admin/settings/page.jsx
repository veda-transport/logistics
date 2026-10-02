'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  UploadCloud, 
  CheckCircle2, 
  Loader2, 
  Trash2, 
  FileText, 
  Phone, 
  Mail, 
  MapPin, 
  Save, 
  Sparkles,
  ArrowLeft,
  Image as ImageIcon
} from 'lucide-react';
import { 
  supabase, 
  getActiveOrgId, 
  getActiveOrganizationDetails, 
  clearOrganizationCache, 
  uploadFileToCloudinary, 
  deleteFileFromStorage 
} from '@/lib/supabase';

export default function CompanySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [form, setForm] = useState({
    name: 'VEDA TRANSPORT',
    legal_name: 'VEDA TRANSPORT LOGISTICS',
    phone: '+91 9978444414',
    email: 'vedatransport777@gmail.com',
    address: 'Desai Faliyu',
    city: 'Antorli, Kamrej',
    state: 'Gujarat',
    pincode: '394150',
    country: 'India',
    gst_number: '24AAAAA0000A1Z5',
    logo_url: '/truck_logo.jpg',
  });

  const [orgId, setOrgId] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function loadOrg() {
      try {
        setLoading(true);
        const resolvedOrgId = await getActiveOrgId();
        if (!resolvedOrgId || ignore) return;
        setOrgId(resolvedOrgId);

        const data = await getActiveOrganizationDetails();
        if (!ignore && data) {
          setForm({
            name: data.name || 'VEDA TRANSPORT',
            legal_name: data.legal_name || 'VEDA TRANSPORT LOGISTICS',
            phone: data.phone || '+91 9978444414',
            email: data.email || 'vedatransport777@gmail.com',
            address: data.address || 'Desai Faliyu',
            city: data.city || 'Antorli, Kamrej',
            state: data.state || 'Gujarat',
            pincode: data.pincode || '394150',
            country: data.country || 'India',
            gst_number: data.gst_number || '',
            logo_url: data.logo_url || '/truck_logo.jpg',
          });
        }
      } catch (err) {
        console.error('Error loading organization:', err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadOrg();
    return () => {
      ignore = true;
    };
  }, []);

  // Handle Logo Upload with Cloudinary
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      // If previous logo was uploaded to Cloudinary, remove it
      const previousLogo = form.logo_url;
      const uploaded = await uploadFileToCloudinary(file, 'veda_transport/company_logos');

      if (previousLogo && previousLogo.includes('cloudinary.com')) {
        deleteFileFromStorage(previousLogo);
      }

      setForm((prev) => ({
        ...prev,
        logo_url: uploaded.url,
      }));
    } catch (err) {
      console.error('Logo upload error:', err);
      alert('Logo upload failed: ' + (err.message || 'Please try again'));
    } finally {
      setUploadingLogo(false);
    }
  };

  // Remove Logo
  const handleRemoveLogo = () => {
    if (form.logo_url && form.logo_url.includes('cloudinary.com')) {
      deleteFileFromStorage(form.logo_url);
    }
    setForm((prev) => ({
      ...prev,
      logo_url: '',
    }));
  };

  // Save Settings to Supabase
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      alert('Please provide Company Name and Phone Number.');
      return;
    }

    setSaving(true);
    setSuccessMessage('');
    try {
      const activeId = orgId || (await getActiveOrgId());

      const payload = {
        name: form.name.trim(),
        legal_name: form.legal_name.trim() || null,
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        country: form.country.trim() || 'India',
        gst_number: form.gst_number.trim() || null,
        logo_url: form.logo_url || null,
        updated_at: new Date().toISOString(),
      };

      if (activeId) {
        const { error } = await supabase
          .from('organizations')
          .update(payload)
          .eq('id', activeId);

        if (error) throw error;
      } else {
        const { data: newOrg, error } = await supabase
          .from('organizations')
          .insert([payload])
          .select('id')
          .single();

        if (error) throw error;
        setOrgId(newOrg.id);
      }

      // Clear local cache so all PDF generators use the fresh data immediately
      clearOrganizationCache();
      setSuccessMessage('Company details and branding updated successfully!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Error saving organization settings:', err);
      alert('Error saving company details: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-3 bg-[#0c1220]/60 rounded-3xl border border-amber-500/20">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        <p className="text-sm font-bold text-amber-200">Loading company profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="p-4 sm:p-6 bg-[#0c1220]/95 backdrop-blur-xl border border-amber-500/30 rounded-3xl shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2.5 bg-[#131c33] border border-amber-500/20 rounded-2xl text-amber-300 hover:text-white hover:bg-amber-500/10 transition-all cursor-pointer"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Company Profile & PDF Branding</h1>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-xs text-slate-400">
              Manage your company information, address, logo, and contact info used in PDF bills & vouchers.
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/25 text-xs sm:text-sm transition-all hover:scale-[1.02] border border-amber-300/30 cursor-pointer self-end sm:self-auto"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 stroke-[2.5]" />}
          <span>Save Changes</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-300 text-sm font-bold shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Live PDF Header Preview */}
      <div className="p-5 sm:p-6 bg-[#0c1220]/90 backdrop-blur-xl border border-emerald-500/30 rounded-3xl space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-amber-500/15 pb-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Live PDF Header Preview</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Real-time PDF header appearance</span>
        </div>

        <div className="p-4 bg-white rounded-2xl shadow-inner text-slate-900 border border-slate-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Logo Preview */}
            <div className="w-20 h-16 rounded-xl border border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
              {form.logo_url ? (
                <img
                  src={form.logo_url}
                  alt="Company Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[10px] text-slate-400 font-bold text-center px-1">No Logo</span>
              )}
            </div>

            {/* Center Brand Name */}
            <div className="text-center">
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-950 uppercase font-sans">
                {form.name || 'VEDA TRANSPORT'}
              </h2>
              {form.legal_name && (
                <p className="text-[11px] text-slate-500 font-semibold">{form.legal_name}</p>
              )}
            </div>

            {/* Right Contact Info */}
            <div className="text-right text-[11px] text-slate-700 leading-tight">
              <p className="font-bold text-slate-900">{form.phone || '+91 9978444414'}</p>
              <p>{form.address || 'Desai Faliyu'}</p>
              <p>{form.city || 'Antorli, Kamrej'}</p>
              <p>{form.state || 'Gujarat'} - {form.pincode || '394150'}</p>
              {form.gst_number && <p className="font-mono text-[10px] font-bold text-slate-600 mt-0.5">GST: {form.gst_number}</p>}
            </div>
          </div>
          <div className="w-full h-1 bg-[#007A58] mt-3 rounded-full"></div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Logo Management */}
        <div className="bg-[#0c1220]/90 backdrop-blur-xl border border-amber-500/20 rounded-3xl p-5 sm:p-7 space-y-4 shadow-xl">
          <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black shadow-md shadow-amber-500/30">1</span>
            <span>Company Logo & Cloudinary Storage</span>
          </h2>

          <div className="border-2 border-dashed border-amber-500/30 hover:border-amber-400 rounded-3xl p-6 text-center transition-all bg-[#070b14]/50">
            {form.logo_url ? (
              <div className="space-y-3">
                <div className="w-24 h-20 mx-auto rounded-2xl overflow-hidden border border-amber-500/40 shadow-md">
                  <img
                    src={form.logo_url}
                    alt="Active Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <label className="inline-block px-4 py-2 bg-[#131c33] hover:bg-slate-800 text-xs font-bold text-amber-300 rounded-xl cursor-pointer transition-all border border-amber-500/30">
                    {uploadingLogo ? 'Uploading...' : 'Replace Logo Image'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="px-3.5 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-bold rounded-xl border border-rose-500/20 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Logo</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Replacing the logo automatically deletes previous files from Cloudinary storage.
                </p>
              </div>
            ) : (
              <div>
                <UploadCloud className="w-10 h-10 mx-auto text-amber-400/80 mb-2" />
                <p className="text-sm font-bold text-slate-200">
                  Upload Company Logo (PNG / JPG / WEBP)
                </p>
                <p className="text-xs text-slate-400 mt-1">This logo appears on all generated PDF bills, vouchers, and statements.</p>
                <label className="mt-4 inline-block px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black rounded-xl cursor-pointer transition-all shadow-md shadow-amber-500/20 border border-amber-300/40">
                  {uploadingLogo ? 'Uploading to Cloudinary...' : 'Choose Logo to Upload'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* 2. Company Identity & Contact */}
        <div className="bg-[#0c1220]/90 backdrop-blur-xl border border-amber-500/20 rounded-3xl p-5 sm:p-7 space-y-5 shadow-xl">
          <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black shadow-md shadow-amber-500/30">2</span>
            <span>Company Name, Contact & Tax Information</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            <div>
              <label className="text-xs font-bold text-amber-300 mb-1.5 block">Company / Brand Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-amber-300 mb-1.5 block">Legal Entity Name</label>
              <input
                type="text"
                value={form.legal_name}
                onChange={(e) => setForm({ ...form, legal_name: e.target.value })}
                className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-amber-300 mb-1.5 block">Contact Phone Number *</label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-amber-300 mb-1.5 block">Official Email Address *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-amber-300 mb-1.5 block">GSTIN / Tax ID</label>
              <input
                type="text"
                placeholder="e.g. 24AAAAA0000A1Z5"
                value={form.gst_number}
                onChange={(e) => setForm({ ...form, gst_number: e.target.value.toUpperCase() })}
                className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white font-mono uppercase focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-amber-300 mb-1.5 block">Country</label>
              <input
                type="text"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 3. Address & Regional Details */}
        <div className="bg-[#0c1220]/90 backdrop-blur-xl border border-amber-500/20 rounded-3xl p-5 sm:p-7 space-y-5 shadow-xl">
          <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black shadow-md shadow-amber-500/30">3</span>
            <span>Physical Address & Header Layout</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-amber-300 mb-1.5 block">Street Address / Society / Area *</label>
              <input
                type="text"
                required
                placeholder="e.g. Desai Faliyu"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-amber-300 mb-1.5 block">City / Taluka *</label>
              <input
                type="text"
                required
                placeholder="e.g. Antorli, Kamrej"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-amber-300 mb-1.5 block">State *</label>
              <input
                type="text"
                required
                placeholder="e.g. Gujarat"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-amber-300 mb-1.5 block">PIN Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. 394150"
                value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-amber-500/15 flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl shadow-xl shadow-amber-500/25 text-sm transition-all hover:scale-[1.02] border border-amber-300/30 cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 stroke-[2.5]" />}
              <span>Save Company Settings</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
