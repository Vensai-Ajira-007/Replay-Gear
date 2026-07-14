import { Kafka, logLevel } from 'kafkajs'
import { smtpTarget } from './mailer.js'
import {
  sendOrderConfirmation,
  type OrderCreatedEvent,
} from './emails/orderConfirmation.js'

const brokers = (process.env.KAFKA_BROKERS ?? 'localhost:29092').split(',')
const topic = process.env.NOTIFICATION_TOPIC ?? 'order-notifications'
const groupId = process.env.KAFKA_GROUP_ID ?? 'notification-service'

const kafka = new Kafka({
  clientId: 'notification-service',
  brokers,
  logLevel: logLevel.NOTHING,
  // Give the broker time to come up when everything starts together.
  retry: { initialRetryTime: 1000, retries: 20 },
})

const consumer = kafka.consumer({ groupId })

async function ensureTopic(): Promise<void> {
  const admin = kafka.admin()
  await admin.connect()
  try {
    await admin.createTopics({ topics: [{ topic, numPartitions: 1 }] })
  } finally {
    await admin.disconnect()
  }
}

async function handle(raw: string): Promise<void> {
  const event = JSON.parse(raw) as { type?: string }
  if (event.type === 'order.created') {
    const e = event as OrderCreatedEvent
    await sendOrderConfirmation(e)
    console.log(
      `✉️  sent order confirmation for #${e.order.id.slice(0, 8)} → ${e.user.email}`,
    )
  } else {
    console.log(`↷ ignoring event type: ${event.type}`)
  }
}

async function main(): Promise<void> {
  console.log(`📨 Notification service starting (SMTP → ${smtpTarget()})`)
  await ensureTopic()
  await consumer.connect()
  await consumer.subscribe({ topic, fromBeginning: false })
  console.log(`👂 Consuming topic "${topic}" on ${brokers.join(',')}`)

  await consumer.run({
    eachMessage: async ({ message }) => {
      const value = message.value?.toString()
      if (!value) return
      try {
        await handle(value)
      } catch (err) {
        // Don't crash the consumer on a bad message / mail failure.
        console.error('failed to process message:', err)
      }
    },
  })
}

const shutdown = async () => {
  try {
    await consumer.disconnect()
  } finally {
    process.exit(0)
  }
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

main().catch((err) => {
  console.error('Notification service failed to start:', err)
  process.exit(1)
})
