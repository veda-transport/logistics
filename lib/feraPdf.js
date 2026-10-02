import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getActiveOrganizationDetails } from './supabase';

// Currency Formatter
export const formatCurrency = (val) => {
  const num = parseFloat(val) || 0;
  return `Rs. ${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatINR = (val) => {
  const num = parseFloat(val) || 0;
  return `Rs. ${num.toLocaleString('en-IN')}`;
};

// Date Formatters
export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

export const formatShortDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = String(d.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  } catch {
    return dateStr;
  }
};

// Indian Currency Number to Words
export const numberToWordsINR = (num) => {
  const n = Math.round(Math.abs(Number(num) || 0));
  if (n === 0) return 'Zero Rupees Only';

  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertLessThanOneThousand = (number) => {
    let current;
    if (number % 100 < 20) {
      current = a[number % 100];
      number = Math.floor(number / 100);
    } else {
      current = a[number % 10];
      number = Math.floor(number / 10);
      current = b[number % 10] + (current ? ' ' + current : '');
      number = Math.floor(number / 10);
    }
    if (number === 0) return current;
    return a[number] + 'Hundred ' + (current ? 'and ' + current : '');
  };

  let str = '';
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const remaining = n % 1000;

  if (crore > 0) {
    str += convertLessThanOneThousand(crore).trim() + ' Crore ';
  }
  if (lakh > 0) {
    str += convertLessThanOneThousand(lakh).trim() + ' Lakh ';
  }
  if (thousand > 0) {
    str += convertLessThanOneThousand(thousand).trim() + ' Thousand ';
  }
  if (remaining > 0) {
    str += convertLessThanOneThousand(remaining).trim();
  }

  return `${str.trim()} Rupees Only`.replace(/\s+/g, ' ');
};

// Helper to load logo as base64 image
const loadImageAsBase64 = (url) => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(null);
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg'));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

// Helper to resolve dynamic company / organization details
export const resolveDynamicOrgInfo = async (customOrg = {}) => {
  let dbOrg = null;
  try {
    dbOrg = await getActiveOrganizationDetails();
  } catch (err) {
    console.warn('Could not fetch dynamic org details:', err);
  }

  return {
    name: customOrg?.name || dbOrg?.name || dbOrg?.legal_name || 'VEDA TRANSPORT',
    phone: customOrg?.phone || dbOrg?.phone || '+91 9978444414',
    email: customOrg?.email || dbOrg?.email || '',
    addressLine1: customOrg?.addressLine1 || dbOrg?.address || 'Desai Faliyu',
    addressLine2: customOrg?.addressLine2 || (dbOrg?.city ? `${dbOrg.city}, ${dbOrg.state || 'kamrej'}` : 'Antorli,kamrej'),
    statePin: customOrg?.statePin || (dbOrg?.state ? `${dbOrg.state} - 394150` : 'Gujarat - 394150'),
    gstNumber: customOrg?.gstNumber || dbOrg?.gst_number || '',
    logoUrl: customOrg?.logoUrl || dbOrg?.logo_url || '/truck_logo.jpg',
  };
};

/**
 * Generates an exact Party Dispatch Bill / Ledger Statement PDF matching the reference layout
 */
export const generatePartyBillPDF = async ({
  party,
  feras = [],
  asOfDate = new Date(),
  orgInfo = null
}) => {
  if (!party) {
    alert('Please select a party to generate the bill.');
    return;
  }

  const effectiveOrg = await resolveDynamicOrgInfo(orgInfo);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Deep Navy Blue Theme (#0d0c3d)
  const bluePrimary = [13, 12, 61];
  const grayDark = [30, 41, 59];
  const grayLight = [248, 250, 252];

  // Try to load truck logo
  const logoData = await loadImageAsBase64(effectiveOrg.logoUrl);

  // 1. Header Section
  let currentY = 12;

  // Left Logo
  if (logoData) {
    try {
      doc.addImage(logoData, 'JPEG', 10, currentY, 28, 22);
    } catch {
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(10, currentY, 28, 22, 1, 1, 'F');
    }
  } else {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(10, currentY, 28, 22, 1, 1, 'F');
  }

  // Center Company Name
  doc.setTextColor(...grayDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(effectiveOrg.name.toUpperCase(), 105, currentY + 12, { align: 'center' });

  // Right Company Contact Info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(effectiveOrg.phone, 200, currentY + 4, { align: 'right' });
  doc.text(effectiveOrg.addressLine1, 200, currentY + 9, { align: 'right' });
  doc.text(effectiveOrg.addressLine2, 200, currentY + 14, { align: 'right' });
  doc.text(effectiveOrg.statePin, 200, currentY + 19, { align: 'right' });

  currentY += 26;

  // Blue Horizontal Separator Line
  doc.setDrawColor(...bluePrimary);
  doc.setLineWidth(0.8);
  doc.line(10, currentY, 200, currentY);

  currentY += 6;

  // 2. "Bill To" Section (Dynamic Party Details)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...grayDark);
  doc.text('Bill To', 10, currentY);

  currentY += 5;
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text(String(party.name || '').toUpperCase(), 10, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  if (party.address && party.address.trim()) {
    const addressLines = String(party.address).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    addressLines.forEach((line) => {
      currentY += 4.5;
      doc.text(line, 10, currentY);
    });
  } else if (party.city || party.state) {
    currentY += 4.5;
    doc.text([party.city, party.state, party.pincode].filter(Boolean).join(', '), 10, currentY);
  }

  if (party.phone) {
    currentY += 4.5;
    const cleanPhone = String(party.phone).startsWith('+91') ? party.phone : `+91 ${party.phone.trim()}`;
    doc.text(cleanPhone, 10, currentY);
  }

  if (party.gst_number) {
    currentY += 4.5;
    doc.text(`GSTIN: ${party.gst_number}`, 10, currentY);
  }

  currentY += 7;

  // 3. Ledger Details as on Date
  const dateFormatted = formatShortDate(asOfDate);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...grayDark);
  doc.text(`Ledger Details as on ${dateFormatted}`, 105, currentY, { align: 'center' });

  currentY += 3;

  // Calculations
  const totalTripsCount = feras.length;
  let totalFreight = 0;
  let totalAdvance = 0;
  let totalCharges = 0;
  let totalDeductions = 0;
  let totalPayments = 0;
  let totalDueAmount = 0;

  const tableRows = feras.map((f, index) => {
    const freight = parseFloat(f.agreed_amount) || 0;
    const weight = parseFloat(f.weight) || 0;
    const weightUnit = f.weight_unit || 'Tonne';
    
    // Rate calculation: prioritize rate_unit, otherwise freight / weight
    const unitRate = parseFloat(f.rate_unit) > 0 
      ? parseFloat(f.rate_unit) 
      : (weight > 0 ? Math.round(freight / weight) : 0);
    const rateDisplay = (unitRate > 0 && weight > 0) 
      ? `Rs. ${unitRate} x ${weight} ${weightUnit}` 
      : `Rs. ${freight.toLocaleString('en-IN')}`;

    const advance = parseFloat(f.advance_amount) || 0;
    const charges = parseFloat(f.extra_charges) || 0;
    const deduction = parseFloat(f.deduction_amount) || 0;
    
    // Actual payments received from party for this trip (0 if no payment received yet)
    const payments = parseFloat(f.paid_amount) || parseFloat(f.received_amount) || 0;
    const rowDue = Math.max(0, (freight + charges) - (advance + deduction + payments));

    totalFreight += freight;
    totalAdvance += advance;
    totalCharges += charges;
    totalDeductions += deduction;
    totalPayments += payments;
    totalDueAmount += rowDue;

    const fromCity = f.from_location?.city || f.from_location?.name || '-';
    const toCity = f.to_location?.city || f.to_location?.name || '-';
    const route = `${fromCity} to ${toCity}`;

    const statusDisplay = rowDue === 0 
      ? 'Settled' 
      : (f.status === 'completed' ? 'Completed' : (f.status === 'in_progress' ? 'In Progress' : 'Planned'));

    return [
      index + 1,
      f.fera_number || `FR-${String(index + 1).padStart(6, '0')}`,
      formatShortDate(f.fera_date),
      f.trucks?.truck_number || '-',
      route,
      statusDisplay,
      rateDisplay,
      `Rs. ${freight.toLocaleString('en-IN')}`,
      advance > 0 ? `Rs. ${advance.toLocaleString('en-IN')}` : 'Rs. 0',
      charges > 0 ? `Rs. ${charges.toLocaleString('en-IN')}` : 'Rs. 0',
      deduction > 0 ? `Rs. ${deduction.toLocaleString('en-IN')}` : 'Rs. 0',
      payments > 0 ? `Rs. ${payments.toLocaleString('en-IN')}` : 'Rs. 0',
      `Rs. ${rowDue.toLocaleString('en-IN')}`,
    ];
  });

  // 4. Solid Blue Banner (Total Due | X Trips | Rs. Y)
  doc.setFillColor(...bluePrimary);
  doc.roundedRect(10, currentY, 190, 8, 1, 1, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Total Due', 14, currentY + 5.5);
  doc.text(`${totalTripsCount} Trips | Rs. ${totalDueAmount.toLocaleString('en-IN')}`, 196, currentY + 5.5, { align: 'right' });

  currentY += 12;

  // 5. Amount in words
  const words = numberToWordsINR(totalDueAmount);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...grayDark);
  const wordsPrefix = 'Amount in words : ';
  const totalWordsWidth = doc.getTextWidth(`${wordsPrefix}${words}`);
  const startWordsX = 105 - (totalWordsWidth / 2);
  doc.text(wordsPrefix, startWordsX, currentY);

  doc.setFont('helvetica', 'bold');
  doc.text(words, startWordsX + doc.getTextWidth(wordsPrefix), currentY);

  currentY += 4;

  // 6. Styled Table with single-line headers and precise column widths (Total width = 190mm)
  autoTable(doc, {
    startY: currentY,
    head: [
      [
        'S.No',
        'LR Number',
        'Date',
        'Truck No.',
        'Route',
        'Status',
        'Rate',
        'Freight',
        'Advance',
        'Charges',
        'Deduction',
        'Payments',
        'Total Due'
      ]
    ],
    body: tableRows,
    foot: [
      [
        '',
        'TOTAL',
        `${totalTripsCount} Trips`,
        '',
        '',
        '',
        '',
        `Rs. ${totalFreight.toLocaleString('en-IN')}`,
        `Rs. ${totalAdvance.toLocaleString('en-IN')}`,
        `Rs. ${totalCharges.toLocaleString('en-IN')}`,
        `Rs. ${totalDeductions.toLocaleString('en-IN')}`,
        `Rs. ${totalPayments.toLocaleString('en-IN')}`,
        `Rs. ${totalDueAmount.toLocaleString('en-IN')}`
      ]
    ],
    theme: 'grid',
    headStyles: {
      fillColor: bluePrimary,
      textColor: [255, 255, 255],
      fontSize: 6.8,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      cellPadding: { top: 2.5, bottom: 2.5, left: 0.6, right: 0.6 },
      overflow: 'visible',
    },
    bodyStyles: {
      fontSize: 6.5,
      textColor: [30, 41, 59],
      cellPadding: { top: 2, bottom: 2, left: 0.6, right: 0.6 },
      valign: 'middle',
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: bluePrimary,
      fontSize: 6.8,
      fontStyle: 'bold',
      halign: 'right',
      cellPadding: { top: 2.5, bottom: 2.5, left: 0.6, right: 0.6 },
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },                            // S.No
      1: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },        // LR Number
      2: { cellWidth: 14, halign: 'center' },                           // Date
      3: { cellWidth: 17, halign: 'center' },                           // Truck No.
      4: { cellWidth: 22, halign: 'left' },                             // Route
      5: { cellWidth: 12, halign: 'center' },                           // Status
      6: { cellWidth: 19, halign: 'center' },                           // Rate
      7: { cellWidth: 14, halign: 'right' },                            // Freight
      8: { cellWidth: 13, halign: 'right' },                            // Advance
      9: { cellWidth: 13, halign: 'right' },                            // Charges
      10: { cellWidth: 13, halign: 'right' },                           // Deduction
      11: { cellWidth: 13, halign: 'right' },                           // Payments
      12: { cellWidth: 14, halign: 'right', fontStyle: 'bold' },        // Total Due
    },
    margin: { left: 10, right: 10 },
    didDrawPage: (data) => {
      const pageNum = doc.internal.getNumberOfPages();
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${pageNum}`, 10, 290);
      doc.text(
        'This is an automatically generated summary. Powered by Veda Transport.',
        105,
        290,
        { align: 'center' }
      );
    },
  });

  const safePartyName = (party.name || 'Party').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `${safePartyName}_Bill_Statement_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
};

/**
 * Generates an exact Fera Group Bill PDF for a specific batch / group of trips
 */
export const generateFeraGroupBillPDF = async ({
  group,
  party,
  feras = [],
  asOfDate = new Date(),
  orgInfo = null,
}) => {
  if (!party && !group) {
    alert('Please provide group and party details.');
    return;
  }

  const effectiveOrg = await resolveDynamicOrgInfo(orgInfo);
  const effectiveParty = party || group?.parties || { name: 'Client' };

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Deep Navy Blue Theme (#0d0c3d)
  const bluePrimary = [13, 12, 61];
  const grayDark = [30, 41, 59];
  const grayLight = [248, 250, 252];

  // Load logo
  const logoData = await loadImageAsBase64(effectiveOrg.logoUrl);

  // 1. Header Section
  let currentY = 12;

  if (logoData) {
    try {
      doc.addImage(logoData, 'JPEG', 10, currentY, 28, 22);
    } catch {
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(10, currentY, 28, 22, 1, 1, 'F');
    }
  } else {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(10, currentY, 28, 22, 1, 1, 'F');
  }

  // Center Company Name
  doc.setTextColor(...grayDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(effectiveOrg.name.toUpperCase(), 105, currentY + 12, { align: 'center' });

  // Right Company Contact Info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(effectiveOrg.phone, 200, currentY + 4, { align: 'right' });
  doc.text(effectiveOrg.addressLine1, 200, currentY + 9, { align: 'right' });
  doc.text(effectiveOrg.addressLine2, 200, currentY + 14, { align: 'right' });
  doc.text(effectiveOrg.statePin, 200, currentY + 19, { align: 'right' });

  currentY += 26;

  // Blue Horizontal Separator Line
  doc.setDrawColor(...bluePrimary);
  doc.setLineWidth(0.8);
  doc.line(10, currentY, 200, currentY);

  currentY += 6;

  // 2. "Bill To" & Fera Group Metadata Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...grayDark);
  doc.text('Bill To', 10, currentY);

  // Group Info Badge Box (Top Right)
  const groupNumberStr = group?.group_number || 'FG-BATCH';
  const groupDateStr = group?.group_date ? formatShortDate(group.group_date) : formatShortDate(asOfDate);
  const groupStatusStr = (group?.status || 'open').toUpperCase();

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(130, currentY - 2, 70, 22, 1.5, 1.5, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(130, currentY - 2, 70, 22, 1.5, 1.5, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('FERA GROUP ORDER', 134, currentY + 3);

  doc.setFontSize(10.5);
  doc.setTextColor(...bluePrimary);
  doc.text(groupNumberStr, 134, currentY + 8.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Date: ${groupDateStr}  |  Status: ${groupStatusStr}`, 134, currentY + 13.5);

  if (group?.name || group?.description) {
    const descText = (group.name || group.description).slice(0, 35);
    doc.text(`Req: ${descText}`, 134, currentY + 18);
  }

  currentY += 5;
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text(String(effectiveParty.name || '').toUpperCase(), 10, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  if (effectiveParty.address && effectiveParty.address.trim()) {
    const addressLines = String(effectiveParty.address).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    addressLines.forEach((line) => {
      currentY += 4.5;
      doc.text(line, 10, currentY);
    });
  } else if (effectiveParty.city || effectiveParty.state) {
    currentY += 4.5;
    doc.text([effectiveParty.city, effectiveParty.state, effectiveParty.pincode].filter(Boolean).join(', '), 10, currentY);
  }

  if (effectiveParty.phone) {
    currentY += 4.5;
    const cleanPhone = String(effectiveParty.phone).startsWith('+91') ? effectiveParty.phone : `+91 ${effectiveParty.phone.trim()}`;
    doc.text(cleanPhone, 10, currentY);
  }

  if (effectiveParty.gst_number) {
    currentY += 4.5;
    doc.text(`GSTIN: ${effectiveParty.gst_number}`, 10, currentY);
  }

  currentY += 7;

  // Material Summary Distribution
  const matSummaryMap = {};
  feras.forEach((f) => {
    const matName = f.materials?.name || f.material?.name || 'Material';
    matSummaryMap[matName] = (matSummaryMap[matName] || 0) + 1;
  });
  const matSummaryText = Object.entries(matSummaryMap)
    .map(([mName, count]) => `${mName}: ${count} Feras`)
    .join('  •  ');

  if (matSummaryText) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...bluePrimary);
    doc.text(`Material Summary: ${matSummaryText}`, 10, currentY);
    currentY += 5;
  }

  // Ledger details text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...grayDark);
  doc.text(`Group Ledger Details as on ${formatShortDate(asOfDate)}`, 105, currentY, { align: 'center' });

  currentY += 3;

  // Calculations
  const totalTripsCount = feras.length;
  let totalFreight = 0;
  let totalAdvance = 0;
  let totalCharges = 0;
  let totalDeductions = 0;
  let totalPayments = 0;
  let totalDueAmount = 0;

  const tableRows = feras.map((f, index) => {
    const freight = parseFloat(f.agreed_amount) || 0;
    const weight = parseFloat(f.weight) || 0;
    const weightUnit = f.weight_unit || 'Tonne';

    const unitRate = parseFloat(f.rate_unit) > 0 
      ? parseFloat(f.rate_unit) 
      : (weight > 0 ? Math.round(freight / weight) : 0);
    const rateDisplay = (unitRate > 0 && weight > 0) 
      ? `Rs. ${unitRate} x ${weight} ${weightUnit}` 
      : `Rs. ${freight.toLocaleString('en-IN')}`;

    const advance = parseFloat(f.advance_amount) || 0;
    const charges = parseFloat(f.extra_charges) || 0;
    const deduction = parseFloat(f.deduction_amount) || 0;
    const payments = parseFloat(f.paid_amount) || parseFloat(f.received_amount) || 0;
    const rowDue = Math.max(0, (freight + charges) - (advance + deduction + payments));

    totalFreight += freight;
    totalAdvance += advance;
    totalCharges += charges;
    totalDeductions += deduction;
    totalPayments += payments;
    totalDueAmount += rowDue;

    const fromCity = f.from_location?.city || f.from_location?.name || '-';
    const toCity = f.to_location?.city || f.to_location?.name || '-';
    const route = `${fromCity} to ${toCity}`;

    const statusDisplay = rowDue === 0 
      ? 'Settled' 
      : (f.status === 'completed' ? 'Completed' : (f.status === 'in_progress' ? 'In Progress' : 'Planned'));

    return [
      index + 1,
      f.fera_number || `FR-${String(index + 1).padStart(6, '0')}`,
      formatShortDate(f.fera_date),
      f.trucks?.truck_number || '-',
      route,
      statusDisplay,
      rateDisplay,
      `Rs. ${freight.toLocaleString('en-IN')}`,
      advance > 0 ? `Rs. ${advance.toLocaleString('en-IN')}` : 'Rs. 0',
      charges > 0 ? `Rs. ${charges.toLocaleString('en-IN')}` : 'Rs. 0',
      deduction > 0 ? `Rs. ${deduction.toLocaleString('en-IN')}` : 'Rs. 0',
      payments > 0 ? `Rs. ${payments.toLocaleString('en-IN')}` : 'Rs. 0',
      `Rs. ${rowDue.toLocaleString('en-IN')}`,
    ];
  });

  // Solid Blue Banner
  doc.setFillColor(...bluePrimary);
  doc.roundedRect(10, currentY, 190, 8, 1, 1, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`Fera Group: ${groupNumberStr} (Total Due)`, 14, currentY + 5.5);
  doc.text(`${totalTripsCount} Trips | Rs. ${totalDueAmount.toLocaleString('en-IN')}`, 196, currentY + 5.5, { align: 'right' });

  currentY += 12;

  // Amount in words
  const words = numberToWordsINR(totalDueAmount);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...grayDark);
  const wordsPrefix = 'Amount in words : ';
  const totalWordsWidth = doc.getTextWidth(`${wordsPrefix}${words}`);
  const startWordsX = 105 - (totalWordsWidth / 2);
  doc.text(wordsPrefix, startWordsX, currentY);

  doc.setFont('helvetica', 'bold');
  doc.text(words, startWordsX + doc.getTextWidth(wordsPrefix), currentY);

  currentY += 4;

  // Table
  autoTable(doc, {
    startY: currentY,
    head: [
      [
        'S.No',
        'LR Number',
        'Date',
        'Truck No.',
        'Route',
        'Status',
        'Rate',
        'Freight',
        'Advance',
        'Charges',
        'Deduction',
        'Payments',
        'Total Due'
      ]
    ],
    body: tableRows,
    foot: [
      [
        '',
        'TOTAL',
        `${totalTripsCount} Trips`,
        '',
        '',
        '',
        '',
        `Rs. ${totalFreight.toLocaleString('en-IN')}`,
        `Rs. ${totalAdvance.toLocaleString('en-IN')}`,
        `Rs. ${totalCharges.toLocaleString('en-IN')}`,
        `Rs. ${totalDeductions.toLocaleString('en-IN')}`,
        `Rs. ${totalPayments.toLocaleString('en-IN')}`,
        `Rs. ${totalDueAmount.toLocaleString('en-IN')}`
      ]
    ],
    theme: 'grid',
    headStyles: {
      fillColor: bluePrimary,
      textColor: [255, 255, 255],
      fontSize: 6.8,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      cellPadding: { top: 2.5, bottom: 2.5, left: 0.6, right: 0.6 },
      overflow: 'visible',
    },
    bodyStyles: {
      fontSize: 6.5,
      textColor: [30, 41, 59],
      cellPadding: { top: 2, bottom: 2, left: 0.6, right: 0.6 },
      valign: 'middle',
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: bluePrimary,
      fontSize: 6.8,
      fontStyle: 'bold',
      halign: 'right',
      cellPadding: { top: 2.5, bottom: 2.5, left: 0.6, right: 0.6 },
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 17, halign: 'center' },
      4: { cellWidth: 22, halign: 'left' },
      5: { cellWidth: 12, halign: 'center' },
      6: { cellWidth: 19, halign: 'center' },
      7: { cellWidth: 14, halign: 'right' },
      8: { cellWidth: 13, halign: 'right' },
      9: { cellWidth: 13, halign: 'right' },
      10: { cellWidth: 13, halign: 'right' },
      11: { cellWidth: 13, halign: 'right' },
      12: { cellWidth: 14, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 10, right: 10 },
    didDrawPage: (data) => {
      const pageNum = doc.internal.getNumberOfPages();
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${pageNum}`, 10, 290);
      doc.text(
        `Fera Group: ${groupNumberStr} • Powered by Veda Transport.`,
        105,
        290,
        { align: 'center' }
      );
    },
  });

  const safePartyName = (effectiveParty.name || 'Party').replace(/[^a-zA-Z0-9]/g, '_');
  const safeGroupName = (groupNumberStr || 'Group').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `${safePartyName}_${safeGroupName}_Statement_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
};

/**
 * Generates a detailed Single Trip / Fera Voucher PDF Slip
 */
export const generateSingleFeraPDF = (fera, orgName = 'VEDA TRANSPORT') => {
  if (!fera) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = [15, 23, 42]; // Slate 900
  const accentColor = [217, 119, 6]; // Amber 600
  const textMuted = [100, 116, 139]; // Slate 500

  // 1. Header & Brand Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 32, 'F');

  // Accent bottom strip
  doc.setFillColor(...accentColor);
  doc.rect(0, 32, 210, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(orgName.toUpperCase(), 14, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text('Logistics & Fleet Management • Trip Dispatch Voucher', 14, 22);

  // Voucher Label Box (Right Top)
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(140, 7, 56, 18, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(245, 158, 11);
  doc.text('TRIP SLIP / FERA VOUCHER', 143, 13);
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(fera.fera_number || 'FERA-N/A', 143, 20);

  // 2. Trip Key Metadata (Grid Layout)
  const rev = parseFloat(fera.agreed_amount) || 0;
  const expList = fera.fera_expenses || [];
  const totalExpenses = expList.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const netProfit = rev - totalExpenses;
  const marginPercent = rev > 0 ? ((netProfit / rev) * 100).toFixed(1) : '0.0';

  let currentY = 40;

  // Overview Info Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, 182, 38, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(...textMuted);
  doc.setFont('helvetica', 'bold');

  // Row 1
  doc.text('Fera Number:', 18, currentY + 8);
  doc.text('Trip Date:', 74, currentY + 8);
  doc.text('Status:', 130, currentY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(String(fera.fera_number || '-'), 42, currentY + 8);
  doc.text(formatDate(fera.fera_date), 92, currentY + 8);

  const statusStr = (fera.status || 'in_progress').toUpperCase();
  if (statusStr === 'COMPLETED') {
    doc.setTextColor(16, 185, 129);
  } else if (statusStr === 'IN_PROGRESS') {
    doc.setTextColor(217, 119, 6);
  } else {
    doc.setTextColor(71, 85, 105);
  }
  doc.setFont('helvetica', 'bold');
  doc.text(statusStr, 145, currentY + 8);

  // Row 2
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textMuted);
  doc.text('Party / Client:', 18, currentY + 18);
  doc.text('Assigned Truck:', 74, currentY + 18);
  doc.text('Assigned Driver:', 130, currentY + 18);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(String(fera.parties?.name || '-'), 42, currentY + 18);
  doc.text(String(fera.trucks?.truck_number || '-'), 102, currentY + 18);
  doc.text(String(fera.drivers?.name || '-'), 158, currentY + 18);

  // Row 3
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textMuted);
  doc.text('Route Origin:', 18, currentY + 28);
  doc.text('Destination:', 74, currentY + 28);
  doc.text('Material / Qty:', 130, currentY + 28);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  const fromLoc = fera.from_location?.city || fera.from_location?.name || '-';
  const toLoc = fera.to_location?.city || fera.to_location?.name || '-';
  const matInfo = `${fera.materials?.name || '-'} (${fera.weight || 0} ${fera.weight_unit || 'ton'})`;

  doc.text(fromLoc, 42, currentY + 28);
  doc.text(toLoc, 97, currentY + 28);
  doc.text(matInfo, 155, currentY + 28);

  // 3. Financial KPI Summary Cards
  currentY += 44;

  const cardW = 42.5;
  const cardH = 20;

  // Card 1: Revenue
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, currentY, cardW, cardH, 2, 2, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textMuted);
  doc.text('AGREED BILLING (REV)', 18, currentY + 6);
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrency(rev), 18, currentY + 14);

  // Card 2: Expenses
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(60.5, currentY, cardW, cardH, 2, 2, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(225, 29, 72);
  doc.text('ROUTE EXPENSES', 64.5, currentY + 6);
  doc.setFontSize(10);
  doc.text(formatCurrency(totalExpenses), 64.5, currentY + 14);

  // Card 3: Driver Commission
  const driverCommCardAmt = parseFloat(fera.driver_commission) || parseFloat(expList.find((e) => e.expense_type === 'driver_commission')?.amount) || 0;
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(107, currentY, cardW, cardH, 2, 2, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 83, 9);
  doc.text('DRIVER COMMISSION', 111, currentY + 6);
  doc.setFontSize(10);
  doc.text(formatCurrency(driverCommCardAmt), 111, currentY + 14);

  // Card 4: Net Profit
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(153.5, currentY, cardW, cardH, 2, 2, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(5, 150, 105);
  doc.text(`EST. NET PROFIT (${marginPercent}%)`, 157.5, currentY + 6);
  doc.setFontSize(10);
  doc.text(formatCurrency(netProfit), 157.5, currentY + 14);

  // 4. Itemized Route Expenses Table
  currentY += 26;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Trip Route Expenses Breakdown', 14, currentY);

  const expenseTableRows = expList.map((exp, idx) => {
    const typeClean = (exp.expense_type || 'other')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const qtyStr = exp.quantity ? `${exp.quantity} ${exp.unit || ''}`.trim() : '-';
    const rateStr = exp.rate ? formatCurrency(exp.rate) : '-';
    const amtStr = formatCurrency(exp.amount);

    return [
      idx + 1,
      typeClean,
      exp.description || '-',
      qtyStr,
      rateStr,
      amtStr,
    ];
  });

  if (expenseTableRows.length === 0) {
    expenseTableRows.push(['1', 'Route Expenses', 'No itemized expenses logged', '-', '-', formatCurrency(0)]);
  }

  autoTable(doc, {
    startY: currentY + 4,
    head: [['#', 'Expense Category', 'Description / Details', 'Quantity', 'Rate', 'Amount (INR)']],
    body: expenseTableRows,
    foot: [['', 'TOTAL ROUTE EXPENSES', '', '', '', formatCurrency(totalExpenses)]],
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [51, 65, 85],
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontSize: 9,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 40 },
      2: { cellWidth: 52 },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  // 5. Notes & Signatures Box
  const finalY = doc.lastAutoTable.finalY + 10;

  if (finalY < 240) {
    // Remarks Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, finalY, 105, 30, 2, 2, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textMuted);
    doc.text('REMARKS / TRIP INSTRUCTIONS:', 18, finalY + 6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const splitNotes = doc.splitTextToSize(fera.notes || 'No specific handling instructions recorded.', 97);
    doc.text(splitNotes, 18, finalY + 12);

    // Attached Weight Slip Indicator
    const docItem = fera.fera_documents?.[0];
    if (docItem?.file_url) {
      doc.setFontSize(7.5);
      doc.setTextColor(217, 119, 6);
      doc.setFont('helvetica', 'bold');
      doc.text(`* Weight Slip Attached (${docItem.file_name || 'Verified'})`, 18, finalY + 26);
    }

    // Signatures Area
    doc.roundedRect(125, finalY, 71, 30, 2, 2, 'FD');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textMuted);
    doc.text('AUTHORIZED SIGNATORY', 130, finalY + 6);

    doc.setDrawColor(203, 213, 225);
    doc.line(130, finalY + 22, 190, finalY + 22);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('Receiver / Fleet Manager Stamp & Sign', 130, finalY + 26);
  }

  // Footer on bottom
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Generated on ${new Date().toLocaleString('en-IN')} | ${orgName} Dispatch System`,
    14,
    290
  );
  doc.text('Page 1 of 1', 196, 290, { align: 'right' });

  // Save PDF
  const safeFilename = `${fera.fera_number || 'Fera'}_Slip_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(safeFilename);
};

/**
 * Generates a Multi-page PDF where each selected Fera gets its own Full Trip Slip Voucher Page
 */
export const generateMultiFeraVouchersPDF = (feras = [], orgName = 'VEDA TRANSPORT') => {
  if (!feras || feras.length === 0) {
    alert('No trip records selected.');
    return;
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = [15, 23, 42]; // Slate 900
  const accentColor = [217, 119, 6]; // Amber 600
  const textMuted = [100, 116, 139]; // Slate 500

  feras.forEach((fera, pageIdx) => {
    if (pageIdx > 0) {
      doc.addPage();
    }

    // 1. Header & Brand Banner
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 32, 'F');

    // Accent bottom strip
    doc.setFillColor(...accentColor);
    doc.rect(0, 32, 210, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(orgName.toUpperCase(), 14, 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225);
    doc.text('Logistics & Fleet Management • Trip Dispatch Voucher', 14, 22);

    // Voucher Label Box (Right Top)
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(138, 7, 58, 18, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(245, 158, 11);
    doc.text('TRIP SLIP / FERA VOUCHER', 141, 13);
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(fera.fera_number || 'FERA-N/A', 141, 20);

    // 2. Trip Key Metadata (Grid Layout)
    const rev = parseFloat(fera.agreed_amount) || 0;
    const expList = fera.fera_expenses || [];
    const totalExpenses = expList.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
    const netProfit = rev - totalExpenses;
    const marginPercent = rev > 0 ? ((netProfit / rev) * 100).toFixed(1) : '0.0';

    let currentY = 40;

    // Overview Info Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, currentY, 182, 38, 2, 2, 'FD');

    doc.setFontSize(9);
    doc.setTextColor(...textMuted);
    doc.setFont('helvetica', 'bold');

    // Row 1
    doc.text('Fera Number:', 18, currentY + 8);
    doc.text('Trip Date:', 74, currentY + 8);
    doc.text('Status:', 130, currentY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(String(fera.fera_number || '-'), 42, currentY + 8);
    doc.text(formatDate(fera.fera_date), 92, currentY + 8);

    const statusStr = (fera.status || 'in_progress').toUpperCase();
    if (statusStr === 'COMPLETED') {
      doc.setTextColor(16, 185, 129);
    } else if (statusStr === 'IN_PROGRESS') {
      doc.setTextColor(217, 119, 6);
    } else {
      doc.setTextColor(71, 85, 105);
    }
    doc.setFont('helvetica', 'bold');
    doc.text(statusStr, 145, currentY + 8);

    // Row 2
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textMuted);
    doc.text('Party / Client:', 18, currentY + 18);
    doc.text('Assigned Truck:', 74, currentY + 18);
    doc.text('Assigned Driver:', 130, currentY + 18);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(String(fera.parties?.name || '-'), 42, currentY + 18);
    doc.text(String(fera.trucks?.truck_number || '-'), 102, currentY + 18);
    doc.text(String(fera.drivers?.name || '-'), 158, currentY + 18);

    // Row 3
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textMuted);
    doc.text('Route Origin:', 18, currentY + 28);
    doc.text('Destination:', 74, currentY + 28);
    doc.text('Material / Qty:', 130, currentY + 28);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const fromLoc = fera.from_location?.city || fera.from_location?.name || '-';
    const toLoc = fera.to_location?.city || fera.to_location?.name || '-';
    const matInfo = `${fera.materials?.name || '-'} (${fera.weight || 0} ${fera.weight_unit || 'ton'})`;

    doc.text(fromLoc, 42, currentY + 28);
    doc.text(toLoc, 97, currentY + 28);
    doc.text(matInfo, 155, currentY + 28);

    // 3. Financial KPI Summary Cards
    currentY += 44;

    const cardW = 42.5;
    const cardH = 20;

    // Card 1: Revenue
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, currentY, cardW, cardH, 2, 2, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textMuted);
    doc.text('AGREED BILLING (REV)', 18, currentY + 6);
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(formatCurrency(rev), 18, currentY + 14);

    // Card 2: Expenses
    doc.setFillColor(254, 242, 242);
    doc.roundedRect(60.5, currentY, cardW, cardH, 2, 2, 'F');
    doc.setFontSize(7.5);
    doc.setTextColor(225, 29, 72);
    doc.text('ROUTE EXPENSES', 64.5, currentY + 6);
    doc.setFontSize(10);
    doc.text(formatCurrency(totalExpenses), 64.5, currentY + 14);

    // Card 3: Driver Commission
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(107, currentY, cardW, cardH, 2, 2, 'F');
    doc.setFontSize(7.5);
    doc.setTextColor(180, 83, 9);
    doc.text('DRIVER COMMISSION', 111, currentY + 6);
    doc.setFontSize(10);
    doc.text(formatCurrency(fera.driver_commission || 0), 111, currentY + 14);

    // Card 4: Net Profit
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(153.5, currentY, cardW, cardH, 2, 2, 'F');
    doc.setFontSize(7.5);
    doc.setTextColor(5, 150, 105);
    doc.text(`EST. NET PROFIT (${marginPercent}%)`, 157.5, currentY + 6);
    doc.setFontSize(10);
    doc.text(formatCurrency(netProfit), 157.5, currentY + 14);

    // 4. Itemized Route Expenses Table
    currentY += 26;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Trip Route Expenses Breakdown', 14, currentY);

    const expenseTableRows = expList.map((exp, idx) => {
      const typeClean = (exp.expense_type || 'other')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      const qtyStr = exp.quantity ? `${exp.quantity} ${exp.unit || ''}`.trim() : '-';
      const rateStr = exp.rate ? formatCurrency(exp.rate) : '-';
      const amtStr = formatCurrency(exp.amount);

      return [
        idx + 1,
        typeClean,
        exp.description || '-',
        qtyStr,
        rateStr,
        amtStr,
      ];
    });

    if (expenseTableRows.length === 0) {
      expenseTableRows.push(['1', 'Route Expenses', 'No itemized expenses logged', '-', '-', formatCurrency(0)]);
    }

    autoTable(doc, {
      startY: currentY + 4,
      head: [['#', 'Expense Category', 'Description / Details', 'Quantity', 'Rate', 'Amount (INR)']],
      body: expenseTableRows,
      foot: [['', 'TOTAL ROUTE EXPENSES', '', '', '', formatCurrency(totalExpenses)]],
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 8.5,
        fontStyle: 'bold',
        halign: 'left',
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [51, 65, 85],
      },
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: [15, 23, 42],
        fontSize: 9,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 40 },
        2: { cellWidth: 52 },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 30, halign: 'right' },
      },
      margin: { left: 14, right: 14 },
    });

    // 5. Notes & Signatures Box
    const finalY = doc.lastAutoTable.finalY + 10;

    if (finalY < 240) {
      // Remarks Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, finalY, 105, 30, 2, 2, 'FD');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...textMuted);
      doc.text('REMARKS / TRIP INSTRUCTIONS:', 18, finalY + 6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const splitNotes = doc.splitTextToSize(fera.notes || 'No specific handling instructions recorded.', 97);
      doc.text(splitNotes, 18, finalY + 12);

      // Attached Weight Slip Indicator
      const docItem = fera.fera_documents?.[0];
      if (docItem?.file_url) {
        doc.setFontSize(7.5);
        doc.setTextColor(217, 119, 6);
        doc.setFont('helvetica', 'bold');
        doc.text(`* Weight Slip Attached (${docItem.file_name || 'Verified'})`, 18, finalY + 26);
      }

      // Signatures Area
      doc.roundedRect(125, finalY, 71, 30, 2, 2, 'FD');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...textMuted);
      doc.text('AUTHORIZED SIGNATORY', 130, finalY + 6);

      doc.setDrawColor(203, 213, 225);
      doc.line(130, finalY + 22, 190, finalY + 22);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text('Receiver / Fleet Manager Stamp & Sign', 130, finalY + 26);
    }

    // Footer on bottom
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Generated on ${new Date().toLocaleString('en-IN')} | ${orgName} Dispatch System`,
      14,
      290
    );
    doc.text(`Page ${pageIdx + 1} of ${feras.length}`, 196, 290, { align: 'right' });
  });

  // Save PDF
  const safeFilename = `${orgName.replace(/\s+/g, '_')}_Selected_Fera_Vouchers_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(safeFilename);
};

/**
 * Generates a comprehensive Filtered / Selected Trips Statement & Ledger PDF
 */
export const generateFilteredFerasPDF = (
  feras = [],
  filterMeta = { status: 'All', searchTerm: '', dateRange: '' },
  orgName = 'VEDA TRANSPORT',
  customTitle = 'TRIP DISPATCH & FINANCIAL STATEMENT'
) => {
  if (!feras || feras.length === 0) {
    alert('No trip records available to export.');
    return;
  }

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = [15, 23, 42]; // Slate 900
  const accentColor = [217, 119, 6]; // Amber 600

  // 1. Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 297, 26, 'F');

  doc.setFillColor(...accentColor);
  doc.rect(0, 26, 297, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(orgName.toUpperCase(), 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`${customTitle} • Fleet Operations & Expense Summary`, 14, 18);

  // Filter Subtitle / Timestamp (Right)
  doc.setFontSize(8);
  doc.setTextColor(245, 158, 11);
  const filterDesc = `Filter: Status [${filterMeta.status || 'All'}]${filterMeta.searchTerm ? ` | Search: "${filterMeta.searchTerm}"` : ''}`;
  doc.text(filterDesc, 283, 11, { align: 'right' });
  doc.setTextColor(203, 213, 225);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 283, 18, { align: 'right' });

  // 2. Aggregate KPI Calculations
  const totalCount = feras.length;
  const totalRevenue = feras.reduce((acc, f) => acc + (parseFloat(f.agreed_amount) || 0), 0);
  const totalExpenses = feras.reduce((acc, f) => {
    return acc + (f.fera_expenses || []).reduce((sum, curr) => sum + (parseFloat(curr.amount) || 0), 0);
  }, 0);
  const totalNetProfit = totalRevenue - totalExpenses;
  const avgMargin = totalRevenue > 0 ? ((totalNetProfit / totalRevenue) * 100).toFixed(1) : '0.0';

  // KPI Summary Bar
  const kpiY = 32;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, kpiY, 269, 14, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('TOTAL TRIPS:', 18, kpiY + 9);
  doc.setTextColor(15, 23, 42);
  doc.text(`${totalCount}`, 43, kpiY + 9);

  doc.setTextColor(71, 85, 105);
  doc.text('TOTAL REVENUE:', 65, kpiY + 9);
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrency(totalRevenue), 94, kpiY + 9);

  doc.setTextColor(225, 29, 72);
  doc.text('TOTAL EXPENSES:', 135, kpiY + 9);
  doc.text(formatCurrency(totalExpenses), 167, kpiY + 9);

  doc.setTextColor(5, 150, 105);
  doc.text(`NET PROFIT (${avgMargin}%):`, 208, kpiY + 9);
  doc.text(formatCurrency(totalNetProfit), 242, kpiY + 9);

  // 3. Table Rows
  const tableRows = feras.map((f, index) => {
    const rev = parseFloat(f.agreed_amount) || 0;
    const exp = (f.fera_expenses || []).reduce((sum, curr) => sum + (parseFloat(curr.amount) || 0), 0);
    const profit = rev - exp;
    const fromCity = f.from_location?.city || f.from_location?.name || '-';
    const toCity = f.to_location?.city || f.to_location?.name || '-';
    const partyName = f.parties?.name || '-';
    const truckNo = f.trucks?.truck_number || '-';
    const driverName = f.drivers?.name || '-';
    const matInfo = `${f.materials?.name || '-'} (${f.weight || 0} ${f.weight_unit || 't'})`;
    const statusClean = (f.status || 'in_progress').replace(/_/g, ' ').toUpperCase();

    return [
      index + 1,
      f.fera_number || '-',
      formatDate(f.fera_date),
      partyName,
      `${fromCity} -> ${toCity}`,
      `${truckNo} / ${driverName}`,
      matInfo,
      formatCurrency(rev),
      formatCurrency(exp),
      formatCurrency(profit),
      statusClean,
    ];
  });

  autoTable(doc, {
    startY: 50,
    head: [
      [
        '#',
        'Fera No.',
        'Date',
        'Party / Client',
        'Route (Origin -> Dest)',
        'Truck / Driver',
        'Material & Wt',
        'Revenue (₹)',
        'Expenses (₹)',
        'Profit (₹)',
        'Status',
      ],
    ],
    body: tableRows,
    foot: [
      [
        '',
        'GRAND TOTAL',
        `${totalCount} Trips`,
        '',
        '',
        '',
        '',
        formatCurrency(totalRevenue),
        formatCurrency(totalExpenses),
        formatCurrency(totalNetProfit),
        `Margin: ${avgMargin}%`,
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [51, 65, 85],
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontSize: 8,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 24, fontStyle: 'bold' },
      2: { cellWidth: 20 },
      3: { cellWidth: 32 },
      4: { cellWidth: 38 },
      5: { cellWidth: 34 },
      6: { cellWidth: 28 },
      7: { cellWidth: 23, halign: 'right' },
      8: { cellWidth: 23, halign: 'right' },
      9: { cellWidth: 23, halign: 'right', fontStyle: 'bold' },
      10: { cellWidth: 16, halign: 'center' },
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      const str = `Page ${doc.internal.getNumberOfPages()}`;
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `${orgName} • Trip Dispatch Report • Filter: ${filterMeta.status || 'All'}`,
        14,
        202
      );
      doc.text(str, 283, 202, { align: 'right' });
    },
  });

  const filename = `${orgName.replace(/\s+/g, '_')}_Fera_Report_${filterMeta.status || 'All'}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
};
