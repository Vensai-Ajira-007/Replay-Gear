import { Kafka, logLevel, type Producer } from 'kafkajs'

const brokers = (process.env.KAFKA_BROKERS ?? 'localhost:29092').split(',')
const topic = process.env.NOTIFICATION_TOPIC ?? 'order-notifications'

const kafka = new Kafka({
  clientId: 'replaygear-api',
  brokers,
  logLevel: logLevel.NOTHING,
  retry: { initialRetryTime: 500, retries: 8 },
})

const producer: Producer = kafka.producer()
let connected = false

export async function connectProducer(): Promise<void> {
  await producer.connect()
  connected = true
  console.log(`📤 Kafka producer connected (${brokers.join(',')})`)
}

// Fire-and-forget publish — callers catch errors so a Kafka hiccup never
// breaks the request that triggered the event.
export async function publishNotification(event: unknown): Promise<void> {
  if (!connected) throw new Error('Kafka producer not connected')
  const key =
    typeof event === 'object' && event && 'order' in event
      ? // @ts-expect-error narrow at runtime
        String(event.order?.id ?? '')
      : undefined
  await producer.send({
    topic,
    messages: [{ key, value: JSON.stringify(event) }],
  })
}

export async function disconnectProducer(): Promise<void> {
  if (connected) await producer.disconnect()
}
