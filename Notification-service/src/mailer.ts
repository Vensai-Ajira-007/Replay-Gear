import nodemailer, { type Transporter } from 'nodemailer'

const host = process.env.SMTP_HOST ?? 'localhost'
const port = Number(process.env.SMTP_PORT) || 1025
const secure = process.env.SMTP_SECURE === 'true'
const user = process.env.SMTP_USER
const pass = process.env.SMTP_PASS

export const mailFrom =
  process.env.MAIL_FROM ?? 'ReplayGear <no-reply@replaygear.com>'

// Mailpit needs no auth; real providers do. Only attach auth if provided.
const transporter: Transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  ...(user && pass ? { auth: { user, pass } } : {}),
})

export async function sendMail(opts: {
  to: string
  subject: string
  html: string
  text: string
}): Promise<void> {
  await transporter.sendMail({ from: mailFrom, ...opts })
}

export function smtpTarget(): string {
  return `${host}:${port}`
}
