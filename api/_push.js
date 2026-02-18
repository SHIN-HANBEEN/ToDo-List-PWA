import webpush from 'web-push'

let vapidConfigured = false

function getEnvValue(name) {
  const raw = process.env[name]
  if (!raw) return ''
  return String(raw).trim()
}

export function getPublicVapidKey() {
  return getEnvValue('VITE_WEB_PUSH_PUBLIC_KEY') || getEnvValue('WEB_PUSH_PUBLIC_KEY')
}

export function getPushConfig() {
  const publicKey = getPublicVapidKey()
  const privateKey = getEnvValue('WEB_PUSH_PRIVATE_KEY')
  const subject = getEnvValue('WEB_PUSH_SUBJECT') || 'mailto:admin@example.com'
  return { publicKey, privateKey, subject }
}

export function hasPushConfig() {
  const { publicKey, privateKey } = getPushConfig()
  return Boolean(publicKey && privateKey)
}

export function ensureWebPushConfigured() {
  if (vapidConfigured) return
  const { publicKey, privateKey, subject } = getPushConfig()
  if (!publicKey || !privateKey) {
    throw new Error('web push is not configured on server')
  }
  webpush.setVapidDetails(subject, publicKey, privateKey)
  vapidConfigured = true
}

export async function sendPushMessage(subscription, payload) {
  ensureWebPushConfigured()
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload)
  return webpush.sendNotification(subscription, body)
}
