/**
 * Outbound staff email.
 *
 * Transport is plain SMTP via nodemailer, so any provider works without a
 * code change: the company mailbox (Google Workspace / Zoho / ...), Resend
 * (smtp.resend.com:465), SendGrid (smtp.sendgrid.net:587) or Postmark.
 *
 * Nothing is configured → every send logs a warning and returns
 * `{ sent: false }`. Callers must degrade instead of failing: the routes
 * that use this never want a missing mail setup to break the admin action
 * that triggered them.
 */
import { createTransport, type Transporter } from 'nodemailer';

const HOST = process.env.SMTP_HOST;
const PORT = Number(process.env.SMTP_PORT || 465);
const USER = process.env.SMTP_USER;
const PASS = process.env.SMTP_PASS;
// Explicit SMTP_SECURE beats the port-465 default so 587 STARTTLS works.
const SECURE = process.env.SMTP_SECURE
  ? process.env.SMTP_SECURE === 'true'
  : PORT === 465;

const FROM = process.env.EMAIL_FROM || 'MovoX <no-reply@heymovox.com>';

/** Staff sign-in lives on the admin host; clients use the portal instead. */
export const ADMIN_LOGIN_URL = 'https://admin.heymovox.com/login';

let transport: Transporter | null = null;

function getTransport(): Transporter | null {
  if (!HOST) return null;
  if (!transport) {
    transport = createTransport({
      host: HOST,
      port: PORT,
      secure: SECURE,
      auth: USER ? { user: USER, pass: PASS } : undefined,
    });
  }
  return transport;
}

export const mailConfigured = (): boolean => Boolean(HOST && USER && PASS);

export interface SendResult {
  sent: boolean;
  error?: string;
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendResult> {
  const t = getTransport();
  if (!t) {
    console.warn(
      `[mail] SMTP is not configured (SMTP_HOST/SMTP_USER/SMTP_PASS) — skipped "${opts.subject}" to ${opts.to}`,
    );
    return { sent: false, error: 'Email is not configured on this server.' };
  }
  try {
    await t.sendMail({ from: FROM, to: opts.to, subject: opts.subject, html: opts.html, text: opts.text });
    return { sent: true };
  } catch (err) {
    console.error(`[mail] failed to send "${opts.subject}" to ${opts.to}:`, err);
    return { sent: false, error: err instanceof Error ? err.message : 'Send failed.' };
  }
}

// ---------------------------------------------------------------------------
// templates
// ---------------------------------------------------------------------------

const ROLE_NAMES: Record<string, string> = {
  admin: 'Administrator',
  operations_manager: 'Operations Manager',
  project_manager: 'Project Manager',
  sales_executive: 'Sales Executive',
  team_member: 'Team Member',
  client: 'Client',
};

const ROLE_SUMMARIES: Record<string, string> = {
  admin: 'full access to every part of the dashboard, including users and settings',
  operations_manager:
    'all projects, agreements (including signing as the MovoX authorised person), invoices and revenue',
  project_manager: 'all projects, agreements and invoices',
  sales_executive: 'the enquiry pipeline: leads and follow-ups',
  team_member: 'only the projects you are assigned to: reply, update status and upload files',
  client: 'the client portal: your own projects, status and files',
};

export const roleLabel = (role: string): string => ROLE_NAMES[role] ?? role;

/** Minimal branded wrapper shared by every template. */
function shell(title: string, bodyHtml: string, greeting: string): { html: string; text: string } {
  const html = `<!doctype html>
<html>
  <body style="margin:0;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif;color:#1e293b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
          <tr><td style="padding:24px 32px;border-bottom:1px solid #e2e8f0;">
            <span style="font-size:20px;font-weight:bold;color:#1d4ed8;">MovoX</span>
            <span style="font-size:12px;color:#94a3b8;"> &nbsp;Beyond Digital</span>
          </td></tr>
          <tr><td style="padding:28px 32px;">
            <h1 style="margin:0 0 16px;font-size:18px;color:#0f172a;">${title}</h1>
            ${bodyHtml}
            <p style="margin:24px 0 0;font-size:13px;color:#64748b;">— Team MovoX</p>
          </td></tr>
          <tr><td style="padding:16px 32px 24px;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;">
            heymovox.com &nbsp;·&nbsp; ${greeting}
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  // Rough text mirror for mail clients that refuse HTML.
  const text = html
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return { html, text };
}

const p = (inner: string) =>
  `<p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#334155;">${inner}</p>`;

const codeCell = (label: string, value: string) => `
  <tr>
    <td style="padding:10px 14px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.04em;">${label}</td>
    <td style="padding:10px 14px;font-size:14px;font-family:Menlo,Consolas,monospace;color:#0f172a;">${value}</td>
  </tr>`;

const button = (href: string, label: string) => `
  <p style="margin:22px 0 8px;">
    <a href="${href}" style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-size:14px;font-weight:bold;">${label}</a>
  </p>
  <p style="margin:6px 0 0;font-size:12px;color:#94a3b8;">Or open <a href="${href}" style="color:#1d4ed8;">${href}</a></p>`;

/**
 * Account-credentials email — sent to the person's *personal* address when a
 * team member is created, since the generated @heymovox.com address is the
 * login itself and cannot receive its own password.
 */
export function credentialsEmail(opts: {
  name: string;
  workEmail: string;
  password: string;
  role: string;
}): { subject: string; html: string; text: string } {
  const first = opts.name.trim().split(/\s+/)[0] || 'there';
  const subject = 'Your MovoX dashboard login is ready';

  const { html, text } = shell(
    'Your MovoX dashboard login is ready',
    `
    ${p(`Hi ${first},`)}
    ${p(`A MovoX dashboard account has been created for you as <strong>${roleLabel(opts.role)}</strong>. Use the details below to sign in.`)}
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin:4px 0 6px;">
      ${codeCell('Login email', opts.workEmail)}
      ${codeCell('Password', opts.password)}
    </table>
    ${button(ADMIN_LOGIN_URL, 'Sign in to MovoX')}
    ${p(`This password was generated for you. After signing in you can ask an administrator to set a new one at any time — just reply to this address.`)}
    ${p(`<strong>Keep this email safe</strong>: it contains your password in plain text.`)}
    `,
    `Welcome, ${opts.name}`,
  );

  return { subject, html, text };
}

/**
 * Role-change email — sent to the person's personal address whenever their
 * role is changed to a staff position (anything that is not the client role).
 */
export function roleChangedEmail(opts: {
  name: string;
  oldRole: string;
  newRole: string;
  changedBy: string;
  at: Date;
}): { subject: string; html: string; text: string } {
  const first = opts.name.trim().split(/\s+/)[0] || 'there';
  const subject = `Your MovoX role has been updated: ${roleLabel(opts.newRole)}`;
  const when = opts.at.toUTCString().replace('GMT', 'UTC');

  const { html, text } = shell(
    'Your MovoX role has been updated',
    `
    ${p(`Hi ${first},`)}
    ${p(`Your role on the MovoX dashboard has been changed. Here is what is different:`)}
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin:4px 0 14px;">
      ${codeCell('Was', roleLabel(opts.oldRole))}
      ${codeCell('Now', roleLabel(opts.newRole))}
    </table>
    ${p(`As <strong>${roleLabel(opts.newRole)}</strong> you have access to ${ROLE_SUMMARIES[opts.newRole] ?? 'the dashboard areas your role permits'}.`)}
    ${button(ADMIN_LOGIN_URL, 'Sign in to MovoX')}
    ${p(`Changed by ${opts.changedBy} on ${when}.`)}
    ${p(`If this does not match what you expect, reply to this email or contact your administrator.`)}
    `,
    `Hello, ${opts.name}`,
  );

  return { subject, html, text };
}
