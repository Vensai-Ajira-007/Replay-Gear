import type { Order } from '../entities/Order.js'
import { sendMail } from './mailer.js'

const money = (n: number) => `$${n.toFixed(2)}`

// Send the order-confirmation email inline. Callers should not await this in a
// way that blocks the response, and should catch errors — a mail failure must
// never fail checkout.
export async function sendOrderConfirmation(
  order: Order,
  to: string,
  name: string,
): Promise<void> {
  const shortId = order.id.slice(0, 8)

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
    <p style="color:#888;font-size:13px">This is a demo store — no payment was taken.</p>
  </div>`

  const text = [
    `Thanks for your order, ${name}!`,
    `Order #${shortId} confirmed.`,
    ...order.items.map((i) => `- ${i.title} x${i.qty} = ${money(i.lineTotal)}`),
    `Total: ${money(order.subtotal)} (${order.totalItems} items)`,
  ].join('\n')

  await sendMail({
    to,
    subject: `Your ReplayGear order #${shortId} is confirmed`,
    html,
    text,
  })
}
