import nodemailer, { type Transporter } from 'nodemailer'

// Provider-agnostic SMTP: Mailpit locally, Brevo/Resend/etc. in production.
const host = process.env.SMTP_HOST
const port = Number(process.env.SMTP_PORT) || 587
const secure = process.env.SMTP_SECURE === 'true'
const user = process.env.SMTP_USER
const pass = process.env.SMTP_PASS

export const mailFrom =
  process.env.MAIL_FROM ?? 'ReplayGear <no-reply@replaygear.com>'

// Only build a transporter if SMTP is configured. When it isn't (e.g. no env
// set), sends are skipped and logged so checkout still works everywhere.
let transporter: Transporter | null = null
if (host) {
  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    ...(user && pass ? { auth: { user, pass } } : {}),
  })
  console.log(`✉️  SMTP configured (${host}:${port})`)
} else {
  console.log('✉️  SMTP not configured — order emails will be skipped (set SMTP_HOST).')
}

export function isMailEnabled(): boolean {
  return transporter !== null
}

export async function sendMail(opts: {
  to: string
  subject: string
  html: string
  text: string
}): Promise<void> {
  if (!transporter) {
    console.log(`✉️  [skipped] would email "${opts.subject}" → ${opts.to}`)
    return
  }
  await transporter.sendMail({ from: mailFrom, ...opts })
}
