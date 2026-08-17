import { authConfig } from '../auth/config.js'
import { sendMail } from './mailer.js'

// Send the forgot-password OTP. Like the order confirmation, callers should not
// block the response on this and must catch — a mail failure must never turn
// into a different HTTP response, or the endpoint leaks which emails exist.
export async function sendPasswordResetOtp(
  to: string,
  name: string,
  code: string,
): Promise<void> {
  const minutes = authConfig.resetOtpTtlMinutes

  const html = `
  <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
    <h2 style="color:#aa3bff">Reset your password</h2>
    <p>Hi ${name}, use this code to finish resetting your ReplayGear password:</p>
    <p style="margin:24px 0;padding:16px;background:#faf7ff;border-radius:8px;text-align:center;
              font-size:32px;font-weight:700;letter-spacing:8px;color:#aa3bff">
      ${code}
    </p>
    <p>The code expires in ${minutes} minutes and can only be used once.</p>
    <p style="color:#888;font-size:13px">
      If you didn't request a password reset, you can ignore this email — your
      password stays unchanged.
    </p>
  </div>`

  const text = [
    `Hi ${name},`,
    '',
    `Your ReplayGear password reset code is: ${code}`,
    `It expires in ${minutes} minutes and can only be used once.`,
    '',
    "If you didn't request a password reset, ignore this email — your password stays unchanged.",
  ].join('\n')

  await sendMail({
    to,
    subject: `${code} is your ReplayGear password reset code`,
    html,
    text,
  })
}
