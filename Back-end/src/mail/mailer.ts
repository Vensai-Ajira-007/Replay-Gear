import nodemailer, { type Transporter } from 'nodemailer'

// Two delivery paths, chosen by env:
// 1. BREVO_API_KEY set  → send via Brevo's HTTPS API (port 443). Use this in
//    production (Render/most PaaS block outbound SMTP ports).
// 2. else SMTP_HOST set → send via SMTP (great for local Mailpit).
// 3. else                → skip + log, so checkout still works anywhere.
const brevoApiKey = process.env.BREVO_API_KEY

const host = process.env.SMTP_HOST
const port = Number(process.env.SMTP_PORT) || 587
const secure = process.env.SMTP_SECURE === 'true'
const user = process.env.SMTP_USER
const pass = process.env.SMTP_PASS

export const mailFrom =
  process.env.MAIL_FROM ?? 'ReplayGear <no-reply@replaygear.com>'

let transporter: Transporter | null = null

if (brevoApiKey) {
  console.log('✉️  Email via Brevo HTTP API')
} else if (host) {
  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    ...(user && pass ? { auth: { user, pass } } : {}),
  })
  console.log(`✉️  SMTP configured (${host}:${port})`)
} else {
  console.log('✉️  Email not configured — order emails will be skipped.')
}

// Split "ReplayGear <no-reply@x.com>" into { name, email }.
function parseFrom(value: string): { name?: string; email: string } {
  const match = value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/)
  if (match) return { name: match[1] || undefined, email: match[2] }
  return { email: value.trim() }
}

interface MailOptions {
  to: string
  subject: string
  html: string
  text: string
}

async function sendViaBrevo(opts: MailOptions): Promise<void> {
  const sender = parseFrom(mailFrom)
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': brevoApiKey as string,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender,
      to: [{ email: opts.to }],
      subject: opts.subject,
      htmlContent: opts.html,
      textContent: opts.text,
    }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Brevo API ${res.status}: ${body}`)
  }
}

export async function sendMail(opts: MailOptions): Promise<void> {
  if (brevoApiKey) return sendViaBrevo(opts)
  if (transporter) {
    await transporter.sendMail({ from: mailFrom, ...opts })
    return
  }
  console.log(`✉️  [skipped] would email "${opts.subject}" → ${opts.to}`)
}
