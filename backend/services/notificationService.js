// ================================================================
//  Notification Service — Nodemailer + Twilio WhatsApp + SMS
// ================================================================

const nodemailer = require('nodemailer');

// ── Email Transporter ────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// ── HTML Email Templates ─────────────────────────────────────────
const EMAIL_TEMPLATES = {
  APPLICATION_RECEIVED: d => ({
    subject: `SBI Credit Card Application Received — ${d.applicationId}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
      <div style="background:#0B1F45;padding:24px;text-align:center;">
        <h1 style="color:#F5A623;margin:0;font-size:24px;font-weight:900;">State Bank of India</h1>
        <p style="color:rgba(255,255,255,.6);margin:4px 0 0;font-size:13px;">Credit Card Division</p>
      </div>
      <div style="padding:28px;background:#fafafa;">
        <p style="font-size:16px;color:#111;">Dear <strong>${d.name}</strong>,</p>
        <p style="color:#374151;">Thank you for applying for an <strong>SBI Credit Card</strong>. Your application has been received successfully.</p>
        <div style="background:#fff;border-left:4px solid #1A56DB;padding:16px 20px;border-radius:0 8px 8px 0;margin:20px 0;box-shadow:0 1px 4px rgba(0,0,0,.08);">
          <p style="margin:0;font-size:14px;"><strong>Application ID:</strong> <span style="color:#1A56DB;font-weight:800;">${d.applicationId}</span></p>
          <p style="margin:8px 0 0;font-size:14px;"><strong>Recommended Card:</strong> ${d.card || 'Pending'}</p>
          <p style="margin:8px 0 0;font-size:14px;"><strong>Status:</strong> <span style="color:#059669;">Under Review</span></p>
        </div>
        <p style="color:#374151;">Our team will review your application within <strong>2–3 business days</strong>. You'll receive updates via email and WhatsApp.</p>
        <div style="text-align:center;margin-top:24px;">
          <a href="${process.env.FRONTEND_URL}/track/${d.applicationId}" style="background:#1A56DB;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">Track Your Application →</a>
        </div>
      </div>
      <div style="background:#0B1F45;padding:14px;text-align:center;color:rgba(255,255,255,.4);font-size:11px;">
        SBI Credit Card Division • 1800-11-2211 • creditcard@sbi.co.in<br/>This is an automated message. Do not reply.
      </div>
    </div>`,
  }),

  APPLICATION_APPROVED: d => ({
    subject: `🎉 Your SBI ${d.card} is Approved! — ${d.applicationId}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #a7f3d0;border-radius:12px;overflow:hidden;">
      <div style="background:#059669;padding:24px;text-align:center;">
        <div style="font-size:48px;">🎉</div>
        <h1 style="color:#fff;margin:8px 0 0;font-size:22px;">Congratulations!</h1>
      </div>
      <div style="padding:28px;">
        <p style="font-size:16px;">Dear <strong>${d.name}</strong>,</p>
        <p>We're delighted to inform you that your <strong>SBI ${d.card}</strong> application has been <strong style="color:#059669;">APPROVED!</strong></p>
        <div style="background:#D1FAE5;padding:16px;border-radius:8px;margin:20px 0;">
          <p style="margin:0;"><strong>Application ID:</strong> ${d.applicationId}</p>
          <p style="margin:8px 0 0;"><strong>Card:</strong> ${d.card}</p>
          <p style="margin:8px 0 0;"><strong>Estimated Delivery:</strong> 5–7 business days</p>
        </div>
        <p style="color:#6B7280;font-size:13px;">Your card will be delivered to your registered address. Please keep a valid ID proof for delivery.</p>
      </div>
    </div>`,
  }),

  APPLICATION_REJECTED: d => ({
    subject: `Update on Your SBI Credit Card Application — ${d.applicationId}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #fecaca;border-radius:12px;overflow:hidden;">
      <div style="background:#DC2626;padding:24px;text-align:center;">
        <h1 style="color:#fff;margin:0;">Application Status Update</h1>
      </div>
      <div style="padding:28px;">
        <p>Dear <strong>${d.name}</strong>,</p>
        <p>After careful review, we regret to inform you that your credit card application could not be approved at this time.</p>
        <div style="background:#FEE2E2;padding:14px;border-radius:8px;margin:16px 0;">
          <p style="margin:0;font-weight:700;">Reason: ${d.reason || 'Eligibility criteria not met'}</p>
        </div>
        <p>You may reapply after 6 months or visit your nearest SBI branch for personalised assistance.</p>
        <p style="color:#6B7280;font-size:12px;">For queries call: 1800-11-2211</p>
      </div>
    </div>`,
  }),

  DOCUMENT_REMINDER: d => ({
    subject: `Action Required: Documents Pending — ${d.applicationId}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#F59E0B;padding:20px;text-align:center;"><h1 style="color:#fff;margin:0;">📄 Documents Required</h1></div>
      <div style="padding:24px;">
        <p>Dear <strong>${d.name}</strong>,</p>
        <p>Your application <strong>${d.applicationId}</strong> is pending due to missing documents:</p>
        <ul>${(d.missingDocs || []).map(doc => `<li style="margin:6px 0;">${doc}</li>`).join('')}</ul>
        <a href="${process.env.FRONTEND_URL}/upload/${d.applicationId}" style="background:#1A56DB;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">Upload Documents →</a>
      </div>
    </div>`,
  }),
};

async function sendEmail(to, template, data) {
  try {
    if (!process.env.EMAIL_USER) return { success:false, error:'Email not configured' };
    const tmpl = EMAIL_TEMPLATES[template]?.(data);
    if (!tmpl) return { success:false, error:`Template "${template}" not found` };
    await transporter.sendMail({ from:`"SBI Credit Cards" <${process.env.EMAIL_USER}>`, to, ...tmpl });
    return { success:true };
  } catch (err) {
    console.error('Email failed:', err.message);
    return { success:false, error:err.message };
  }
}

// ── WhatsApp Templates ────────────────────────────────────────────
const WA = {
  APPLICATION_RECEIVED: d =>
    `🏦 *State Bank of India*\n\nDear ${d.name},\n\nYour credit card application has been received!\n\n📋 *App ID:* ${d.applicationId}\n💳 *Card:* ${d.card || 'Under Review'}\n📊 *Status:* Under Review\n\n_Our team will contact you within 2–3 business days._\n\nQueries: *1800-11-2211*`,

  APPLICATION_APPROVED: d =>
    `🎉 *Congratulations, ${d.name}!*\n\nYour *SBI ${d.card}* application is *APPROVED!* ✅\n\n📋 App ID: ${d.applicationId}\n📦 Card will be delivered in 5–7 business days.\n\nThank you for choosing SBI! 🏦`,

  APPLICATION_REJECTED: d =>
    `📋 *SBI Credit Card Update*\n\nDear ${d.name},\n\nYour application *${d.applicationId}* could not be approved.\n\n❌ Reason: ${d.reason || 'Eligibility criteria not met'}\n\nFor assistance call: *1800-11-2211*`,

  DOCUMENT_REMINDER: d =>
    `📄 *Documents Required — SBI CC*\n\nDear ${d.name},\n\nApp *${d.applicationId}* needs:\n${(d.missingDocs || []).map(m => `• ${m}`).join('\n')}\n\nUpload at: ${process.env.FRONTEND_URL}\n\nQueries: *1800-11-2211*`,

  FOLLOW_UP: d =>
    `👋 *SBI Credit Card*\n\nHi ${d.name}, this is a friendly follow-up regarding your credit card application.\n\nApp ID: *${d.applicationId}*\nStatus: *${d.status}*\n\nFor help call: *1800-11-2211*`,
};

async function sendWhatsApp(mobile, template, data) {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID) return { success:false, error:'Twilio not configured' };
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const msg    = WA[template]?.(data) || data.message;
    if (!msg) return { success:false, error:'No message content' };
    await client.messages.create({
      body: msg,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
      to:   `whatsapp:+91${mobile.replace(/\D/g,'')}`,
    });
    return { success:true };
  } catch (err) {
    console.error('WhatsApp failed:', err.message);
    return { success:false, error:err.message };
  }
}

async function notifyAll(app, template) {
  const data = {
    name:          app.personal?.name,
    applicationId: app.applicationId,
    card:          app.eligibility?.recommendedCard,
    status:        app.status,
  };
  const [emailResult, waResult] = await Promise.allSettled([
    sendEmail(app.personal?.email, template, data),
    sendWhatsApp(app.personal?.mobile, template, data),
  ]);
  return { email: emailResult.value, whatsapp: waResult.value };
}

module.exports = { sendEmail, sendWhatsApp, notifyAll, EMAIL_TEMPLATES, WA };
