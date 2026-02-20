
import React, { useRef, useState } from 'react';
import { Download, Mail, X, CheckCircle2, Loader2, IndianRupee, Printer } from 'lucide-react';
import { Booking, Specialist, User } from '../types';

interface EBillProps {
  booking: Booking;
  specialist: Specialist;
  user: User;
  onClose: () => void;
}

export function EBill({ booking, specialist, user, onClose }: EBillProps) {
  const billRef = useRef<HTMLDivElement>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailInput, setEmailInput] = useState(user.email || '');
  const [showEmailInput, setShowEmailInput] = useState(false);

  const finalTotal = booking.finalTotal || booking.totalValue;
  const baseCharge = booking.totalValue;
  const extraCharges = booking.extraCharges || [];
  const extraTotal = extraCharges.reduce((s, c) => s + c.amount, 0);
  const paidAt = booking.paidAt ? new Date(booking.paidAt) : new Date();
  const billNo = `BILL-${booking.id.slice(-8).toUpperCase()}`;

  const handleDownload = () => {
    // Build a self-contained HTML string and use print-to-PDF
    const billHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice ${billNo}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; color: #111; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #000; padding-bottom: 24px; }
    .brand { font-size: 28px; font-weight: 900; letter-spacing: -1px; }
    .brand span { color: #4169E1; }
    .bill-meta { text-align: right; }
    .bill-meta .bill-no { font-size: 20px; font-weight: 700; }
    .bill-meta .date { font-size: 13px; color: #666; margin-top: 4px; }
    .status-badge { display: inline-block; background: #dcfce7; color: #166534; border-radius: 20px; padding: 4px 14px; font-size: 12px; font-weight: 700; margin-top: 8px; }
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 36px; }
    .party-label { font-size: 11px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .party-name { font-size: 16px; font-weight: 700; }
    .party-detail { font-size: 13px; color: #555; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead tr { background: #f3f4f6; }
    th { padding: 10px 14px; text-align: left; font-size: 12px; font-weight: 700; color: #555; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 12px 14px; font-size: 14px; border-bottom: 1px solid #f0f0f0; }
    .amount-col { text-align: right; }
    .total-row td { font-weight: 700; font-size: 16px; border-top: 2px solid #000; border-bottom: none; padding-top: 16px; }
    .total-row .amount-col { color: #4169E1; font-size: 20px; }
    .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
    .footer-note { font-size: 12px; color: #999; }
    .booking-id { font-size: 12px; color: #aaa; font-family: monospace; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">servi<span>zo</span></div>
      <div style="font-size:13px;color:#666;margin-top:4px;">Professional Home Services</div>
    </div>
    <div class="bill-meta">
      <div class="bill-no">${billNo}</div>
      <div class="date">Date: ${paidAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
      <div class="status-badge">PAID</div>
    </div>
  </div>

  <div class="parties">
    <div>
      <div class="party-label">Billed To</div>
      <div class="party-name">${user.name}</div>
      <div class="party-detail">${user.email}</div>
      ${booking.serviceAddress ? `<div class="party-detail">${booking.serviceAddress}</div>` : ''}
    </div>
    <div>
      <div class="party-label">Service Provider</div>
      <div class="party-name">${specialist.name}</div>
      <div class="party-detail">${specialist.title}</div>
      <div class="party-detail">${specialist.location}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="amount-col">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <strong>${specialist.category} Service — Base Visit Charge</strong><br/>
          <span style="font-size:12px;color:#666;">${specialist.title}</span>
        </td>
        <td class="amount-col">₹${baseCharge.toLocaleString('en-IN')}</td>
      </tr>
      ${extraCharges.map(c => `
      <tr>
        <td>
          ${c.description}<br/>
          <span style="font-size:12px;color:#666;">Additional charge — ${new Date(c.addedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
        </td>
        <td class="amount-col">₹${c.amount.toLocaleString('en-IN')}</td>
      </tr>`).join('')}
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td>Total Amount Paid</td>
        <td class="amount-col">₹${finalTotal.toLocaleString('en-IN')}</td>
      </tr>
    </tfoot>
  </table>

  <div class="footer">
    <div>
      <div class="footer-note">Thank you for choosing Servizo.</div>
      <div class="footer-note" style="margin-top:4px;">Payment confirmed on ${paidAt.toLocaleString('en-IN')}</div>
    </div>
    <div class="booking-id">Booking ID: ${booking.id}</div>
  </div>
</body>
</html>`;

    const blob = new Blob([billHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) {
      win.addEventListener('load', () => {
        setTimeout(() => {
          win.print();
          URL.revokeObjectURL(url);
        }, 500);
      });
    }
  };

  const handleSendEmail = async () => {
    if (!emailInput.trim()) return;
    setEmailSending(true);
    // Simulate email send (in production, call a backend endpoint)
    await new Promise(r => setTimeout(r, 1500));
    setEmailSending(false);
    setEmailSent(true);
    setShowEmailInput(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Payment Receipt</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Bill preview */}
        <div ref={billRef} className="p-6">
          {/* Brand + bill no */}
          <div className="flex justify-between items-start mb-6 pb-5 border-b border-gray-100">
            <div>
              <div className="text-2xl font-black tracking-tight">servi<span className="text-[#4169E1]">zo</span></div>
              <p className="text-xs text-gray-400 mt-0.5">Professional Home Services</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">{billNo}</p>
              <p className="text-xs text-gray-400 mt-0.5">{paidAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              <span className="inline-block mt-1 px-2.5 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold rounded-full">PAID</span>
            </div>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Billed To</p>
              <p className="text-sm font-bold text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Service Provider</p>
              <p className="text-sm font-bold text-gray-900">{specialist.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{specialist.title}</p>
              <p className="text-xs text-gray-400">{specialist.location}</p>
            </div>
          </div>

          {/* Line items */}
          <div className="rounded-xl border border-gray-100 overflow-hidden mb-4">
            <div className="bg-gray-50 px-4 py-2.5 grid grid-cols-[1fr_auto] gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Description</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Amount</span>
            </div>
            <div className="divide-y divide-gray-50">
              <div className="px-4 py-3 grid grid-cols-[1fr_auto] gap-2 items-start">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{specialist.category} Service — Base Visit</p>
                  <p className="text-xs text-gray-400 mt-0.5">{specialist.title}</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">₹{baseCharge.toLocaleString('en-IN')}</p>
              </div>
              {extraCharges.map(c => (
                <div key={c.id} className="px-4 py-3 grid grid-cols-[1fr_auto] gap-2 items-start">
                  <div>
                    <p className="text-sm text-gray-700">{c.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Additional charge</p>
                  </div>
                  <p className="text-sm text-amber-600 font-semibold">+₹{c.amount.toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
            {/* Total row */}
            <div className="px-4 py-3 border-t-2 border-gray-900 bg-gray-50 grid grid-cols-[1fr_auto] gap-2 items-center">
              <span className="text-sm font-bold text-gray-900">Total Paid</span>
              <span className="text-lg font-black text-[#4169E1]">₹{finalTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <p className="text-[10px] text-gray-400 text-center">Booking ID: {booking.id} · Payment confirmed {paidAt.toLocaleString('en-IN')}</p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 space-y-3">
          {/* Email section */}
          {showEmailInput ? (
            <div className="flex gap-2">
              <input
                type="email"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                placeholder="Enter email address"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#4169E1]"
              />
              <button
                onClick={handleSendEmail}
                disabled={emailSending || !emailInput.trim()}
                className="px-4 py-2.5 bg-[#4169E1] text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {emailSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                Send
              </button>
              <button onClick={() => setShowEmailInput(false)} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : emailSent ? (
            <div className="flex items-center justify-center gap-2 py-2.5 bg-green-50 border border-green-100 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-green-700">Bill sent to {emailInput}</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors"
              >
                <Printer className="w-4 h-4" /> Download / Print
              </button>
              <button
                onClick={() => setShowEmailInput(true)}
                className="flex items-center justify-center gap-2 py-3 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                <Mail className="w-4 h-4" /> Send to Email
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
