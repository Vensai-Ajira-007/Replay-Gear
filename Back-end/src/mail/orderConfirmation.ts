import type { Order } from '../entities/Order.js'
import { formatAddressLines } from '../services/address.js'
import { sendMail } from './mailer.js'

const money = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n)

// Send the order-confirmation email inline. Callers should not await this in a
// way that blocks the response, and should catch errors — a mail failure must
// never fail checkout.
export async function sendOrderConfirmation(
  order: Order,
  to: string,
  name: string,
): Promise<void> {
  const shortId = order.id.slice(0, 8)

  // Orders placed before delivery details existed have no address — skip the block.
  const addressLines = order.deliveryAddress
    ? formatAddressLines(order.deliveryAddress)
    : null

  const addressHtml = addressLines
    ? `
    <div style="margin-top:24px;padding:16px;background:#faf7ff;border-radius:8px">
      <h3 style="margin:0 0 8px;font-size:14px;color:#aa3bff">Delivering to</h3>
      <p style="margin:0;font-size:14px;line-height:1.6">
        ${addressLines.join('<br />')}
      </p>
    </div>`
    : ''

  const rows = order.items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee">${i.title}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center">×${i.qty}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${money(i.lineTotal)}</td>
      </tr>`,
    )
    .join('')

  const html = `
  <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
    <h2 style="color:#aa3bff">Thanks for your order, ${name}! 🎮</h2>
    <p>Your ReplayGear order <strong>#${shortId}</strong> is confirmed.</p>
    <table style="width:100%;border-collapse:collapse;margin-top:12px">
      <thead>
        <tr>
          <th style="text-align:left;padding:8px 0;border-bottom:2px solid #aa3bff">Item</th>
          <th style="text-align:center;padding:8px 0;border-bottom:2px solid #aa3bff">Qty</th>
          <th style="text-align:right;padding:8px 0;border-bottom:2px solid #aa3bff">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="text-align:right;font-size:18px;margin-top:16px">
      <strong>Total: ${money(order.subtotal)}</strong> (${order.totalItems} items)
    </p>
    ${addressHtml}
    <p style="color:#888;font-size:13px">This is a demo store — no payment was taken.</p>
  </div>`

  const text = [
    `Thanks for your order, ${name}!`,
    `Order #${shortId} confirmed.`,
    ...order.items.map((i) => `- ${i.title} x${i.qty} = ${money(i.lineTotal)}`),
    `Total: ${money(order.subtotal)} (${order.totalItems} items)`,
    ...(addressLines ? ['', 'Delivering to:', ...addressLines] : []),
  ].join('\n')

  await sendMail({
    to,
    subject: `Your ReplayGear order #${shortId} is confirmed`,
    html,
    text,
  })
}
