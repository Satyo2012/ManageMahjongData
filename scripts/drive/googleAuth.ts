import { createSign } from 'node:crypto'

/** サービスアカウントの鍵 JSON（Google Cloud でダウンロードしたもの）のうち使う項目 */
export interface ServiceAccountKey {
  client_email: string
  private_key: string
}

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
export const DRIVE_READONLY_SCOPE = 'https://www.googleapis.com/auth/drive.readonly'
/** Google が受け付けるアサーションの最大有効期間 */
const ASSERTION_LIFETIME_SEC = 3600

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url')
}

export function parseServiceAccountKey(json: string): ServiceAccountKey {
  let key: Partial<ServiceAccountKey>
  try {
    key = JSON.parse(json) as Partial<ServiceAccountKey>
  } catch {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY が JSON として読めません。鍵ファイルの中身をそのまま登録してください')
  }
  if (!key.client_email || !key.private_key) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY に client_email / private_key がありません')
  }
  return { client_email: key.client_email, private_key: key.private_key }
}

/** OAuth 2.0 JWT Bearer フロー用の署名付きアサーション (RS256) */
export function buildAssertion(key: ServiceAccountKey, scope: string, nowSec: number = Math.floor(Date.now() / 1000)): string {
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = base64url(
    JSON.stringify({ iss: key.client_email, scope, aud: TOKEN_URL, iat: nowSec, exp: nowSec + ASSERTION_LIFETIME_SEC }),
  )
  const signature = createSign('RSA-SHA256').update(`${header}.${claims}`).sign(key.private_key)
  return `${header}.${claims}.${base64url(signature)}`
}

/** サービスアカウントでアクセストークンを取得する */
export async function fetchAccessToken(key: ServiceAccountKey, scope: string = DRIVE_READONLY_SCOPE): Promise<string> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: buildAssertion(key, scope),
    }),
  })
  if (!res.ok) {
    throw new Error(`Google のアクセストークン取得に失敗しました (${res.status}): ${await res.text()}`)
  }
  const body = (await res.json()) as { access_token?: string }
  if (!body.access_token) throw new Error('Google の応答に access_token がありません')
  return body.access_token
}
