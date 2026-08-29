import { SESSION_TTL_MS } from './constants'

const encoder = new TextEncoder()

async function sessionKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(process.env.AUTH_SECRET!),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function fromHex(hex: string): Uint8Array {
  return Uint8Array.from(hex.match(/../g) ?? [], (byte) => parseInt(byte, 16))
}

export async function createSessionToken(): Promise<string> {
  const issuedAt = Date.now().toString()
  const signature = await crypto.subtle.sign('HMAC', await sessionKey(), encoder.encode(issuedAt))
  return `${issuedAt}.${toHex(signature)}`
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false

  const [issuedAt, signature] = token.split('.')
  if (!issuedAt || !signature) return false

  const valid = await crypto.subtle.verify(
    'HMAC',
    await sessionKey(),
    fromHex(signature) as BufferSource,
    encoder.encode(issuedAt),
  )

  return valid && Date.now() - Number(issuedAt) < SESSION_TTL_MS
}

export function passwordMatches(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD!
  if (candidate.length !== expected.length) return false

  let mismatch = 0
  for (let i = 0; i < candidate.length; i++) {
    mismatch |= candidate.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  return mismatch === 0
}
