'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Calculator, 
  ArrowLeft, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Fuel, 
  Truck, 
  DollarSign, 
  MapPin, 
  Users, 
  Package, 
  ShieldAlert, 
  ShieldCheck, 
  Copy, 
  Check, 
  Share2, 
  Plus, 
  Trash2, 
  RefreshCw, 
  ArrowRightLeft, 
  ArrowRight,
  Receipt,
  FileSpreadsheet,
  Layers,
  Percent,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import { supabase, getActiveOrgId } from '@/lib/supabase';
import { siteData } from '@/data/siteData';

export default function FeraProfitCalculatorPage() {
  const router = useRouter();

  // Masters
  const [parties, setParties] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loadingMasters, setLoadingMasters] = useState(true);

  // Core Trip Parameters
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [customPartyName, setCustomPartyName] = useState('');
  const [fromLocationId, setFromLocationId] = useState('');
  const [customFrom, setCustomFrom] = useState('');
  const [toLocationId, setToLocationId] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [selectedTruckId, setSelectedTruckId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [customMaterial, setCustomMaterial] = useState('');

  // Trip Distance & Route
  const [distanceKm, setDistanceKm] = useState('120');
  const [isRoundTrip, setIsRoundTrip] = useState(false);

  // Cargo & Weight
  const [weight, setWeight] = useState('25');
  const [weightUnit, setWeightUnit] = useState('ton');

  // Client Pricing Mode: 'per_unit' | 'lump_sum' | 'target_margin'
  const [pricingMode, setPricingMode] = useState('per_unit');
  const [ratePerUnit, setRatePerUnit] = useState('1100');
  const [fixedLumpSum, setFixedLumpSum] = useState('27500');
  const [targetMarginPct, setTargetMarginPct] = useState('20');

  // Extra Client Invoiced Charges
  const [loadingCharges, setLoadingCharges] = useState('0');
  const [unloadingCharges, setUnloadingCharges] = useState('0');
  const [kantaChargesParty, setKantaChargesParty] = useState('0');
  const [haltingDays, setHaltingDays] = useState('0');
  const [haltingRatePerDay, setHaltingRatePerDay] = useState('1500');
  const [extraDropCharges, setExtraDropCharges] = useState('0');

  // Fuel Cost Configuration
  const [fuelCalcMode, setFuelCalcMode] = useState('mileage'); // 'mileage' | 'litres' | 'lump_sum'
  const [truckMileage, setTruckMileage] = useState('4.0'); // KM per Litre
  const [dieselPrice, setDieselPrice] = useState('90'); // Rs. per Litre
  const [fuelLitres, setFuelLitres] = useState('');
  const [fuelLumpSum, setFuelLumpSum] = useState('');

  // Other Operating Costs
  const [materialPurchaseCost, setMaterialPurchaseCost] = useState('0');
  const [isMaterialPurchaseEnabled, setIsMaterialPurchaseEnabled] = useState(false);
  const [materialPurchaseRate, setMaterialPurchaseRate] = useState('');

  const [driverCommission, setDriverCommission] = useState('1200');
  const [driverBhatta, setDriverBhatta] = useState('300');
  const [tollFastagCost, setTollFastagCost] = useState('650');
  const [kantaExpense, setKantaExpense] = useState('150');
  const [laborExpense, setLaborExpense] = useState('0');
  const [rtoPoliceMisc, setRtoPoliceMisc] = useState('200');
  const [maintenanceBufferPerKm, setMaintenanceBufferPerKm] = useState('2.5'); // Rs/KM wear & tear

  // Custom Extra Expenses
  const [customExpenses, setCustomExpenses] = useState([]);

  // WhatsApp Quote Customization
  const [copiedQuote, setCopiedQuote] = useState(false);
  const [quoteValidityDays, setQuoteValidityDays] = useState('3');
  const [quoteRemarks, setQuoteRemarks] = useState('Toll & Fastag included. Unloading within 6 hours.');

  // Load masters from Supabase
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const orgId = await getActiveOrgId();
        if (!orgId) return;

        const [pRes, tRes, dRes, mRes, lRes] = await Promise.all([
          supabase.from('parties').select('id, name, phone').eq('organization_id', orgId),
          supabase.from('trucks').select('id, truck_number, truck_type').eq('organization_id', orgId).eq('status', 'active'),
          supabase.from('drivers').select('id, name, commission_value').eq('organization_id', orgId).eq('status', 'active'),
          supabase.from('materials').select('id, name, unit').eq('organization_id', orgId),
          supabase.from('locations').select('id, name, city').eq('organization_id', orgId),
        ]);

        if (!isMounted) return;
        setParties(pRes.data || []);
        setTrucks(tRes.data || []);
        setDrivers(dRes.data || []);
        setMaterials(mRes.data || []);
        setLocations(lRes.data || []);

        if (pRes.data?.length) setSelectedPartyId(pRes.data[0].id);
        if (tRes.data?.length) setSelectedTruckId(tRes.data[0].id);
        if (dRes.data?.length) {
          setSelectedDriverId(dRes.data[0].id);
          if (dRes.data[0].commission_value) {
            setDriverCommission(String(dRes.data[0].commission_value));
          }
        }
        if (mRes.data?.length) {
          setSelectedMaterialId(mRes.data[0].id);
          if (mRes.data[0].unit) setWeightUnit(mRes.data[0].unit);
        }
        if (lRes.data?.length >= 2) {
          setFromLocationId(lRes.data[0].id);
          setToLocationId(lRes.data[1].id);
        }
      } catch (err) {
        console.error('Error loading calculator masters:', err);
      } finally {
        if (isMounted) setLoadingMasters(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Update driver commission when driver changes
  const handleDriverChange = (driverId) => {
    setSelectedDriverId(driverId);
    const d = drivers.find((item) => item.id === driverId);
    if (d && d.commission_value) {
      setDriverCommission(String(d.commission_value));
    }
  };

  // Swap locations
  const handleSwapLocations = () => {
    const temp = fromLocationId;
    setFromLocationId(toLocationId);
    setToLocationId(temp);
    const tempCustom = customFrom;
    setCustomFrom(customTo);
    setCustomTo(tempCustom);
  };

  // Add custom expense row
  const addCustomExpense = () => {
    setCustomExpenses((prev) => [
      ...prev,
      { id: Date.now(), name: 'Extra Expense', amount: '200' },
    ]);
  };

  const removeCustomExpense = (id) => {
    setCustomExpenses((prev) => prev.filter((item) => item.id !== id));
  };

  const updateCustomExpense = (id, field, value) => {
    setCustomExpenses((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Effective Total Distance
  const effectiveDistanceKm = useMemo(() => {
    const base = parseFloat(distanceKm) || 0;
    return isRoundTrip ? base * 2 : base;
  }, [distanceKm, isRoundTrip]);

  // Fuel Cost Calculation
  const calculatedFuelCost = useMemo(() => {
    if (fuelCalcMode === 'lump_sum') {
      return parseFloat(fuelLumpSum) || 0;
    }
    if (fuelCalcMode === 'litres') {
      const l = parseFloat(fuelLitres) || 0;
      const p = parseFloat(dieselPrice) || 0;
      return l * p;
    }
    // Mileage mode
    const dist = effectiveDistanceKm;
    const mileage = parseFloat(truckMileage) || 4.0;
    const price = parseFloat(dieselPrice) || 90;
    if (mileage <= 0) return 0;
    const litresNeeded = dist / mileage;
    return litresNeeded * price;
  }, [fuelCalcMode, fuelLumpSum, fuelLitres, dieselPrice, effectiveDistanceKm, truckMileage]);

  const fuelLitresEstimated = useMemo(() => {
    if (fuelCalcMode === 'litres') return parseFloat(fuelLitres) || 0;
    if (truckMileage && parseFloat(truckMileage) > 0) {
      return (effectiveDistanceKm / parseFloat(truckMileage)).toFixed(1);
    }
    return '0.0';
  }, [fuelCalcMode, fuelLitres, truckMileage, effectiveDistanceKm]);

  // Total Material Purchase Cost
  const totalMaterialPurchaseCost = useMemo(() => {
    if (!isMaterialPurchaseEnabled) return 0;
    const r = parseFloat(materialPurchaseRate) || 0;
    const w = parseFloat(weight) || 0;
    if (r > 0 && w > 0) return r * w;
    return parseFloat(materialPurchaseCost) || 0;
  }, [isMaterialPurchaseEnabled, materialPurchaseRate, weight, materialPurchaseCost]);

  // Maintenance reserve
  const maintenanceCost = useMemo(() => {
    const rate = parseFloat(maintenanceBufferPerKm) || 0;
    return effectiveDistanceKm * rate;
  }, [effectiveDistanceKm, maintenanceBufferPerKm]);

  // Total Custom Expenses
  const totalCustomExpenses = useMemo(() => {
    return customExpenses.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  }, [customExpenses]);

  // Total Trip Operating Expenses
  const totalTripExpenses = useMemo(() => {
    const fuel = calculatedFuelCost;
    const mat = totalMaterialPurchaseCost;
    const comm = parseFloat(driverCommission) || 0;
    const bhatta = parseFloat(driverBhatta) || 0;
    const toll = parseFloat(tollFastagCost) || 0;
    const kanta = parseFloat(kantaExpense) || 0;
    const labor = parseFloat(laborExpense) || 0;
    const misc = parseFloat(rtoPoliceMisc) || 0;
    const maint = maintenanceCost;
    const extra = totalCustomExpenses;

    return fuel + mat + comm + bhatta + toll + kanta + labor + misc + maint + extra;
  }, [
    calculatedFuelCost,
    totalMaterialPurchaseCost,
    driverCommission,
    driverBhatta,
    tollFastagCost,
    kantaExpense,
    laborExpense,
    rtoPoliceMisc,
    maintenanceCost,
    totalCustomExpenses,
  ]);

  // Total Client Invoiced Extras
  const totalClientExtras = useMemo(() => {
    const l = parseFloat(loadingCharges) || 0;
    const u = parseFloat(unloadingCharges) || 0;
    const k = parseFloat(kantaChargesParty) || 0;
    const hDays = parseFloat(haltingDays) || 0;
    const hRate = parseFloat(haltingRatePerDay) || 0;
    const drop = parseFloat(extraDropCharges) || 0;
    return l + u + k + (hDays * hRate) + drop;
  }, [loadingCharges, unloadingCharges, kantaChargesParty, haltingDays, haltingRatePerDay, extraDropCharges]);

  // Base Freight & Total Revenue Calculation
  const { baseFreight, effectiveRatePerUnit, totalRevenue } = useMemo(() => {
    const w = parseFloat(weight) || 0;
    const expenses = totalTripExpenses;
    const extras = totalClientExtras;

    let base = 0;
    let unitRate = 0;

    if (pricingMode === 'per_unit') {
      unitRate = parseFloat(ratePerUnit) || 0;
      base = w * unitRate;
    } else if (pricingMode === 'lump_sum') {
      base = parseFloat(fixedLumpSum) || 0;
      unitRate = w > 0 ? base / w : 0;
    } else if (pricingMode === 'target_margin') {
      const targetPct = parseFloat(targetMarginPct) || 20;
      // Revenue = Expenses / (1 - targetMarginPct / 100)
      if (targetPct < 100) {
        const requiredTotalRev = expenses / (1 - targetPct / 100);
        base = Math.max(0, requiredTotalRev - extras);
        unitRate = w > 0 ? base / w : 0;
      }
    }

    const totRev = base + extras;
    return {
      baseFreight: Math.round(base),
      effectiveRatePerUnit: unitRate,
      totalRevenue: Math.round(totRev),
    };
  }, [pricingMode, ratePerUnit, fixedLumpSum, targetMarginPct, weight, totalTripExpenses, totalClientExtras]);

  // Profitability Analytics
  const netProfit = totalRevenue - totalTripExpenses;
  const netProfitMarginPct = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;
  const profitPerUnit = (parseFloat(weight) || 0) > 0 ? (netProfit / parseFloat(weight)) : 0;
  const profitPerKm = effectiveDistanceKm > 0 ? (netProfit / effectiveDistanceKm) : 0;
  const costPerKm = effectiveDistanceKm > 0 ? (totalTripExpenses / effectiveDistanceKm) : 0;

  // Break-even Calculations (Zero Profit rate)
  const breakEvenTotalRevenue = totalTripExpenses;
  const breakEvenBaseFreight = Math.max(0, breakEvenTotalRevenue - totalClientExtras);
  const breakEvenRatePerUnit = (parseFloat(weight) || 0) > 0 ? (breakEvenBaseFreight / parseFloat(weight)) : 0;

  // Scenario Presets Matrix (10%, 15%, 20%, 25%, 30%)
  const marginScenarios = useMemo(() => {
    const w = parseFloat(weight) || 0;
    const exp = totalTripExpenses;
    const extras = totalClientExtras;

    return [10, 15, 20, 25, 30].map((pct) => {
      const requiredRev = exp / (1 - pct / 100);
      const scenarioBase = Math.max(0, requiredRev - extras);
      const scenarioRate = w > 0 ? scenarioBase / w : 0;
      const scenarioProfit = requiredRev - exp;

      return {
        pct,
        totalRev: Math.round(requiredRev),
        baseFreight: Math.round(scenarioBase),
        ratePerUnit: scenarioRate.toFixed(2),
        profit: Math.round(scenarioProfit),
      };
    });
  }, [totalTripExpenses, totalClientExtras, weight]);

  // Derived display strings for party, route, material
  const partyDisplayName = useMemo(() => {
    if (customPartyName.trim()) return customPartyName.trim();
    const p = parties.find((item) => item.id === selectedPartyId);
    return p ? p.name : 'Valued Client';
  }, [parties, selectedPartyId, customPartyName]);

  const fromDisplayName = useMemo(() => {
    if (customFrom.trim()) return customFrom.trim();
    const loc = locations.find((l) => l.id === fromLocationId);
    return loc ? `${loc.name} (${loc.city})` : 'Origin';
  }, [locations, fromLocationId, customFrom]);

  const toDisplayName = useMemo(() => {
    if (customTo.trim()) return customTo.trim();
    const loc = locations.find((l) => l.id === toLocationId);
    return loc ? `${loc.name} (${loc.city})` : 'Destination';
  }, [locations, toLocationId, customTo]);

  const materialDisplayName = useMemo(() => {
    if (customMaterial.trim()) return customMaterial.trim();
    const m = materials.find((item) => item.id === selectedMaterialId);
    return m ? m.name : 'General Goods';
  }, [materials, selectedMaterialId, customMaterial]);

  const truckDisplayName = useMemo(() => {
    const t = trucks.find((item) => item.id === selectedTruckId);
    return t ? `${t.truck_number} (${t.truck_type || 'Truck'})` : 'Dedicated Fleet Vehicle';
  }, [trucks, selectedTruckId]);

  // WhatsApp Quotation Message Text
  const whatsappQuoteText = useMemo(() => {
    const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedFreight = `Rs. ${totalRevenue.toLocaleString('en-IN')}`;
    const formattedRate = `Rs. ${effectiveRatePerUnit.toFixed(2)} / ${weightUnit.toUpperCase()}`;

    return `*🚛 TRANSPORT QUOTATION | ${siteData.company.name.toUpperCase()}*
──────────────────────
📅 *Date:* ${dateStr}
👤 *Party:* ${partyDisplayName}

📍 *Route:* ${fromDisplayName} ➔ ${toDisplayName}
📦 *Material:* ${materialDisplayName}
⚖️ *Weight / Qty:* ${weight} ${weightUnit.toUpperCase()}
🚛 *Vehicle Type:* ${truckDisplayName}
🛣️ *Est. Distance:* ${effectiveDistanceKm} KM ${isRoundTrip ? '(Round Trip)' : '(One-Way)'}

──────────────────────
💰 *ESTIMATED FREIGHT:* *${formattedFreight}*
💵 *Quoted Rate:* ${pricingMode === 'per_unit' ? formattedRate : `Lump Sum (${formattedFreight})`}
${totalClientExtras > 0 ? `➕ *Extra Invoiced Services:* Rs. ${totalClientExtras.toLocaleString('en-IN')}\n` : ''}
──────────────────────
📌 *Terms & Remarks:*
• ${quoteRemarks}
• Quote Valid For: ${quoteValidityDays} Days
• Toll & Taxes as per invoice agreement.

📞 *Direct Booking Line:* ${siteData.contact.phone}
💬 *WhatsApp:* ${siteData.contact.whatsapp}
🏢 *Office:* ${siteData.address.line1}, ${siteData.address.city}, ${siteData.address.state}

_Thank you for choosing ${siteData.company.name}!_`;
  }, [
    partyDisplayName,
    fromDisplayName,
    toDisplayName,
    materialDisplayName,
    weight,
    weightUnit,
    truckDisplayName,
    effectiveDistanceKm,
    isRoundTrip,
    totalRevenue,
    effectiveRatePerUnit,
    pricingMode,
    totalClientExtras,
    quoteRemarks,
    quoteValidityDays,
  ]);

  // Copy WhatsApp text to clipboard
  const handleCopyQuote = async () => {
    try {
      await navigator.clipboard.writeText(whatsappQuoteText);
      setCopiedQuote(true);
      setTimeout(() => setCopiedQuote(false), 2500);
    } catch {
      alert('Unable to copy to clipboard.');
    }
  };

  // Share to WhatsApp
  const handleShareWhatsApp = () => {
    const selectedParty = parties.find((p) => p.id === selectedPartyId);
    const rawPhone = selectedParty?.phone || '';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    const phoneParam = cleanPhone.length >= 10 ? (cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone) : '';

    const url = phoneParam 
      ? `https://wa.me/${phoneParam}?text=${encodeURIComponent(whatsappQuoteText)}`
      : `https://wa.me/?text=${encodeURIComponent(whatsappQuoteText)}`;

    window.open(url, '_blank');
  };

  // Reset to default
  const handleReset = () => {
    setDistanceKm('120');
    setIsRoundTrip(false);
    setWeight('25');
    setWeightUnit('ton');
    setPricingMode('per_unit');
    setRatePerUnit('1100');
    setFixedLumpSum('27500');
    setTargetMarginPct('20');
    setLoadingCharges('0');
    setUnloadingCharges('0');
    setKantaChargesParty('0');
    setHaltingDays('0');
    setExtraDropCharges('0');
    setTruckMileage('4.0');
    setDieselPrice('90');
    setMaterialPurchaseCost('0');
    setIsMaterialPurchaseEnabled(false);
    setDriverCommission('1200');
    setDriverBhatta('300');
    setTollFastagCost('650');
    setKantaExpense('150');
    setLaborExpense('0');
    setRtoPoliceMisc('200');
    setMaintenanceBufferPerKm('2.5');
    setCustomExpenses([]);
  };

  // Convert to New Fera (Navigate to /admin/feras/new with session state)
  const handleConvertToFera = () => {
    const feraPayload = {
      partyId: selectedPartyId,
      truckId: selectedTruckId,
      driverId: selectedDriverId,
      materialId: selectedMaterialId,
      fromLocationId: fromLocationId,
      toLocationId: toLocationId,
      weight: weight,
      weightUnit: weightUnit,
      rateUnit: pricingMode === 'per_unit' ? String(effectiveRatePerUnit.toFixed(2)) : '',
      agreedAmount: String(totalRevenue),
      driverCommission: driverCommission,
      notes: `Estimated with Fera Calculator. Route: ${fromDisplayName} to ${toDisplayName}. Est. Distance: ${effectiveDistanceKm} KM.`,
      expenses: [
        { expenseType: 'diesel', description: `Diesel (${fuelLitresEstimated}L @ Rs.${dieselPrice})`, amount: String(Math.round(calculatedFuelCost)), quantity: String(fuelLitresEstimated), rate: String(dieselPrice), unit: 'litres' },
        ...(isMaterialPurchaseEnabled && totalMaterialPurchaseCost > 0 ? [{ expenseType: 'material_purchase', description: 'Material Cost', amount: String(Math.round(totalMaterialPurchaseCost)), quantity: String(weight), rate: String(materialPurchaseRate || 0), unit: weightUnit }] : []),
        { expenseType: 'driver_commission', description: 'Driver Commission & Bhatta', amount: String(Math.round((parseFloat(driverCommission) || 0) + (parseFloat(driverBhatta) || 0))), quantity: null, rate: null, unit: null },
        { expenseType: 'toll', description: 'Toll & Fastag', amount: String(Math.round(parseFloat(tollFastagCost) || 0)), quantity: null, rate: null, unit: null },
        { expenseType: 'weighbridge', description: 'Weighbridge / Kanta', amount: String(Math.round(parseFloat(kantaExpense) || 0)), quantity: null, rate: null, unit: null },
        ...(parseFloat(laborExpense) > 0 ? [{ expenseType: 'labor', description: 'Loading / Unloading Labor', amount: String(Math.round(parseFloat(laborExpense))), quantity: null, rate: null, unit: null }] : []),
        ...(parseFloat(rtoPoliceMisc) > 0 ? [{ expenseType: 'other', description: 'RTO / En-route Misc', amount: String(Math.round(parseFloat(rtoPoliceMisc))), quantity: null, rate: null, unit: null }] : []),
        ...customExpenses.map((c) => ({ expenseType: 'other', description: c.name || 'Extra Expense', amount: String(c.amount || 0), quantity: null, rate: null, unit: null })),
      ],
    };

    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('veda_calc_fera_prefill', JSON.stringify(feraPayload));
    }
    router.push('/admin/feras/new?from_calc=1');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-500/15 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2.5 bg-[#131c33] border border-amber-500/20 rounded-2xl text-amber-300 hover:text-white hover:bg-amber-500/10 transition-all cursor-pointer shadow-md"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Single Fera Profit & Rate Estimator
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-extrabold uppercase tracking-wider">
                Live Pricing Tool
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Accurately project trip operational costs, determine target profit margins, and deliver instant WhatsApp quotes to clients.
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <WhatsAppIcon className="w-4 h-4 text-white" />
            <span>WhatsApp Quote</span>
          </button>

          <button
            onClick={handleConvertToFera}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 border border-amber-300/30 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Receipt className="w-4 h-4 stroke-[2.5]" />
            <span>Convert to New Fera</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Inputs / Right Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Input Panels (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* 1. Trip & Route Parameters */}
          <div className="p-5 sm:p-6 bg-[#0c1220]/90 backdrop-blur-xl border border-amber-500/20 rounded-3xl space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-amber-500/15 pb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <Truck className="w-5 h-5 stroke-[2.5]" />
                <h2 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                  1. Trip & Route Parameters
                </h2>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Origin, Destination & Cargo</span>
            </div>

            {/* Client / Party Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Client / Party Name
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={selectedPartyId}
                  onChange={(e) => {
                    setSelectedPartyId(e.target.value);
                    if (e.target.value) setCustomPartyName('');
                  }}
                  className="w-full bg-[#131c33] border border-amber-500/20 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 transition-all"
                >
                  <option value="">-- Select Registered Client --</option>
                  {parties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} {p.phone ? `(${p.phone})` : ''}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Or type custom client name..."
                  value={customPartyName}
                  onChange={(e) => {
                    setCustomPartyName(e.target.value);
                    if (e.target.value) setSelectedPartyId('');
                  }}
                  className="w-full bg-[#131c33] border border-amber-500/20 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-all"
                />
              </div>
            </div>

            {/* Route (From -> To with swap) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Transit Route
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <div className="flex-1 w-full">
                  <select
                    value={fromLocationId}
                    onChange={(e) => {
                      setFromLocationId(e.target.value);
                      if (e.target.value) setCustomFrom('');
                    }}
                    className="w-full bg-[#131c33] border border-amber-500/20 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="">-- From Origin --</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>{l.name} ({l.city})</option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleSwapLocations}
                  className="p-2.5 rounded-xl bg-slate-900 border border-amber-500/30 text-amber-400 hover:text-white hover:bg-amber-500/20 transition-all cursor-pointer shrink-0"
                  title="Swap Origin & Destination"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </button>

                <div className="flex-1 w-full">
                  <select
                    value={toLocationId}
                    onChange={(e) => {
                      setToLocationId(e.target.value);
                      if (e.target.value) setCustomTo('');
                    }}
                    className="w-full bg-[#131c33] border border-amber-500/20 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="">-- To Destination --</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>{l.name} ({l.city})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Custom Location write-in override */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <input
                  type="text"
                  placeholder="Custom Origin city/hub..."
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full bg-[#0a0f1d] border border-slate-700/60 rounded-lg px-3 py-1.5 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
                <input
                  type="text"
                  placeholder="Custom Destination city/hub..."
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full bg-[#0a0f1d] border border-slate-700/60 rounded-lg px-3 py-1.5 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Distance, Round Trip & Vehicle */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wide">
                  One-Way Distance (KM) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(e.target.value)}
                    className="w-full bg-[#131c33] border border-amber-500/20 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-amber-400"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-bold">KM</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wide">
                  Trip Direction
                </label>
                <button
                  type="button"
                  onClick={() => setIsRoundTrip(!isRoundTrip)}
                  className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isRoundTrip
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-[#131c33] border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>{isRoundTrip ? `Round Trip (${effectiveDistanceKm} KM)` : 'One-Way Trip'}</span>
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wide">
                  Assigned Truck
                </label>
                <select
                  value={selectedTruckId}
                  onChange={(e) => setSelectedTruckId(e.target.value)}
                  className="w-full bg-[#131c33] border border-amber-500/20 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="">-- Select Truck --</option>
                  {trucks.map((t) => (
                    <option key={t.id} value={t.id}>{t.truck_number} ({t.truck_type || 'Truck'})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Material & Cargo Weight */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wide">
                  Material / Goods Type
                </label>
                <select
                  value={selectedMaterialId}
                  onChange={(e) => {
                    setSelectedMaterialId(e.target.value);
                    const m = materials.find((item) => item.id === e.target.value);
                    if (m && m.unit) setWeightUnit(m.unit);
                  }}
                  className="w-full bg-[#131c33] border border-amber-500/20 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="">-- Select Material --</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wide">
                  Cargo Weight / Quantity *
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full bg-[#131c33] border border-amber-500/20 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wide">
                  Billing Unit
                </label>
                <select
                  value={weightUnit}
                  onChange={(e) => setWeightUnit(e.target.value)}
                  className="w-full bg-[#131c33] border border-amber-500/20 rounded-xl px-3 py-2.5 text-xs text-white uppercase focus:outline-none focus:border-amber-400"
                >
                  <option value="ton">Tons (MT)</option>
                  <option value="brass">Brass</option>
                  <option value="kg">Kilograms (KG)</option>
                  <option value="trip">Per Trip</option>
                  <option value="km">Per KM</option>
                  <option value="bag">Bags</option>
                  <option value="cbm">CBM</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. Client Billing & Revenue Mode */}
          <div className="p-5 sm:p-6 bg-[#0c1220]/90 backdrop-blur-xl border border-amber-500/20 rounded-3xl space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-amber-500/15 pb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <DollarSign className="w-5 h-5 stroke-[2.5]" />
                <h2 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                  2. Client Pricing & Revenue Setup
                </h2>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Billing Quotation Structure</span>
            </div>

            {/* Pricing Mode Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-[#070b14] border border-slate-800 rounded-2xl">
              <button
                type="button"
                onClick={() => setPricingMode('per_unit')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  pricingMode === 'per_unit'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Rate Per {weightUnit.toUpperCase()}
              </button>
              <button
                type="button"
                onClick={() => setPricingMode('lump_sum')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  pricingMode === 'lump_sum'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Fixed Lump Sum
              </button>
              <button
                type="button"
                onClick={() => setPricingMode('target_margin')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  pricingMode === 'target_margin'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Target Margin %
              </button>
            </div>

            {/* Dynamic Pricing Inputs */}
            {pricingMode === 'per_unit' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#131c33]/70 border border-amber-500/20 rounded-2xl">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Rate per {weightUnit.toUpperCase()} (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs text-amber-400 font-bold">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={ratePerUnit}
                      onChange={(e) => setRatePerUnit(e.target.value)}
                      className="w-full bg-[#0a0f1d] border border-amber-500/30 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-white font-extrabold focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
                <div className="p-3 bg-[#070b14]/80 rounded-xl border border-slate-800 flex flex-col justify-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Calculated Base Freight</span>
                  <span className="text-base font-black text-amber-400 mt-0.5">
                    ₹ {baseFreight.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {weight} {weightUnit} × ₹{ratePerUnit || 0}
                  </span>
                </div>
              </div>
            )}

            {pricingMode === 'lump_sum' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#131c33]/70 border border-amber-500/20 rounded-2xl">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Agreed Lump Sum Freight (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs text-amber-400 font-bold">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={fixedLumpSum}
                      onChange={(e) => setFixedLumpSum(e.target.value)}
                      className="w-full bg-[#0a0f1d] border border-amber-500/30 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-white font-extrabold focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
                <div className="p-3 bg-[#070b14]/80 rounded-xl border border-slate-800 flex flex-col justify-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Equivalent Unit Rate</span>
                  <span className="text-base font-black text-amber-400 mt-0.5">
                    ₹ {effectiveRatePerUnit.toFixed(2)} / {weightUnit}
                  </span>
                </div>
              </div>
            )}

            {pricingMode === 'target_margin' && (
              <div className="space-y-4 p-4 bg-[#131c33]/70 border border-amber-500/20 rounded-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider">
                      Desired Profit Margin % *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="99"
                        step="any"
                        value={targetMarginPct}
                        onChange={(e) => setTargetMarginPct(e.target.value)}
                        className="w-full bg-[#0a0f1d] border border-amber-500/30 rounded-xl px-3.5 py-2.5 text-sm text-white font-extrabold focus:outline-none focus:border-amber-400"
                      />
                      <span className="absolute right-3.5 top-2.5 text-xs text-amber-400 font-bold">%</span>
                    </div>
                  </div>
                  <div className="p-3 bg-[#070b14]/80 rounded-xl border border-slate-800 flex flex-col justify-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Recommended Quote</span>
                    <span className="text-base font-black text-emerald-400 mt-0.5">
                      ₹ {totalRevenue.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      (₹{effectiveRatePerUnit.toFixed(2)} / {weightUnit})
                    </span>
                  </div>
                </div>

                {/* Quick Margin Pills */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Quick Targets:</span>
                  {[12, 15, 18, 20, 25, 30].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTargetMarginPct(String(preset))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        targetMarginPct === String(preset)
                          ? 'bg-amber-400 text-slate-950 font-black'
                          : 'bg-slate-900 border border-slate-700 text-slate-300 hover:border-amber-400'
                      }`}
                    >
                      {preset}%
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Extra Client Invoiced Charges Accordion */}
            <div className="space-y-3 pt-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300 block">
                Additional Client Invoiced Charges (Optional)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Loading (Hamali)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={loadingCharges}
                    onChange={(e) => setLoadingCharges(e.target.value)}
                    className="w-full bg-[#131c33] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Unloading</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={unloadingCharges}
                    onChange={(e) => setUnloadingCharges(e.target.value)}
                    className="w-full bg-[#131c33] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Kanta to Party</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={kantaChargesParty}
                    onChange={(e) => setKantaChargesParty(e.target.value)}
                    className="w-full bg-[#131c33] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Halting (Days)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={haltingDays}
                    onChange={(e) => setHaltingDays(e.target.value)}
                    className="w-full bg-[#131c33] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Halting Rate / Day</label>
                  <input
                    type="number"
                    min="0"
                    value={haltingRatePerDay}
                    onChange={(e) => setHaltingRatePerDay(e.target.value)}
                    className="w-full bg-[#131c33] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Extra Drop Charge</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={extraDropCharges}
                    onChange={(e) => setExtraDropCharges(e.target.value)}
                    className="w-full bg-[#131c33] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Detailed Trip Operating Expenses */}
          <div className="p-5 sm:p-6 bg-[#0c1220]/90 backdrop-blur-xl border border-amber-500/20 rounded-3xl space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-amber-500/15 pb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <Fuel className="w-5 h-5 stroke-[2.5]" />
                <h2 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                  3. Direct Trip Operating Expenses (Costs)
                </h2>
              </div>
              <span className="text-xs font-mono font-black text-rose-400">
                Total: ₹ {Math.round(totalTripExpenses).toLocaleString('en-IN')}
              </span>
            </div>

            {/* Diesel / Fuel Cost Calculator Section */}
            <div className="p-4 bg-[#131c33]/70 border border-amber-500/20 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-300">
                  <Fuel className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-extrabold uppercase tracking-wide">Diesel / Fuel Calculator</span>
                </div>
                <span className="text-xs font-black text-amber-400">
                  ₹ {Math.round(calculatedFuelCost).toLocaleString('en-IN')} ({fuelLitresEstimated} L)
                </span>
              </div>

              {/* Fuel Calculation Mode */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFuelCalcMode('mileage')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    fuelCalcMode === 'mileage' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-[#0a0f1d] text-slate-400'
                  }`}
                >
                  By KM & Mileage
                </button>
                <button
                  type="button"
                  onClick={() => setFuelCalcMode('litres')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    fuelCalcMode === 'litres' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-[#0a0f1d] text-slate-400'
                  }`}
                >
                  Direct Litres
                </button>
                <button
                  type="button"
                  onClick={() => setFuelCalcMode('lump_sum')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    fuelCalcMode === 'lump_sum' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-[#0a0f1d] text-slate-400'
                  }`}
                >
                  Lump Sum Fuel
                </button>
              </div>

              {fuelCalcMode === 'mileage' && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Truck Mileage (KM / L)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      value={truckMileage}
                      onChange={(e) => setTruckMileage(e.target.value)}
                      className="w-full bg-[#0a0f1d] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Diesel Price (₹ / Litre)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      value={dieselPrice}
                      onChange={(e) => setDieselPrice(e.target.value)}
                      className="w-full bg-[#0a0f1d] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                    />
                  </div>
                </div>
              )}

              {fuelCalcMode === 'litres' && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Litres Required (L)</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 50"
                      value={fuelLitres}
                      onChange={(e) => setFuelLitres(e.target.value)}
                      className="w-full bg-[#0a0f1d] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Diesel Price (₹ / Litre)</label>
                    <input
                      type="number"
                      value={dieselPrice}
                      onChange={(e) => setDieselPrice(e.target.value)}
                      className="w-full bg-[#0a0f1d] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                    />
                  </div>
                </div>
              )}

              {fuelCalcMode === 'lump_sum' && (
                <div className="space-y-1 pt-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Total Fuel Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 4500"
                    value={fuelLumpSum}
                    onChange={(e) => setFuelLumpSum(e.target.value)}
                    className="w-full bg-[#0a0f1d] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  />
                </div>
              )}
            </div>

            {/* Material Purchase / Royalty / Pass Cost Toggle */}
            <div className="p-4 bg-[#131c33]/70 border border-slate-700/80 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="matPurchaseToggle"
                    checked={isMaterialPurchaseEnabled}
                    onChange={(e) => setIsMaterialPurchaseEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-900 border-slate-700 cursor-pointer"
                  />
                  <label htmlFor="matPurchaseToggle" className="text-xs font-bold text-slate-200 cursor-pointer">
                    Material Purchase / Royalty / Mine Pass Cost (If paid by transporter)
                  </label>
                </div>
                {isMaterialPurchaseEnabled && (
                  <span className="text-xs font-black text-rose-400">
                    ₹ {Math.round(totalMaterialPurchaseCost).toLocaleString('en-IN')}
                  </span>
                )}
              </div>

              {isMaterialPurchaseEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Purchase Rate per {weightUnit} (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 450"
                      value={materialPurchaseRate}
                      onChange={(e) => setMaterialPurchaseRate(e.target.value)}
                      className="w-full bg-[#0a0f1d] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Or Total Purchase Lump Sum (₹)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={materialPurchaseCost}
                      onChange={(e) => setMaterialPurchaseCost(e.target.value)}
                      className="w-full bg-[#0a0f1d] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Standard Trip Expense Rows */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Driver Commission (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={driverCommission}
                  onChange={(e) => setDriverCommission(e.target.value)}
                  className="w-full bg-[#131c33] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Driver Bhatta / Food (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={driverBhatta}
                  onChange={(e) => setDriverBhatta(e.target.value)}
                  className="w-full bg-[#131c33] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Toll / Fastag (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={tollFastagCost}
                  onChange={(e) => setTollFastagCost(e.target.value)}
                  className="w-full bg-[#131c33] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Weighbridge / Kanta (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={kantaExpense}
                  onChange={(e) => setKantaExpense(e.target.value)}
                  className="w-full bg-[#131c33] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Loading Labor (Hamali)</label>
                <input
                  type="number"
                  min="0"
                  value={laborExpense}
                  onChange={(e) => setLaborExpense(e.target.value)}
                  className="w-full bg-[#131c33] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">RTO / Police / Misc (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={rtoPoliceMisc}
                  onChange={(e) => setRtoPoliceMisc(e.target.value)}
                  className="w-full bg-[#131c33] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            {/* Vehicle Wear & Tear / Maintenance Buffer */}
            <div className="p-3 bg-[#070b14]/90 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-300 block">Tyre & Maintenance Buffer</span>
                <span className="text-[10px] text-slate-500">
                  ₹{maintenanceBufferPerKm}/KM × {effectiveDistanceKm} KM = ₹{Math.round(maintenanceCost).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={maintenanceBufferPerKm}
                  onChange={(e) => setMaintenanceBufferPerKm(e.target.value)}
                  className="w-20 bg-[#131c33] border border-slate-700 rounded-lg px-2 py-1 text-xs text-right text-white font-bold"
                />
                <span className="text-[10px] text-slate-400 font-bold">₹/KM</span>
              </div>
            </div>

            {/* Custom Expense Additions */}
            {customExpenses.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                  Custom Additional Expenses
                </span>
                {customExpenses.map((c) => (
                  <div key={c.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Expense name..."
                      value={c.name}
                      onChange={(e) => updateCustomExpense(c.id, 'name', e.target.value)}
                      className="flex-1 bg-[#131c33] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                    />
                    <input
                      type="number"
                      placeholder="Amount (₹)"
                      value={c.amount}
                      onChange={(e) => updateCustomExpense(c.id, 'amount', e.target.value)}
                      className="w-28 bg-[#131c33] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold text-right"
                    />
                    <button
                      type="button"
                      onClick={() => removeCustomExpense(c.id)}
                      className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={addCustomExpense}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-400/50 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Add Custom Expense Item</span>
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: Profitability Dashboard & WhatsApp Quotation Generator (5 Cols) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-4">

          {/* 1. Main Profitability Scorecard */}
          <div className="p-6 bg-gradient-to-br from-[#0e1628] to-[#070b14] border-2 border-amber-500/40 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
                  Trip Economics Summary
                </span>
                <h3 className="text-lg font-black text-white tracking-tight">Single Fera Profit & Loss</h3>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-md ${
                netProfit >= 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}>
                {netProfit >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                <span>{netProfitMarginPct.toFixed(1)}% Margin</span>
              </div>
            </div>

            {/* Net Profit Hero Box */}
            <div className={`p-5 rounded-2xl border text-center transition-all ${
              netProfit >= 0
                ? 'bg-gradient-to-b from-emerald-500/15 to-emerald-500/5 border-emerald-500/40 shadow-inner'
                : 'bg-gradient-to-b from-rose-500/15 to-rose-500/5 border-rose-500/40 shadow-inner'
            }`}>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Estimated Net Profit (Per Fera)
              </span>
              <div className={`text-3xl sm:text-4xl font-black mt-1 tracking-tight ${
                netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                ₹ {Math.round(netProfit).toLocaleString('en-IN')}
              </div>
              <div className="flex items-center justify-center gap-3 mt-2 text-[11px] font-bold text-slate-300">
                <span>₹{profitPerUnit.toFixed(1)} / {weightUnit}</span>
                <span>•</span>
                <span>₹{profitPerKm.toFixed(1)} / KM</span>
              </div>
            </div>

            {/* Revenue vs Cost Dual Breakdown */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-[#131c33]/80 rounded-2xl border border-emerald-500/20">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Client Revenue</span>
                <span className="text-xl font-black text-white block mt-0.5">
                  ₹ {totalRevenue.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  Quoted: ₹{effectiveRatePerUnit.toFixed(2)}/{weightUnit}
                </span>
              </div>

              <div className="p-3.5 bg-[#131c33]/80 rounded-2xl border border-rose-500/20">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Trip Operating Cost</span>
                <span className="text-xl font-black text-rose-400 block mt-0.5">
                  ₹ {Math.round(totalTripExpenses).toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  ₹{costPerKm.toFixed(1)} / KM
                </span>
              </div>
            </div>

            {/* Break-Even Warning Bar */}
            <div className="p-3.5 bg-[#070b14]/90 rounded-2xl border border-amber-500/20 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-amber-400 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Break-Even Threshold (0% Profit)</span>
                </span>
                <span className="text-white font-mono font-black">
                  ₹{breakEvenRatePerUnit.toFixed(2)} / {weightUnit}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Any client quote below ₹{breakEvenRatePerUnit.toFixed(2)}/{weightUnit} (or ₹{Math.round(breakEvenTotalRevenue).toLocaleString('en-IN')} lump sum) will cause an operational loss.
              </p>
            </div>

            {/* Cost Breakdown Progress Bars */}
            <div className="space-y-2 pt-1 border-t border-amber-500/15">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Cost Breakdown Distribution
              </span>
              
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between font-bold text-slate-300">
                  <span>Fuel / Diesel</span>
                  <span className="font-mono text-amber-400">
                    ₹{Math.round(calculatedFuelCost).toLocaleString('en-IN')} ({totalRevenue > 0 ? ((calculatedFuelCost / totalRevenue) * 100).toFixed(0) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full"
                    style={{ width: `${Math.min(100, totalRevenue > 0 ? (calculatedFuelCost / totalRevenue) * 100 : 0)}%` }}
                  />
                </div>

                <div className="flex justify-between font-bold text-slate-300 pt-1">
                  <span>Driver & Toll</span>
                  <span className="font-mono text-indigo-400">
                    ₹{Math.round((parseFloat(driverCommission) || 0) + (parseFloat(driverBhatta) || 0) + (parseFloat(tollFastagCost) || 0)).toLocaleString('en-IN')}
                  </span>
                </div>

                {isMaterialPurchaseEnabled && totalMaterialPurchaseCost > 0 && (
                  <div className="flex justify-between font-bold text-slate-300 pt-1">
                    <span>Material Purchase</span>
                    <span className="font-mono text-rose-400">
                      ₹{Math.round(totalMaterialPurchaseCost).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. Target Profit Margin Scenarios Matrix */}
          <div className="p-5 bg-[#0c1220]/90 backdrop-blur-xl border border-amber-500/20 rounded-3xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-amber-500/15 pb-2">
              <span className="text-xs font-black uppercase tracking-wide text-amber-400 flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-amber-400" />
                <span>Quick Margin Quote Scenarios</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">1-Click Apply</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {marginScenarios.map((sc) => (
                <button
                  key={sc.pct}
                  type="button"
                  onClick={() => {
                    setPricingMode('per_unit');
                    setRatePerUnit(sc.ratePerUnit);
                  }}
                  className="p-2.5 rounded-xl bg-[#131c33] border border-slate-700/80 hover:border-amber-400/80 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-amber-300">{sc.pct}% Target Margin</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono font-bold">
                      ₹{sc.ratePerUnit}/{weightUnit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>Total: ₹{sc.totalRev.toLocaleString('en-IN')}</span>
                    <span className="text-emerald-400 font-bold">+₹{sc.profit.toLocaleString('en-IN')} Profit</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 3. WhatsApp Quotation Generator Box */}
          <div className="p-5 bg-[#0c1220]/90 backdrop-blur-xl border border-emerald-500/30 rounded-3xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
              <span className="text-xs font-black uppercase tracking-wide text-emerald-400 flex items-center gap-1.5">
                <WhatsAppIcon className="w-4 h-4 text-emerald-400" />
                <span>Client WhatsApp Quotation Generator</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Live Message Preview</span>
            </div>

            {/* Custom Quote Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Quote Validity (Days)</label>
                <input
                  type="number"
                  min="1"
                  value={quoteValidityDays}
                  onChange={(e) => setQuoteValidityDays(e.target.value)}
                  className="w-full bg-[#131c33] border border-slate-700 rounded-lg px-2 py-1 text-xs text-white mt-0.5"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Payment & Trip Terms</label>
                <input
                  type="text"
                  value={quoteRemarks}
                  onChange={(e) => setQuoteRemarks(e.target.value)}
                  className="w-full bg-[#131c33] border border-slate-700 rounded-lg px-2 py-1 text-xs text-white mt-0.5"
                />
              </div>
            </div>

            {/* Formatted Message Code Snippet */}
            <div className="p-3.5 bg-[#070b14] rounded-2xl border border-slate-800 text-[11px] font-mono text-emerald-300 max-h-52 overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
              {whatsappQuoteText}
            </div>

            {/* Quotation Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleCopyQuote}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-white font-bold text-xs transition-all cursor-pointer"
              >
                {copiedQuote ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedQuote ? 'Copied to Clipboard!' : 'Copy Quotation'}</span>
              </button>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-black text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <WhatsAppIcon className="w-4 h-4 text-white" />
                <span>Send on WhatsApp</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
