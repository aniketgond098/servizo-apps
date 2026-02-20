import { Booking, Specialist, User } from '../types';

export interface BillData {
  booking: Booking;
  specialist: Specialist;
  user: User;
}

/** Generates a printable HTML string for the e-bill */
export function buildBillHTML(data: BillData): string {
  const { booking, specialist, user } = data;
  const base = booking.totalValue;
  const extras = booking.extraCharges || [];
  const extrasTotal = extras.reduce((s, c) => s + c.amount, 0);
  const total = booking.finalTotal || base;
  const paidAt = booking.paidAt ? new Date(booking.paidAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN');
  const bookedAt = new Date(booking.createdAt).toLocaleString('en-IN');

  const extraRows = extras.map(c => `
    <tr>
      <td style="padding:8px 12px;color:#555;font-size:13px;">${c.description}</td>
      <td style="padding:8px 12px;text-align:right;color:#b45309;font-size:13px;">+₹${c.amount.toLocaleString('en-IN')}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Servizo E-Bill — ${booking.id}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Segoe UI',Arial,sans-serif;background:#f4f4f5;display:flex;justify-content:center;padding:32px 16px;}
  .bill{background:#fff;width:100%;max-width:620px;border-radius:16px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,0.10);}
  .header{background:#000;color:#fff;padding:32px 36px 24px;}
  .header h1{font-size:26px;font-weight:700;letter-spacing:-0.5px;}
  .header p{color:#aaa;font-size:13px;margin-top:4px;}
  .badge{display:inline-block;background:#22c55e;color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;margin-top:12px;letter-spacing:0.5px;}
  .section{padding:24px 36px;border-bottom:1px solid #f0f0f0;}
  .section:last-child{border-bottom:none;}
  .label{font-size:11px;font-weight:600;color:#999;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:14px;}
  .row{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;}
  .row .key{font-size:13px;color:#666;}
  .row .val{font-size:13px;font-weight:600;color:#111;text-align:right;max-width:60%;}
  table{width:100%;border-collapse:collapse;}
  .tbl-head th{background:#f8f8f8;padding:8px 12px;font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.6px;text-align:left;}
  .tbl-head th:last-child{text-align:right;}
  .base-row td{padding:10px 12px;font-size:13px;color:#333;border-bottom:1px solid #f0f0f0;}
  .base-row td:last-child{text-align:right;font-weight:600;}
  .total-row{background:#f8f8f8;}
  .total-row td{padding:12px 12px;font-size:15px;font-weight:700;color:#111;}
  .total-row td:last-child{text-align:right;color:#4169E1;}
  .footer{background:#fafafa;padding:20px 36px;text-align:center;}
  .footer p{font-size:12px;color:#aaa;}
  .footer strong{color:#555;}
  @media print{body{background:#fff;padding:0;}  .bill{box-shadow:none;border-radius:0;max-width:100%;}}
</style>
</head>
<body>
<div class="bill">
  <div class="header">
    <h1>Servizo</h1>
    <p>E-Bill / Tax Invoice</p>
    <div class="badge">PAID</div>
  </div>

  <div class="section">
    <div class="label">Invoice Details</div>
    <div class="row"><span class="key">Invoice No.</span><span class="val">${booking.id}</span></div>
    <div class="row"><span class="key">Booking Date</span><span class="val">${bookedAt}</span></div>
    <div class="row"><span class="key">Payment Date</span><span class="val">${paidAt}</span></div>
    <div class="row"><span class="key">Payment Status</span><span class="val" style="color:#16a34a;">Paid</span></div>
  </div>

  <div class="section">
    <div class="label">Customer</div>
    <div class="row"><span class="key">Name</span><span class="val">${user.name}</span></div>
    <div class="row"><span class="key">Email</span><span class="val">${user.email}</span></div>
    ${booking.serviceAddress ? `<div class="row"><span class="key">Service Address</span><span class="val">${booking.serviceAddress}</span></div>` : ''}
  </div>

  <div class="section">
    <div class="label">Service Provider</div>
    <div class="row"><span class="key">Name</span><span class="val">${specialist.name}</span></div>
    <div class="row"><span class="key">Speciality</span><span class="val">${specialist.title}</span></div>
    <div class="row"><span class="key">Category</span><span class="val">${specialist.category}</span></div>
    <div class="row"><span class="key">Location</span><span class="val">${specialist.location}</span></div>
  </div>

  <div class="section">
    <div class="label">Charges</div>
    <table>
      <thead class="tbl-head">
        <tr><th>Description</th><th>Amount</th></tr>
      </thead>
      <tbody>
        <tr class="base-row">
          <td>Base Service Charge</td>
          <td>₹${base.toLocaleString('en-IN')}</td>
        </tr>
        ${extraRows}
        <tr class="total-row">
          <td>Total Paid</td>
          <td>₹${total.toLocaleString('en-IN')}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="footer">
    <p>Thank you for using <strong>Servizo</strong>. This is a computer-generated invoice.</p>
    <p style="margin-top:6px;">For support, contact us at <strong>support@servizo.in</strong></p>
  </div>
</div>
</body>
</html>`;
}

/** Opens a print dialog for the bill (download as PDF via browser print-to-PDF) */
export function downloadBillAsPDF(data: BillData) {
  const html = buildBillHTML(data);
  const win = window.open('', '_blank', 'width=700,height=900');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}

/** Sends the bill HTML to the user's email via mailto: */
export function emailBill(data: BillData) {
  const { booking, specialist, user } = data;
  const total = booking.finalTotal || booking.totalValue;
  const subject = encodeURIComponent(`Servizo E-Bill — Booking ${booking.id}`);
  const body = encodeURIComponent(
    `Hi ${user.name},\n\nThank you for using Servizo!\n\nHere are your booking details:\n\n` +
    `Booking ID: ${booking.id}\n` +
    `Service Provider: ${specialist.name} (${specialist.category})\n` +
    `Amount Paid: ₹${total.toLocaleString('en-IN')}\n` +
    `Payment Date: ${booking.paidAt ? new Date(booking.paidAt).toLocaleString('en-IN') : 'N/A'}\n\n` +
    `For a full invoice, please visit your dashboard and open the booking.\n\n` +
    `Regards,\nServizo Team\nsupport@servizo.in`
  );
  window.open(`mailto:${user.email}?subject=${subject}&body=${body}`);
}
