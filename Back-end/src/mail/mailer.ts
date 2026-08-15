import nodemailer, { type Transporter } from 'nodemailer'

// Three delivery paths, chosen by env:
// 1. MAILEROO_API_KEY set → send via Maileroo's HTTPS API (port 443). Use this in
//    production (Render/most PaaS block outbound SMTP ports).
// 2. else SMTP_HOST set   → send via SMTP (great for local Mailpit).
// 3. else                 → skip + log, so checkout still works anywhere.
const mailerooApiKey = process.env.MAILEROO_API_KEY

const MAILEROO_ENDPOINT = 'https://smtp.maileroo.com/api/v2/emails'
// The send is fire-and-forget at the call site, so a hung request would leak
// silently — bound it.
const MAILEROO_TIMEOUT_MS = Number(process.env.MAILEROO_TIMEOUT_MS) || 10000

const host = process.env.SMTP_HOST
const port = Number(process.env.SMTP_PORT) || 587
const secure = process.env.SMTP_SECURE === 'true'
const user = process.env.SMTP_USER
const pass = process.env.SMTP_PASS

// `||` not `??`: Compose passes an empty string for unset vars, and an empty
// sender would be sent verbatim rather than falling back.
export const mailFrom =
  process.env.MAIL_FROM || 'ReplayGear <no-reply@replaygear.com>'

let transporter: Transporter | null = null

if (mailerooApiKey) {
  console.log('✉️  Email via Maileroo HTTP API')
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

/**
 * POST /api/v2/emails — Maileroo's transactional endpoint.
 *
 * Note the field names differ from most providers: `plain` (not textContent),
 * and addresses are objects with `address`/`display_name`. MAIL_FROM must sit on
 * a domain verified in Maileroo or the send is rejected.
 */
async function sendViaMaileroo(opts: MailOptions): Promise<void> {
  const sender = parseFrom(mailFrom)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), MAILEROO_TIMEOUT_MS)
  let res: Response
  try {
    res = await fetch(MAILEROO_ENDPOINT, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'X-Api-Key': mailerooApiKey as string,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        from: { address: sender.email, ...(sender.name ? { display_name: sender.name } : {}) },
        to: [{ address: opts.to }],
        subject: opts.subject,
        html: opts.html,
        plain: opts.text,
      }),
    })
  } finally {
    clearTimeout(timer)
  }

  const body = (await res.json().catch(() => null)) as
    | { success?: boolean; message?: string }
    | null

  // Maileroo can answer 200 with success:false, so the status alone isn't enough.
  // The body is already consumed above, hence no res.text() fallback here.
  if (!res.ok || body?.success === false) {
    throw new Error(
      `Maileroo API ${res.status}: ${body?.message ?? res.statusText ?? 'unknown error'}`,
    )
  }
}

export async function sendMail(opts: MailOptions): Promise<void> {
  if (mailerooApiKey) return sendViaMaileroo(opts)
  if (transporter) {
    await transporter.sendMail({ from: mailFrom, ...opts })
    return
  }
  console.log(`✉️  [skipped] would email "${opts.subject}" → ${opts.to}`)
}
